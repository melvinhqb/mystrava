import { Tile } from '@/components/ui';
import { duration, km, nf } from '@/lib/format';
import type { AthleteStats, Totals } from '@/types/strava';

export function TotalsTile({ stats, size = '2:1' }: { stats: AthleteStats; size?: '2:1' }) {
  return (
    <Tile size={size} className="totals" title="Totaux" caption="toutes sorties de course">
      <div className="totals-grid">
        <TotalsBlock title="4 semaines" short="4 sem." totals={stats.recent} />
        <TotalsBlock title={`Année ${new Date().getFullYear()}`} short={String(new Date().getFullYear())} totals={stats.ytd} />
        <TotalsBlock title="Depuis toujours" short="Total" totals={stats.all} />
      </div>
    </Tile>
  );
}

/** `short` remplace le titre quand la place manque (mobile). */
function TotalsBlock({ title, short, totals: t }: { title: string; short: string; totals?: Totals }) {
  if (!t) return null;
  return (
    <section>
      <h3 title={title}><span className="long">{title}</span><span className="short">{short}</span></h3>
      <p><b>{km(t.distance, 0)}</b> km</p>
      <p>{nf().format(t.count)} sorties · {duration(t.moving_time)}</p>
      <p>{nf().format(Math.round(t.elevation_gain))} m D+</p>
    </section>
  );
}
