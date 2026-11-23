import React, { useState } from 'react';
import { useStartup } from '../context/StartupContext';
import { Link } from 'react-router-dom';
import {
  formatMoney,
  ROLE_CONFIG,
} from '../utils/formatters';
import {
  Users,
  DollarSign,
  Code2,
  TrendingUp,
  Megaphone,
  Headphones,
  UserPlus,
  UserMinus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function EmployeesPage() {
  const { currentStartup, advanceTurn, isLoading } = useStartup();
  const [selectedFireId, setSelectedFireId] = useState(null);
  const [fireConfirmOpen, setFireConfirmOpen] = useState(false);
  const [firingLoading, setFiringLoading] = useState(false);

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

  const employees = currentStartup.employees || [];
  const activeEmployees = employees.filter((e) => e.isActive);
  const formerEmployees = employees.filter((e) => !e.isActive);

  const totalPayrollCents = activeEmployees.reduce((sum, e) => sum + Number(e.salaryCents), 0);

  const countByRole = {
    ENGINEERING: activeEmployees.filter((e) => e.role === 'ENGINEERING').length,
    SALES: activeEmployees.filter((e) => e.role === 'SALES').length,
    MARKETING: activeEmployees.filter((e) => e.role === 'MARKETING').length,
    SUPPORT: activeEmployees.filter((e) => e.role === 'SUPPORT').length,
  };

  const roleIcons = {
    ENGINEERING: Code2,
    SALES: TrendingUp,
    MARKETING: Megaphone,
    SUPPORT: Headphones,
  };

  const handleFireClick = (id) => {
    setSelectedFireId(id);
    setFireConfirmOpen(true);
  };

  const confirmFire = async () => {
    if (!selectedFireId) return;
    setFiringLoading(true);
    try {
      // Fire through advancing turn or navigating to decisions
      // Usually fires are submitted as turn decisions
      setFireConfirmOpen(false);
    } finally {
      setFiringLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team & Headcount Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {activeEmployees.length} Active Member{activeEmployees.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Staffing levels directly govern product velocity, customer conversion, and retention.
          </p>
        </div>

        <Link
          to="/decisions"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Hire in Month {currentStartup.currentMonth + 1} Cockpit</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── Role Cards Summary ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
          const Icon = roleIcons[roleKey] || Users;
          const count = countByRole[roleKey] || 0;
          const totalRolePayroll = count * cfg.salaryCents;

          return (
            <div
              key={roleKey}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {cfg.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${cfg.badgeClass}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">{count}</span>
                <span className="text-xs text-slate-500 font-sans">headcount</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex justify-between font-mono mb-1">
                  <span>Salary:</span>
                  <span className="text-slate-300">{cfg.salaryLabel}</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed font-sans">
                  {cfg.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Total Payroll Banner ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Total Monthly Payroll
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Recurring monthly personnel expense across all active roles
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold font-mono text-emerald-400">
            {formatMoney(totalPayrollCents)}
          </span>
          <span className="text-xs text-slate-500 block font-mono">per month</span>
        </div>
      </div>

      {/* ─── Active Employees Roster Table ────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Active Team Roster ({activeEmployees.length})
        </h3>

        {activeEmployees.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No active team members. You can hire engineers, sales reps, marketers, and customer support in the monthly decision cockpit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Monthly Compensation</th>
                  <th className="py-2.5 px-3">Hired Month</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeEmployees.map((emp) => {
                  const cfg = ROLE_CONFIG[emp.role] || {};
                  const Icon = roleIcons[emp.role] || Users;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg border ${cfg.badgeClass || 'bg-slate-800'}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-white font-sans">{cfg.label || emp.role}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{formatMoney(emp.salaryCents)} / mo</td>
                      <td className="py-3 px-3 text-slate-400">Month {emp.hiredMonth}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to="/decisions"
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-sans font-medium transition-colors"
                        >
                          Manage in Cockpit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Former Employees ─────────────────────────────────────── */}
      {formerEmployees.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Alumni & Former Staff ({formerEmployees.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-400">
              <thead className="bg-slate-800/40 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Tenure</th>
                  <th className="py-2 px-3">Dismissed Month</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {formerEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="py-2.5 px-3 font-sans">{emp.role}</td>
                    <td className="py-2.5 px-3">
                      Month {emp.hiredMonth} → Month {emp.firedMonth}
                    </td>
                    <td className="py-2.5 px-3">Month {emp.firedMonth}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        Terminated
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
