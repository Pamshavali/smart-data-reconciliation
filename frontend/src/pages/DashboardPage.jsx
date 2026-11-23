import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  AlertOctagon, 
  HelpCircle, 
  Copy, 
  AlertTriangle, 
  Percent, 
  Layers, 
  FileCheck,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  MatchedDoughnutChart, 
  SystemCountBarChart, 
  OrgComparisonChart, 
  LocationComparisonChart, 
  MonthlyComparisonChart, 
  QualityDistributionChart 
} from '../components/Charts';

export default function DashboardPage({ setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, chartRes, actRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardCharts(),
        api.getRecentActivity()
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
      setActivity(actRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunReconciliation = async () => {
    try {
      setReconciling(true);
      setSuccessMessage(null);
      await api.runReconciliation('Manual Reconciliation triggered from Dashboard');
      await fetchData();
      setSuccessMessage('Reconciliation pipeline executed successfully! All metrics refreshed.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(`Reconciliation error: ${err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading reconciliation metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Production Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reconciliation Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cross-system reconciliation between System A (authoritative transactions) and System B (operational ledger).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Manage Datasets
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={reconciling}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${reconciling ? 'animate-spin' : ''}`} />
            <span>{reconciling ? 'Reconciling Datasets...' : 'Run Reconciliation'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 8 Required Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total System A */}
        <StatCard
          title="Total System A Records"
          value={summary?.total_a_records ?? 0}
          subtext="Source transactions ingested"
          icon={Layers}
          color="blue"
        />

        {/* Card 2: Total System B */}
        <StatCard
          title="Total System B Records"
          value={summary?.total_b_records ?? 0}
          subtext="Ledger entries ingested"
          icon={FileCheck}
          color="indigo"
        />

        {/* Card 3: Matched Records */}
        <StatCard
          title="Matched Records"
          value={summary?.matched_records ?? 0}
          subtext="Exact & normalized verified"
          icon={CheckCircle}
          color="emerald"
          badgeText="Verified"
          badgeType="success"
        />

        {/* Card 4: Mismatched Records */}
        <StatCard
          title="Mismatched Records"
          value={summary?.mismatched_records ?? 0}
          subtext="Amount, Date, Loc discrepancies"
          icon={AlertOctagon}
          color="rose"
          badgeText={summary?.mismatched_records > 0 ? 'Requires Action' : 'Clean'}
          badgeType={summary?.mismatched_records > 0 ? 'danger' : 'success'}
        />

        {/* Card 5: Missing Records */}
        <StatCard
          title="Missing Records"
          value={summary?.missing_records ?? 0}
          subtext="Orphaned across systems (A or B)"
          icon={HelpCircle}
          color="amber"
          badgeText={summary?.missing_records > 0 ? 'Variance' : 'Complete'}
          badgeType="warning"
        />

        {/* Card 6: Duplicate Records */}
        <StatCard
          title="Duplicate Records"
          value={summary?.duplicate_records ?? 0}
          subtext="Multi-entry & split bookings"
          icon={Copy}
          color="purple"
        />

        {/* Card 7: Data Quality Issues */}
        <StatCard
          title="Data Quality Issues"
          value={summary?.data_quality_issues ?? 0}
          subtext="Malformed IDs, nulls, invalid formats"
          icon={AlertTriangle}
          color="amber"
        />

        {/* Card 8: Completion Percentage */}
        <StatCard
          title="Reconciliation Completion"
          value={`${summary?.reconciliation_completion_percentage ?? 0}%`}
          subtext={summary?.last_run_date ? `Last run: ${summary.last_run_date.split(' ')[0]}` : 'Ready for run'}
          icon={Percent}
          color="emerald"
          badgeText="Health"
          badgeType="success"
        />
      </div>

      {/* Financial Net Variance Strip */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Monetary Exposure</span>
          <h3 className="text-xl font-bold mt-1">Cross-System Transaction Balances</h3>
          <p className="text-xs text-slate-300 mt-0.5">Summary of booked financial totals and net discrepancy exposure.</p>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium">System A Total Value</p>
            <p className="text-xl font-mono font-bold text-emerald-400">
              ${(summary?.total_a_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium">System B Total Value</p>
            <p className="text-xl font-mono font-bold text-blue-400">
              ${(summary?.total_b_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium">Net Value Difference</p>
            <p className="text-xl font-mono font-bold text-rose-400">
              ${(summary?.net_difference ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Required Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1: Matched vs Mismatched */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">1. Matched vs Mismatched</h4>
            <span className="text-[11px] text-slate-400 font-medium">Overview</span>
          </div>
          <MatchedDoughnutChart data={charts?.matched_vs_mismatched} />
        </div>

        {/* Chart 2: System A vs System B Record Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">2. System A vs B Record Count</h4>
            <span className="text-[11px] text-slate-400 font-medium">Ingestion Volume</span>
          </div>
          <SystemCountBarChart data={charts?.system_a_vs_b_count} />
        </div>

        {/* Chart 3: Organization-wise Reconciliation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">3. Organization-wise Reconciliation</h4>
            <span className="text-[11px] text-slate-400 font-medium">ORG-A vs ORG-B</span>
          </div>
          <OrgComparisonChart data={charts?.org_wise_reconciliation} />
        </div>

        {/* Chart 4: Location-wise Reconciliation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">4. Location-wise Reconciliation</h4>
            <span className="text-[11px] text-slate-400 font-medium">5 Master Locations</span>
          </div>
          <LocationComparisonChart data={charts?.location_wise_reconciliation} />
        </div>

        {/* Chart 5: Monthly Transaction Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">5. Monthly Transaction Comparison</h4>
            <span className="text-[11px] text-slate-400 font-medium">March vs April 2026</span>
          </div>
          <MonthlyComparisonChart data={charts?.monthly_comparison} />
        </div>

        {/* Chart 6: Data Quality Issues Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">6. Quality Issues Distribution</h4>
            <span className="text-[11px] text-slate-400 font-medium">Rule Breaches</span>
          </div>
          <QualityDistributionChart data={charts?.quality_issues_distribution} />
        </div>
      </div>

      {/* Recent Activity & Audit Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">Recent Reconciliation & Audit Log</h3>
          </div>
          <button 
            onClick={() => setActiveTab('exceptions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Exceptions &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Performed By</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {activity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">
                    No recent activities recorded.
                  </td>
                </tr>
              ) : (
                activity.slice(0, 6).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-blue-700">
                      {item.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{item.entity_type || '-'}</td>
                    <td className="py-2.5 px-4">{item.user}</td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={item.details}>
                      {item.details}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{item.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

