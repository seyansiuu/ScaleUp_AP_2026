import React from 'react';
import { formatMoney, formatCompactMoney } from '../utils/formatters';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
  Skull,
} from 'lucide-react';

export default function TurnModal({ result, onClose }) {
  if (!result) return null;

  const { state, events = [], ledger = [] } = result;
  const isBankrupt = state?.status === 'BANKRUPT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isBankrupt
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-brand-500/10 border border-brand-500/30 text-brand-400'
            }`}
          >
            {isBankrupt ? <Skull className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                Month {state?.month ?? state?.currentMonth ?? 1} Executed
              </h2>
              {isBankrupt && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">
                  BANKRUPT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              The monthly simulation cycle has completed. Here is the monthly debrief.
            </p>
          </div>
        </div>

        {/* High-level summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Ending Cash</span>
            <div
              className={`text-lg font-mono font-bold mt-0.5 ${
                state.cashCents < 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {formatCompactMoney(state.cashCents)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">MRR</span>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {formatCompactMoney(state.mrrCents)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Net Burn</span>
            <div
              className={`text-lg font-mono font-bold mt-0.5 ${
                state.metrics?.netBurnCents < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatCompactMoney(state.metrics?.netBurnCents)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Quality</span>
            <div className="text-lg font-mono font-bold text-indigo-400 mt-0.5">
              {state.qualityScore}/100
            </div>
          </div>
        </div>

        {/* Market Events Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Market Events This Month ({events.length})
          </h4>
          {events.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-400 text-xs">
              No unusual market events occurred this turn. Operations ran according to baseline.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((evt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    evt.impact === 'positive'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="mt-0.5">
                    {evt.impact === 'positive' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[10px] block opacity-80 mb-0.5">
                      {evt.type}
                    </span>
                    <p className="text-slate-200">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accounting Ledger Summary */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
            Double-Entry Accounting Ledger
          </h4>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Entry Type</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledger.map((entry, idx) => (
                  <tr key={idx} className={entry.type === 'NET' ? 'bg-slate-800/40 font-bold' : ''}>
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
                    <td className="py-2 px-3 text-slate-300 font-sans">{entry.label}</td>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
