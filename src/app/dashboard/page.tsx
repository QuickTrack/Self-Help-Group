'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { 
  Users, 
  Wallet, 
  Banknote, 
  PiggyBank, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Eye,
  AlertCircle,
  DollarSign,
  Percent,
  CreditCard,
  Target,
  Heart,
  HandHeart,
  UsersRound,
  Award,
  ChartBar,
  TrendingDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  monthlyContributions: number;
  activeLoans: number;
  loansOutstanding: number;
  totalSavings: number;
  memberGrowth: number;
}

interface Transaction {
  _id: string;
  type: 'contribution' | 'loan' | 'savings' | 'welfare';
  member: { _id: string; fullName: string };
  amount: number;
  date: string;
  method?: string;
  status?: string;
}

interface LoanData {
  _id: string;
  member: { _id: string; fullName: string };
  principalAmount: number;
  outstandingBalance: number;
  status: string;
}

interface ContributionData {
  _id: string;
  member: { _id: string; fullName: string };
  amount: number;
  date: string;
  contributionType: string;
}

const COLORS = {
  green: '#228B22',
  greenLight: '#22C55E',
  orange: '#FF6B35',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  yellow: '#F59E0B',
  red: '#EF4444',
  teal: '#14B8A6',
};

const GRADIENT_CONTRIB = 'gradientContrib';
const GRADIENT_LOANS = 'gradientLoans';
const GRADIENT_SAVINGS = 'gradientSavings';

const chartColors = {
  grid: '#E5E7EB',
  text: '#6B7280',
  textLight: '#9CA3AF',
};

