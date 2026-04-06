'use client';

import { useState } from 'react';
import { useStore } from '../../../stores/useStore';
import { PermissionGuard } from '@/components/PermissionGuard';
import { 
  Wallet, 
  Search, 
  Plus, 
  Download, 
  Filter,
  X,
  Calendar,
  Banknote,
  Building2
} from 'lucide-react';
import { MemberSearch } from '@/components/MemberSearch';

const paymentMethods = ['Cash', 'M-Pesa', 'Bank'];
const contributionTypes = ['Monthly', 'Weekly', 'Special'];

export default function ContributionsPage() {
  const { members, contributions, addContribution } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    member: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'M-Pesa',
    contributionType: 'Monthly',
    isRecurring: false,
    notes: '',
  });

  const getMemberName = (memberData: any) => {
    if (typeof memberData === 'object' && memberData?.fullName) {
      return memberData.fullName;
    }
    if (typeof memberData === 'string') {
      const member = members.find((m: any) => m.memberId === memberData || m._id === memberData);
      return member?.fullName || 'Unknown';
    }
    return 'Unknown';
  };

  const filteredContributions = contributions.filter((c: any) => {
    const memberName = getMemberName(c.member).toLowerCase();
    const matchesSearch = !searchTerm || memberName.includes(searchTerm.toLowerCase());
    const matchesMethod = !filterMethod || c.paymentMethod === filterMethod;
    const matchesType = !filterType || c.contributionType === filterType;
    return matchesSearch && matchesMethod && matchesType;
  });

  const totalAmount = filteredContributions.reduce((sum: number, c: any) => sum + c.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.member || !formData.amount) {
      alert('Please select a member and enter an amount');
      return;
    }

    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: formData.member,
          amount: Number(formData.amount),
          date: formData.date,
          paymentMethod: formData.paymentMethod,
          contributionType: formData.contributionType,
          isRecurring: formData.isRecurring,
          notes: formData.notes || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addContribution(data.contribution);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to record contribution');
        return;
      }
    } catch (error) {
      console.error('Error recording contribution:', error);
      alert('Failed to record contribution');
      return;
    }

    setShowModal(false);
    setFormData({
      member: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'M-Pesa',
      contributionType: 'Monthly',
      isRecurring: false,
      notes: '',
    });
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Member', 'Amount', 'Type', 'Method', 'Notes'],
      ...filteredContributions.map((c: any) => [
        new Date(c.date).toLocaleDateString(),
        getMemberName(c.member),
        c.amount,
        c.contributionType,
        c.paymentMethod,
        c.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contributions.csv';
    a.click();
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
          Contributions
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Record and manage chama contributions
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Total Contributions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A' }}>{formatCurrency(totalAmount)}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>This Month</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#228B22' }}>{formatCurrency(7000)}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: '4px' }}>Records</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A' }}>{filteredContributions.length}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="input select"
              style={{ width: '140px', height: '40px' }}
            >
              <option value="">All Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input select"
              style={{ width: '140px', height: '40px' }}
            >
              <option value="">All Types</option>
              {contributionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} />
              Export
            </button>
            <PermissionGuard permission="contributions.create" fallback={
              <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
                <Plus size={16} />
                Add Contribution
              </button>
            }>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                Add Contribution
              </button>
            </PermissionGuard>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredContributions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                  No contributions found
                </td>
              </tr>
            ) : (
              filteredContributions.map((contribution: any) => (
                <tr key={contribution._id}>
                  <td>{new Date(contribution.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{getMemberName(contribution.member)}</td>
                  <td style={{ fontWeight: 600, color: '#166534' }}>{formatCurrency(contribution.amount)}</td>
                  <td>
                    <span className={`badge badge-${contribution.contributionType === 'Special' ? 'info' : 'success'}`}>
                      {contribution.contributionType}
                    </span>
                  </td>
                  <td>{contribution.paymentMethod}</td>
                  <td>
                    {contribution.isRecurring ? (
                      <span className="badge badge-info">Recurring</span>
                    ) : (
                      <span className="badge badge-success">Recorded</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Record Contribution
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
                  <label className="input-label">Amount (KES) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="1000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="input-label">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="input select"
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Type</label>
                    <select
                      value={formData.contributionType}
                      onChange={(e) => setFormData({ ...formData, contributionType: e.target.value })}
                      className="input select"
                    >
                      {contributionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Recurring Contribution</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="input-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Optional notes..."
                  />
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
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}