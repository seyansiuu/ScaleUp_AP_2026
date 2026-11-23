import React, { useState } from 'react';
import { useStartup } from '../context/StartupContext';
import { Rocket, Sparkles, X, Dices } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateStartupModal({ onClose }) {
  const { createStartup, isLoading, error } = useStartup();
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999) + 1);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 999999) + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('Startup name is required');
      return;
    }

    try {
      await createStartup({ name: name.trim(), seed: Number(seed) });
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Failed to create startup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Found New Startup</h3>
            <p className="text-xs text-slate-400">
              Start with $500k cash and 100% equity at Month 0.
            </p>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {localError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Startup Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme AI, Omniscale, Vektor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Deterministic RNG Seed
              </label>
              <button
                type="button"
                onClick={handleRandomizeSeed}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-mono"
              >
                <Dices className="w-3.5 h-3.5" />
                Randomize
              </button>
            </div>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              The simulation engine uses Mulberry32 PRNG. The same seed yields identical market events.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Launching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Launch Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
