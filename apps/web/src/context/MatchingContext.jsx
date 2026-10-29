import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../config/api.js';

const MatchingContext = createContext(null);

const REFRESH_MS = 60 * 1000;

export function MatchingProvider({ children }) {
  const { token, user } = useAuth();
  const [candidateCount, setCandidateCount] = useState(0);

  const canFetch = Boolean(
    token &&
    localStorage.getItem('token') &&
    user?.emailVerified &&
    user?.profileCompleted &&
    user?.role !== 'admin'
  );

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setCandidateCount(0);
      return;
    }

    try {
      const res = await api.get('/v1/matching/candidates', { params: { limit: 1 } });
      setCandidateCount(Number(res.data.total || 0));
    } catch (_error) {
      setCandidateCount(0);
    }
  }, [canFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!canFetch) return undefined;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [canFetch, refresh]);

  const value = useMemo(
    () => ({
      candidateCount,
      refresh,
    }),
    [candidateCount, refresh]
  );

  return <MatchingContext.Provider value={value}>{children}</MatchingContext.Provider>;
}

export function useMatching() {
  const context = useContext(MatchingContext);
  if (!context) {
    throw new Error('useMatching debe usarse dentro de MatchingProvider');
  }
  return context;
}
