import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { api } from '../utils/api';

vi.mock('../utils/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  },
}));

describe('Auth Workflow & Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form and submits credentials successfully', async () => {
    api.login.mockResolvedValueOnce({
      token: 'jwt-token-123',
      user: { id: 'u-1', email: 'founder@scaleup.io', name: 'Alex' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Welcome back to/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/founder@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Cockpit/i });

    fireEvent.change(emailInput, { target: { value: 'founder@scaleup.io' } });
    fireEvent.change(passwordInput, { target: { value: 'scaleup123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'founder@scaleup.io',
        password: 'scaleup123',
      });
      expect(localStorage.getItem('scaleup_token')).toBe('jwt-token-123');
    });
  });

  it('displays error message on invalid credentials', async () => {
    api.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const emailInput = screen.getByPlaceholderText(/founder@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Cockpit/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@scaleup.io' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('renders registration form and registers new user successfully', async () => {
    api.register.mockResolvedValueOnce({
      token: 'jwt-token-456',
      user: { id: 'u-2', email: 'new@scaleup.io', name: 'Jane Doe' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Create Founder Account/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Alex Vance/i);
    const emailInput = screen.getByPlaceholderText(/founder@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Launch Venture Profile/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'new@scaleup.io' } });
    fireEvent.change(passwordInput, { target: { value: 'scaleup123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'new@scaleup.io',
        password: 'scaleup123',
      });
      expect(localStorage.getItem('scaleup_token')).toBe('jwt-token-456');
    });
  });

  it('validates minimum password length on registration', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const nameInput = screen.getByPlaceholderText(/Alex Vance/i);
    const emailInput = screen.getByPlaceholderText(/founder@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Launch Venture Profile/i });

    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    fireEvent.change(emailInput, { target: { value: 'jane@scaleup.io' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
      expect(api.register).not.toHaveBeenCalled();
    });
  });
});
