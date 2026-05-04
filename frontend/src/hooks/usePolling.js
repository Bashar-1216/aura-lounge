import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(fetchFn, interval = 5000, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const wsRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchFn();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    timerRef.current = setInterval(fetchData, interval);
    return () => clearInterval(timerRef.current);
  }, [fetchData, interval, enabled]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refresh };
}
