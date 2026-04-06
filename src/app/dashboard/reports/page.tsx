'use client';

import { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalContributions = contributions.reduce((sum: number, c: any) => sum + c.amount, 0);
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
  }, [selectedReport, dateFrom, dateTo]);

  const handlePrint = () => {
    window.print();
  };

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
              <table className="table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => {
                    const memberSavings = savings.find((s: any) => s.member === m._id);
                    return (
                      <tr key={m._id}>
                        <td>{m.memberId}</td>
                        <td>{m.fullName}</td>
                        <td>{m.location}</td>
                        <td>
                          <span className={`badge badge-${m.status === 'active' ? 'success' : 'warning'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(memberSavings?.savingsBalance || 0)}
                        </td>
                      </tr>
                    );
                  })}
</tbody>
                </table>
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