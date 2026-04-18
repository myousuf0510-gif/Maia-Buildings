'use client';
import { useState, useEffect, useCallback } from 'react';

export function useApiData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      setData(result);
      setIsLive(true);
      setError(null);
    } catch (e: unknown) {
      // Fall back to mock data gracefully — don't break the UI
      setError(e instanceof Error ? e.message : 'Unknown error');
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, isLive, reload: load };
}
