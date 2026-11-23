import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-400 text-xs">-</span>;

  const s = status.toUpperCase();

  const config = {
    MATCHED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Matched'
    },
    EXACT: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Exact Match'
    },
    SUGGESTED: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Normalized Match'
    },
    AMOUNT_MISMATCH: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Amount Mismatch'
    },
    DATE_MISMATCH: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Date Variance'
    },
    LOCATION_MISMATCH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      label: 'Location Conflict'
    },
    MISSING_IN_B: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
      label: 'Missing in System B'
    },
    MISSING_IN_A: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      label: 'Missing in System A'
    },
    MISSING_RECORD: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
      label: 'Missing Record'
    },
    DUPLICATE: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
      label: 'Duplicate / Split'
    },
    DUPLICATE_ENTRY: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
      label: 'Duplicate Entry'
    },
    VOIDED_TRANSACTION: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
      label: 'Voided in System A'
    },
    VOIDED: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
      label: 'Voided'
    },
    CONFIRMED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Confirmed'
    },
    QUALITY_ISSUE: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Quality Issue'
    },
    INVALID_DATA: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Invalid Data'
    },
    // Review statuses
    PENDING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Pending Review'
    },
    APPROVED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Approved'
    },
    REJECTED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Rejected'
    },
    RESOLVED: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Resolved'
    }
  };

  const item = config[s] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status.replace(/_/g, ' ')
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`}></span>
      <span>{item.label}</span>
    </span>
  );
}

