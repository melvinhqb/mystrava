import { useCallback, useState } from 'react';

/** useState mémorisé dans localStorage (ignoré si le stockage est indisponible). */
export function usePersistentState<T extends string>(key: string, initial: T, isValid: (v: string) => v is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null && isValid(saved)) return saved;
    } catch { /* stockage indisponible */ }
    return initial;
  });

  const set = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(key, next); } catch { /* ignoré */ }
  }, [key]);

  return [value, set] as const;
}
