import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStartup } from '../context/StartupContext';
import {
  Rocket,
  LayoutDashboard,
  Compass,
  Users,
  LineChart,
  History,
  PlusCircle,
  LogOut,
  ChevronDown,
  Building2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import CreateStartupModal from './CreateStartupModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { startups, currentStartup, selectStartup } = useStartup();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/decisions', label: 'Monthly Decisions', icon: Compass },
    { to: '/employees', label: 'Team', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/history', label: 'Turn Ledger', icon: History },
  ];

  const isBankrupt = currentStartup?.status === 'BANKRUPT';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left brand & Startup Selector */}
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                  <Rocket className="w-5 h-5 text-slate-950 fill-current" />
                </div>
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    Scale<span className="text-brand-500">Up</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      v1.0
                    </span>
                  </span>
                </div>
              </Link>

              {/* Startup Selector Dropdown */}
              {startups.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-sm font-medium text-slate-200 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-brand-400" />
                    <span className="max-w-[140px] truncate">
                      {currentStartup ? currentStartup.name : 'Select Startup'}
                    </span>
                    {isBankrupt && (
                      <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-rose-500/20 text-rose-400 rounded border border-rose-500/30">
                        BANKRUPT
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Your Startups ({startups.length})
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {startups.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => selectStartup(s.id)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800/90 transition-colors ${
                              currentStartup?.id === s.id
                                ? 'bg-brand-500/10 text-brand-400 font-medium'
                                : 'text-slate-300'
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              M{s.currentMonth}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-800 my-1"></div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full text-left px-3 py-2 text-sm text-brand-400 hover:bg-brand-500/10 flex items-center gap-2 font-medium"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Create New Startup
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle Nav Links */}
            {currentStartup && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-brand-400 shadow-sm border border-slate-700/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* Right: User + Actions */}
            <div className="flex items-center gap-3">
              {startups.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-brand-500/20 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Launch Startup
                </button>
              )}

              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                    {user?.email}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {currentStartup && (
          <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-slate-950/70 border-t border-slate-800/60 gap-1 scrollbar-none">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {showCreateModal && <CreateStartupModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}
