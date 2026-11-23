import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const StartupContext = createContext(null);

export function StartupProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [startups, setStartups] = useState([]);
  const [activeStartupId, setActiveStartupId] = useState(() => {
    return localStorage.getItem('scaleup_active_startup_id') || null;
  });
  const [currentStartup, setCurrentStartup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latestTurnResult, setLatestTurnResult] = useState(null);

  // Load all startups for current user
  const fetchStartups = useCallback(async () => {
    if (!isAuthenticated) return [];
    setIsLoading(true);
    setError(null);
    try {
      const list = await api.getStartups();
      setStartups(list);
      // If we have an active startup id that's still in the list, keep it, else pick the first
      if (list.length > 0) {
        const found = list.find(s => s.id === activeStartupId);
        const targetId = found ? found.id : list[0].id;
        setActiveStartupId(targetId);
        localStorage.setItem('scaleup_active_startup_id', targetId);
      } else {
        setActiveStartupId(null);
        setCurrentStartup(null);
        localStorage.removeItem('scaleup_active_startup_id');
      }
      return list;
    } catch (err) {
      setError(err.message || 'Failed to fetch startups');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeStartupId]);

  // Load detailed startup by activeStartupId
  const fetchStartupDetails = useCallback(async (id = activeStartupId) => {
    if (!id || !isAuthenticated) return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getStartup(id);
      setCurrentStartup(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch startup details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activeStartupId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStartups();
    } else {
      setStartups([]);
      setCurrentStartup(null);
      setActiveStartupId(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeStartupId && isAuthenticated) {
      fetchStartupDetails(activeStartupId);
    }
  }, [activeStartupId, isAuthenticated]);

  const selectStartup = (id) => {
    setActiveStartupId(id);
    localStorage.setItem('scaleup_active_startup_id', id);
  };

  const createStartup = async ({ name, seed }) => {
    setIsLoading(true);
    setError(null);
    try {
      const newStartup = await api.createStartup({ name, seed });
      await fetchStartups();
      selectStartup(newStartup.id);
      return newStartup;
    } catch (err) {
      setError(err.message || 'Failed to create startup');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const advanceTurn = async (decisions) => {
    if (!currentStartup) throw new Error('No active startup');
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.advanceTurn(currentStartup.id, decisions);
      setLatestTurnResult(result);
      // Refresh current startup details and startups list
      await fetchStartupDetails(currentStartup.id);
      await fetchStartups();
      return result;
    } catch (err) {
      setError(err.message || 'Failed to execute turn');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearTurnResult = () => setLatestTurnResult(null);

  const value = {
    startups,
    activeStartupId,
    currentStartup,
    isLoading,
    error,
    latestTurnResult,
    selectStartup,
    createStartup,
    advanceTurn,
    clearTurnResult,
    refreshStartup: () => fetchStartupDetails(activeStartupId),
    refreshAll: fetchStartups,
  };

  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}

export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) {
    throw new Error('useStartup must be used within a StartupProvider');
  }
  return context;
}
