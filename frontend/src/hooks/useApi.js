/**
 * Minimal hook for data fetching with loading/error state.
 * Usage:
 *   const { data, loading, error, reload } = useApi(() => catalogService.getProducts(), []);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!signal?.aborted) setData(result);
    } catch (err) {
      if (!signal?.aborted) setError(err?.response?.data?.detail || err.message || 'Error loading data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run]);

  return { data, loading, error, reload: run };
}
