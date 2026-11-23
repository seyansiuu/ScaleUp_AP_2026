import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStartup } from '../context/StartupContext';
import TurnModal from '../components/TurnModal';
import {
  formatMoney,
  formatCompactMoney,
  formatPercent,
  ROLE_CONFIG,
} from '../utils/formatters';
import {
  Compass,
  DollarSign,
  TrendingUp,
  Users,
  Megaphone,
  UserPlus,
  UserMinus,
  Award,
  Sparkles,
  Calculator,
  AlertTriangle,
  Play,
  ArrowLeft,
  Info,
} from 'lucide-react';

export default function DecisionsPage() {
  const { currentStartup, advanceTurn, isLoading, error, latestTurnResult, clearTurnResult } =
    useStartup();
  const navigate = useNavigate();

  // ─── Local State for Founder Decisions ─────────────────────────
  const [priceDollars, setPriceDollars] = useState(49);
  const [marketing, setMarketing] = useState({
    organicDollars: 1000,
    paidDollars: 2000,
    contentDollars: 500,
  });

  const [hires, setHires] = useState([]); // [{ role: 'ENGINEERING', count: 1 }]
  const [fires, setFires] = useState([]); // array of employee IDs
  const [acceptTermSheet, setAcceptTermSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Initialize from current startup
  useEffect(() => {
    if (currentStartup) {
      setPriceDollars(Math.round(Number(currentStartup.productPriceCents) / 100));
    }
  }, [currentStartup]);

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

  const isBankrupt = currentStartup.status === 'BANKRUPT';
  const activeEmployees = (currentStartup.employees || []).filter((e) => e.isActive);
  const termSheet = currentStartup.availableTermSheet;

  // ─── Pre-flight Calculation & Lead Estimator ────────────────────
  const organicCents = (Number(marketing.organicDollars) || 0) * 100;
  const paidCents = (Number(marketing.paidDollars) || 0) * 100;
  const contentCents = (Number(marketing.contentDollars) || 0) * 100;
  const totalMarketingCents = organicCents + paidCents + contentCents;

  // Lead projection formulas from turnEngine
  const projectedOrganicLeads = Math.floor(Math.sqrt(Math.max(organicCents, 0) / 100) * 2);
  const projectedPaidLeads = Math.floor(Math.sqrt(Math.max(paidCents, 0) / 100) * 5);
  const projectedContentLeads = Math.floor(Math.sqrt(Math.max(contentCents, 0) / 100) * 3);
  const totalProjectedLeads = projectedOrganicLeads + projectedPaidLeads + projectedContentLeads;

  // Payroll calculation
  const currentPayrollCents = activeEmployees.reduce((s, e) => s + Number(e.salaryCents), 0);
  const hiredPayrollCents = hires.reduce(
    (s, h) => s + (ROLE_CONFIG[h.role]?.salaryCents || 0) * h.count,
    0,
  );
  const firedPayrollCents = fires.reduce((s, id) => {
    const emp = activeEmployees.find((e) => e.id === id);
    return s + (emp ? Number(emp.salaryCents) : 0);
  }, 0);
  const projectedPayrollCents = currentPayrollCents + hiredPayrollCents - firedPayrollCents;

  const currentCashCents = Number(currentStartup.cashCents);
  const currentMrrCents = Number(currentStartup.mrrCents);
  const estimatedCogsCents = Math.floor((currentMrrCents * 2000) / 10000); // 20%
  const fixedOpExCents = 500000; // $5k

  const totalProjectedExpensesCents =
    projectedPayrollCents + totalMarketingCents + estimatedCogsCents + fixedOpExCents;
  const projectedFundingCents = acceptTermSheet && termSheet ? termSheet.amountCents : 0;
  const projectedEndingCashCents =
    currentCashCents + currentMrrCents + projectedFundingCents - totalProjectedExpensesCents;

  // ─── Handlers ──────────────────────────────────────────────────
  const handleAddHire = (role) => {
    setHires((prev) => {
      const existing = prev.find((h) => h.role === role);
      if (existing) {
        if (existing.count >= 5) return prev;
        return prev.map((h) => (h.role === role ? { ...h, count: h.count + 1 } : h));
      }
      return [...prev, { role, count: 1 }];
    });
  };

  const handleRemoveHire = (role) => {
    setHires((prev) => {
      const existing = prev.find((h) => h.role === role);
      if (!existing) return prev;
      if (existing.count <= 1) return prev.filter((h) => h.role !== role);
      return prev.map((h) => (h.role === role ? { ...h, count: h.count - 1 } : h));
    });
  };

  const toggleFire = (employeeId) => {
    setFires((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBankrupt) return;
    setLocalError('');
    setSubmitting(true);

    try {
      const decisionsPayload = {
        priceCents: Math.round(priceDollars * 100),
        marketing: {
          organic: organicCents,
          paid: paidCents,
          content: contentCents,
        },
        hires,
        fires,
        acceptTermSheet: Boolean(acceptTermSheet && termSheet),
      };

      await advanceTurn(decisionsPayload);
      // Reset temporary hires and fires after turn commits
      setHires([]);
      setFires([]);
      setAcceptTermSheet(false);
    } catch (err) {
      setLocalError(err.message || 'Failed to advance turn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── Breadcrumb & Header ──────────────────────────────────── */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Month {currentStartup.currentMonth + 1} Decision Cockpit
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Set strategy, adjust pricing, allocate marketing capital, and optimize team structure.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
              Current Cash: {formatCompactMoney(currentCashCents)}
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
              MRR: {formatCompactMoney(currentMrrCents)}
            </span>
          </div>
        </div>
      </div>

      {(localError || error) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      {isBankrupt ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
          <h3 className="text-lg font-bold text-rose-300 mb-2">Simulation Ended</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            This startup is bankrupt. You cannot advance turns further. Create a new startup to try a different operational strategy.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs tracking-wide"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} data-testid="decision-form" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Decision Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* ─── 1. Product Pricing ────────────────────────────── */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        1. Product Subscription Price
                      </h3>
                      <p className="text-xs text-slate-400">
                        Monthly charge billed to new customer cohorts
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold font-mono text-brand-400">
                    ${priceDollars}.00
                    <span className="text-xs text-slate-500 font-sans font-normal"> / mo</span>
                  </span>
                </div>

                <div>
                  <input
                    type="range"
                    min="9"
                    max="499"
                    step="5"
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                    <span>$9.00 (High Volume)</span>
                    <span>$49.00 (Standard)</span>
                    <span>$499.00 (Enterprise)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>
                    Higher prices boost MRR per customer, but increase churn sensitivity (+20 bps per $10 over $50) unless offset by product quality or customer support headcount.
                  </span>
                </div>
              </div>

              {/* ─── 2. Marketing Budget & Channel Allocation ──────── */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        2. Marketing Channel Allocation
                      </h3>
                      <p className="text-xs text-slate-400">
                        Spend across channels to drive top-of-funnel leads
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatMoney(totalMarketingCents)}
                    </span>
                    <span className="text-[11px] text-indigo-400 block font-mono">
                      ~{totalProjectedLeads} Projected Leads
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Organic Marketing */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">Organic (SEO / PR)</span>
                      <span className="text-slate-400 font-mono">
                        ~{projectedOrganicLeads} leads
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={marketing.organicDollars}
                        onChange={(e) =>
                          setMarketing({ ...marketing, organicDollars: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Eff: 2× √(spend)</span>
                  </div>

                  {/* Paid Ads */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">Paid Acquisition</span>
                      <span className="text-slate-400 font-mono">
                        ~{projectedPaidLeads} leads
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={marketing.paidDollars}
                        onChange={(e) =>
                          setMarketing({ ...marketing, paidDollars: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Eff: 5× √(spend)</span>
                  </div>

                  {/* Content Marketing */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">Content / Community</span>
                      <span className="text-slate-400 font-mono">
                        ~{projectedContentLeads} leads
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="250"
                        value={marketing.contentDollars}
                        onChange={(e) =>
                          setMarketing({ ...marketing, contentDollars: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Eff: 3× √(spend)</span>
                  </div>
                </div>
              </div>

              {/* ─── 3. Team Growth (Hiring) ───────────────────────── */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        3. Hire Team Members
                      </h3>
                      <p className="text-xs text-slate-400">
                        Scale engineering, sales, marketing, and support
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    +{formatMoney(hiredPayrollCents)}/mo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
                    const currentHire = hires.find((h) => h.role === roleKey);
                    const count = currentHire ? currentHire.count : 0;
                    const existingActiveCount = activeEmployees.filter(
                      (e) => e.role === roleKey && !fires.includes(e.id),
                    ).length;

                    return (
                      <div
                        key={roleKey}
                        className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{cfg.label}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({existingActiveCount} active)
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {cfg.salaryLabel}
                          </span>
                        </div>

                        {/* Increment / Decrement Counter */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveHire(roleKey)}
                            disabled={count <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-sm text-brand-400">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddHire(roleKey)}
                            disabled={count >= 5}
                            className="w-7 h-7 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── 4. Team Streamlining (Firing) ─────────────────── */}
              {activeEmployees.length > 0 && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <UserMinus className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          4. Dismiss Team Members (Optional)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Streamline payroll to extend runway
                        </p>
                      </div>
                    </div>
                    {fires.length > 0 && (
                      <span className="text-xs font-mono text-rose-400">
                        -{formatMoney(firedPayrollCents)}/mo savings
                      </span>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {activeEmployees.map((emp) => {
                      const isSelected = fires.includes(emp.id);
                      const cfg = ROLE_CONFIG[emp.role] || {};

                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleFire(emp.id)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-rose-500 cursor-pointer"
                            />
                            <span className="font-semibold">{cfg.label || emp.role}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Hired M{emp.hiredMonth}
                            </span>
                          </div>
                          <span className="font-mono text-slate-400">
                            {formatMoney(emp.salaryCents)}/mo
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── 5. VC Funding Round Acceptance ────────────────── */}
              {termSheet && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 to-brand-500/10 border border-amber-500/30 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          VC Term Sheet Offer: {termSheet.label}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Inject <strong className="text-amber-300 font-mono">{formatMoney(termSheet.amountCents)}</strong> into cash reserves in exchange for{' '}
                          <strong className="text-amber-300 font-mono">{formatPercent(termSheet.equityCostBps)}</strong> founder equity.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-500/40 shrink-0">
                      <input
                        type="checkbox"
                        checked={acceptTermSheet}
                        onChange={(e) => setAcceptTermSheet(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-300">Accept Term Sheet</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Pre-flight Financial Simulator & Submit */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 sticky top-20">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Turn Pre-Flight Simulator
                  </h3>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Starting Cash</span>
                    <span className="text-white">{formatMoney(currentCashCents)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Projected Revenue (MRR)</span>
                    <span className="text-emerald-400">+{formatMoney(currentMrrCents)}</span>
                  </div>

                  {projectedFundingCents > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-amber-300 font-sans font-bold">VC Funding Inflow</span>
                      <span className="text-amber-300 font-bold">+{formatMoney(projectedFundingCents)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Projected Payroll</span>
                    <span className="text-rose-400">-{formatMoney(projectedPayrollCents)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Marketing Budget</span>
                    <span className="text-rose-400">-{formatMoney(totalMarketingCents)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">COGS (20% MRR) + OpEx</span>
                    <span className="text-rose-400">
                      -{formatMoney(estimatedCogsCents + fixedOpExCents)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 bg-slate-800/60 px-3 rounded-lg font-bold text-sm">
                    <span className="text-slate-300 font-sans">Projected Ending Cash</span>
                    <span
                      className={projectedEndingCashCents < 0 ? 'text-rose-400' : 'text-brand-400'}
                    >
                      {formatMoney(projectedEndingCashCents)}
                    </span>
                  </div>
                </div>

                {projectedEndingCashCents < 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      WARNING: Projected expenses exceed cash reserves! Company will enter Chapter 11 bankruptcy this turn unless expenses are cut or VC funding is accepted.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="commit-turn-btn"
                  disabled={submitting || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-brand-500/25 transition-all cursor-pointer"
                >
                  {submitting || isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Executing Month {currentStartup.currentMonth + 1}...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Commit Month {currentStartup.currentMonth + 1} Turn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Turn Result Modal */}
      {latestTurnResult && (
        <TurnModal result={latestTurnResult} onClose={clearTurnResult} />
      )}
    </div>
  );
}
