import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  Check,
  RefreshCw,
  BadgeAlert
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function ExceptionsPage({ onExceptionsUpdated }) {
  const [exceptions, setExceptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Review modal state
  const [activeReviewItem, setActiveReviewItem] = useState(null);
  const [reviewStatusChoice, setReviewStatusChoice] = useState('APPROVED');
  const [reviewerName, setReviewerName] = useState('Lead Auditor');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const params = {
        review_status: statusFilter !== 'ALL' ? statusFilter : undefined,
        exception_type: typeFilter !== 'ALL' ? typeFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      };
      const [listData, statsData] = await Promise.all([
        api.getExceptions(params),
        api.getExceptionStats()
      ]);
      setExceptions(listData);
      setStats(statsData);
      if (onExceptionsUpdated) onExceptionsUpdated(statsData.pending);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [statusFilter, typeFilter, severityFilter]);

  const openReviewModal = (item, defaultAction = 'APPROVED') => {
    setActiveReviewItem(item);
    setReviewStatusChoice(defaultAction);
    setReviewComment(
      defaultAction === 'APPROVED' 
        ? 'Validated variance against operational justification.' 
        : 'Discrepancy rejected. Action requested from booking operator.'
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeReviewItem) return;

    setSubmittingReview(true);
    try {
      await api.reviewException(activeReviewItem.id, {
        review_status: reviewStatusChoice,
        reviewer: reviewerName,
        comments: reviewComment
      });
      setActiveReviewItem(null);
      await fetchExceptions();
    } catch (err) {
      alert(`Review submission error: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredExceptions = exceptions.filter((ex) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      ex.record_id?.toLowerCase().includes(term) ||
      ex.entry_id?.toLowerCase().includes(term) ||
      ex.comments?.toLowerCase().includes(term) ||
      ex.suggested_action?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Audit & Governance</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Exception Management & Sign-off</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Review suggested matches, investigate rule breaches, approve or reject discrepancies with audit tracking.
          </p>
        </div>

        {/* Stats Pill Counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-amber-700">Pending</p>
            <p className="text-lg font-bold text-amber-900">{stats.pending}</p>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-700">Approved</p>
            <p className="text-lg font-bold text-emerald-900">{stats.approved}</p>
          </div>
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-rose-700">Rejected</p>
            <p className="text-lg font-bold text-rose-900">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search record, comments, suggested action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Review Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Exception Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Exception Types</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="DATE_MISMATCH">Date Mismatch</option>
            <option value="LOCATION_MISMATCH">Location Conflict</option>
            <option value="MISSING_RECORD">Missing Record</option>
            <option value="DUPLICATE">Duplicate / Split</option>
            <option value="VOIDED_TX">Voided Transaction</option>
            <option value="INVALID_DATA">Data Quality Issue</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || severityFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                setSeverityFilter('ALL');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Exceptions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Querying exceptions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">System B Entry</th>
                  <th className="py-3 px-4">Exception Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Diagnosis & Variance</th>
                  <th className="py-3 px-4">Suggested Action</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredExceptions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-400">
                      No exceptions found for the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{ex.record_id}</td>
                      <td className="py-3 px-4 font-mono text-purple-700">{ex.entry_id || '-'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ex.exception_type} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          ex.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                          ex.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ex.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 font-medium">
                        {ex.comments}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px]">
                        {ex.suggested_action}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ex.review_status} />
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        {ex.reviewer || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openReviewModal(ex, 'APPROVED')}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Approve / Accept Match"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openReviewModal(ex, 'REJECTED')}
                            className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Reject Match / Flag for Correction"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {activeReviewItem && (
        <Modal
          isOpen={!!activeReviewItem}
          onClose={() => setActiveReviewItem(null)}
          title={`Review Exception: ${activeReviewItem.record_id}`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Type: {activeReviewItem.exception_type}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeReviewItem.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeReviewItem.severity} SEVERITY
                </span>
              </div>
              <p className="text-slate-600">{activeReviewItem.comments}</p>
              {activeReviewItem.suggested_action && (
                <p className="text-blue-700 font-semibold pt-1">
                  Suggested Action: {activeReviewItem.suggested_action}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Decision
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['APPROVED', 'REJECTED', 'RESOLVED'].map((decision) => (
                  <button
                    key={decision}
                    type="button"
                    onClick={() => setReviewStatusChoice(decision)}
                    className={`py-2 px-3 rounded-lg font-bold text-center border transition-all ${
                      reviewStatusChoice === decision
                        ? decision === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600' :
                          decision === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600' :
                          'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {decision}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Auditor / Reviewer Name
              </label>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Audit Notes & Resolution Comments
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain justification, operational approval, or corrective instruction..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReviewItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {submittingReview ? 'Recording Sign-off...' : 'Submit Audit Sign-off'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

