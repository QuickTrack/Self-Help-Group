export type UserRole = 'admin' | 'treasurer' | 'secretary' | 'member';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  member?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Member {
  _id: string;
  memberId: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email?: string;
  location: 'Githirioni' | 'Lari' | 'Kiambu' | 'Other';
  joinDate: Date;
  nextOfKinName: string;
  nextOfKinPhone: string;
  photo?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'Bank';
export type ContributionType = 'Monthly' | 'Weekly' | 'Special';

export interface Contribution {
  _id: string;
  member: string;
  memberDetails?: Member;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  contributionType: ContributionType;
  isRecurring: boolean;
  notes?: string;
  recordedBy: string;
  createdAt?: Date;
}

export interface WelfareContribution {
  _id: string;
  member: string;
  memberDetails?: Member;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  reason: 'Bereavement' | 'Celebration' | 'Emergency' | 'Regular';
  payoutAmount?: number;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
}

export type LoanStatus = 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Paid';

export interface Loan {
  _id: string;
  member: string;
  memberDetails?: Member;
  principalAmount: number;
  interestRate: number;
  repaymentPeriod: number;
  startDate: Date;
  status: LoanStatus;
  guarantor1?: string;
  guarantor2?: string;
  installmentAmount: number;
  totalInterest: number;
  totalRepayable: number;
  outstandingBalance: number;
  appliedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  disbursedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoanRepayment {
  _id: string;
  loan: string;
  member: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface Savings {
  _id: string;
  member: string;
  memberDetails?: Member;
  savingsBalance: number;
  totalShares: number;
  shareValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavingsTransaction {
  _id: string;
  savings: string;
  member: string;
  type: 'deposit' | 'share_purchase' | 'withdrawal';
  amount: number;
  date: Date;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface Meeting {
  _id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  agenda: string;
  minutes?: string;
  attendees: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  sentVia: ('email' | 'sms')[];
  createdBy: string;
  createdAt: Date;
}

export interface ActivityLog {
  _id: string;
  user: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface Settings {
  _id: string;
  groupName: string;
  logo?: string;
  defaultInterestRate: number;
  shareValue: number;
  monthlyContribution: number;
  weeklyContribution: number;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  monthlyContributions: number;
  activeLoans: number;
  loansOutstanding: number;
  totalSavings: number;
  memberGrowth: number;
}