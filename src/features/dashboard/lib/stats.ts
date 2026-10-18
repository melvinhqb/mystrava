// Calculs du tableau de bord : fonctions pures, sans dépendance au DOM.

import { addDays, DAY, dayKey, startOfWeek, weekKey } from '@/lib/dates';
import type { Period, Run } from '@/types/strava';

export interface PeriodBounds {
  start: number;
  end: number;
  prevStart: number | null;
}

export const sum = (runs: Run[], key: 'distance' | 'moving_time' | 'elevation') =>
  runs.reduce((s, r) => s + r[key], 0);

/** Allure moyenne (s/km) d'un ensemble de sorties, NaN si vide. */
export function paceOf(runs: Run[]): number {
  const d = sum(runs, 'distance');
  return d ? sum(runs, 'moving_time') / (d / 1000) : NaN;
}

export function periodBounds(period: Period, now = Date.now()): PeriodBounds {
  if (period === 'all') return { start: -Infinity, end: now, prevStart: null };
  const days = Number(period);
  return { start: now - days * DAY, end: now, prevStart: now - 2 * days * DAY };
}

/** Sorties de la période et de la période précédente (null pour « Tout »). */
export function splitByPeriod(all: Run[], bounds: PeriodBounds) {
  const runs = all.filter((r) => r.startDate.getTime() >= bounds.start);
  const prevRuns = bounds.prevStart === null
    ? null
    : all.filter((r) => r.startDate.getTime() >= bounds.prevStart! && r.startDate.getTime() < bounds.start);
  return { runs, prevRuns };
}

/** Durée couverte par la période, en jours (au moins une semaine). */
export function periodSpanDays(runs: Run[], bounds: PeriodBounds): number {
  const first = runs.length ? runs[runs.length - 1].startDate.getTime() : bounds.end;
  return Math.max(7, (bounds.end - (isFinite(bounds.start) ? bounds.start : first)) / DAY);
}

export interface WeekTotal {
  start: Date;
  distance: number;
  runs: number;
}

/** Totaux des `count` dernières semaines (lundi → dimanche), la plus ancienne d'abord. */
export function weeklyTotals(runs: Run[], count: number, now = new Date()): WeekTotal[] {
  const current = startOfWeek(now);
  const weeks: WeekTotal[] = [];
  for (let i = count - 1; i >= 0; i--) weeks.push({ start: addDays(current, -i * 7), distance: 0, runs: 0 });
  const byKey = new Map(weeks.map((w) => [w.start.getTime(), w]));
  for (const r of runs) {
    const w = byKey.get(weekKey(r.startDate));
    if (w) { w.distance += r.distance; w.runs++; }
  }
  return weeks;
}

/** Semaines consécutives avec au moins une sortie : série en cours et record. */
export function streaks(runs: Run[], now = new Date()) {
  const weeks = new Set(runs.map((r) => weekKey(r.startDate)));
  const shift = (t: number, n: number) => startOfWeek(addDays(t, n * 7)).getTime();

  // La semaine en cours compte si elle a déjà une sortie, sinon la série démarre la semaine précédente.
  let cursor = weekKey(now);
  if (!weeks.has(cursor)) cursor = shift(cursor, -1);
  let current = 0;
  while (weeks.has(cursor)) { current++; cursor = shift(cursor, -1); }

  let best = 0;
  for (const w of weeks) {
    if (weeks.has(shift(w, -1))) continue; // pas un début de série
    let len = 0;
    for (let t = w; weeks.has(t); t = shift(t, 1)) len++;
    best = Math.max(best, len);
  }
  return { current, best };
}

export interface MonthPace {
  date: Date;
  pace: number;
  count: number;
}

/** Allure moyenne des 12 derniers mois, le plus ancien d'abord. */
export function monthlyPace(runs: Run[], now = new Date()): MonthPace[] {
  const months: MonthPace[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = runs.filter((r) => r.startDate.getFullYear() === date.getFullYear() && r.startDate.getMonth() === date.getMonth());
    months.push({ date, pace: paceOf(inMonth), count: inMonth.length });
  }
  return months;
}

export function records(runs: Run[]) {
  if (!runs.length) return null;
  const maxBy = (list: Run[], f: (r: Run) => number) => list.reduce((a, b) => (f(b) > f(a) ? b : a));
  const fastPool = runs.filter((r) => r.distance >= 5000);
  const weeks = new Map<number, number>();
  for (const r of runs) weeks.set(weekKey(r.startDate), (weeks.get(weekKey(r.startDate)) ?? 0) + r.distance);
  const [bestWeekStart, bestWeekDistance] = [...weeks].reduce((a, b) => (b[1] > a[1] ? b : a));
  return {
    longest: maxBy(runs, (r) => r.distance),
    fastest: fastPool.length ? maxBy(fastPool, (r) => r.average_speed) : null,
    climb: maxBy(runs, (r) => r.elevation),
    bestWeek: { start: new Date(bestWeekStart), distance: bestWeekDistance },
  };
}

/** Fréquence cardiaque moyenne pondérée par la durée, null sans données. */
export function averageHeartRate(runs: Run[]) {
  const withHr = runs.filter((r) => r.average_heartrate);
  if (!withHr.length) return null;
  const time = sum(withHr, 'moving_time');
  const bpm = withHr.reduce((s, r) => s + r.average_heartrate! * r.moving_time, 0) / time;
  return { bpm, count: withHr.length };
}

/** Nombre de sorties par jour de la semaine, lundi d'abord. */
export function weekdayCounts(runs: Run[]): number[] {
  const counts = Array<number>(7).fill(0);
  for (const r of runs) counts[(r.startDate.getDay() + 6) % 7]++;
  return counts;
}

const BUCKETS = [
  { label: '<5', max: 5000 },
  { label: '5–10', max: 10000 },
  { label: '10–15', max: 15000 },
  { label: '15–21', max: 21000 },
  { label: '21+', max: Infinity },
];

export function distanceBuckets(runs: Run[]) {
  const buckets = BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const r of runs) buckets.find((b) => r.distance < b.max)!.count++;
  return buckets;
}

/** Distance courue par jour (clé : minuit local). */
export function distancePerDay(runs: Run[]): Map<number, number> {
  const perDay = new Map<number, number>();
  for (const r of runs) perDay.set(dayKey(r.startDate), (perDay.get(dayKey(r.startDate)) ?? 0) + r.distance);
  return perDay;
}

/** Niveau d'intensité 0–4 du calendrier selon la distance du jour. */
export const heatLevel = (m: number) => (!m ? 0 : m < 5000 ? 1 : m < 10000 ? 2 : m < 15000 ? 3 : 4);
