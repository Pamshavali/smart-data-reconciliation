import React from 'react';
import { ShieldCheck, User, LogOut, RefreshCw, Database } from 'lucide-react';

export default function Navbar({ user, onLogout, onRefresh, isRefreshing }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Smart Data Reconciliation & Validation
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Enterprise v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Automated Cross-System Audit & Anomaly Detection</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user?.full_name || user?.username || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize font-medium">{user?.role || 'Analyst'}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

