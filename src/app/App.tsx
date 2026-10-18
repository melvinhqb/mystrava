import { useEffect } from 'react';
import { Footer, Topbar, WelcomeScreen } from '@/components/layout';
import { Dashboard, DEFAULT_PERIOD, isPeriod, PeriodSelector } from '@/features/dashboard';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useStravaData } from '@/hooks/useStravaData';
import { athleteName } from '@/lib/athlete';

export function App() {
  const state = useStravaData();
  const [period, setPeriod] = usePersistentState('running.period', DEFAULT_PERIOD, isPeriod);
  const data = state.status === 'ready' ? state.data : null;

  useEffect(() => {
    const name = athleteName(data?.athlete);
    if (name) document.title = `${name} · Course à pied`;
  }, [data]);

  const footerInfo = !data
    ? undefined
    : data.demo
      ? 'Mode démo : données fictives'
      : `${data.runs.length} sorties · mis à jour le ${new Date(data.fetchedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`;

  return (
    <>
      <Topbar
        athlete={data?.athlete}
        demo={data?.demo}
        actions={data && <PeriodSelector value={period} onChange={setPeriod} />}
      />
      <main>
        {state.status === 'loading' && <p className="status" role="status">Chargement…</p>}
        {state.status === 'error' && <p className="status" role="status">{state.message}</p>}
        {state.status === 'empty' && <WelcomeScreen />}
        {data && <Dashboard data={data} period={period} />}
      </main>
      <Footer info={footerInfo} />
    </>
  );
}
