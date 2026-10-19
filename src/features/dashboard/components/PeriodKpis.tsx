import { Delta, StatTile } from '@/components/ui';
import { duration, nf } from '@/lib/format';
import type { Run } from '@/types/strava';
import { sum } from '../lib/stats';
import { PaceTile } from './PaceTile';

export interface PeriodKpisProps {
  runs: Run[];
  prevRuns: Run[] | null;
  spanDays: number;
}

export interface KpiProps extends PeriodKpisProps {
  /** Format de la tuile (colonnes:lignes). */
  size?: '1:1';
}

/** Les quatre indicateurs de la période : sorties, temps, allure, dénivelé. */
export function PeriodKpis(props: PeriodKpisProps) {
  return (
    <>
      <RunCountKpi {...props} />
      <MovingTimeKpi {...props} />
      <PaceTile {...props} />
      <ElevationKpi {...props} />
    </>
  );
}

export function RunCountKpi({ runs, prevRuns, spanDays, size = '1:1' }: KpiProps) {
  return (
    <StatTile
      size={size}
      label="Sorties"
      value={nf().format(runs.length)}
      sub={prevRuns
        ? <Delta current={runs.length} previous={prevRuns.length} />
        : `${nf(1).format(runs.length / (spanDays / 7))} par semaine`}
    />
  );
}

export function MovingTimeKpi({ runs, size = '1:1' }: KpiProps) {
  const time = sum(runs, 'moving_time');
  return (
    <StatTile
      size={size}
      label="Temps de course"
      value={duration(time)}
      sub={runs.length ? `${duration(time / runs.length)} par sortie` : undefined}
    />
  );
}

export function ElevationKpi({ runs, size = '1:1' }: KpiProps) {
  const dist = sum(runs, 'distance');
  const elev = sum(runs, 'elevation');
  return (
    <StatTile
      size={size}
      label="Dénivelé positif"
      value={nf().format(Math.round(elev))}
      unit="m"
      sub={dist ? `${nf().format(Math.round((elev / (dist / 1000)) * 10))} m / 10 km` : undefined}
    />
  );
}
