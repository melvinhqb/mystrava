import { useMemo } from 'react';
import type { DashboardData, Period } from '@/types/strava';
import { periodBounds, periodSpanDays, splitByPeriod } from '../lib/stats';
import { DistanceBucketsTile } from './DistanceBucketsTile';
import { HeartRateTile } from './HeartRateTile';
import { HeatmapTile } from './HeatmapTile';
import { HeroTile } from './HeroTile';
import { PaceTrendTile } from './PaceTrendTile';
import { PeriodKpis } from './PeriodKpis';
import { RecentRunsTile } from './RecentRunsTile';
import { RecordsTile } from './RecordsTile';
import { StreakTile } from './StreakTile';
import { TotalsTile } from './TotalsTile';
import { WeekdayTile } from './WeekdayTile';
import { WeeklyVolumeTile } from './WeeklyVolumeTile';

export interface DashboardProps {
  data: DashboardData;
  period: Period;
}

/**
 * Grille bento complète. Les tuiles liées à la période reçoivent `runs`,
 * les tendances (semaines, mois, calendrier) reçoivent toutes les sorties.
 */
export function Dashboard({ data, period }: DashboardProps) {
  const all = data.runs;
  const { runs, prevRuns, spanDays } = useMemo(() => {
    const bounds = periodBounds(period);
    const split = splitByPeriod(all, bounds);
    return { ...split, spanDays: periodSpanDays(split.runs, bounds) };
  }, [all, period]);

  return (
    <section className="bento">
      <HeroTile runs={runs} prevRuns={prevRuns} allRuns={all} period={period} spanDays={spanDays} />
      <PeriodKpis runs={runs} prevRuns={prevRuns} spanDays={spanDays} />
      <WeeklyVolumeTile runs={all} />
      <RecordsTile runs={runs} />
      <StreakTile runs={all} />
      <PaceTrendTile runs={all} />
      <HeartRateTile runs={runs} />
      <HeatmapTile runs={all} />
      <WeekdayTile runs={runs} />
      <DistanceBucketsTile runs={runs} />
      <RecentRunsTile runs={all} athleteId={data.athlete.id} demo={data.demo} />
      <TotalsTile stats={data.stats} />
    </section>
  );
}
