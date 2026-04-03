'use client';

import { useState } from 'react';
import { useStore } from '../../../stores/useStore';
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  Wallet,
  Banknote,
  PiggyBank,
  Printer
} from 'lucide-react';

type ReportType = 'summary' | 'contributions' | 'loans' | 'members';

export default function ReportsPage() {
  const { members, contributions, loans, savings } = useStore();
  const [selectedReport, setSelectedReport] = useState<ReportType>('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
  ];

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
          <div style={{
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
                  Githirioni Self Help Group
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
                <p>Githirioni Self Help Group • Githirioni, Kiambu, Kenya</p>
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
        </div>
      </div>
    </div>
  );
}