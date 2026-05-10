import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseSupabaseQueryOptions {
  staleTime?: number;
  cacheKey?: string;
  retries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getSessionCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`sq_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

function setSessionCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(`sq_${key}`, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

function isCacheValid(key: string, staleTime: number): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < staleTime;
}

async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  retries: number,
  retryDelay: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal.aborted) throw new Error('Aborted');
    try {
      return await fn(signal);
    } catch (err) {
      lastError = err;
      if (attempt < retries && !signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export function useSupabaseQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const {
    staleTime = 120_000,
    cacheKey,
    retries = 2,
    retryDelay = 1000,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    if (cacheKey) {
      const cached = memoryCache.get(cacheKey);
      if (cached && isCacheValid(cacheKey, staleTime)) {
        return cached.data as T;
      }
      const sessionCached = getSessionCache<T>(cacheKey);
      if (sessionCached) return sessionCached;
    }
    return null;
  });

  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (!enabled) return;

    if (cacheKey && isCacheValid(cacheKey, staleTime)) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        setData(cached.data as T);
        setLoading(false);
        setIsStale(false);
        return;
      }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(queryFn, controller.signal, retries, retryDelay);

      if (!mountedRef.current || controller.signal.aborted) return;

      setData(result);
      setIsStale(false);

      if (cacheKey) {
        memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
        setSessionCache(cacheKey, result);
      }
    } catch (err) {
      if (!mountedRef.current || controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(msg);
      setIsStale(true);
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, cacheKey, staleTime, retries, retryDelay, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [execute]);

  const refetch = useCallback(async () => {
    if (cacheKey) {
      memoryCache.delete(cacheKey);
      try { sessionStorage.removeItem(`sq_${cacheKey}`); } catch {}
    }
    await execute();
  }, [execute, cacheKey]);

  return { data, loading, error, refetch, isStale };
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}
