import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table, 
  GitCompare, 
  AlertTriangle, 
  FileText,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingExceptionsCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'File Upload', icon: UploadCloud },
    { id: 'preview', label: 'Data Preview', icon: Table },
    { id: 'reconciliation', label: 'Reconciliation', icon: GitCompare },
    { 
      id: 'exceptions', 
      label: 'Exceptions', 
      icon: AlertTriangle,
      badge: pendingExceptionsCount > 0 ? pendingExceptionsCount : null,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200'
    },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </p>
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            System Rules
          </p>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>8-Point Validation Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Normalized Match (REC-*)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>State Audit (Voided Safe)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>PostgreSQL / SQLite Storage</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Audit Trail & Session Active</p>
      </div>
    </aside>
  );
}

