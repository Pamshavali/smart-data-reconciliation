import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Layers, 
  ArrowRight,
  Eye,
  FileDown,
  RefreshCw,
  GitCompare,
  TrendingDown,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function ReconciliationPage() {
  const [results, setResults] = useState({ items: [], total: 0, page: 1, total_pages: 1, metrics: {} });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal inspection
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchLocations = async () => {
    try {
      const locs = await api.getLocations();
      setLocations(locs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 15,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        location_id: locationFilter !== 'ALL' ? locationFilter : undefined,
        has_discrepancy: discrepancyOnly ? true : undefined,
        search: search.trim() || undefined
      };
      const data = await api.getReconciliationResults(params);
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [page, statusFilter, locationFilter, discrepancyOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleRunReconciliation = async () => {
    try {
      setReconciling(true);
      await api.runReconciliation('Triggered from Reconciliation Workspace');
      setPage(1);
      await fetchResults();
    } catch (err) {
      alert(`Reconciliation run failed: ${err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setLocationFilter('ALL');
    setDiscrepancyOnly(false);
    setSearch('');
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Reconciliation Workspace</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System A vs System B Comparison</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Rule-based reconciliation verifying record references, amounts, dates, locations, duplicates, and transaction states.
          </p>
        </div>

        <button
          onClick={handleRunReconciliation}
          disabled={reconciling}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 fill-current ${reconciling ? 'animate-spin' : ''}`} />
          <span>{reconciling ? 'Running Reconciliation...' : 'Run Reconciliation'}</span>
        </button>
      </div>

      {/* Metrics Mini-Bar */}
      {results.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Matched</p>
            <p className="text-xl font-bold text-emerald-600">{results.metrics.matched ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Mismatches</p>
            <p className="text-xl font-bold text-rose-600">{results.metrics.mismatched ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Missing Records</p>
            <p className="text-xl font-bold text-amber-600">{results.metrics.missing ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Duplicates</p>
            <p className="text-xl font-bold text-purple-600">{results.metrics.duplicates ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Voided TX</p>
            <p className="text-xl font-bold text-slate-700">{results.metrics.voided ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Completion %</p>
            <p className="text-xl font-bold text-blue-600">{results.metrics.completion_pct ?? 0}%</p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Record ID, Entry ID, discrepancy note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="DATE_MISMATCH">Date Mismatch</option>
            <option value="LOCATION_MISMATCH">Location Conflict</option>
            <option value="MISSING_IN_B">Missing in System B</option>
            <option value="MISSING_IN_A">Missing in System A</option>
            <option value="VOIDED_TRANSACTION">Voided in System A</option>
            <option value="QUALITY_ISSUE">Data Quality Issue</option>
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.location_id}>
                {loc.location_id}
              </option>
            ))}
          </select>

          {/* Discrepancy Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={discrepancyOnly}
              onChange={(e) => { setDiscrepancyOnly(e.target.checked); setPage(1); }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Discrepancies Only</span>
          </label>

          {(statusFilter !== 'ALL' || locationFilter !== 'ALL' || discrepancyOnly || search) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Querying reconciliation results...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">System B Entry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Match Method</th>
                  <th className="py-3 px-4 text-right">System A Value</th>
                  <th className="py-3 px-4 text-right">System B Value</th>
                  <th className="py-3 px-4 text-right">Difference</th>
                  <th className="py-3 px-4">Dates (A vs B)</th>
                  <th className="py-3 px-4">Locations</th>
                  <th className="py-3 px-4">Discrepancy Details</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.items.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-10 text-slate-400">
                      No reconciliation records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  results.items.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        row.has_discrepancy ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{row.record_id}</td>
                      <td className="py-3 px-4 font-mono text-purple-700">{row.entry_id || '-'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.match_category} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {row.a_total_value !== null ? (
                          `$${row.a_total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {row.b_value !== null ? (
                          `$${row.b_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-rose-500 font-bold">MISSING</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {row.difference !== null && Math.abs(row.difference) > 0.01 ? (
                          <span className="text-rose-600">
                            ${Math.abs(row.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-normal">$0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {row.a_date || row.b_date ? (
                          <div className="space-y-0.5">
                            <span className="text-slate-700">A: {row.a_date || 'N/A'}</span>
                            <br />
                            <span className="text-slate-500">B: {row.b_date || 'N/A'}</span>
                            {row.date_diff_days && row.date_diff_days !== 0 ? (
                              <span className="block text-amber-700 font-bold">({Math.abs(row.date_diff_days)}d variance)</span>
                            ) : null}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {row.a_location_id === row.b_location_id ? (
                          <span className="font-semibold text-slate-800">{row.a_location_id || row.b_location_id}</span>
                        ) : (
                          <span className="text-orange-700 font-bold">
                            {row.a_location_id || 'N/A'} &rarr; {row.b_location_id || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600">
                        {row.discrepancy_details}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedRecord(row)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Full Record Inspection"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{results.items.length}</span> of{' '}
            <span className="font-bold text-slate-800">{results.total}</span> reconciliation items
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {results.total_pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, results.total_pages))}
              disabled={page >= results.total_pages}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Reconciliation Inspection: ${selectedRecord.record_id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Reconciliation Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Matching Mode</p>
                <div className="mt-1">
                  <StatusBadge status={selectedRecord.match_category} />
                </div>
              </div>
            </div>

            {/* Financial Comparison Box */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
              <div>
                <p className="text-xs text-slate-500">System A Total Value</p>
                <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {selectedRecord.a_total_value !== null ? `$${selectedRecord.a_total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">System B Value</p>
                <p className="text-lg font-bold font-mono text-purple-700 mt-0.5">
                  {selectedRecord.b_value !== null ? `$${selectedRecord.b_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'MISSING'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Discrepancy</p>
                <p className={`text-lg font-bold font-mono mt-0.5 ${
                  selectedRecord.difference && Math.abs(selectedRecord.difference) > 0.01 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {selectedRecord.difference !== null ? `$${Math.abs(selectedRecord.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                </p>
              </div>
            </div>

            {/* Comparative Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Attribute</th>
                    <th className="py-2.5 px-4">System A (Source)</th>
                    <th className="py-2.5 px-4">System B (Ledger)</th>
                    <th className="py-2.5 px-4">Audit Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-700">Record Ref</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.record_id}</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.entry_id ? `${selectedRecord.record_id} (${selectedRecord.entry_id})` : 'MISSING'}</td>
                    <td className="py-2 px-4 text-emerald-600 font-semibold">{selectedRecord.match_category}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-700">Posting Date</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.a_date || 'N/A'}</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.b_date || 'N/A'}</td>
                    <td className="py-2 px-4">
                      {selectedRecord.date_diff_days ? (
                        <span className="text-amber-700 font-bold">{selectedRecord.date_diff_days} days variance</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Matched</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-700">Location ID</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.a_location_id || 'N/A'}</td>
                    <td className="py-2 px-4 font-mono">{selectedRecord.b_location_id || 'N/A'}</td>
                    <td className="py-2 px-4">
                      {selectedRecord.a_location_id !== selectedRecord.b_location_id ? (
                        <span className="text-rose-600 font-bold">Location Conflict</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Matched</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-700">Transaction State</td>
                    <td className="py-2 px-4">
                      <StatusBadge status={selectedRecord.a_state} />
                    </td>
                    <td className="py-2 px-4 text-slate-500">Active Entry</td>
                    <td className="py-2 px-4">
                      {selectedRecord.a_state === 'VOIDED' ? (
                        <span className="text-rose-600 font-bold">Voided Anomaly</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Valid</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Discrepancy details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-800 mb-1">Reconciliation Notes & Diagnosis:</p>
              <p className="text-slate-600 leading-relaxed">{selectedRecord.discrepancy_details}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

