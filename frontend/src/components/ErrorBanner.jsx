import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Simple error banner used across the app.
 * Props:
 *   message: string – error message to display.
 *   onClose?: () => void – optional close handler (e.g., to clear context state).
 */
export default function ErrorBanner({ message, onClose }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 text-sm">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-rose-400 hover:text-rose-200"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
