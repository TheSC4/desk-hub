import { useState, useEffect, useRef } from 'react';
import { liveQuery } from 'dexie';

/**
 * Custom hook that wraps Dexie's liveQuery for reactive IndexedDB queries.
 * Re-renders the component whenever the underlying data changes.
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: unknown[] = [],
  defaultValue: T
): T {
  const [result, setResult] = useState<T>(defaultValue);
  const querierRef = useRef(querier);
  querierRef.current = querier;

  useEffect(() => {
    const observable = liveQuery(() => querierRef.current());
    const subscription = observable.subscribe({
      next: (value) => setResult(value),
      error: (err) => console.error('LiveQuery error:', err),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
