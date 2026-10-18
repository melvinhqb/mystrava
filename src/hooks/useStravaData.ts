import { useEffect, useState } from 'react';
import { fetchStravaData, toDashboardData } from '@/api/strava';
import type { DashboardData, StravaData } from '@/types/strava';

export type DataState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardData };

// Données de démo, en dev uniquement : en prod, la condition vaut false et Vite retire le module du bundle.
async function loadData(): Promise<StravaData | null> {
  const data = await fetchStravaData();
  if (data || !import.meta.env.DEV) return data;
  return (await import('@/api/demo')).makeDemoData();
}

/** Charge data.json ; en dev, se rabat sur les données de démo s'il n'existe pas. */
export function useStravaData(): DataState {
  const [state, setState] = useState<DataState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadData()
      .then((raw) => { if (!cancelled) setState(raw ? { status: 'ready', data: toDashboardData(raw) } : { status: 'empty' }); })
      .catch((e: Error) => { if (!cancelled) setState({ status: 'error', message: e.message }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}
