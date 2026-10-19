import { useCallback, useState } from 'react';
import { defaultLayout, parseLayout, type DashboardLayout } from '../layout';

const KEY = 'running.layout';

/**
 * Disposition personnalisée, mémorisée dans localStorage.
 * Sans sauvegarde (ou après réinitialisation), suit `defaultLayout`.
 */
export function useDashboardLayout() {
  const [layout, setState] = useState<DashboardLayout>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved !== null) return parseLayout(JSON.parse(saved)) ?? defaultLayout;
    } catch { /* stockage indisponible ou contenu invalide */ }
    return defaultLayout;
  });

  const setLayout = useCallback((next: DashboardLayout) => {
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignoré */ }
  }, []);

  const reset = useCallback(() => {
    setState(defaultLayout);
    try { localStorage.removeItem(KEY); } catch { /* ignoré */ }
  }, []);

  return { layout, setLayout, reset };
}
