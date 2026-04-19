'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../../stores/useStore';
import { useAppSelector } from '@/lib/store/hooks';
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  Wallet,
  Banknote,
  PiggyBank,
  Printer,
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserCheck,
  Search,
  X,
  MessageCircle,
  Send
} from 'lucide-react';
import { MemberSearch } from '@/components/MemberSearch';

type ReportType = 'summary' | 'contributions' | 'loans' | 'members' | 'welfare' | 'attendance';

export default function ReportsPage() {
  const { members, contributions, loans, savings } = useStore();
  const { settings: groupSettings } = useAppSelector(state => state.group);
  const groupName = groupSettings?.groupName || 'Self Help Group';
  const [selectedReport, setSelectedReport] = useState<ReportType>('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [welfareData, setWelfareData] = useState<any>({ contributions: [], payouts: [] });
  const [welfareLoading, setWelfareLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedMemberStatement, setSelectedMemberStatement] = useState<string>('');
  const [memberContributions, setMemberContributions] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalContributions = contributions.reduce((sum: number, c: any) => sum + c.amount, 0);

  const memberTotalContributions = useMemo(() => {
    const map: Record<string, number> = {};
    contributions.forEach((c: any) => {
      const memberId = typeof c.member === 'string' ? c.member : c.member?._id;
      if (memberId) {
        map[memberId] = (map[memberId] || 0) + c.amount;
      }
    });
    return map;
  }, [contributions]);
  
  useEffect(() => {
    async function fetchContributions() {
      try {
        const res = await fetch('/api/contributions?limit=1000');
        const data = await res.json();
        if (data.contributions) {
          setMemberContributions(data.contributions || []);
        }
      } catch (error) {
        console.error('Failed to fetch contributions:', error);
      }
    }
    fetchContributions();
  }, []);
  
  // Ensure members are loaded
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/members?limit=100');
        const data = await res.json();
        if (data.members) {
          setDbMembers(data.members || []);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      }
    }
    fetchMembers();
  }, []);
  
  const displayMembers = members.length > 0 ? members : dbMembers;
  
  const dbMemberTotalContributions = useMemo(() => {
    const map: Record<string, number> = {};
    memberContributions.forEach((c: any) => {
      const memberId = typeof c.member === 'string' ? c.member : c.member?._id;
      if (memberId) {
        map[memberId] = (map[memberId] || 0) + c.amount;
      }
    });
    return map;
  }, [memberContributions]);
  
  const totalLoans = loans.reduce((sum: number, l: any) => sum + l.principalAmount, 0);
  const outstandingLoans = loans
    .filter((l: any) => l.status === 'Disbursed')
    .reduce((sum: number, l: any) => sum + l.outstandingBalance, 0);
  const totalSavings = savings.reduce((sum: number, s: any) => sum + s.savingsBalance, 0);

  const reports = [
    { id: 'summary', title: 'Group Summary', description: 'Overview of all group finances', icon: FileText },
    { id: 'contributions', title: 'Contributions Report', description: 'All contribution records', icon: Wallet },
    { id: 'loans', title: 'Loans Report', description: 'Loan portfolio status', icon: Banknote },
    { id: 'members', title: 'Member Statement', description: 'Individual member details', icon: Users },
    { id: 'welfare', title: 'Welfare Fund Report', description: 'Emergency fund status', icon: Heart },
    { id: 'attendance', title: 'Attendance Report', description: 'Meeting attendance and bonus stats', icon: UserCheck },
  ];

  useEffect(() => {
    if (selectedReport === 'welfare') {
      setWelfareLoading(true);
      Promise.all([
        fetch('/api/welfare').then(r => r.json()),
        fetch('/api/welfare/payout').then(r => r.json())
      ])
        .then(([contribRes, payoutRes]) => {
          setWelfareData({
            contributions: contribRes.contributions || [],
            payouts: payoutRes.payouts || []
          });
          setWelfareLoading(false);
        })
        .catch(() => setWelfareLoading(false));
    }

    if (selectedReport === 'attendance') {
      setAttendanceLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);
      params.set('type', 'summary');
      
      fetch(`/api/attendance/reports?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
          setAttendanceData(data);
          setAttendanceLoading(false);
        })
        .catch(() => setAttendanceLoading(false));
    }
    
    if (selectedReport === 'members' && selectedMemberStatement) {
      setMemberLoading(true);
      fetch(`/api/contributions?member=${selectedMemberStatement}&limit=500`)
        .then(r => r.json())
        .then(data => {
          setMemberContributions(data.contributions || []);
          setMemberLoading(false);
        })
        .catch(() => setMemberLoading(false));
    }
  }, [selectedReport, dateFrom, dateTo, selectedMemberStatement]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberStatement(memberId);
    setMemberContributions([]);
  };
  
  const handleWhatsApp = () => {
    if (!selectedMember) return;
    
    let phone = selectedMember.phoneNumber?.replace(/[^0-9]/g, '');
    if (!phone) {
      alert('No phone number available for this member');
      return;
    }
    
    // Format phone for WhatsApp - Kenya numbers should start with 254
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (!phone.startsWith('254') && phone.length === 12) {
      phone = '254' + phone.substring(0);
    } else if (!phone.startsWith('254') && phone.length === 9) {
      phone = '254' + phone;
    }
    
    const totalContrib = memberContributions.reduce((s: number, c: any) => s + c.amount, 0);
    const lastContrib = memberContributions[0] 
      ? new Date(memberContributions[0].date).toLocaleDateString()
      : 'N/A';
    
    const message = `*${groupName} - Member Statement*\n\n` +
      `_Member: ${selectedMember.fullName}_ (${selectedMember.memberId})\n` +
      `Status: ${selectedMember.status}\n\n` +
      `*Contribution Summary:*\n` +
      `• Total: ${formatCurrency(totalContrib)}\n` +
      `• Transactions: ${memberContributions.length}\n` +
      `• Last Contribution: ${lastContrib}\n\n` +
      `Generated: ${new Date().toLocaleDateString()}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    console.log('WhatsApp URL:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };
  
  const handleBulkWhatsApp = async () => {
    const activeMembers = members.filter((m: any) => m.status === 'active' && m.phoneNumber);
    if (activeMembers.length === 0) {
      alert('No active members with phone numbers found');
      return;
    }
    
    if (!confirm(`Send statement to ${activeMembers.length} members via WhatsApp?`)) {
      return;
    }
    
    setBulkSending(true);
    setBulkProgress(0);
    
    // Fetch contributions for all members first
    const memberContribMap: Record<string, any[]> = {};
    
    for (const member of activeMembers) {
      try {
        const res = await fetch(`/api/contributions?member=${member._id}&limit=500`);
        const data = await res.json();
        memberContribMap[member._id] = data.contributions || [];
      } catch (e) {
        memberContribMap[member._id] = [];
      }
    }
    
    // Now send to each member with delay to avoid blocking
    for (let i = 0; i < activeMembers.length; i++) {
      const member = activeMembers[i];
      const contributions = memberContribMap[member._id] || [];
      
      let phone = member.phoneNumber?.replace(/[^0-9]/g, '');
      if (!phone) continue;
      
      if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
      } else if (!phone.startsWith('254') && phone.length === 9) {
        phone = '254' + phone;
      }
      
      const totalContrib = contributions.reduce((s: number, c: any) => s + c.amount, 0);
      const lastContrib = contributions[0] 
        ? new Date(contributions[0].date).toLocaleDateString()
        : 'N/A';
      
      const message = `*${groupName} - Member Statement*\n\n` +
        `_Member: ${member.fullName}_ (${member.memberId})\n` +
        `Status: ${member.status}\n\n` +
        `*Contribution Summary:*\n` +
        `• Total: ${formatCurrency(totalContrib)}\n` +
        `• Transactions: ${contributions.length}\n` +
        `• Last Contribution: ${lastContrib}\n\n` +
        `Generated: ${new Date().toLocaleDateString()}`;
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      setBulkProgress(i + 1);
      
      // Delay between messages to avoid rate limiting
      if (i < activeMembers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setBulkSending(false);
    alert(`Sent statements to ${activeMembers.length} members!`);
  };
  
  const selectedMember = members.find((m: any) => m._id === selectedMemberStatement);

  const handleExportCSV = () => {
    let csv = '';
    
    if (selectedReport === 'summary') {
      csv = [
        ['Metric', 'Value'],
        ['Total Members', members.length],
        ['Active Members', members.filter((m: any) => m.status === 'active').length],
        ['Total Contributions', totalContributions],
        ['Total Loans Disbursed', totalLoans],
        ['Outstanding Loans', outstandingLoans],
        ['Total Savings', totalSavings],
      ].map(row => row.join(',')).join('\n');
    } else if (selectedReport === 'contributions') {
      csv = [
        ['Date', 'Member', 'Amount', 'Type', 'Method'],
        ...contributions.map((c: any) => [
          new Date(c.date).toLocaleDateString(),
          members.find((m: any) => m._id === c.member)?.fullName,
          c.amount,
          c.contributionType,
          c.paymentMethod
        ])
      ].map(row => row.join(',')).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report.csv`;
    a.click();
  };

  return (
    <div>
      <div className="print-only">
        <div className="print-header">
          <div className="print-header__left">
            <div className="print-header__logo">
              <span className="print-header__logo-text">GITHIRIONI SHG</span>
            </div>
          </div>
          <div className="print-header__right">
            <div className="print-header__date">
              <div>{new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: '8pt' }}>Financial Report</div>
            </div>
          </div>
        </div>
        <div className="print-footer">
          <span className="print-footer__confidential">Confidential</span>
          <span className="print-footer__version">v1.0</span>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Reports
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Generate and export financial reports
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        <div>
          <div className="card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id as ReportType)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: selectedReport === report.id ? '#EBF5EB' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      color: selectedReport === report.id ? '#228B22' : '#4A4A4A',
                    }}
                  >
                    <Icon size={18} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{report.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="no-print" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input"
                  style={{ width: '140px', height: '36px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input"
                  style={{ width: '140px', height: '36px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={16} />
                Print
              </button>
              <button className="btn btn-primary" onClick={handleExportCSV}>
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {selectedReport === 'summary' && (
            <div id="print-area">
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  background: '#228B22', 
                  borderRadius: '8px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white'
                }}>
                  <FileText size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>
                  {groupName}
                </h2>
                <p style={{ color: '#6B6B6B' }}>Financial Summary Report</p>
                <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>

              <table className="table" style={{ marginBottom: '24px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Total Members</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{members.length}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Active Members</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{members.filter((m: any) => m.status === 'active').length}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Total Contributions</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#166534' }}>{formatCurrency(totalContributions)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Total Loans Disbursed</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalLoans)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Outstanding Loans</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#991B1B' }}>{formatCurrency(outstandingLoans)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Total Savings</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#166534' }}>{formatCurrency(totalSavings)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '24px', textAlign: 'center', color: '#6B6B6B', fontSize: '0.875rem' }}>
                <p>{groupName} • {groupSettings?.location?.city || 'Githirioni'}, {groupSettings?.location?.county || 'Kiambu'}, Kenya</p>
                <p>This is a computer-generated document</p>
              </div>
            </div>
          )}

          {selectedReport === 'contributions' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                Contributions Report
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c: any) => (
                    <tr key={c._id}>
                      <td>{new Date(c.date).toLocaleDateString()}</td>
                      <td>{members.find((m: any) => m._id === c.member)?.fullName}</td>
                      <td>{c.contributionType}</td>
                      <td>{c.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#166534' }}>
                        {formatCurrency(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === 'loans' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                Loans Report
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l: any) => (
                    <tr key={l._id}>
                      <td>{members.find((m: any) => m._id === l.member)?.fullName}</td>
                      <td>{formatCurrency(l.principalAmount)}</td>
                      <td>{l.repaymentPeriod} months</td>
                      <td>
                        <span className={`badge badge-${l.status === 'Disbursed' ? 'error' : l.status === 'Paid' ? 'success' : 'warning'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(l.outstandingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

{selectedReport === 'members' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                Member Statement
              </h3>
              
              {!selectedMemberStatement ? (
                <>
                  <p style={{ color: '#6B6B6B', marginBottom: '16px' }}>
                    Select a member to view their detailed contribution statement
                  </p>
                  <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                      <MemberSearch
                        value={selectedMemberStatement}
                        onChange={handleMemberSelect}
                        placeholder="Search member by name, ID, or phone..."
                        filterStatus="all"
                      />
                    </div>
                    <button 
                      onClick={handleBulkWhatsApp}
                      disabled={bulkSending}
                      className="btn btn-secondary"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        background: '#25D366',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {bulkSending ? (
                        <>Sending ${bulkProgress}...</>
                      ) : (
                        <>
                          <Send size={16} />
                          Send All via WhatsApp
                        </>
                      )}
                    </button>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Total Contributions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayMembers.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#6B6B6B' }}>
                            Loading members...
                          </td>
                        </tr>
                      ) : displayMembers.map((m: any) => {
                        const totalContrib = dbMemberTotalContributions[m._id] || memberTotalContributions[m._id] || 0;
                        return (
                          <tr 
                            key={m._id} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMemberSelect(m._id)}
                          >
                            <td>{m.memberId}</td>
                            <td>{m.fullName}</td>
                            <td>{m.location}</td>
                            <td>
                              <span className={`badge badge-${m.status === 'active' ? 'success' : 'warning'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(totalContrib)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div>
                  <div style={{ 
                    background: '#F8FAF8', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Member</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {selectedMember?.fullName}
                        </div>
                        <div style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
                          {selectedMember?.memberId} • {selectedMember?.phoneNumber} • {selectedMember?.location}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMemberStatement('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#6B6B6B'
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    {memberLoading ? (
                      <div style={{ color: '#6B6B6B' }}>Loading contributions...</div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Total Contributions</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#16A34A' }}>
                              {formatCurrency(memberContributions.reduce((s: number, c: any) => s + c.amount, 0))}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Transactions</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                              {memberContributions.length}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Last Contribution</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                              {memberContributions[0] 
                                ? new Date(memberContributions[0].date).toLocaleDateString()
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Member Status</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                              <span className={`badge badge-${selectedMember?.status === 'active' ? 'success' : 'warning'}`}>
                                {selectedMember?.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handlePrint}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Printer size={16} />
                      Print Statement
                    </button>
                    <button 
                      onClick={handleWhatsApp}
                      className="btn btn-secondary"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        background: '#25D366',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  </div>
                  
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>
                    Contribution Transactions
                  </h4>
                  
                  {memberLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6B6B6B' }}>
                      Loading...
                    </div>
                  ) : memberContributions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6B6B6B' }}>
                      No contributions found for this member
                    </div>
                  ) : (
                    <table className="table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Ref No.</th>
                          <th>Type</th>
                          <th>Payment Method</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberContributions.map((c: any) => (
                          <tr key={c._id}>
                            <td>{new Date(c.date).toLocaleDateString()}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {c._id?.slice(-8).toUpperCase()}
                            </td>
                            <td>
                              <span className={`badge badge-${c.contributionType === 'Special' ? 'info' : 'success'}`}>
                                {c.contributionType}
                              </span>
                            </td>
                            <td>{c.paymentMethod}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>
                              {formatCurrency(c.amount)}
                            </td>
                            <td>
                              {c.isRecurring ? (
                                <span className="badge badge-info">Recurring</span>
                              ) : (
                                <span className="badge badge-success">Recorded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedReport === 'welfare' && welfareLoading && (
            <div className="loading">
              <div className="spinner" />
            </div>
          )}

          {selectedReport === 'welfare' && !welfareLoading && (() => {
            const welfareContributions = welfareData.contributions;
            const welfarePayouts = welfareData.payouts;
            
            const totalContrib = welfareContributions.reduce((s: number, c: any) => s + (c.amount || 0), 0);
            const totalPayout = welfarePayouts.filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + (p.approvedAmount || 0), 0);
            const fundBalance = totalContrib - totalPayout;
            const pendingPayouts = welfarePayouts.filter((p: any) => p.status === 'Pending').length;
            const approvedPayouts = welfarePayouts.filter((p: any) => p.status === 'Approved').length;
            
            const recentContributions = welfareContributions.slice(-5).reverse();
            const recentPayouts = welfarePayouts.filter((p: any) => p.status === 'Paid').slice(-5).reverse();
            
            const avgContribution = welfareContributions.length > 0 ? totalContrib / welfareContributions.length : 0;
            const payoutRatio = totalContrib > 0 ? (totalPayout / totalContrib * 100) : 0;
            
            return (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#EF4444', 
                    borderRadius: '8px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'white'
                  }}>
                    <Heart size={24} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>
                    {groupName}
                  </h2>
                  <p style={{ color: '#6B6B6B' }}>Welfare Fund Report</p>
                  <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: '#F0FDF4', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#16A34A', marginBottom: '4px' }}>
                      <Wallet size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Fund Balance</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16A34A' }}>
                      {formatCurrency(fundBalance)}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#EFF6FF', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#2563EB', marginBottom: '4px' }}>
                      <TrendingUp size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Contributions</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB' }}>
                      {formatCurrency(totalContrib)}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#DC2626', marginBottom: '4px' }}>
                      <TrendingDown size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Disbursements</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626' }}>
                      {formatCurrency(totalPayout)}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#D97706', marginBottom: '4px' }}>
                      <AlertTriangle size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Pending</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D97706' }}>
                      {pendingPayouts}
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#1A1A1A' }}>
                  Fund Overview
                </h3>
                <table className="table" style={{ marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500 }}>Total Contributions</td>
                      <td style={{ textAlign: 'right' }}>{welfareContributions.length}</td>
                      <td style={{ fontWeight: 500 }}>Total Disbursements</td>
                      <td style={{ textAlign: 'right' }}>{welfarePayouts.filter((p: any) => p.status === 'Paid').length}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500 }}>Pending Requests</td>
                      <td style={{ textAlign: 'right', color: '#D97706' }}>{pendingPayouts}</td>
                      <td style={{ fontWeight: 500 }}>Approved (Unpaid)</td>
                      <td style={{ textAlign: 'right', color: '#2563EB' }}>{approvedPayouts}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500 }}>Avg. Contribution</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(avgContribution)}</td>
                      <td style={{ fontWeight: 500 }}>Payout Ratio</td>
                      <td style={{ textAlign: 'right' }}>{payoutRatio.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#1A1A1A' }}>
                      Recent Contributions
                    </h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Member</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentContributions.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: '#6B6B6B' }}>No contributions</td>
                          </tr>
                        ) : (
                          recentContributions.map((c: any, i: number) => (
                            <tr key={i}>
                              <td>{new Date(c.date).toLocaleDateString()}</td>
                              <td>{c.member?.fullName || 'Unknown'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>
                                {formatCurrency(c.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#1A1A1A' }}>
                      Recent Disbursements
                    </h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Member</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayouts.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: '#6B6B6B' }}>No disbursements</td>
                          </tr>
                        ) : (
                          recentPayouts.map((p: any, i: number) => (
                            <tr key={i}>
                              <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td>{p.member?.fullName || 'Unknown'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626' }}>
                                {formatCurrency(p.approvedAmount || p.requestedAmount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', borderLeft: '4px solid #228B22' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>
                    Outlook
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#4A4A4A', lineHeight: 1.6 }}>
                    The welfare fund maintains a healthy balance of {formatCurrency(fundBalance)}. 
                    With a payout ratio of {payoutRatio.toFixed(1)}%, the fund has sufficient reserves to cover pending requests. 
                    {pendingPayouts > 0 ? `${pendingPayouts} request(s) awaiting review.` : 'All requests have been processed.'}{' '}
                    Recommend maintaining at least 3 months of average disbursements in reserve for emergencies.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '24px', textAlign: 'center', color: '#6B6B6B', fontSize: '0.875rem' }}>
                  <p>{groupName} • {groupSettings?.location?.city || 'Githirioni'}, {groupSettings?.location?.county || 'Kiambu'}, Kenya</p>
                  <p>This is a computer-generated document</p>
                </div>
              </div>
            );
          })()}

          {selectedReport === 'attendance' && attendanceLoading && (
            <div className="loading">
              <div className="spinner" />
            </div>
          )}

          {selectedReport === 'attendance' && !attendanceLoading && attendanceData && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '20px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D', marginBottom: '8px' }}>Total Attendance</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#14532D' }}>{attendanceData.summary?.totalAttendance || 0}</div>
                </div>
                <div style={{ padding: '20px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', marginBottom: '8px' }}>Total Members</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E3A8A' }}>{attendanceData.summary?.totalMembers || 0}</div>
                </div>
                <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #FDE047' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A16207', marginBottom: '8px' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#713F12' }}>{attendanceData.summary?.attendanceRate || 0}%</div>
                </div>
                <div style={{ padding: '20px', background: '#FDF4FF', borderRadius: '12px', border: '1px solid #F0ABFC' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A21CAF', marginBottom: '8px' }}>Total Bonus Paid</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#86198F' }}>{formatCurrency(attendanceData.summary?.totalBonusPaid || 0)}</div>
                </div>
              </div>

              {attendanceData.meetingStats && attendanceData.meetingStats.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>Meeting Attendance</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Meeting</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Date</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Total</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Verified</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Manual</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Bonus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.meetingStats.map((meeting: any) => (
                          <tr key={meeting._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '12px', fontSize: '0.875rem', color: '#1A1A1A' }}>{meeting.meetingTitle || 'Unknown'}</td>
                            <td style={{ padding: '12px', fontSize: '0.875rem', color: '#6B7280' }}>{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', color: '#1A1A1A' }}>{meeting.totalAttendees}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', color: '#228B22' }}>{meeting.verifiedCount}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', color: '#D97706' }}>{meeting.manualCount}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.875rem', color: '#1A1A1A' }}>{formatCurrency(meeting.totalBonus || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {attendanceData.checkInMethodStats && Object.keys(attendanceData.checkInMethodStats).length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>Check-In Methods</h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {Object.entries(attendanceData.checkInMethodStats).map(([method, count]: [string, any]) => (
                      <div key={method} style={{ flex: 1, padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px', textTransform: 'capitalize' }}>{method}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1A1A1A' }}>{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!attendanceData.meetingStats || attendanceData.meetingStats.length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  <UserCheck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No attendance records found</p>
                  <p style={{ fontSize: '0.875rem' }}>Attendance data will appear after members check in to meetings</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '24px', textAlign: 'center', color: '#6B6B6B', fontSize: '0.875rem' }}>
                <p>{groupName} • {groupSettings?.location?.city || 'Githirioni'}, {groupSettings?.location?.county || 'Kiambu'}, Kenya</p>
                <p>This is a computer-generated document</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}