import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

describe('Protected Routes Security', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users attempting to access /dashboard to /login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Screen</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard Screen')).not.toBeInTheDocument();
  });

  it('permits authenticated users with valid token to access protected page', () => {
    localStorage.setItem('scaleup_token', 'valid-jwt-token');
    localStorage.setItem(
      'scaleup_user',
      JSON.stringify({ id: 'u-1', email: 'founder@scaleup.io', name: 'Alex' }),
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Screen</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secret Dashboard Screen')).toBeInTheDocument();
  });
});
