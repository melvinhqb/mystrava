// Jeux de données partagés par les stories.

import { makeDemoData } from '@/api/demo';
import { toDashboardData } from '@/api/strava';
import type { DashboardData, Run } from '@/types/strava';

export const demoData: DashboardData = toDashboardData(makeDemoData());

/** Toutes les sorties de démo, plus récentes d'abord (~2 ans). */
export const demoRuns: Run[] = demoData.runs;

/** Sorties des `days` derniers jours. */
export const lastDays = (days: number, runs = demoRuns) =>
  runs.filter((r) => r.startDate.getTime() >= Date.now() - days * 86400000);

/** Sorties sans fréquence cardiaque. */
export const withoutHeartRate = (runs: Run[]) => runs.map((r) => ({ ...r, average_heartrate: null }));
