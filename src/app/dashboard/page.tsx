'use client';

import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { 
  Users, 
  Wallet, 
  Banknote, 
  PiggyBank, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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
  Bar
} from 'recharts';

const monthlyData = [
  { month: 'Jan', contributions: 12500, loans: 8000 },
  { month: 'Feb', contributions: 15800, loans: 12000 },
  { month: 'Mar', contributions: 14200, loans: 9500 },
  { month: 'Apr', contributions: 18500, loans: 15000 },
  { month: 'May', contributions: 16800, loans: 11000 },
  { month: 'Jun', contributions: 19200, loans: 18000 },
];

const recentTransactions = [
  { type: 'contribution', member: 'John Kamau', amount: 1000, date: '2024-06-01', method: 'M-Pesa' },
  { type: 'loan', member: 'Grace Wanjiku', amount: 30000, date: '2024-06-02', method: 'Bank' },
  { type: 'contribution', member: 'David Maina', amount: 500, date: '2024-06-03', method: 'Cash' },
  { type: 'loan', member: 'Faith Nyambura', amount: 15000, date: '2024-06-04', method: 'M-Pesa' },
  { type: 'contribution', member: 'Joseph Mwangi', amount: 1000, date: '2024-06-05', method: 'Bank' },
];

export default function DashboardPage() {
  const { members, contributions, loans, savings, calculateDashboardStats } = useStore();
  const [stats, setStats] = useState({
    totalMembers: 5,
    activeMembers: 4,
    totalContributions: 97000,
    monthlyContributions: 19200,
    activeLoans: 2,
    loansOutstanding: 95000,
    totalSavings: 40000,
    memberGrowth: 25,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Overview of your Self Help Group performance
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: '#DCFCE7' }}>
              <Users size={20} color="#166534" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stats.memberGrowth >= 0 ? '#166534' : '#991B1B', fontSize: '0.75rem', fontWeight: 500 }}>
              {stats.memberGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(stats.memberGrowth)}%
            </div>
          </div>
          <div>
            <div className="stat-value">{stats.activeMembers}</div>
            <div className="stat-label">Active Members</div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: '#DBEAFE' }}>
              <Wallet size={20} color="#1E40AF" />
            </div>
          </div>
          <div>
            <div className="stat-value">{formatCurrency(stats.monthlyContributions)}</div>
            <div className="stat-label">Monthly Contributions</div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: '#FEE2E2' }}>
              <Banknote size={20} color="#991B1B" />
            </div>
          </div>
          <div>
            <div className="stat-value">{stats.activeLoans}</div>
            <div className="stat-label">Active Loans</div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="stat-icon" style={{ background: '#FEF3C7' }}>
              <PiggyBank size={20} color="#92400E" />
            </div>
          </div>
          <div>
            <div className="stat-value">{formatCurrency(stats.totalSavings)}</div>
            <div className="stat-label">Total Savings</div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '20px' }}>
            Financial Overview
          </h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#228B22" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#228B22" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B6B6B" fontSize={12} />
                <YAxis stroke="#6B6B6B" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                />
                <Area type="monotone" dataKey="contributions" stroke="#228B22" strokeWidth={2} fill="url(#colorContrib)" />
                <Area type="monotone" dataKey="loans" stroke="#FF6B35" strokeWidth={2} fill="url(#colorLoans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '20px' }}>
            Recent Transactions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTransactions.map((tx, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#F9FAFB',
                borderRadius: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: tx.type === 'contribution' ? '#DCFCE7' : '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {tx.type === 'contribution' ? (
                      <Wallet size={16} color="#166534" />
                    ) : (
                      <Banknote size={16} color="#991B1B" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>
                      {tx.member}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                      {tx.type === 'contribution' ? 'Contribution' : 'Loan Disbursement'} • {tx.method}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: tx.type === 'contribution' ? '#166534' : '#991B1B' }}>
                  {tx.type === 'contribution' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '20px' }}>
          Loan Portfolio Distribution
        </h3>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'John Kamau', balance: 65000 },
              { name: 'Grace Wanjiku', balance: 30000 },
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B6B6B" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
              <YAxis type="category" dataKey="name" stroke="#6B6B6B" fontSize={12} width={100} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="balance" fill="#FF6B35" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}