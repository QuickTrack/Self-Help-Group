'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../../stores/useStore';
import { PermissionGuard } from '@/components/PermissionGuard';
import { 
  Banknote, 
  Search, 
  Plus, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Users
} from 'lucide-react';
import { MemberSearch } from '@/components/MemberSearch';

const loanStatuses = ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Paid'];

export default function LoansPage() {
  const { members } = useStore();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    member: '',
    principalAmount: '',
    interestRate: '10',
    repaymentPeriod: '6',
    guarantor1: '',
    guarantor2: '',
  });

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans?limit=100');
      const data = await res.json();
      if (data.loans) {
        setLoans(data.loans);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const getMemberName = (memberData: any) => {
    if (!memberData) return 'Unknown';
    if (typeof memberData === 'string') {
      const member = members.find((m: any) => m._id === memberData);
      return member?.fullName || 'Unknown';
    }
    return memberData.fullName || 'Unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disbursed':
        return <Banknote size={16} color="#991B1B" />;
      case 'Approved':
        return <CheckCircle size={16} color="#166534" />;
      case 'Rejected':
        return <XCircle size={16} color="#991B1B" />;
      case 'Paid':
        return <CheckCircle size={16} color="#228B22" />;
      default:
        return <Clock size={16} color="#92400E" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disbursed':
        return 'badge-error';
      case 'Approved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-error';
      case 'Paid':
        return 'badge-success';
      default:
        return 'badge-warning';
    }
  };

  const filteredLoans = loans.filter((loan: any) => {
    const memberName = getMemberName(loan.member).toLowerCase();
    const matchesSearch = !searchTerm || memberName.includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = loans
    .filter((l: any) => l.status === 'Disbursed')
    .reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const principal = Number(formData.principalAmount);
    const rate = Number(formData.interestRate) / 100;
    const period = Number(formData.repaymentPeriod);
    const totalInterest = Math.round(principal * rate * period);
    const totalRepayable = principal + totalInterest;
    const installmentAmount = Math.round(totalRepayable / period);

    if (!formData.member || !principal || !period) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: formData.member,
          principalAmount: principal,
          interestRate: Number(formData.interestRate),
          repaymentPeriod: period,
          guarantor1: formData.guarantor1 || undefined,
          guarantor2: formData.guarantor2 || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoans((prev) => [data.loan, ...prev]);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to apply for loan');
        return;
      }
    } catch (error) {
      console.error('Error applying for loan:', error);
      alert('Failed to apply for loan');
      return;
    }

    setShowModal(false);
    setFormData({
      member: '',
      principalAmount: '',
      interestRate: '10',
      repaymentPeriod: '6',
      guarantor1: '',
      guarantor2: '',
    });
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoans((prev) => prev.map((l) => l._id === id ? data.loan : l));
      }
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleDisburse = async (id: string) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'disburse' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoans((prev) => prev.map((l) => l._id === id ? data.loan : l));
      }
    } catch (error) {
      console.error('Error disbursing loan:', error);
    }
  };

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
          Loans
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Manage member loans and repayments
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Active Loans</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A' }}>
            {loans.filter((l: any) => l.status === 'Disbursed').length}
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Outstanding</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>{formatCurrency(totalOutstanding)}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Pending Approval</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>
            {loans.filter((l: any) => l.status === 'Pending').length}
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Total Disbursed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A' }}>
            {formatCurrency(loans.reduce((sum: number, l: any) => sum + l.principalAmount, 0))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B' }} />
            <input
              type="text"
              placeholder="Search by member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px', width: '240px', height: '40px' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input select"
            style={{ width: '160px', height: '40px' }}
          >
            <option value="">All Status</option>
            {loanStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            New Loan
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
              No loans found
            </div>
          ) : (
            filteredLoans.map((loan: any) => (
              <div 
                key={loan._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: loan.status === 'Disbursed' ? '#FEE2E2' : '#FEF3C7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {getStatusIcon(loan.status)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                      {getMemberName(loan.member)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                      {loan.principalAmount && formatCurrency(loan.principalAmount)} • {loan.repaymentPeriod} months @ {loan.interestRate}%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#1A1A1A' }}>
                      {loan.status === 'Disbursed' ? formatCurrency(loan.outstandingBalance) : formatCurrency(loan.totalRepayable)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                      {loan.status === 'Disbursed' ? 'Outstanding' : 'Total Repayable'}
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(loan.status)}`}>
                    {loan.status}
                  </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                    {loan.status === 'Pending' && (
                      <>
                        <PermissionGuard permission="loans.approve" fallback={null}>
                          <button
                            onClick={() => handleApprove(loan._id)}
                            className="btn btn-sm btn-primary"
                          >
                            Approve
                          </button>
                        </PermissionGuard>
                      </>
                    )}
                    {loan.status === 'Approved' && (
                      <PermissionGuard permission="loans.disburse" fallback={null}>
                        <button
                          onClick={() => handleDisburse(loan._id)}
                          className="btn btn-sm btn-primary"
                        >
                          Disburse
                        </button>
                      </PermissionGuard>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Apply for Loan
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="input-label">Member *</label>
                  <MemberSearch
                    value={formData.member}
                    onChange={(memberId) => setFormData({ ...formData, member: memberId })}
                    placeholder="Search member by name, ID, or phone..."
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Principal Amount (KES) *</label>
                  <input
                    type="number"
                    value={formData.principalAmount}
                    onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                    className="input"
                    placeholder="50000"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="input-label">Interest Rate (%)</label>
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Repayment Period (months)</label>
                    <input
                      type="number"
                      value={formData.repaymentPeriod}
                      onChange={(e) => setFormData({ ...formData, repaymentPeriod: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="input-label">Guarantor 1</label>
                    <select
                      value={formData.guarantor1}
                      onChange={(e) => setFormData({ ...formData, guarantor1: e.target.value })}
                      className="input select"
                    >
                      <option value="">Select</option>
                      {members.filter((m: any) => m._id !== formData.member).map((m: any) => (
                        <option key={m._id} value={m._id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Guarantor 2</label>
                    <select
                      value={formData.guarantor2}
                      onChange={(e) => setFormData({ ...formData, guarantor2: e.target.value })}
                      className="input select"
                    >
                      <option value="">Select</option>
                      {members.filter((m: any) => m._id !== formData.member).map((m: any) => (
                        <option key={m._id} value={m._id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}