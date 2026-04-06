'use client';

import { Banknote, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
}

const statusConfig: Record<string, { className: string; label: string }> = {
  Disbursed: { className: 'badge-error', label: 'Disbursed' },
  Approved: { className: 'badge-success', label: 'Approved' },
  'Ready for Payment': { className: 'badge-success', label: 'Ready for Payment' },
  Rejected: { className: 'badge-error', label: 'Rejected' },
  Paid: { className: 'badge-success', label: 'Paid' },
  Pending: { className: 'badge-warning', label: 'Pending' },
  Active: { className: 'badge-success', label: 'Active' },
  Inactive: { className: 'badge-warning', label: 'Inactive' },
  Outstanding: { className: 'badge-error', label: 'Outstanding' },
};

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = statusConfig[status] || { className: 'badge-warning', label: status };
  
  return (
    <span 
      className={`badge ${config.className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {config.label}
    </span>
  );
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'Disbursed':
      return <Banknote size={16} color="#991B1B" />;
    case 'Approved':
    case 'Active':
    case 'Paid':
      return <CheckCircle size={16} color="#166534" />;
    case 'Rejected':
    case 'Outstanding':
      return <XCircle size={16} color="#991B1B" />;
    default:
      return <Clock size={16} color="#92400E" />;
  }
}

export function getStatusBadgeClass(status: string): string {
  return statusConfig[status]?.className || 'badge-warning';
}
