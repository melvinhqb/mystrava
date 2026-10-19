import type { ReactNode } from 'react';
import type { TileSize } from '@/components/ui';
import type { DashboardData, Period, Run } from '@/types/strava';
import { DistanceBucketsTile } from './components/DistanceBucketsTile';
import { DistanceTile } from './components/DistanceTile';
import { HeartRateTile } from './components/HeartRateTile';
import { MapTile } from './components/MapTile';
import { PaceTile } from './components/PaceTile';
import { ElevationKpi, MovingTimeKpi, RunCountKpi } from './components/PeriodKpis';
import { RecentRunsTile } from './components/RecentRunsTile';
import { RecordsTile } from './components/RecordsTile';
import { RegularityTile } from './components/RegularityTile';
import { TotalsTile } from './components/TotalsTile';
import { WeekdayTile } from './components/WeekdayTile';
import { parseMapView } from './lib/map';

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

/** Réglages propres à un emplacement (ex. la vue de la carte), modifiables en mode édition. */
export interface BlockSettings<O> {
  options: O | undefined;
  editing: boolean;
  /** Enregistre de nouveaux réglages, ou revient aux réglages par défaut avec undefined. */
  onOptionsChange: (options: O | undefined) => void;
}

export interface BlockDefinition<S extends TileSize = TileSize, O = never> {
  /** Nom affiché dans le catalogue des widgets. */
  label: string;
  /** Formats que le bloc sait afficher (colonnes:lignes) ; le premier est celui par défaut. */
  sizes: readonly [S, ...S[]];
  /** Relit des réglages sauvegardés (undefined s'ils sont invalides) ; seulement pour un bloc qui en a. */
  parseOptions?: (value: unknown) => O | undefined;
  render: (ctx: BlockContext, size: S, settings: BlockSettings<O>) => ReactNode;
}

const defineBlock = <S extends TileSize, O = never>(block: BlockDefinition<S, O>) => block;

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
  map: defineBlock({
    label: 'Carte des sorties',
    sizes: ['2:2', '1:1', '4:2'],
    parseOptions: parseMapView,
    render: (c, size, { options, editing, onOptionsChange }) => (
      <MapTile
        size={size}
        runs={c.runs}
        allRuns={c.all}
        home={c.data.athlete.cityCenter}
        view={options}
        editing={editing}
        onViewChange={onOptionsChange}
      />
    ),
  }),
  totals: defineBlock({
    label: 'Totaux',
    sizes: ['2:1'],
    render: (c, size) => <TotalsTile size={size} stats={c.data.stats} />,
  }),
};

export type BlockId = keyof typeof blocks;

/** Formats disponibles pour un bloc donné. */
export type BlockSize<K extends BlockId> = (typeof blocks)[K]['sizes'][number];

/** Réglages d'un bloc donné (never s'il n'en a pas). */
export type BlockOptions<K extends BlockId> = NonNullable<Parameters<(typeof blocks)[K]['render']>[2]['options']>;
