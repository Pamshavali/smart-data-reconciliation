import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Building,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function DataPreviewPage() {
  const [activeTab, setActiveTab] = useState('system-a');
  const [recordsA, setRecordsA] = useState({ items: [], total: 0, page: 1, total_pages: 1 });
  const [recordsB, setRecordsB] = useState({ items: [], total: 0, page: 1, total_pages: 1 });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [qualityOnly, setQualityOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 12,
        search: search.trim() || undefined,
        location_id: selectedLocation || undefined,
        quality_issue: qualityOnly ? true : undefined
      };

      if (activeTab === 'system-a') {
        if (selectedState) params.state = selectedState;
        const data = await api.getSystemARecords(params);
        setRecordsA(data);
      } else if (activeTab === 'system-b') {
        const data = await api.getSystemBRecords(params);
        setRecordsB(data);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [activeTab, page, selectedLocation, selectedState, qualityOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedLocation('');
    setSelectedState('');
    setQualityOnly(false);
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Data Explorer</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dataset Records & Quality Inspector</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect raw inputs side-by-side with cleaned, normalized values and data quality flags.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('system-a'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'system-a'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System A Records
          </button>
          <button
            onClick={() => { setActiveTab('system-b'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'system-b'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System B Entries
          </button>
          <button
            onClick={() => { setActiveTab('locations'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'locations'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Locations ({locations.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      {activeTab !== 'locations' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'system-a' ? "Search record_id, category, actor..." : "Search entry_id, record_ref, label..."}
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
            {/* Location filter */}
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.location_id}>
                  {loc.location_id} ({loc.org_id})
                </option>
              ))}
            </select>

            {/* State filter for System A */}
            {activeTab === 'system-a' && (
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">All States</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="VOIDED">VOIDED</option>
              </select>
            )}

            {/* Quality Issues Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <input
                type="checkbox"
                checked={qualityOnly}
                onChange={(e) => { setQualityOnly(e.target.checked); setPage(1); }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Quality Issues Only</span>
            </label>

            {(search || selectedLocation || selectedState || qualityOnly) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading dataset rows...</p>
          </div>
        ) : activeTab === 'system-a' ? (
          /* System A Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Standardized ID</th>
                  <th className="py-3 px-4">Raw ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Actor ID</th>
                  <th className="py-3 px-4 text-right">Base Value</th>
                  <th className="py-3 px-4 text-right">Adjustment</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-center">State</th>
                  <th className="py-3 px-4">Quality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recordsA.items.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-10 text-slate-400">
                      No System A records match your criteria.
                    </td>
                  </tr>
                ) : (
                  recordsA.items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{row.record_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{row.raw_record_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{row.location_id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.event_date}</td>
                      <td className="py-3 px-4 text-slate-600">{row.category_code || '-'}</td>
                      <td className="py-3 px-4">
                        {row.actor_id ? (
                          <span className="font-mono text-slate-700">{row.actor_id}</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                            NULL ACTOR
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">${row.base_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">${row.adjustment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${row.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={row.state} />
                      </td>
                      <td className="py-3 px-4">
                        {row.has_quality_issue ? (
                          <span className="text-[11px] text-amber-700 flex items-center gap-1 font-medium" title={row.quality_notes}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{row.quality_notes}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Clean
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'system-b' ? (
          /* System B Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Entry ID</th>
                  <th className="py-3 px-4">Standardized Ref</th>
                  <th className="py-3 px-4">Raw Ref (Uploaded)</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Recorded On</th>
                  <th className="py-3 px-4 text-right">Clean Value</th>
                  <th className="py-3 px-4">Raw Value</th>
                  <th className="py-3 px-4">Label</th>
                  <th className="py-3 px-4">Quality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recordsB.items.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-400">
                      No System B records match your criteria.
                    </td>
                  </tr>
                ) : (
                  recordsB.items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">{row.entry_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{row.record_ref}</td>
                      <td className="py-3 px-4 font-mono">
                        {row.raw_record_ref !== row.record_ref ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            {row.raw_record_ref}
                          </span>
                        ) : (
                          <span className="text-slate-400">{row.raw_record_ref}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.location_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.recorded_on}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {row.value !== null ? (
                          `$${row.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-rose-600 font-bold">NULL</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {row.raw_value ? `'${row.raw_value}'` : <span className="text-rose-500 italic">null</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{row.label}</td>
                      <td className="py-3 px-4">
                        {row.has_quality_issue ? (
                          <span className="text-[11px] text-amber-700 flex items-center gap-1 font-medium" title={row.quality_notes}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{row.quality_notes}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Clean
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Locations Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Location ID</th>
                  <th className="py-3 px-4">Organization ID</th>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{loc.location_id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{loc.org_id}</td>
                    <td className="py-3 px-4">{loc.location_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {activeTab !== 'locations' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {activeTab === 'system-a' ? recordsA.items.length : recordsB.items.length} of{' '}
              <span className="font-bold text-slate-800">
                {activeTab === 'system-a' ? recordsA.total : recordsB.total}
              </span>{' '}
              records
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
                Page {page} of {activeTab === 'system-a' ? recordsA.total_pages : recordsB.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, activeTab === 'system-a' ? recordsA.total_pages : recordsB.total_pages))}
                disabled={page >= (activeTab === 'system-a' ? recordsA.total_pages : recordsB.total_pages)}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

