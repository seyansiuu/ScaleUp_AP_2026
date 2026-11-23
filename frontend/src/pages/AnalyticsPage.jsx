import React from 'react';
import { useStartup } from '../context/StartupContext';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  formatNumber,
} from '../utils/formatters';
import {
  LineChart,
  Users,
  TrendingDown,
  TrendingUp,
  Layers,
  ArrowRight,
  Filter,
  DollarSign,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { currentStartup } = useStartup();

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

  const cohorts = currentStartup.cohorts || [];
  const employees = currentStartup.employees || [];
  const activeEmployees = employees.filter((e) => e.isActive);
  const supportCount = activeEmployees.filter((e) => e.role === 'SUPPORT').length;
  const salesCount = activeEmployees.filter((e) => e.role === 'SALES').length;

  const totalActiveCustomers = cohorts.reduce((s, c) => s + c.currentCount, 0);
  const totalAcquiredCustomers = cohorts.reduce((s, c) => s + c.initialCount, 0);
  const aggregateRetentionBps =
    totalAcquiredCustomers > 0
      ? Math.round((totalActiveCustomers / totalAcquiredCustomers) * 10000)
      : 10000;

  // Churn analysis computation
  const quality = currentStartup.qualityScore;
  const price = Number(currentStartup.productPriceCents);
  const qualityMod = -Math.floor((quality - 50) * 10);
  const supportMod = -Math.floor(Math.sqrt(supportCount) * 50);
  const priceMod = Math.floor((Math.max(0, price - 5000) / 1000) * 20);
  let effectiveChurnBps = 500 + qualityMod + supportMod + priceMod;
  effectiveChurnBps = Math.max(100, Math.min(3000, effectiveChurnBps));

  // Sales conversion computation
  const salesMod = Math.floor(Math.sqrt(salesCount) * 300);
  const conversionBps = Math.min(5000, 1000 + salesMod);

  // Cohort Chart Data
  const cohortChartData = cohorts.map((c) => ({
    cohort: `Month ${c.acquiredMonth}`,
    initial: c.initialCount,
    active: c.currentCount,
    mrr: Math.round((c.currentCount * Number(c.monthlyPriceCents)) / 100),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Cohorts & Churn Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time cohort retention curves, churn drivers, and marketing conversion rates.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
            {cohorts.length} Cohort{cohorts.length === 1 ? '' : 's'} Active
          </span>
        </div>
      </div>

      {/* ─── Metric Highlights ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Customers"
          value={formatNumber(totalActiveCustomers)}
          subtext={`Acquired: ${formatNumber(totalAcquiredCustomers)} lifetime`}
          icon={Users}
          variant="brand"
        />

        <MetricCard
          title="Aggregate Retention"
          value={formatPercent(aggregateRetentionBps)}
          subtext="Net retention rate across all cohorts"
          icon={ShieldCheck}
          variant="emerald"
        />

        <MetricCard
          title="Effective Monthly Churn"
          value={formatPercent(effectiveChurnBps)}
          subtext={`Base: 5.0% • Quality Mod: ${(qualityMod / 100).toFixed(1)}%`}
          icon={TrendingDown}
          variant={effectiveChurnBps > 1000 ? 'rose' : 'amber'}
        />

        <MetricCard
          title="Lead Conversion Rate"
          value={formatPercent(conversionBps)}
          subtext={`${salesCount} sales reps driving conversion`}
          icon={TrendingUp}
          variant="indigo"
        />
      </div>

      {/* ─── Churn Factor Diagnostic ───────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Monthly Churn Mechanics Diagnostic
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Baseline Churn</span>
            <span className="text-lg font-bold text-white">5.00%</span>
            <p className="text-[11px] text-slate-500 font-sans mt-1">Standard SaaS baseline</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Quality Effect</span>
            <span className={`text-lg font-bold ${qualityMod <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(qualityMod / 100).toFixed(2)}%
            </span>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Score: {quality}/100 (50 is neutral)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Support Effect</span>
            <span className="text-lg font-bold text-emerald-400">
              {(supportMod / 100).toFixed(2)}%
            </span>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              {supportCount} support reps reducing churn
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Price Elasticity</span>
            <span className={`text-lg font-bold ${priceMod > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              +{(priceMod / 100).toFixed(2)}%
            </span>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              At {formatMoney(price)}/mo
            </p>
          </div>
        </div>
      </div>

      {/* ─── Cohort Visualizations ─────────────────────────────────── */}
      {cohorts.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cohort Customer Retention (Initial vs Active)
            </h3>
            <span className="text-xs font-mono text-brand-400">Customer Count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="cohort" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="initial" name="Acquired Customers" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" name="Current Active Customers" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Detailed Cohort Table ─────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Cohort Retention Breakdown Table ({cohorts.length})
        </h3>

        {cohorts.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No customer cohorts yet. In the monthly cockpit, allocate budget to marketing channels (organic, paid, content) to acquire your first cohort of paying customers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Cohort</th>
                  <th className="py-2.5 px-3">Acquired Month</th>
                  <th className="py-2.5 px-3 text-right">Initial Count</th>
                  <th className="py-2.5 px-3 text-right">Active Count</th>
                  <th className="py-2.5 px-3 text-right">Retention</th>
                  <th className="py-2.5 px-3 text-right">Cohort Price</th>
                  <th className="py-2.5 px-3 text-right">Current MRR Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cohorts.map((c) => {
                  const retentionRate =
                    c.initialCount > 0 ? (c.currentCount / c.initialCount) * 100 : 0;
                  const mrrContribution = c.currentCount * Number(c.monthlyPriceCents);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-white">
                        Cohort M{c.acquiredMonth}
                      </td>
                      <td className="py-3 px-3 text-slate-400">Month {c.acquiredMonth}</td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {formatNumber(c.initialCount)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatNumber(c.currentCount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            retentionRate >= 80
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : retentionRate >= 50
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {retentionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {formatMoney(c.monthlyPriceCents)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatMoney(mrrContribution)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
