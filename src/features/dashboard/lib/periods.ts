import type { Period } from '@/types/strava';

export const PERIODS: { value: Period; label: string; description: string }[] = [
  { value: '30', label: '30 j', description: '30 derniers jours' },
  { value: '90', label: '90 j', description: '90 derniers jours' },
  { value: '365', label: '1 an', description: '12 derniers mois' },
  { value: 'all', label: 'Tout', description: 'depuis la première sortie' },
];

export const DEFAULT_PERIOD: Period = '365';

export const isPeriod = (v: string): v is Period => PERIODS.some((p) => p.value === v);

export const periodDescription = (p: Period) => PERIODS.find((x) => x.value === p)!.description;
