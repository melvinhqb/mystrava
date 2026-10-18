import { Delta, StatTile } from '@/components/ui';
import { duration, nf, pace } from '@/lib/format';
import type { Run } from '@/types/strava';
import { paceOf, sum } from '../lib/stats';

export interface PeriodKpisProps {
  runs: Run[];
  prevRuns: Run[] | null;
  spanDays: number;
}

/** Les quatre indicateurs de la période : sorties, temps, allure, dénivelé. */
export function PeriodKpis({ runs, prevRuns, spanDays }: PeriodKpisProps) {
  const dist = sum(runs, 'distance');
  const time = sum(runs, 'moving_time');
  const elev = sum(runs, 'elevation');
  const p = paceOf(runs);
  const prevP = prevRuns ? paceOf(prevRuns) : NaN;

  return (
    <>
      <StatTile
        label="Sorties"
        value={nf().format(runs.length)}
        sub={prevRuns
          ? <Delta current={runs.length} previous={prevRuns.length} />
          : `${nf(1).format(runs.length / (spanDays / 7))} par semaine`}
      />
      <StatTile
        label="Temps de course"
        value={duration(time)}
        sub={runs.length ? `${duration(time / runs.length)} par sortie` : undefined}
      />
      <StatTile label="Allure moyenne" value={pace(p)} unit="/km" sub={<PaceDelta pace={p} previous={prevP} />} />
      <StatTile
        label="Dénivelé positif"
        value={nf().format(Math.round(elev))}
        unit="m"
        sub={dist ? `${nf().format(Math.round((elev / (dist / 1000)) * 10))} m / 10 km` : undefined}
      />
    </>
  );
}

function PaceDelta({ pace: p, previous }: { pace: number; previous: number }) {
  if (!isFinite(p)) return null;
  if (!isFinite(previous)) return <>{nf(1).format(3600 / p)} km/h</>;
  const diff = Math.round(previous - p);
  if (diff === 0) return <>Stable vs période préc.</>;
  return (
    <>
      <span className={diff > 0 ? 'delta-up' : 'delta-down'}>{diff > 0 ? '−' : '+'}{Math.abs(diff)} s/km</span> vs période préc.
    </>
  );
}
