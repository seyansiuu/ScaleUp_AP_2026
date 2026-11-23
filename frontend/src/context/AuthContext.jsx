import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('scaleup_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('scaleup_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('scaleup:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('scaleup:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('scaleup_token', res.token);
      localStorage.setItem('scaleup_user', JSON.stringify(res.user));
      return res;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.register({ name, email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('scaleup_token', res.token);
      localStorage.setItem('scaleup_user', JSON.stringify(res.user));
      return res;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('scaleup_token');
    localStorage.removeItem('scaleup_user');
    localStorage.removeItem('scaleup_active_startup_id');
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    authError,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
