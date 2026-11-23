import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Database, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function UploadPage({ setActiveTab }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getUploadStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to get upload status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      let res;
      if (type === 'locations') res = await api.uploadLocations(file);
      else if (type === 'system-a') res = await api.uploadSystemA(file);
      else if (type === 'system-b') res = await api.uploadSystemB(file);

      setMessage(`${res.message}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = null; // reset input
    }
  };

  const handleLoadSample = async () => {
    setSampleLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.loadSampleDatasets();
      setMessage(res.message);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Data Management</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dataset Ingestion & Validation</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload CSV files for locations, System A transactions, and System B operational ledger.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={sampleLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${sampleLoading ? 'animate-spin' : ''}`} />
          <span>{sampleLoading ? 'Ingesting Datasets...' : 'One-Click Ingest Sample Datasets'}</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* File 1: locations.csv */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Master Data
              </span>
              {status?.locations_uploaded ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Loaded
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Pending</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">locations.csv</h3>
                <p className="text-xs text-slate-500 font-medium">Master location & org directory</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Expected Columns:</p>
              <p className="font-mono text-[11px] text-slate-500">location_id, org_id, location_name</p>
              <div className="pt-2 text-slate-500">
                Current Records: <span className="font-bold text-slate-800">{status?.locations_count ?? 0}</span>
              </div>
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors">
            <UploadCloud className="w-4 h-4" />
            <span>Upload locations.csv</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'locations')}
              disabled={loading}
            />
          </label>
        </div>

        {/* File 2: system_a.csv */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Source System
              </span>
              {status?.system_a_uploaded ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Loaded
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Pending</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">system_a.csv</h3>
                <p className="text-xs text-slate-500 font-medium">Authoritative transactional data</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Expected Columns:</p>
              <p className="font-mono text-[11px] text-slate-500">record_id, location_id, event_date, base_val, adjustment, total_value, state</p>
              <div className="pt-2 text-slate-500">
                Current Records: <span className="font-bold text-slate-800">{status?.system_a_count ?? 0}</span>
              </div>
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors">
            <UploadCloud className="w-4 h-4" />
            <span>Upload system_a.csv</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'system-a')}
              disabled={loading}
            />
          </label>
        </div>

        {/* File 3: system_b.csv */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                Target System
              </span>
              {status?.system_b_uploaded ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Loaded
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Pending</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">system_b.csv</h3>
                <p className="text-xs text-slate-500 font-medium">Operational booking & ledger</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Expected Columns:</p>
              <p className="font-mono text-[11px] text-slate-500">entry_id, record_ref, location_id, recorded_on, value, label</p>
              <div className="pt-2 text-slate-500">
                Current Records: <span className="font-bold text-slate-800">{status?.system_b_count ?? 0}</span>
              </div>
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors">
            <UploadCloud className="w-4 h-4" />
            <span>Upload system_b.csv</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'system-b')}
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {/* Cleaning & Validation Rules Explainer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Automated Cleaning & Normalization Pipeline</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The ingestion engine strictly validates and sanitizes incoming datasets without corrupting raw audit records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800">1. Identifier Normalization</p>
            <p className="text-slate-500">
              Trims surrounding whitespace, standardizes casing, and safely repairs malformed prefixes:
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 space-y-0.5">
              <p>rec1034 &rarr; REC-1034</p>
              <p>' REC - 1070 ' &rarr; REC-1070</p>
              <p>1112 &rarr; REC-1112</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800">2. Numeric & Currency Sanitization</p>
            <p className="text-slate-500">
              Parses Indian and Western comma separators and flags missing values:
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 space-y-0.5">
              <p>'1,25,400.00' &rarr; 125400.00</p>
              <p>Null / NaN &rarr; Flagged Quality Exception</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800">3. Transaction State Protection</p>
            <p className="text-slate-500">
              Explicit handling of VOIDED transactions. Protects ledger from treating canceled transactions as confirmed revenue.
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 space-y-0.5">
              <p>REC-1019 &rarr; State: VOIDED</p>
              <p>Action &rarr; Manual Review Flag</p>
            </div>
          </div>
        </div>

        {status?.all_uploaded && (
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All 3 datasets are loaded and ready for reconciliation.
            </span>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>Go to Reconciliation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

