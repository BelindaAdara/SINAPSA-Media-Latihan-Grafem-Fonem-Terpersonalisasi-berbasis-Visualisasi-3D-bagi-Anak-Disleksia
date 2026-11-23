import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { api } from '../api';

const CHILD_KEY = 'sinapsa.child_id';
const ChildContext = createContext(null);

export function ChildProvider({ children }) {
  const [child, setChild] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const childId = await AsyncStorage.getItem(CHILD_KEY);
        if (!active) return;
        if (!childId) {
          setChild(null);
          setStatus('onboarding');
          return;
        }
        try {
          const profile = await api.child(childId);
          if (!active) return;
          setChild(profile);
          setStatus('ready');
        } catch (requestError) {
          if (requestError instanceof ApiError && requestError.status === 404) {
            await AsyncStorage.removeItem(CHILD_KEY);
            if (!active) return;
            setChild(null);
            setStatus('onboarding');
            return;
          }
          throw requestError;
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError);
        setStatus('error');
      }
    }
    load();
    return () => { active = false; };
  }, [retryIndex]);

  const saveChild = useCallback(async (nextChild) => {
    await AsyncStorage.setItem(CHILD_KEY, nextChild.id);
    setChild(nextChild);
    setStatus('ready');
  }, []);

  const refreshChild = useCallback(async () => {
    if (!child?.id) return;
    const latest = await api.child(child.id);
    setChild(latest);
    return latest;
  }, [child]);

  const value = useMemo(() => ({
    child,
    status,
    error,
    saveChild,
    refreshChild,
    retry: () => setRetryIndex((value) => value + 1),
  }), [child, status, error, saveChild, refreshChild]);

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}

export function useChild() {
  const context = useContext(ChildContext);
  if (!context) throw new Error('useChild harus dipakai di dalam ChildProvider.');
  return context;
}
