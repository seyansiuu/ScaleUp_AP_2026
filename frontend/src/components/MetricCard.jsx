import React from 'react';

const VARIANTS = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    subtext: 'text-emerald-500/80',
    glow: 'from-emerald-500/10',
  },
  brand: {
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    text: 'text-brand-400',
    subtext: 'text-brand-500/80',
    glow: 'from-brand-500/10',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    subtext: 'text-indigo-500/80',
    glow: 'from-indigo-500/10',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    subtext: 'text-amber-500/80',
    glow: 'from-amber-500/10',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    subtext: 'text-rose-500/80',
    glow: 'from-rose-500/10',
  },
  slate: {
    bg: 'bg-slate-800/60',
    border: 'border-slate-700/60',
    text: 'text-slate-300',
    subtext: 'text-slate-500',
    glow: 'from-slate-700/10',
  },
};

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'brand',
  badge,
  className = '',
}) {
  const v = VARIANTS[variant] || VARIANTS.brand;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-lg shadow-black/30 hover:border-slate-700 transition-all ${className}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${v.glow} to-transparent rounded-bl-full pointer-events-none opacity-50`}
      ></div>

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl ${v.bg} ${v.border} border flex items-center justify-center ${v.text}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-400 font-sans">{subtext}</p>}
    </div>
  );
}
