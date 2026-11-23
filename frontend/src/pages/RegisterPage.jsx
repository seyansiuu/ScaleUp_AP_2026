import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const { register, isLoading, authError, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!email) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      // Error is set in context
    }
  };

  const handleFillDemo = () => {
    setName('Seyanshu & Garvit');
    setEmail(`founder_${Math.floor(Math.random() * 9000 + 1000)}@scaleup.io`);
    setPassword('scaleup123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-slate-950 shadow-xl shadow-brand-500/20 mb-4">
          <Rocket className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Create Founder Account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Build and scale your venture through real economic turns.
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
                Founder Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

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
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Launch Venture Profile
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Generate Demo button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Fast sign-up testing?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-mono font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Test Profile
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
