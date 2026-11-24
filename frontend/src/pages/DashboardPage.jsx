import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStartup } from '../context/StartupContext';
import ErrorBanner from '../components/ErrorBanner';
import MetricCard from '../components/MetricCard';
import CreateStartupModal from '../components/CreateStartupModal';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  formatNumber,
} from '../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  Flame,
  Zap,
  Users,
  PieChart,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Building2,
  Calendar,
  PlusCircle,
  Skull,
  Award,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const {
    currentStartup,
    startups,
    activeStartupId,
    isLoading,
    hasLoadedStartups,
    error,
    refreshAll,
    clearError,
  } = useStartup();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // ─── Loading State ─────────────────────────────────────────────
  if (!hasLoadedStartups || (isLoading && startups.length > 0 && !currentStartup)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-800/60 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-800/40 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-80 bg-slate-800/30 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !currentStartup) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <ErrorBanner message={error} onClose={clearError} />
        <button
          type="button"
          onClick={() => refreshAll().catch(() => {})}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm"
        >
          {isLoading ? 'Retrying…' : 'Retry loading startups'}
        </button>
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/10">
          <Building2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          No Startups Founded Yet
        </h2>
        <p className="mt-3 text-slate-400 max-w-md mx-auto text-sm">
          Begin your journey as a founder. Start with $500,000 in seed capital and lead your company through monthly economic cycles.
        </p>
        <div className="mt-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-brand-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Launch Your First Startup
          </button>
        </div>

        {showCreateModal && <CreateStartupModal onClose={() => setShowCreateModal(false)} />}
      </div>
    );
  }

  if (!currentStartup) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4 text-center">
        <p className="text-slate-300">The selected startup details are not available yet.</p>
        <button
          type="button"
          onClick={() => refreshAll().catch(() => {})}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm"
        >
          {isLoading ? 'Retrying…' : 'Retry loading dashboard'}
        </button>
      </div>
    );
  }

  // ─── Metrics Extraction ─────────────────────────────────────────
  const cashCents = Number(currentStartup.cashCents);
  const mrrCents = Number(currentStartup.mrrCents);
  const arrCents = mrrCents * 12;
  const equityBps = currentStartup.founderEquityBps;
  const quality = currentStartup.qualityScore;
  const isBankrupt = currentStartup.status === 'BANKRUPT';

  // Active employees & headcount
  const employees = currentStartup.employees || [];
  const activeEmployees = employees.filter((e) => e.isActive);
  const payrollCents = activeEmployees.reduce((s, e) => s + Number(e.salaryCents), 0);

  // Active cohorts & customer metrics
  const cohorts = currentStartup.cohorts || [];
  const totalActiveCustomers = cohorts.reduce((s, c) => s + c.currentCount, 0);

  // Derive burn rate from latest turn or estimates
  const turns = currentStartup.turns || [];
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  const netBurnCents = latestTurn?.snapshot?.metrics?.netBurnCents ?? -(payrollCents + 500000);
  const runwayMonths =
    netBurnCents < 0
      ? Math.max(0, Math.floor(cashCents / Math.abs(netBurnCents)))
      : 999;

  // Chart data from turns
  const chartData = [
    {
      month: 'M0',
      cash: 500000,
      mrr: 0,
      revenue: 0,
      expenses: 5000,
      quality: 30,
    },
    ...turns.map((t) => {
      const snap = t.snapshot || {};
      const metrics = snap.metrics || {};
      return {
        month: `M${t.month}`,
        cash: Math.round(Number(snap.cashCents || 0) / 100),
        mrr: Math.round(Number(snap.mrrCents || 0) / 100),
        revenue: Math.round(Number(metrics.totalRevenueCents || snap.mrrCents || 0) / 100),
        expenses: Math.round(Number(metrics.totalExpensesCents || 0) / 100),
        quality: snap.qualityScore || 30,
      };
    }),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {error && (
        <div className="space-y-3">
          <ErrorBanner message={error} onClose={clearError} />
          <button
            type="button"
            onClick={() => refreshAll({ preferredId: activeStartupId }).catch(() => {})}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm"
          >
            {isLoading ? 'Retrying…' : 'Retry refresh'}
          </button>
        </div>
      )}
      {/* ─── Top Company Bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentStartup.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                isBankrupt
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {currentStartup.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Month {currentStartup.currentMonth}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Deterministic Seed: #{currentStartup.seed} • Product Price: {formatMoney(currentStartup.productPriceCents)}/mo
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {!isBankrupt ? (
            <Link
              to="/decisions"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all cursor-pointer group"
            >
              <Calendar className="w-4 h-4" />
              <span>Enter Month {currentStartup.currentMonth + 1} Cockpit</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Skull className="w-4 h-4" />
              Found Next Startup
            </button>
          )}
        </div>
      </div>

      {/* ─── Bankruptcy Notice ─────────────────────────────────────── */}
      {isBankrupt && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-300">
              Company Insolvent — Chapter 11 / Liquidation
            </h3>
            <p className="text-xs text-rose-200/80 mt-1">
              Your cash balance dropped below $0.00 ({formatMoney(cashCents)}). You can review historical turn logs or launch a new venture with your hard-earned founder experience.
            </p>
          </div>
        </div>
      )}

      {/* ─── VC Term Sheet Callout Banner ─────────────────────────── */}
      {currentStartup.availableTermSheet && !isBankrupt && (
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-brand-500/10 to-indigo-500/15 border border-amber-500/40 shadow-xl shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Term Sheet Available
                  </span>
                  <span className="text-sm font-bold text-white">
                    {currentStartup.availableTermSheet.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Venture capitalists have extended a term sheet of{' '}
                  <strong className="text-amber-300">
                    {formatMoney(currentStartup.availableTermSheet.amountCents)}
                  </strong>{' '}
                  in exchange for{' '}
                  <strong className="text-amber-300">
                    {formatPercent(currentStartup.availableTermSheet.equityCostBps)}
                  </strong>{' '}
                  equity.
                </p>
              </div>
            </div>
            <Link
              to="/decisions"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs tracking-wide shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
            >
              Review in Month {currentStartup.currentMonth + 1} Cockpit →
            </Link>
          </div>
        </div>
      )}

      {/* ─── Executive Metric Cards Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash On Hand */}
        <MetricCard
          title="Cash on Hand"
          value={formatCompactMoney(cashCents)}
          subtext={
            runwayMonths >= 999
              ? 'Infinite runway (Profitable)'
              : `${runwayMonths} month${runwayMonths === 1 ? '' : 's'} runway remaining`
          }
          icon={DollarSign}
          variant={cashCents < 5000000 ? (cashCents < 0 ? 'rose' : 'amber') : 'brand'}
          badge={formatMoney(cashCents)}
        />

        {/* MRR / ARR */}
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCompactMoney(mrrCents)}
          subtext={`ARR: ${formatCompactMoney(arrCents)} • Price: ${formatMoney(currentStartup.productPriceCents)}`}
          icon={TrendingUp}
          variant="emerald"
          badge={mrrCents > 0 ? `${formatNumber(totalActiveCustomers)} subs` : 'Pre-revenue'}
        />

        {/* Net Cash Flow / Burn */}
        <MetricCard
          title="Net Monthly Burn"
          value={formatCompactMoney(netBurnCents)}
          subtext={
            netBurnCents >= 0
              ? 'Operating with positive net cash flow'
              : `Monthly cash burn at current headcount & marketing`
          }
          icon={Flame}
          variant={netBurnCents >= 0 ? 'emerald' : 'rose'}
          badge={netBurnCents >= 0 ? 'Cash Flow +' : 'Net Burn'}
        />

        {/* Product Quality */}
        <MetricCard
          title="Product Quality"
          value={`${quality}/100`}
          subtext={`${activeEmployees.filter(e => e.role === 'ENGINEERING').length} active engineers driving velocity`}
          icon={Zap}
          variant="indigo"
          badge={quality >= 70 ? 'High' : quality >= 40 ? 'Moderate' : 'Early'}
        />
      </div>

      {/* ─── Second Row Metric Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Founder Equity"
          value={formatPercent(equityBps)}
          subtext={`Seed: ${currentStartup.raisedSeed ? 'Raised ($2M)' : 'None'} • Series A: ${currentStartup.raisedSeriesA ? 'Raised ($10M)' : 'None'}`}
          icon={PieChart}
          variant="brand"
        />

        <MetricCard
          title="Active Headcount"
          value={formatNumber(activeEmployees.length)}
          subtext={`Monthly Payroll: ${formatMoney(payrollCents)}`}
          icon={Users}
          variant="slate"
          badge={`${activeEmployees.filter(e => e.role === 'ENGINEERING').length} Eng • ${activeEmployees.filter(e => e.role === 'SALES').length} Sales`}
        />

        <MetricCard
          title="Customer Base"
          value={formatNumber(totalActiveCustomers)}
          subtext={`${cohorts.length} total customer cohort${cohorts.length === 1 ? '' : 's'} acquired`}
          icon={Layers}
          variant="slate"
        />
      </div>

      {/* ─── Charts Section ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Trajectory Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Financial Trajectory ($ Thousands)
              </h3>
              <p className="text-xs text-slate-400">Cash balance and MRR growth across turns</p>
            </div>
            <span className="text-xs font-mono text-brand-400">Turns M0 - M{currentStartup.currentMonth}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value, name) => [`$${value.toLocaleString()}k`, name === 'cash' ? 'Cash Balance' : 'MRR']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="cash" name="Cash" stroke="#22c55e" fillOpacity={1} fill="url(#cashGrad)" />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#6366f1" fillOpacity={1} fill="url(#mrrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Expenses Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Revenue vs Expenses ($ Thousands)
              </h3>
              <p className="text-xs text-slate-400">Monthly operating cash flow comparison</p>
            </div>
            <span className="text-xs font-mono text-indigo-400">Double-Entry Model</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value, name) => [`$${value.toLocaleString()}k`, name === 'revenue' ? 'Revenue (MRR)' : 'Total Expenses']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Recent Market Events Ticker ───────────────────────────── */}
      {latestTurn && latestTurn.events && latestTurn.events.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Latest Market Developments (Month {latestTurn.month})
            </h3>
            <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View Turn Archive →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {latestTurn.events.map((evt, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                  evt.impact === 'positive'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                }`}
              >
                <div className="font-semibold uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-slate-900/60 border border-current/20 shrink-0 mt-0.5">
                  {evt.type}
                </div>
                <p className="text-slate-200">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && <CreateStartupModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
