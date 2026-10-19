import type { ReactNode } from 'react';
import type { TileSize } from '@/components/ui';
import type { DashboardData, Period, Run } from '@/types/strava';
import { DistanceBucketsTile } from './components/DistanceBucketsTile';
import { DistanceTile } from './components/DistanceTile';
import { HeartRateTile } from './components/HeartRateTile';
import { PaceTile } from './components/PaceTile';
import { ElevationKpi, MovingTimeKpi, RunCountKpi } from './components/PeriodKpis';
import { RecentRunsTile } from './components/RecentRunsTile';
import { RecordsTile } from './components/RecordsTile';
import { RegularityTile } from './components/RegularityTile';
import { TotalsTile } from './components/TotalsTile';
import { WeekdayTile } from './components/WeekdayTile';

/** Données mises à disposition de chaque bloc. */
export interface BlockContext {
  data: DashboardData;
  period: Period;
  /** Toutes les sorties, pour les tendances (semaines, mois, calendrier). */
  all: Run[];
  /** Sorties de la période. */
  runs: Run[];
  /** Sorties de la période précédente, null pour « Tout ». */
  prevRuns: Run[] | null;
  spanDays: number;
}

export interface BlockDefinition<S extends TileSize = TileSize> {
  /** Nom affiché dans le catalogue des widgets. */
  label: string;
  /** Formats que le bloc sait afficher (colonnes:lignes) ; le premier est celui par défaut. */
  sizes: readonly [S, ...S[]];
  render: (ctx: BlockContext, size: S) => ReactNode;
}

const defineBlock = <S extends TileSize>(block: BlockDefinition<S>) => block;

/**
 * Catalogue des blocs du tableau de bord et des formats que chacun supporte.
 * Pour proposer un nouveau format, l'ajouter à `sizes` et au type de la prop `size` du composant.
 */
export const blocks = {
  distance: defineBlock({
    label: 'Distance parcourue',
    sizes: ['1:1', '2:1', '2:2'],
    render: (c, size) => (
      <DistanceTile size={size} runs={c.runs} prevRuns={c.prevRuns} allRuns={c.all} period={c.period} spanDays={c.spanDays} />
    ),
  }),
  'kpi-runs': defineBlock({
    label: 'Sorties',
    sizes: ['1:1'],
    render: (c, size) => <RunCountKpi size={size} {...c} />,
  }),
  'kpi-time': defineBlock({
    label: 'Temps de course',
    sizes: ['1:1'],
    render: (c, size) => <MovingTimeKpi size={size} {...c} />,
  }),
  pace: defineBlock({
    label: 'Allure moyenne',
    sizes: ['1:1', '2:1', '2:2'],
    render: (c, size) => <PaceTile size={size} runs={c.runs} prevRuns={c.prevRuns} allRuns={c.all} />,
  }),
  'kpi-elevation': defineBlock({
    label: 'Dénivelé positif',
    sizes: ['1:1'],
    render: (c, size) => <ElevationKpi size={size} {...c} />,
  }),
  records: defineBlock({
    label: 'Records',
    sizes: ['1:2'],
    render: (c, size) => <RecordsTile size={size} runs={c.runs} />,
  }),
  streak: defineBlock({
    label: 'Régularité',
    sizes: ['1:1', '2:1', '2:2', '4:1'],
    render: (c, size) => <RegularityTile size={size} runs={c.all} />,
  }),
  'heart-rate': defineBlock({
    label: 'Fréquence cardiaque',
    sizes: ['1:1', '2:1'],
    render: (c, size) => <HeartRateTile size={size} runs={c.runs} />,
  }),
  weekday: defineBlock({
    label: 'Jours de sortie',
    sizes: ['1:1'],
    render: (c, size) => <WeekdayTile size={size} runs={c.runs} />,
  }),
  'distance-buckets': defineBlock({
    label: 'Distances',
    sizes: ['1:1'],
    render: (c, size) => <DistanceBucketsTile size={size} runs={c.runs} />,
  }),
  'recent-runs': defineBlock({
    label: 'Dernières sorties',
    sizes: ['2:2'],
    render: (c, size) => <RecentRunsTile size={size} runs={c.all} athleteId={c.data.athlete.id} demo={c.data.demo} />,
  }),
  totals: defineBlock({
    label: 'Totaux',
    sizes: ['2:1'],
    render: (c, size) => <TotalsTile size={size} stats={c.data.stats} />,
  }),
};

export type BlockId = keyof typeof blocks;

/** Formats disponibles pour un bloc donné. */
export type BlockSize<K extends BlockId> = (typeof blocks)[K] extends BlockDefinition<infer S> ? S : never;