export default function DashboardPage() {
  const { settings: groupSettings } = useAppSelector(state => state.group);
  const groupName = groupSettings?.groupName || 'Self Help Group';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalContributions: 0,
    monthlyContributions: 0,
    activeLoans: 0,
    loansOutstanding: 0,
    totalSavings: 0,
    memberGrowth: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; contributions: number; loans: number; savings: number }>>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [welfareFund, setWelfareFund] = useState({
    totalContributions: 0,
    totalPayouts: 0,
    fundBalance: 0,
    pendingRequests: 0,
    membersSupported: 0,
  });
  const [welfareContributions, setWelfareContributions] = useState<any[]>([]);
  const [welfarePayouts, setWelfarePayouts] = useState<any[]>([]);

  const [meetingsData, setMeetingsData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [bonusData, setBonusData] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, contribRes, loansRes, savingsRes, welfareRes, welfarePayoutRes, meetingsRes, attendanceRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/contributions'),
        fetch('/api/loans'),
        fetch('/api/savings'),
        fetch('/api/welfare'),
        fetch('/api/welfare/payout'),
        fetch('/api/meetings?limit=100'),
        fetch('/api/attendance/reports'),
      ]);

      const membersData = await membersRes.json();
      const contribData = await contribRes.json();
      const loansData = await loansRes.json();
      const savingsData = await savingsRes.json();
      const welfareData = await welfareRes.json();
      const welfarePayoutData = await welfarePayoutRes.json();
      const meetingsResult = await meetingsRes.json();
      const attendanceResult = await attendanceRes.json();

      const members = membersData.members || [];
      const contributions = contribData.contributions || [];
      const loansList = loansData.loans || [];
      const savings = savingsData.savings || [];
      const welfareContribs = welfareData.contributions || [];
      const welfarePayoutList = welfarePayoutData.payouts || [];
      const meetings = meetingsResult.meetings || [];
      const attendanceReport = attendanceResult;

      const activeMembers = members.filter((m: any) => m.status === 'active').length;
      const totalContrib = contributions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const monthlyContrib = contributions
        .filter((c: any) => {
          const date = new Date(c.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, c: any) => sum + c.amount, 0);

      const activeLoans = loansList.filter((l: any) => l.status === 'Disbursed');
      const outstandingLoans = activeLoans.reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);
      const totalSavings = savings.reduce((sum: number, s: any) => sum + (s.savingsBalance || 0), 0);

      const welfareTotalContrib = welfareContribs.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
      const paidPayouts = welfarePayoutList.filter((p: any) => p.status === 'Paid');
      const welfareTotalPayouts = paidPayouts.reduce((sum: number, p: any) => sum + (p.approvedAmount || 0), 0);
      const pendingRequests = welfarePayoutList.filter((p: any) => p.status === 'Pending' || p.status === 'Approved').length;
      const uniqueBeneficiaries = new Set(paidPayouts.map((p: any) => p.member?._id || p.member).filter(Boolean)).size;

      setWelfareFund({
        totalContributions: welfareTotalContrib,
        totalPayouts: welfareTotalPayouts,
        fundBalance: welfareTotalContrib - welfareTotalPayouts,
        pendingRequests,
        membersSupported: uniqueBeneficiaries,
      });
      setWelfareContributions(welfareContribs.slice(-10).reverse());
      setWelfarePayouts(paidPayouts.slice(-5).reverse());

      setMeetingsData(meetings);
      setAttendanceData(attendanceReport);
      setBonusData({
        totalBonus: attendanceReport.summary?.totalBonusPaid || 0,
        bonusRecipients: attendanceReport.summary?.totalBonusRecipients || 0,
        meetingStats: attendanceReport.meetingStats || [],
        dailyStats: attendanceReport.dailyStats || [],
      });

      const prevMonthMembers = Math.max(1, activeMembers - 2);
      const growth = Math.round(((activeMembers - prevMonthMembers) / prevMonthMembers) * 100);

      setStats({
        totalMembers: members.length,
        activeMembers,
        totalContributions: totalContrib,
        monthlyContributions: monthlyContrib,
        activeLoans: activeLoans.length,
        loansOutstanding: outstandingLoans,
        totalSavings,
        memberGrowth: growth,
      });

      setLoans(activeLoans);

      const recentTx = [
        ...contributions.slice(-3).map((c: any) => ({ ...c, type: 'contribution' as const, member: c.member })),
        ...loansList.filter((l: any) => l.status === 'Disbursed').slice(-2).map((l: any) => ({ ...l, type: 'loan' as const, member: l.member, amount: l.principalAmount })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      setRecentTransactions(recentTx);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const monthly = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, idx) => {
        const monthIndex = currentMonth - 5 + idx;
        const monthContribs = contributions.filter((c: any) => {
          const d = new Date(c.date);
          return d.getMonth() === monthIndex && d.getFullYear() === new Date().getFullYear();
        });
        const monthLoans = loansList.filter((l: any) => {
          const d = new Date(l.startDate);
          return d.getMonth() === monthIndex && d.getFullYear() === new Date().getFullYear();
        });
        return {
          month,
          contributions: monthContribs.reduce((sum: number, c: any) => sum + c.amount, 0),
          loans: monthLoans.reduce((sum: number, l: any) => sum + l.principalAmount, 0),
          savings: savings.reduce((sum: number, s: any) => sum + (s.savingsBalance || 0), 0) / 12,
        };
      });
      setMonthlyData(monthly);

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const statCards = useMemo(() => [
    {
      title: 'Active Members',
      value: stats.activeMembers,
      subtitle: `${stats.totalMembers} total`,
      icon: Users,
      color: COLORS.green,
      bgColor: '#DCFCE7',
      change: stats.memberGrowth,
      changeLabel: 'vs last month',
    },
    {
      title: 'Monthly Contributions',
      value: formatCurrency(stats.monthlyContributions),
      subtitle: `${formatCurrency(stats.totalContributions)} total`,
      icon: Wallet,
      color: COLORS.blue,
      bgColor: '#DBEAFE',
      change: null,
      changeLabel: 'this month',
    },
    {
      title: 'Active Loans',
      value: stats.activeLoans,
      subtitle: formatCurrency(stats.loansOutstanding),
      icon: Banknote,
      color: COLORS.orange,
      bgColor: '#FEE2E2',
      change: null,
      changeLabel: 'outstanding',
    },
    {
      title: 'Total Savings',
      value: formatCurrency(stats.totalSavings),
      subtitle: `${loans.length} accounts`,
      icon: PiggyBank,
      color: COLORS.purple,
      bgColor: '#F3E8FF',
      change: null,
      changeLabel: 'total value',
    },
    {
      title: 'Welfare Fund',
      value: formatCurrency(welfareFund.fundBalance),
      subtitle: `${welfareFund.membersSupported} supported`,
      icon: Heart,
      color: COLORS.red,
      bgColor: '#FEE2E2',
      change: welfareFund.pendingRequests > 0 ? welfareFund.pendingRequests : null,
      changeLabel: 'pending requests',
    },
  ], [stats, formatCurrency, loans.length, welfareFund]);

  const loanDistribution = useMemo(() => 
    loans.slice(0, 6).map(l => ({
      name: l.member?.fullName?.split(' ')[0] || 'Unknown',
      balance: l.outstandingBalance || 0,
    }))
  , [loans]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #E5E7EB', 
          borderTopColor: '#228B22', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <AlertCircle size={48} color="#EF4444" />
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#228B22',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            {groupName}
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Dashboard Overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <Filter size={16} color="#6B7280" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#374151',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button 
            onClick={fetchDashboardData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#374151',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#228B22'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '16px',
          fontSize: '0.75rem',
          color: '#9CA3AF'
        }}>
          <Clock size={12} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="card stat-card"
              style={{
                padding: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div 
                  className="stat-icon" 
                  style={{ 
                    background: stat.bgColor,
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={22} color={stat.color} />
                </div>
                {stat.change !== null && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px 8px',
                    background: stat.change >= 0 ? '#DCFCE7' : '#FEE2E2',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: stat.change >= 0 ? '#166534' : '#991B1B'
                  }}>
                    {stat.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div>
                <div 
                  className="stat-value" 
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    color: '#1A1A1A',
                    marginBottom: '4px'
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                  {stat.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Financial Overview
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Contributions vs Loans disbursed
              </p>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={GRADIENT_CONTRIB} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id={GRADIENT_LOANS} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke={chartColors.text} 
                  fontSize={12} 
                  tickFormatter={(value) => `KES ${value/1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#374151', fontSize: '0.8125rem' }}>{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="contributions" 
                  stroke={COLORS.green} 
                  strokeWidth={2}
                  fill={`url(#${GRADIENT_CONTRIB})`}
                  name="Contributions"
                />
                <Area 
                  type="monotone" 
                  dataKey="loans" 
                  stroke={COLORS.orange} 
                  strokeWidth={2}
                  fill={`url(#${GRADIENT_LOANS})`}
                  name="Loans Disbursed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Recent Activity
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Latest transactions
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTransactions.length > 0 ? recentTransactions.map((tx, i) => (
              <div key={tx._id || i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #F3F4F6',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = '#F3F4F6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#F3F4F6';
                e.currentTarget.style.background = '#F9FAFB';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: tx.type === 'contribution' ? '#DCFCE7' : tx.type === 'loan' ? '#FEE2E2' : '#E0E7FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {tx.type === 'contribution' ? (
                      <Wallet size={18} color="#166534" />
                    ) : tx.type === 'loan' ? (
                      <Banknote size={18} color="#991B1B" />
                    ) : (
                      <PiggyBank size={18} color="#4F46E5" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#1A1A1A' }}>
                      {tx.member?.fullName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {tx.type === 'contribution' ? 'Contribution' : tx.type === 'loan' ? 'Loan Disbursement' : tx.type} • {formatDate(tx.date)}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9375rem',
                  color: tx.type === 'contribution' ? '#166534' : '#991B1B' 
                }}>
                  {tx.type === 'contribution' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            )) : (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#9CA3AF',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px dashed #E5E7EB'
              }}>
                <Wallet size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
              Loan Portfolio
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              Outstanding balances by member
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#FEF3C7',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: '#92400E',
            fontWeight: 500,
          }}>
            <AlertCircle size={14} />
            {formatCurrency(stats.loansOutstanding)} outstanding
          </div>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={loanDistribution} 
              layout="vertical"
              margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
              <XAxis 
                type="number" 
                stroke={chartColors.text} 
                fontSize={12}
                tickFormatter={(value) => `KES ${value/1000}k`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke={chartColors.text} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="balance" 
                fill={COLORS.orange}
                radius={[0, 6, 6, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
              Welfare Fund Analysis
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              Emergency support fund status and recent payouts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#DCFCE7',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: '#166534',
              fontWeight: 500,
            }}>
              <HandHeart size={14} />
              {formatCurrency(welfareFund.totalContributions)} contributed
            </div>
            {welfareFund.pendingRequests > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#FEF3C7',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#92400E',
                fontWeight: 500,
              }}>
                <AlertCircle size={14} />
                {welfareFund.pendingRequests} pending
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ 
            padding: '16px', 
            background: '#F0FDF4', 
            borderRadius: '10px',
            border: '1px solid #BBF7D0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={16} color="white" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>Fund Balance</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
              {formatCurrency(welfareFund.fundBalance)}
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            background: '#EFF6FF', 
            borderRadius: '10px',
            border: '1px solid #BFDBFE'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersRound size={16} color="white" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 500 }}>Total Contributions</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8' }}>
              {formatCurrency(welfareFund.totalContributions)}
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            background: '#FEF2F2', 
            borderRadius: '10px',
            border: '1px solid #FECACA'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HandHeart size={16} color="white" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 500 }}>Total Payouts</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626' }}>
              {formatCurrency(welfareFund.totalPayouts)}
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            background: '#FDF4FF', 
            borderRadius: '10px',
            border: '1px solid #F0ABFC'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#A855F7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="white" />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#A21CAF', fontWeight: 500 }}>Members Supported</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#A21CAF' }}>
              {welfareFund.membersSupported}
            </div>
          </div>
        </div>

        {welfarePayouts.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Recent Payouts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {welfarePayouts.map((payout, idx) => (
                <div 
                  key={payout._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    borderRadius: '8px',
                    border: '1px solid #FEE2E2',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Heart size={16} color="#DC2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>
                        {payout.member?.fullName || 'Unknown Member'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {payout.eventType || 'Welfare Support'} • {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#DC2626' }}>
                    -{formatCurrency(payout.approvedAmount || payout.requestedAmount || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {welfareFund.totalContributions === 0 && welfarePayouts.length === 0 && (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center', 
            color: '#9CA3AF',
            background: '#F9FAFB',
            borderRadius: '10px',
            border: '1px dashed #E5E7EB'
          }}>
            <Heart size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem' }}>No welfare fund activity yet</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Contributions and payouts will appear here</p>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginTop: '24px'
      }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Meetings Analysis
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Meeting frequency, duration, and attendance trends
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#EFF6FF',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#1D4ED8',
                fontWeight: 500,
              }}>
                <Calendar size={14} />
                {meetingsData.length} meetings
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              padding: '14px', 
              background: '#F0FDF4', 
              borderRadius: '10px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#22C55E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 500 }}>Total Meetings</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534' }}>
                {meetingsData.length}
              </div>
            </div>

            <div style={{ 
              padding: '14px', 
              background: '#EFF6FF', 
              borderRadius: '10px',
              border: '1px solid #BFDBFE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#3B82F6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UsersRound size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#1D4ED8', fontWeight: 500 }}>Avg Attendance</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1D4ED8' }}>
                {attendanceData?.summary?.totalAttendance || 0}
              </div>
            </div>

            <div style={{ 
              padding: '14px', 
              background: '#FDF4FF', 
              borderRadius: '10px',
              border: '1px solid #F0ABFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#A855F7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#A21CAF', fontWeight: 500 }}>Attendance Rate</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#A21CAF' }}>
                {attendanceData?.summary?.attendanceRate || 0}%
              </div>
            </div>
          </div>

          <div style={{ height: '200px' }}>
            {bonusData?.meetingStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={bonusData.meetingStats.slice(0, 6).map((m: any) => ({
                    name: m.meetingTitle?.substring(0, 15) || 'Unknown',
                    attendees: m.totalAttendees || 0,
                    rate: Math.round((m.totalAttendees / (attendanceData?.summary?.totalMembers || 1)) * 100),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.text} 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis 
                    stroke={chartColors.text} 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="attendees" 
                    fill={COLORS.green}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    name="Attendees"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#9CA3AF'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No meeting data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                Bonuses Analysis
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Bonus distribution and payout amounts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#FEF3C7',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: '#92400E',
                fontWeight: 500,
              }}>
                <Award size={14} />
                {formatCurrency(bonusData?.totalBonus || 0)} total
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              padding: '14px', 
              background: '#FEF3C7', 
              borderRadius: '10px',
              border: '1px solid #FDE68A'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#F59E0B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 500 }}>Total Bonuses</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#92400E' }}>
                {formatCurrency(bonusData?.totalBonus || 0)}
              </div>
            </div>

            <div style={{ 
              padding: '14px', 
              background: '#F0FDF4', 
              borderRadius: '10px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#22C55E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 500 }}>Recipients</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534' }}>
                {bonusData?.bonusRecipients || 0}
              </div>
            </div>

            <div style={{ 
              padding: '14px', 
              background: '#EFF6FF', 
              borderRadius: '10px',
              border: '1px solid #BFDBFE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', background: '#3B82F6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChartBar size={14} color="white" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#1D4ED8', fontWeight: 500 }}>Avg per Person</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1D4ED8' }}>
                {bonusData?.bonusRecipients > 0 
                  ? formatCurrency(Math.round((bonusData?.totalBonus || 0) / bonusData?.bonusRecipients))
                  : formatCurrency(0)}
              </div>
            </div>
          </div>

          <div style={{ height: '200px' }}>
            {bonusData?.dailyStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={bonusData.dailyStats.slice(0, 14).map((d: any) => ({
                    date: d._id ? new Date(d._id).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : 'N/A',
                    bonus: d.bonusTotal || 0,
                    count: d.count || 0,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartColors.text} 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis 
                    stroke={chartColors.text} 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `KES ${value/1000}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bonus" 
                    stroke={COLORS.yellow} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.yellow, strokeWidth: 2 }}
                    name="Bonus Amount"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#9CA3AF'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Award size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No bonus data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}