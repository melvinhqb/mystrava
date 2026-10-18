import { Tile } from '@/components/ui';
import { duration, km, nf } from '@/lib/format';
import type { AthleteStats, Totals } from '@/types/strava';

export function TotalsTile({ stats }: { stats: AthleteStats }) {
  return (
    <Tile span={2} className="totals" title="Totaux" caption="toutes sorties de course">
      <div className="totals-grid">
        <TotalsBlock title="4 dernières semaines" totals={stats.recent} />
        <TotalsBlock title={`Année ${new Date().getFullYear()}`} totals={stats.ytd} />
        <TotalsBlock title="Depuis toujours" totals={stats.all} />
      </div>
    </Tile>
  );
}

function TotalsBlock({ title, totals: t }: { title: string; totals?: Totals }) {
  if (!t) return null;
  return (
    <section>
      <h3>{title}</h3>
      <p><b>{km(t.distance, 0)}</b> km</p>
      <p>{nf().format(t.count)} sorties · {duration(t.moving_time)}</p>
      <p>{nf().format(Math.round(t.elevation_gain))} m D+</p>
    </section>
  );
}
