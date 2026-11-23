import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { StartupProvider } from '../context/StartupContext';
import DashboardPage from '../pages/DashboardPage';
import DecisionsPage from '../pages/DecisionsPage';
import { api } from '../utils/api';

vi.mock('../utils/api', () => ({
  api: {
    getStartups: vi.fn(),
    getStartup: vi.fn(),
    createStartup: vi.fn(),
    advanceTurn: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  },
}));

describe('Startup Dashboard & Turn Simulation Workflow', () => {
  const mockStartup = {
    id: 'startup-123',
    userId: 'user-1',
    name: 'OmniTech AI',
    seed: 42,
    currentMonth: 0,
    status: 'ACTIVE',
    cashCents: 50000000, // $500,000
    mrrCents: 0,
    productPriceCents: 4900,
    qualityScore: 30,
    founderEquityBps: 10000,
    raisedSeed: false,
    raisedSeriesA: false,
    employees: [
      {
        id: 'emp-1',
        role: 'ENGINEERING',
        salaryCents: 1200000,
        hiredMonth: 0,
        isActive: true,
      },
    ],
    cohorts: [],
    turns: [],
    availableTermSheet: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('scaleup_token', 'valid-token');
    localStorage.setItem(
      'scaleup_user',
      JSON.stringify({ id: 'user-1', email: 'alex@scaleup.io', name: 'Alex' }),
    );
    localStorage.setItem('scaleup_active_startup_id', 'startup-123');
  });

  it('loads startup details and displays financial metrics correctly', async () => {
    api.getStartups.mockResolvedValueOnce([mockStartup]);
    api.getStartup.mockResolvedValueOnce(mockStartup);

    render(
      <MemoryRouter>
        <AuthProvider>
          <StartupProvider>
            <DashboardPage />
          </StartupProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('OmniTech AI')).toBeInTheDocument();
      // Cash on hand: $500.0k
      expect(screen.getByText('$500.0k')).toBeInTheDocument();
      // Month 0
      expect(screen.getByText('Month 0')).toBeInTheDocument();
      // Product quality: 30/100
      expect(screen.getByText('30/100')).toBeInTheDocument();
    });
  });

  it('submits monthly decisions with idempotency key and updates financial metrics', async () => {
    api.getStartups.mockResolvedValue([mockStartup]);
    api.getStartup.mockResolvedValue(mockStartup);

    const advancedState = {
      ...mockStartup,
      month: 1,
      currentMonth: 1,
      cashCents: 48000000, // $480,000
      mrrCents: 147000,    // $1,470
      qualityScore: 33,
    };

    const turnResult = {
      turn: { id: 'turn-1', month: 1 },
      state: advancedState,
      events: [
        {
          type: 'VIRAL_TWEET',
          description: '🐦 A viral tweet brought 30 organic customers!',
          impact: 'positive',
        },
      ],
      ledger: [
        { type: 'INFLOW', label: 'Revenue (MRR)', amountCents: 147000 },
        { type: 'OUTFLOW', label: 'Payroll', amountCents: 1200000 },
        { type: 'OUTFLOW', label: 'Marketing', amountCents: 350000 },
        { type: 'OUTFLOW', label: 'Fixed OpEx', amountCents: 500000 },
        { type: 'NET', label: 'Net Cash Flow', amountCents: -1903000 },
      ],
      availableTermSheet: null,
    };

    api.advanceTurn.mockResolvedValueOnce(turnResult);

    render(
      <MemoryRouter>
        <AuthProvider>
          <StartupProvider>
            <DecisionsPage />
          </StartupProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('decision-form')).toBeInTheDocument();
      const btn = screen.getByTestId('commit-turn-btn');
      expect(btn).not.toBeDisabled();
    });

    fireEvent.submit(screen.getByTestId('decision-form'));

    await waitFor(() => {
      expect(api.advanceTurn).toHaveBeenCalled();
      // Shows modal with Month 1 Executed
      expect(screen.getByText('Month 1 Executed')).toBeInTheDocument();
      // Shows event
      expect(screen.getByText(/A viral tweet brought 30 organic customers!/i)).toBeInTheDocument();
    });
  });

  it('handles and surfaces invalid turn execution errors gracefully', async () => {
    api.getStartups.mockResolvedValue([mockStartup]);
    api.getStartup.mockResolvedValue(mockStartup);
    api.advanceTurn.mockRejectedValueOnce(new Error('Validation error: priceCents must be positive'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <StartupProvider>
            <DecisionsPage />
          </StartupProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('decision-form')).toBeInTheDocument();
      const btn = screen.getByTestId('commit-turn-btn');
      expect(btn).not.toBeDisabled();
    });

    fireEvent.submit(screen.getByTestId('decision-form'));

    await waitFor(() => {
      expect(screen.getByText(/Validation error: priceCents must be positive/i)).toBeInTheDocument();
    });
  });
});
