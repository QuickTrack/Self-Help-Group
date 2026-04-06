import { create } from 'zustand';
import type { Member, Contribution, Loan, Savings, User, UserRole, DashboardStats, PermissionScope, Permission } from '../types';

interface AppState {
  user: (User & { permissionScope?: PermissionScope; effectivePermissions?: Permission[] }) | null;
  isAuthenticated: boolean;
  members: any[];
  contributions: any[];
  loans: any[];
  savings: any[];
  dashboardStats: DashboardStats;
  
  setUser: (user: User & { permissionScope?: PermissionScope; effectivePermissions?: Permission[] } | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  addMember: (member: any) => void;
  updateMember: (id: string, member: any) => void;
  deleteMember: (id: string) => void;
  
  addContribution: (contribution: any) => void;
  addLoan: (loan: any) => void;
  updateLoan: (id: string, loan: any) => void;
  
  addSavings: (savings: any) => void;
  updateSavings: (id: string, savings: any) => void;
  
  calculateDashboardStats: () => DashboardStats;
}

const generateMemberId = (count: number) => `GSH-${String(count + 1).padStart(4, '0')}`;

const USE_DEV_DATA = process.env.NODE_ENV === 'development' && process.env.USE_DEV_DATA === 'true';

const seedMembers: Member[] = USE_DEV_DATA ? [
  {
    _id: '1',
    memberId: 'GSH-0001',
    fullName: 'John Kamau',
    idNumber: '12345678',
    phoneNumber: '+254712345678',
    email: 'jkamau@email.com',
    location: 'Githirioni',
    joinDate: new Date('2022-01-15'),
    nextOfKinName: 'Mary Kamau',
    nextOfKinPhone: '+254732345678',
    status: 'active',
  },
  {
    _id: '2',
    memberId: 'GSH-0002',
    fullName: 'Grace Wanjiku',
    idNumber: '23456789',
    phoneNumber: '+254723456789',
    email: 'gwanjiku@email.com',
    location: 'Lari',
    joinDate: new Date('2022-03-20'),
    nextOfKinName: 'Peter Wanjiku',
    nextOfKinPhone: '+254733456789',
    status: 'active',
  },
  {
    _id: '3',
    memberId: 'GSH-0003',
    fullName: 'David Maina',
    idNumber: '34567890',
    phoneNumber: '+254734567890',
    location: 'Kiambu',
    joinDate: new Date('2022-06-10'),
    nextOfKinName: 'Sarah Maina',
    nextOfKinPhone: '+254744567890',
    status: 'active',
  },
  {
    _id: '4',
    memberId: 'GSH-0004',
    fullName: 'Faith Nyambura',
    idNumber: '45678901',
    phoneNumber: '+254745678901',
    email: 'fnyambura@email.com',
    location: 'Githirioni',
    joinDate: new Date('2023-01-05'),
    nextOfKinName: 'James Nyambura',
    nextOfKinPhone: '+254755678901',
    status: 'active',
  },
  {
    _id: '5',
    memberId: 'GSH-0005',
    fullName: 'Joseph Mwangi',
    idNumber: '56789012',
    phoneNumber: '+254756789012',
    location: 'Lari',
    joinDate: new Date('2023-04-18'),
    nextOfKinName: 'Anne Mwangi',
    nextOfKinPhone: '+254766789012',
    status: 'inactive',
  },
] : [];

const seedContributions: Contribution[] = USE_DEV_DATA ? [
  { _id: '1', member: '1', amount: 1000, date: new Date('2024-01-01'), paymentMethod: 'M-Pesa', contributionType: 'Monthly', isRecurring: true, recordedBy: '1' },
  { _id: '2', member: '1', amount: 1000, date: new Date('2024-02-01'), paymentMethod: 'M-Pesa', contributionType: 'Monthly', isRecurring: true, recordedBy: '1' },
  { _id: '3', member: '2', amount: 1000, date: new Date('2024-01-01'), paymentMethod: 'Bank', contributionType: 'Monthly', isRecurring: true, recordedBy: '1' },
  { _id: '4', member: '3', amount: 250, date: new Date('2024-01-08'), paymentMethod: 'Cash', contributionType: 'Weekly', isRecurring: true, recordedBy: '1' },
  { _id: '5', member: '3', amount: 250, date: new Date('2024-01-15'), paymentMethod: 'Cash', contributionType: 'Weekly', isRecurring: true, recordedBy: '1' },
  { _id: '6', member: '4', amount: 5000, date: new Date('2024-01-20'), paymentMethod: 'Bank', contributionType: 'Special', isRecurring: false, recordedBy: '1'   },
] : [];

const seedLoans: Loan[] = USE_DEV_DATA ? [
  {
    _id: '1',
    member: '1',
    principalAmount: 50000,
    interestRate: 10,
    repaymentPeriod: 6,
    startDate: new Date('2024-01-15'),
    status: 'Disbursed',
    guarantor1: '2',
    guarantor2: '3',
    installmentAmount: 9167,
    totalInterest: 30000,
    totalRepayable: 80000,
    outstandingBalance: 65000,
    appliedBy: '1',
    approvedBy: '1',
  },
  {
    _id: '2',
    member: '2',
    principalAmount: 30000,
    interestRate: 10,
    repaymentPeriod: 4,
    startDate: new Date('2024-02-01'),
    status: 'Disbursed',
    guarantor1: '1',
    installmentAmount: 8250,
    totalInterest: 12000,
    totalRepayable: 42000,
    outstandingBalance: 30000,
    appliedBy: '1',
    approvedBy: '1',
  },
] : [];

const seedSavings: Savings[] = USE_DEV_DATA ? [
  { _id: '1', member: '1', savingsBalance: 15000, totalShares: 5 },
  { _id: '2', member: '2', savingsBalance: 8000, totalShares: 3 },
  { _id: '3', member: '3', savingsBalance: 5000, totalShares: 2 },
  { _id: '4', member: '4', savingsBalance: 12000, totalShares: 4 },
] : [];

const defaultStats: DashboardStats = {
  totalMembers: 5,
  activeMembers: 4,
  totalContributions: 14500,
  monthlyContributions: 7000,
  activeLoans: 2,
  loansOutstanding: 95000,
  totalSavings: 40000,
  memberGrowth: 25,
};

export const useStore = create<AppState>()(
  (set, get) => ({
      user: null,
      isAuthenticated: false,
      members: [],
      contributions: [],
      loans: [],
      savings: [],
      dashboardStats: defaultStats,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      login: async (email: string, password: string) => {
        return false;
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
      },
      
      addMember: (member) => set((state) => {
        if (!member?._id && !member?.memberId) return state;
        const exists = state.members.some((m) => m._id === member._id || m.memberId === member.memberId);
        if (exists) return state;
        return { members: [...state.members, member] };
      }),
      
      updateMember: (id, updates) => set((state) => ({
        members: state.members.map((m) => m._id === id ? { ...m, ...updates } : m)
      })),
      
      deleteMember: (id) => set((state) => ({
        members: state.members.filter((m) => m._id !== id)
      })),
      
      addContribution: (contribution) => set((state) => ({
        contributions: [...state.contributions, { ...contribution, _id: String(state.contributions.length + 1) }]
      })),
      
      addLoan: (loan) => set((state) => ({
        loans: [...state.loans, { ...loan, _id: String(state.loans.length + 1) }]
      })),
      
      updateLoan: (id, updates) => set((state) => ({
        loans: state.loans.map((l) => l._id === id ? { ...l, ...updates } : l)
      })),
      
      addSavings: (savings) => set((state) => ({
        savings: [...state.savings, { ...savings, _id: String(state.savings.length + 1) }]
      })),
      
      updateSavings: (id, updates) => set((state) => ({
        savings: state.savings.map((s) => s._id === id ? { ...s, ...updates } : s)
      })),
      
      calculateDashboardStats: () => {
        const state = get();
        const activeMembers = state.members.filter(m => m.status === 'active').length;
        const totalContributions = state.contributions.reduce((sum, c) => sum + c.amount, 0);
        const activeLoans = state.loans.filter(l => l.status === 'Disbursed');
        const totalSavings = state.savings.reduce((sum, s) => sum + s.savingsBalance, 0);
        
        return {
          totalMembers: state.members.length,
          activeMembers,
          totalContributions,
          monthlyContributions: state.contributions.filter(c => {
            const now = new Date();
            return new Date(c.date).getMonth() === now.getMonth();
          }).reduce((sum, c) => sum + c.amount, 0),
          activeLoans: activeLoans.length,
          loansOutstanding: activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0),
          totalSavings,
          memberGrowth: Math.round(((activeMembers - state.members.length) / state.members.length) * 100),
        };
      },
    })
);