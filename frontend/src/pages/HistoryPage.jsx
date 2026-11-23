import React, { useState } from 'react';
import { useStartup } from '../context/StartupContext';
import { Link } from 'react-router-dom';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  formatNumber,
} from '../utils/formatters';
import {
  History,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function HistoryPage() {
  const { currentStartup } = useStartup();
  const [expandedTurn, setExpandedTurn] = useState(null);

  if (!currentStartup) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Please select a startup first.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-brand-400 underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const turns = currentStartup.turns || [];

  const toggleTurn = (month) => {
    setExpandedTurn((prev) => (prev === month ? null : month));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Turn Archive & Accounting Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Immutable monthly execution records, founder decisions, and double-entry general ledger.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
            {turns.length} Turn{turns.length === 1 ? '' : 's'} Completed
          </span>
        </div>
      </div>

      {turns.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Simulation Turns Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your company is currently at Month 0 (Pre-launch). Enter the monthly decision cockpit to execute your inaugural turn.
          </p>
          <Link
            to="/decisions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-brand-500/20 transition-all"
          >
            Enter Month 1 Cockpit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {turns
            .slice()
            .reverse()
            .map((t) => {
              const isExpanded = expandedTurn === t.month || (expandedTurn === null && t.month === turns[turns.length - 1].month);
              const snapshot = t.snapshot || {};
              const decisions = t.decisions || {};
              const events = t.events || [];
              const ledger = t.ledger || [];
              const metrics = snapshot.metrics || {};

              return (
                <div
                  key={t.id || t.month}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl transition-all"
                >
                  {/* Collapsible Header */}
                  <div
                    onClick={() => toggleTurn(t.month)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-mono font-bold text-sm">
                        M{t.month}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            Month {t.month} Ledger
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500">
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
                          <span>Cash: {formatCompactMoney(snapshot.cashCents)}</span>
                          <span>•</span>
                          <span>MRR: {formatCompactMoney(snapshot.mrrCents)}</span>
                          <span>•</span>
                          <span
                            className={
                              metrics.netBurnCents < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }
                          >
                            Flow: {formatCompactMoney(metrics.netBurnCents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {events.length > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          <Sparkles className="w-3 h-3" />
                          {events.length} Event{events.length === 1 ? '' : 's'}
                        </span>
                      )}
                      <button className="p-1 rounded-lg text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Turn Details */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/40 space-y-6">
                      {/* Financial Metrics Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Ending Cash
                          </span>
                          <span className="text-base font-bold font-mono text-white">
                            {formatMoney(snapshot.cashCents)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            MRR
                          </span>
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {formatMoney(snapshot.mrrCents)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Net Burn
                          </span>
                          <span
                            className={`text-base font-bold font-mono ${
                              metrics.netBurnCents < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatMoney(metrics.netBurnCents)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Product Quality
                          </span>
                          <span className="text-base font-bold font-mono text-indigo-400">
                            {snapshot.qualityScore} / 100
                          </span>
                        </div>
                      </div>

                      {/* Decisions Made in this turn */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Founder Decisions Applied
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">Pricing Set:</span>
                            <span className="font-mono font-bold text-white">
                              {formatMoney(decisions.priceCents || snapshot.productPriceCents)}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">Marketing Spend:</span>
                            <span className="font-mono font-bold text-white">
                              {formatMoney(
                                (decisions.marketing?.organic || 0) +
                                  (decisions.marketing?.paid || 0) +
                                  (decisions.marketing?.content || 0),
                              )}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">New Hires:</span>
                            <span className="font-mono font-bold text-white">
                              {(decisions.hires || []).length > 0
                                ? (decisions.hires || [])
                                    .map((h) => `${h.count} ${h.role}`)
                                    .join(', ')
                                : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Events that hit this turn */}
                      {events.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Market Events
                          </h4>
                          <div className="space-y-2">
                            {events.map((evt, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                  evt.impact === 'positive'
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                    : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                                }`}
                              >
                                <div>
                                  <span className="font-semibold uppercase text-[10px] block opacity-75">
                                    {evt.type}
                                  </span>
                                  <span>{evt.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Double-Entry Accounting Ledger */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-400" />
                          Double-Entry General Ledger
                        </h4>
                        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden text-xs">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Type</th>
                                <th className="py-2 px-3">Account / Entry</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {ledger.map((entry, idx) => (
                                <tr
                                  key={idx}
                                  className={entry.type === 'NET' ? 'bg-slate-800/40 font-bold' : ''}
                                >
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-sans ${
                                        entry.type === 'INFLOW'
                                          ? 'bg-emerald-500/15 text-emerald-400'
                                          : entry.type === 'OUTFLOW'
                                          ? 'bg-rose-500/15 text-rose-400'
                                          : 'bg-brand-500/15 text-brand-400'
                                      }`}
                                    >
                                      {entry.type}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-300 font-sans">
                                    {entry.label}
                                  </td>
                                  <td
                                    className={`py-2 px-3 text-right ${
                                      entry.amountCents < 0 || entry.type === 'OUTFLOW'
                                        ? 'text-rose-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {formatMoney(entry.amountCents)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
