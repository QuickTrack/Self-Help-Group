'use client';

import { useState, useEffect } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { 
  Heart, 
  Plus, 
  FileText, 
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  X,
  Eye,
  Info,
  Calendar,
  User,
  File,
  Send,
  HelpCircle
} from 'lucide-react';
import { MemberSearch } from '@/components/MemberSearch';

interface EventTypeOption {
  name: string;
  maxCompensation: number;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Paid: 'bg-blue-100 text-blue-800',
  Cancelled: 'bg-gray-100 text-gray-800',
};

interface WelfareStats {
  fundBalance: number;
  totalContributions: number;
  contributionCount: number;
  totalPayouts: number;
  payoutCount: number;
  activeMembers: number;
}

export default function WelfarePage() {
  const [activeTab, setActiveTab] = useState<'contributions' | 'payouts'>('contributions');
  const [contributions, setContributions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState<WelfareStats>({
    fundBalance: 0,
    totalContributions: 0,
    contributionCount: 0,
    totalPayouts: 0,
    payoutCount: 0,
    activeMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedPayoutMember, setSelectedPayoutMember] = useState('');
  const [selectedPayoutRequest, setSelectedPayoutRequest] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([]);
  const [eventLimits, setEventLimits] = useState<Record<string, number>>({});
  const [contributionNotification, setContributionNotification] = useState<string | null>(null);
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [contribRes, payoutRes, eventTypesRes] = await Promise.all([
        fetch('/api/welfare'),
        fetch('/api/welfare/payout'),
        fetch('/api/life-event-types/options'),
      ]);
      const contribData = await contribRes.json();
      const payoutData = await payoutRes.json();
      const eventTypesData = await eventTypesRes.json();
      
      setContributions(contribData.contributions || []);
      setPayouts(payoutData.payouts || []);
      
      const pending = (payoutData.payouts || []).filter((p: any) => 
        p.status === 'Pending' || p.status === 'Approved'
      );
      setPendingPayouts(pending);
      
      let types = eventTypesData.eventTypes || [];
      
      if (!types.length || eventTypesData.error) {
        types = [
          { name: 'Bereavement', maxCompensation: 20000 },
          { name: 'Wedding', maxCompensation: 15000 },
          { name: 'Celebration', maxCompensation: 10000 },
          { name: 'Medical', maxCompensation: 25000 },
          { name: 'Disaster', maxCompensation: 30000 },
        ];
      }
      
      setEventTypes(types);
      const limits: Record<string, number> = {};
      types.forEach((t: EventTypeOption) => {
        limits[t.name] = t.maxCompensation;
      });
      setEventLimits(limits);
      
      const totalContrib = (contribData.contributions || []).reduce((s: number, c: any) => s + c.amount, 0);
      const totalPayout = (payoutData.payouts || []).filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + (p.approvedAmount || 0), 0);
      
      setStats({
        fundBalance: totalContrib - totalPayout,
        totalContributions: totalContrib,
        contributionCount: contribData.count || 0,
        totalPayouts: totalPayout,
        payoutCount: payoutData.payouts?.length || 0,
        activeMembers: 5,
      });
    } catch (error) {
      console.error('Error loading welfare data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContribution(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      member: selectedMember,
      amount: parseFloat(formData.get('amount') as string),
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes'),
      payoutRequestId: selectedPayoutRequest || undefined,
    };
    
    if (!selectedMember) {
      alert('Please select a member');
      return;
    }
    
    if (selectedPayoutRequest) {
      const payout = pendingPayouts.find(p => p._id === selectedPayoutRequest);
      if (payout) {
        const amount = parseFloat(formData.get('amount') as string);
        const maxLimit = eventLimits[payout.eventType] || 10000;
        const needed = maxLimit - (payout.approvedAmount || 0);
        
        if (amount < needed && !confirm(`This contribution (KES ${amount.toLocaleString()}) is less than the amount needed (KES ${needed.toLocaleString()}). Submit anyway?`)) {
          return;
        }
      }
    }
    
    setContributionError(null);
    setContributionNotification(null);
    
    try {
      const res = await fetch('/api/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        setShowModal(false);
        setSelectedMember('');
        setSelectedPayoutRequest('');
        loadData();
        
        if (responseData.notifications && responseData.notifications.length > 0) {
          setContributionNotification(responseData.notifications.join(' '));
        } else if (responseData.message) {
          setContributionNotification(responseData.message);
        }
      } else {
        setContributionError(responseData.error || 'Failed to add contribution');
        if (responseData.warning) {
          setContributionNotification(responseData.warning);
        }
      }
    } catch (error) {
      setContributionError('Failed to add contribution');
      console.error('Error adding contribution:', error);
    }
  }

  async function handleRequestPayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPayoutError(null);
    
    const formData = new FormData(e.currentTarget);
    const eventType = formData.get('eventType') as string;
    const requestedAmount = eventLimits[eventType] || 0;
    
    const data = {
      member: selectedPayoutMember,
      eventType: eventType,
      eventDescription: formData.get('eventDescription'),
      requestedAmount: requestedAmount,
      eventDate: formData.get('eventDate'),
      notes: formData.get('notes'),
    };
    
    if (!selectedPayoutMember) {
      setPayoutError('Please select a member');
      return;
    }
    
    if (requestedAmount <= 0) {
      setPayoutError('Please select a valid event type');
      return;
    }
    
    try {
      const res = await fetch('/api/welfare/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        setShowPayoutModal(false);
        setSelectedPayoutMember('');
        setSelectedEventType('');
        setPayoutError(null);
        loadData();
      } else {
        const errorData = await res.json();
        setPayoutError(errorData.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      setPayoutError('Failed to submit request');
    }
  }

  async function handleApprovePayout(id: string, overrideEligible: boolean = false) {
    try {
      const res = await fetch('/api/welfare/payout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve', userId: '1', overrideEligible }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.eligibilityDetails) {
          const reasons = data.eligibilityDetails.reasons?.join('\n') || 'Eligibility requirements not met';
          if (overrideEligible) {
            alert(`Override failed: ${reasons}`);
          } else {
            const proceed = confirm(`Member does not meet eligibility requirements:\n\n${reasons}\n\nDo you want to override and approve anyway?\n\nNote: Override requires documenting justification per the override protocol.`);
            if (proceed) {
              handleApprovePayout(id, true);
            }
          }
        } else {
          alert(data.error || data.details || 'Failed to approve payout');
        }
        return;
      }
      
      loadData();
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('Failed to approve payout. Please try again.');
    }
  }

  async function handleRejectPayout(id: string, reason: string) {
    try {
      const res = await fetch('/api/welfare/payout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', rejectionReason: reason, userId: '1' }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to reject payout');
        return;
      }
      
      loadData();
    } catch (error) {
      console.error('Error rejecting payout:', error);
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      const res = await fetch('/api/welfare/payout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'pay', userId: '1' }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        if (data.eligibilityDetails) {
          alert(`Cannot process payment: Member does not meet eligibility requirements:\n\n${data.eligibilityDetails.reasons.join('\n')}`);
        } else {
          alert(data.error || 'Failed to process payment');
        }
        return;
      }
      
      loadData();
    } catch (error) {
      console.error('Error marking payout as paid:', error);
    }
  }

  async function exportReport(type: string) {
    try {
      const res = await fetch(`/api/welfare/reports?type=${type}`);
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `welfare-${type}-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  }

  const filteredPayouts = payouts.filter((p) => !filterStatus || p.status === filterStatus);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Welfare Fund
          </h1>
          <p className="text-gray-600">Emergency fund for life events</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportReport('audit')} className="btn btn-outline flex items-center gap-1">
            <Download className="w-4 h-4" /> Audit
          </button>
          <PermissionGuard permission="welfare.create" fallback={
            <button className="btn btn-primary flex items-center gap-1" disabled style={{ opacity: 0.5 }}>
              <Plus className="w-4 h-4" /> Add Contribution
            </button>
          }>
            <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Contribution
            </button>
          </PermissionGuard>
          <PermissionGuard permission="welfare.create" fallback={
            <button className="btn btn-primary flex items-center gap-1" disabled style={{ opacity: 0.5 }}>
              <Plus className="w-4 h-4" /> Request Payout
            </button>
          }>
            <button onClick={() => setShowPayoutModal(true)} className="btn btn-primary flex items-center gap-1">
              <Plus className="w-4 h-4" /> Request Payout
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="w-4 h-4" /> Fund Balance
          </div>
          <div className="text-2xl font-bold text-green-600">
            KES {stats.fundBalance.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" /> Contributions
          </div>
          <div className="text-2xl font-bold">
            KES {stats.totalContributions.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" /> Total Payouts
          </div>
          <div className="text-2xl font-bold text-blue-600">
            KES {stats.totalPayouts.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <AlertTriangle className="w-4 h-4" /> Pending
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {payouts.filter((p) => p.status === 'Pending').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'contributions' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            Contributions
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'payouts' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            Payout Requests
          </button>
        </div>

        {activeTab === 'contributions' && (
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {contributions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No contributions yet
                    </td>
                  </tr>
                ) : (
                  contributions.map((c: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="py-2">{c.member?.fullName || 'Unknown'}</td>
                      <td className="py-2">KES {c.amount?.toLocaleString()}</td>
                      <td className="py-2">{c.paymentMethod}</td>
                      <td className="py-2 text-gray-500">{c.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <select
                className="border rounded px-3 py-1"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Event</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">
                    <span className="flex items-center gap-1">
                      Eligibility
                      <span className="text-xs text-gray-400">(click to view)</span>
                    </span>
                  </th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      No payout requests
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p: any) => (
                    <tr key={p._id} className="border-b">
                      <td className="py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">{p.member?.fullName || 'Unknown'}</td>
                      <td className="py-2">
                        <div className="font-medium">{p.eventType}</div>
                        <div className="text-sm text-gray-500">{p.eventDescription}</div>
                      </td>
                      <td className="py-2">
                        <div>Requested: KES {p.requestedAmount?.toLocaleString()}</div>
                        {p.approvedAmount && (
                          <div className="text-green-600">Approved: KES {p.approvedAmount?.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${statusColors[p.status] || 'bg-gray-100'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <button 
                          onClick={() => setSelectedPayoutDetails(p)}
                          className={`flex items-center gap-1 hover:underline cursor-pointer ${p.eligibilityCheck?.isEligible ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {p.eligibilityCheck?.isEligible ? (
                            <>
                              <CheckCircle className="w-4 h-4" /> Eligible
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" /> Ineligible
                            </>
                          )}
                        </button>
                        {p.eligibilityCheck?.isEligible && p.eligibilityCheck?.warnings?.length > 0 && (
                          <span className="text-xs text-yellow-600 ml-1">
                            ({p.eligibilityCheck.warnings.length} warning(s))
                          </span>
                        )}
                        {!p.eligibilityCheck?.isEligible && p.eligibilityCheck?.reasons?.length > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({p.eligibilityCheck.reasons.length} issue(s))
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {p.status === 'Pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprovePayout(p._id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleRejectPayout(p._id, reason);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {p.status === 'Approved' && (
                          <button
                            onClick={() => handleMarkPaid(p._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Welfare Contribution</h2>
            
            {contributionNotification && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                {contributionNotification}
              </div>
            )}
            
            {contributionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {contributionError}
              </div>
            )}
            
            <form onSubmit={handleAddContribution}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Member</label>
                <MemberSearch
                  value={selectedMember}
                  onChange={(memberId) => {
                    setSelectedMember(memberId);
                    setSelectedPayoutRequest('');
                  }}
                  placeholder="Search member by name, ID, or phone..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Apply to Payout Request (Optional)</label>
                <select 
                  value={selectedPayoutRequest}
                  onChange={(e) => setSelectedPayoutRequest(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">No payout request - general contribution</option>
                  {pendingPayouts
                    .filter(p => !selectedMember || p.member?._id === selectedMember || p.member === selectedMember)
                    .map(p => {
                      const maxLimit = eventLimits[p.eventType] || 10000;
                      const needed = maxLimit - (p.approvedAmount || 0);
                      return (
                        <option key={p._id} value={p._id}>
                          {p.member?.fullName || 'Unknown'} - {p.eventType} (KES {needed.toLocaleString()} needed)
                        </option>
                      );
                    })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a payout request to automatically apply this contribution
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (KES)</label>
                <input name="amount" type="number" required min="1" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select name="paymentMethod" className="w-full border rounded px-3 py-2">
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input name="notes" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setContributionNotification(null);
                  setContributionError(null);
                }} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-t-xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Request Welfare Payout</h2>
                    <p className="text-xs text-white/80">Submit a life event claim for approval</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowPayoutModal(false); setPayoutError(null); }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {payoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{payoutError}</p>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Fill in the details below. Your request will be reviewed by the committee. Maximum payout depends on the event type.
                </p>
              </div>

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" /> Member Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
                    <MemberSearch
                      value={selectedPayoutMember}
                      onChange={(memberId) => setSelectedPayoutMember(memberId)}
                      placeholder="Search by name, member ID, or phone number..."
                    />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <File className="w-4 h-4" /> Event Details
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type *
                      <span className="font-normal text-gray-500 ml-1">(what happened)</span>
                    </label>
                    <select 
                      name="eventType" 
                      required 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value)}
                    >
                      <option value="">Select event type...</option>
                      {eventTypes.map((type) => (
                        <option key={type.name} value={type.name}>
                          {type.name} (up to KES {type.maxCompensation?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum payout for selected event
                    </p>
                  </div>

                  {selectedEventType && eventLimits[selectedEventType] && (
                    <div className="bg-green-100 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-700">Maximum Payout</p>
                        <p className="text-lg font-bold text-green-800">
                          KES {eventLimits[selectedEventType].toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Event Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Description *
                      <span className="font-normal text-gray-500 ml-1">(brief explanation)</span>
                    </label>
                    <input 
                      name="eventDescription" 
                      required 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="e.g., Death of father - John Kamau"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date
                      </label>
                      <input 
                        name="eventDate" 
                        type="date" 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        Additional Notes
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input 
                        name="notes" 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Any extra details..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowPayoutModal(false); setPayoutError(null); }} 
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedPayoutDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Eligibility Details</h2>
              <button onClick={() => setSelectedPayoutDetails(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Member: {selectedPayoutDetails.member?.fullName || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">Event: {selectedPayoutDetails.eventType}</p>
                <p className="text-sm text-gray-600">Requested: KES {selectedPayoutDetails.requestedAmount?.toLocaleString()}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Eligibility Status</h4>
                {selectedPayoutDetails.eligibilityCheck?.isEligible ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Eligible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Not Eligible</span>
                  </div>
                )}
              </div>

              {selectedPayoutDetails.eligibilityCheck?.checks && (
                <div>
                  <h4 className="font-medium mb-2">Checks Performed</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedPayoutDetails.eligibilityCheck.checks).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPayoutDetails.eligibilityCheck?.reasons?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Issues</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedPayoutDetails.eligibilityCheck.reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="text-sm text-red-600">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPayoutDetails.eligibilityCheck?.warnings?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-yellow-600">Warnings</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedPayoutDetails.eligibilityCheck.warnings.map((warning: string, idx: number) => (
                      <li key={idx} className="text-sm text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPayoutDetails.eligibilityCheck?.details && (
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Months Active: <span className="font-medium">{selectedPayoutDetails.eligibilityCheck.details.monthsActive}</span></div>
                    <div>Total Contributions: <span className="font-medium">KES {selectedPayoutDetails.eligibilityCheck.details.totalContributed?.toLocaleString()}</span></div>
                    <div>Recent Contributions: <span className="font-medium">{selectedPayoutDetails.eligibilityCheck.details.monthlyContributions}</span></div>
                    <div>Pending Payouts: <span className="font-medium">{selectedPayoutDetails.eligibilityCheck.details.pendingPayouts}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedPayoutDetails(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}