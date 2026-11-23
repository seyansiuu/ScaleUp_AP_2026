import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading, authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is set in context
    }
  };

  const handleFillDemo = () => {
    setEmail('founder@scaleup.io');
    setPassword('scaleup123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-slate-950 shadow-xl shadow-brand-500/20 mb-4">
          <Rocket className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Welcome back to <span className="text-brand-500">ScaleUp</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          The high-fidelity startup simulator & founder cockpit.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {(localError || authError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Cockpit
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need quick credentials?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-mono font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Demo Login
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have a founder account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
