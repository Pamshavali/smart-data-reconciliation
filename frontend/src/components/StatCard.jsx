import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  color = 'blue',
  badgeText,
  badgeType = 'neutral' 
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'hover:border-blue-300'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      border: 'hover:border-emerald-300'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-600',
      border: 'hover:border-rose-300'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      border: 'hover:border-amber-300'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'hover:border-purple-300'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'hover:border-indigo-300'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all ${scheme.border} relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {badgeText && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                badgeType === 'success' ? 'bg-emerald-100 text-emerald-800' :
                badgeType === 'danger' ? 'bg-rose-100 text-rose-800' :
                badgeType === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${scheme.bg} ${scheme.icon} flex items-center justify-center shrink-0`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
}

