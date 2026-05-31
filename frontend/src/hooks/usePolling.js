import { useEffect, useRef } from 'react';

/**
 * usePolling
 * Runs the provided callback immediately on mount and then repeatedly
 * at the given interval (ms). Polling is paused when the document is hidden
 * to avoid unnecessary network activity.
 *
 * Usage:
 * const fetchData = useCallback(() => { ... }, []);
 * usePolling(fetchData, 5000);
 *
 * The hook avoids unnecessary re-renders by using refs for the callback
 * and not returning changing state.
 */
export default function usePolling(callback, intervalMs) {
  const savedCallback = useRef();
  const intervalId = useRef(null);

  // Always keep the latest callback in a ref so the interval can call it
  // without re-creating the interval when the callback changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Main effect: run immediately, then set up interval. Clean up on unmount.
  useEffect(() => {
    if (typeof intervalMs !== 'number' || intervalMs <= 0) {
      // If invalid interval, just run once immediately (when visible).
      if (!document.hidden && typeof savedCallback.current === 'function') {
        savedCallback.current();
      }
      return undefined;
    }

    let mounted = true;

    const tick = () => {
      if (!document.hidden && mounted && typeof savedCallback.current === 'function') {
        savedCallback.current();
      }
    };

    // Run immediately on mount (if visible).
    tick();

    // Start interval
    intervalId.current = setInterval(tick, intervalMs);

    // When tab becomes visible, run one immediate tick to refresh data.
    const onVisibilityChange = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs]);
}
