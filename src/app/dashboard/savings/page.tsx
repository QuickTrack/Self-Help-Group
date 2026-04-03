'use client';

import { useState } from 'react';
import { useStore } from '../../../stores/useStore';
import { 
  PiggyBank, 
  Search, 
  Plus, 
  X,
  TrendingUp,
  Wallet
} from 'lucide-react';

export default function SavingsPage() {
  const { members, savings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    member: '',
    amount: '',
    type: 'deposit',
  });

  const getMemberName = (id: string) => {
    const member = members.find((m: any) => m._id === id);
    return member?.fullName || 'Unknown';
  };

  const getSavings = (memberId: string) => {
    const s = savings.find((s: any) => s.member === memberId);
    return s || { savingsBalance: 0, totalShares: 0 };
  };

  const enrichedMembers = members.map((member: any) => ({
    ...member,
    savings: getSavings(member._id),
  }));

  const filteredMembers = enrichedMembers.filter((m: any) => {
    return !searchTerm || 
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalSavings = savings.reduce((sum: number, s: any) => sum + s.savingsBalance, 0);
  const totalShares = savings.reduce((sum: number, s: any) => sum + s.totalShares, 0);

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
          Savings & Shares
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Track member savings and shareholdings
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#FEF3C7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PiggyBank size={20} color="#92400E" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Total Savings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>{formatCurrency(totalSavings)}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#DBEAFE',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} color="#1E40AF" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Total Shares</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>{totalShares}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#DCFCE7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={20} color="#166534" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Share Value</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>KES 1,000/share</div>
            </div>
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
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px', width: '240px', height: '40px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Transaction
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Member ID</th>
              <th>Savings Balance</th>
              <th>Total Shares</th>
              <th>Equity Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member: any) => (
                <tr key={member._id}>
                  <td style={{ fontWeight: 500 }}>{member.fullName}</td>
                  <td>{member.memberId}</td>
                  <td style={{ fontWeight: 600, color: '#166534' }}>
                    {formatCurrency(member.savings.savingsBalance)}
                  </td>
                  <td>{member.savings.totalShares}</td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(member.savings.totalShares * 1000)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Add Savings Transaction
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="input-label">Member *</label>
                  <select
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                    className="input select"
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map((m: any) => (
                      <option key={m._id} value={m._id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Transaction Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input select"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="share_purchase">Buy Shares</option>
                    <option value="withdrawal">Withdrawal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Amount (KES)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="1000"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}