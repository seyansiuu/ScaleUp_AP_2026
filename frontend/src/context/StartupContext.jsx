import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const StartupContext = createContext(null);
const ACTIVE_STARTUP_KEY = 'scaleup_active_startup_id';

export function StartupProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [startups, setStartups] = useState([]);
  const [activeStartupId, setActiveStartupId] = useState(() => localStorage.getItem(ACTIVE_STARTUP_KEY));
  const [currentStartup, setCurrentStartup] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedStartups, setHasLoadedStartups] = useState(false);
  const [latestTurnResult, setLatestTurnResult] = useState(null);

  const currentStartupId = useRef(currentStartup?.id);
  currentStartupId.current = currentStartup?.id;
  const pendingCount = useRef(0);
  const startupRequestId = useRef(0);
  const detailsRequestId = useRef(0);

  const beginLoading = useCallback(() => {
    pendingCount.current += 1;
    setIsLoading(true);
    return () => {
      pendingCount.current = Math.max(0, pendingCount.current - 1);
      setIsLoading(pendingCount.current > 0);
    };
  }, []);

  const fetchStartupDetails = useCallback(async (id) => {
    if (!id || !isAuthenticated) return null;

    const requestId = ++detailsRequestId.current;
    const finishLoading = beginLoading();
    setError(null);
    try {
      const startup = await api.getStartup(id);
      if (!startup || startup.id !== id) {
        throw new Error('The server returned invalid startup details.');
      }
      if (requestId === detailsRequestId.current) setCurrentStartup(startup);
      return startup;
    } catch (err) {
      if (requestId === detailsRequestId.current) {
        setCurrentStartup(null);
        setError(err.message || 'Failed to fetch startup details');
      }
      throw err;
    } finally {
      finishLoading();
    }
  }, [beginLoading, isAuthenticated]);

  const fetchStartups = useCallback(async ({ preferredId } = {}) => {
    if (!isAuthenticated) return [];

    const requestId = ++startupRequestId.current;
    const finishLoading = beginLoading();
    setError(null);
    try {
      const list = await api.getStartups();
      if (!Array.isArray(list)) {
        throw new Error('The server returned an invalid startup list.');
      }
      if (requestId !== startupRequestId.current) return list;

      setStartups(list);
      setHasLoadedStartups(true);

      const storedId = preferredId ?? localStorage.getItem(ACTIVE_STARTUP_KEY);
      const selected = list.find((startup) => startup.id === storedId) || list[0] || null;
      const selectedId = selected?.id ?? null;

      setActiveStartupId(selectedId);
      if (selectedId) localStorage.setItem(ACTIVE_STARTUP_KEY, selectedId);
      else localStorage.removeItem(ACTIVE_STARTUP_KEY);

      if (!selectedId) {
        detailsRequestId.current += 1;
        setCurrentStartup(null);
        setLatestTurnResult(null);
        return list;
      }

      if (currentStartupId.current !== selectedId) {
        setCurrentStartup(null);
        setLatestTurnResult(null);
      }
      await fetchStartupDetails(selectedId);
      return list;
    } catch (err) {
      if (requestId === startupRequestId.current) {
        setHasLoadedStartups(true);
        setError(err.message || 'Failed to fetch startups');
      }
      throw err;
    } finally {
      finishLoading();
    }
  }, [beginLoading, fetchStartupDetails, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStartups().catch(() => {});
      return;
    }

    startupRequestId.current += 1;
    detailsRequestId.current += 1;
    setStartups([]);
    setCurrentStartup(null);
    setActiveStartupId(null);
    setError(null);
    setHasLoadedStartups(false);
    setLatestTurnResult(null);
    setIsLoading(false);
    pendingCount.current = 0;
  }, [fetchStartups, isAuthenticated]);

  const selectStartup = useCallback((id) => {
    if (!id || !startups.some((startup) => startup.id === id)) return Promise.resolve(null);

    setError(null);
    setLatestTurnResult(null);
    setActiveStartupId(id);
    localStorage.setItem(ACTIVE_STARTUP_KEY, id);
    if (currentStartup?.id !== id) setCurrentStartup(null);
    return fetchStartupDetails(id).catch(() => null);
  }, [currentStartup?.id, fetchStartupDetails, startups]);

  const createStartup = useCallback(async ({ name, seed }) => {
    const finishLoading = beginLoading();
    setError(null);
    try {
      const created = await api.createStartup({ name, seed });
      if (!created?.id) throw new Error('The server did not return the created startup.');
      await fetchStartups({ preferredId: created.id });
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create startup');
      throw err;
    } finally {
      finishLoading();
    }
  }, [beginLoading, fetchStartups]);

  const advanceTurn = useCallback(async (decisions) => {
    const startupId = currentStartup?.id || activeStartupId;
    if (!startupId) throw new Error('No active startup');

    const finishLoading = beginLoading();
    setError(null);
    try {
      const result = await api.advanceTurn(startupId, decisions);
      setLatestTurnResult(result);
      await fetchStartups({ preferredId: startupId });
      return result;
    } catch (err) {
      setError(err.message || 'Failed to execute turn');
      throw err;
    } finally {
      finishLoading();
    }
  }, [activeStartupId, beginLoading, currentStartup?.id, fetchStartups]);

  const refreshStartup = useCallback(() => {
    if (!activeStartupId) return fetchStartups();
    return fetchStartupDetails(activeStartupId);
  }, [activeStartupId, fetchStartupDetails, fetchStartups]);

  const clearError = useCallback(() => setError(null), []);
  const clearTurnResult = useCallback(() => setLatestTurnResult(null), []);

  const value = {
    startups,
    activeStartupId,
    currentStartup,
    error,
    isLoading,
    hasLoadedStartups,
    latestTurnResult,
    selectStartup,
    createStartup,
    advanceTurn,
    clearTurnResult,
    clearError,
    refreshStartup,
    refreshAll: fetchStartups,
  };

  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}

export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) throw new Error('useStartup must be used within a StartupProvider');
  return context;
}
