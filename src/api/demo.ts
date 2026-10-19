// Données de démonstration : ~2 ans de course à pied générés de façon déterministe,
// au même format que data.json. Utilisées en dev quand data.json est absent, et par les stories Storybook.

import { encodePolyline } from '@/lib/polyline';
import type { LatLng, RawRun, StravaData, Totals } from '@/types/strava';

const PARIS: LatLng = [48.8566, 2.3522];
/** Points de départ des tracés de démo : centre, bois de Boulogne, bois de Vincennes, parc de Saint-Cloud. */
const SPOTS: LatLng[] = [[48.853, 2.345], [48.862, 2.25], [48.835, 2.435], [48.84, 2.215]];

/** Boucle de démo d'environ `meters` autour d'un des SPOTS, de forme irrégulière. */
function demoRoute(meters: number, rand: () => number): string {
  const [lat0, lng0] = SPOTS[Math.floor(rand() * SPOTS.length)];
  const radius = meters / (2 * Math.PI);
  const angle = rand() * 2 * Math.PI;
  const [k1, k2, p1, p2] = [0.15 + rand() * 0.25, rand() * 0.15, rand() * 6, rand() * 6];
  // Le départ est sur la boucle : son centre est décalé d'un rayon dans la direction `angle`.
  const cy = Math.sin(angle) * radius;
  const cx = Math.cos(angle) * radius;
  const mPerLat = 111320;
  const mPerLng = mPerLat * Math.cos((lat0 * Math.PI) / 180);
  const points: LatLng[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = angle + Math.PI + (i / 80) * 2 * Math.PI;
    const r = radius * (1 + k1 * Math.sin(3 * (t - angle - Math.PI) + p1) * Math.sin((t - angle - Math.PI) / 2) + k2 * Math.sin(7 * t + p2));
    points.push([lat0 + (cy + Math.sin(t) * r) / mPerLat, lng0 + (cx + Math.cos(t) * r) / mPerLng]);
  }
  return encodePolyline(points);
}

export function makeDemoData(): StravaData {
  let seed = 42;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const names = {
    easy: ['Footing du matin', 'Sortie tranquille', 'Récup en endurance', 'Footing bords de Seine', 'Petit tour du parc'],
    tempo: ['Tempo run', 'Allure seuil', 'Fractionné 6×1000 m', 'VMA 10×400 m', 'Côtes'],
    long: ['Sortie longue', 'Sortie longue du dimanche', 'Long run en forêt', 'Prépa semi'],
    race: ['Course 10 km', 'Semi-marathon', 'Trail des Crêtes'],
  };
  const pick = (list: string[]) => list[Math.floor(rand() * list.length)];
  const pad = (n: number) => String(n).padStart(2, '0');

  const runs: RawRun[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = 730;
  let id = 9000000000;

  for (let d = days; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dow = date.getDay();
    const progress = 1 - d / days; // 0 → 1 : on progresse au fil du temps
    const winter = [11, 0, 1].includes(date.getMonth()) ? 0.15 : 0;
    const chance = ({ 0: 0.85, 2: 0.6, 4: 0.6, 6: 0.35 } as Record<number, number>)[dow] ?? 0.12;
    if (rand() > chance - winter) continue;

    let kind: keyof typeof names = 'easy';
    if (dow === 0) kind = rand() < 0.08 ? 'race' : 'long';
    else if (dow === 2 || dow === 4) kind = rand() < 0.55 ? 'tempo' : 'easy';

    const base = { easy: 7, tempo: 9, long: 14 + progress * 6, race: rand() < 0.6 ? 10 : 21.1 }[kind];
    const km = kind === 'race' ? base : Math.max(3, base + (rand() - 0.5) * 4);
    const paceBase = 345 - progress * 25; // s/km
    const pace = paceBase + { easy: 20, tempo: -25, long: 15, race: -35 }[kind] + (rand() - 0.5) * 20;
    const hilly = rand() < 0.15;
    const hour = dow === 0 || dow === 6 ? 8 + Math.floor(rand() * 3) : rand() < 0.5 ? 7 : 19;

    runs.push({
      id: id++,
      name: kind === 'race' && km > 20 ? 'Semi-marathon' : pick(names[kind]),
      type: hilly ? 'TrailRun' : 'Run',
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(Math.floor(rand() * 60))}:00Z`,
      distance: Math.round(km * 1000),
      moving_time: Math.round(km * pace),
      elevation: Math.round(km * (hilly ? 35 + rand() * 30 : 4 + rand() * 8)),
      average_speed: 1000 / pace,
      average_heartrate: Math.round(145 + { easy: -8, tempo: 12, long: 0, race: 18 }[kind] + (rand() - 0.5) * 10),
      kudos: Math.floor(rand() * 25),
    });
  }
  runs.reverse(); // plus récentes d'abord, comme l'API Strava

  // Tracés générés avec leur propre suite aléatoire, pour ne pas modifier les autres données.
  let routeSeed = 7;
  const routeRand = (): number => {
    routeSeed = (routeSeed * 1664525 + 1013904223) % 4294967296;
    return routeSeed / 4294967296;
  };
  for (const run of runs) run.polyline = demoRoute(run.distance, routeRand);

  const totals = (list: RawRun[]): Totals => ({
    count: list.length,
    distance: list.reduce((s, r) => s + r.distance, 0),
    moving_time: list.reduce((s, r) => s + r.moving_time, 0),
    elevation_gain: list.reduce((s, r) => s + r.elevation, 0),
  });
  const since = (n: number) => runs.filter((r) => Date.now() - new Date(r.date.slice(0, 10)).getTime() < n * 86400000);
  const yearStart = `${today.getFullYear()}-01-01`;

  return {
    athlete: { firstname: 'Coureur', lastname: 'Démo', profile: null, city: 'Paris', cityCenter: PARIS },
    stats: {
      all: totals(runs),
      ytd: totals(runs.filter((r) => r.date >= yearStart)),
      recent: totals(since(28)),
    },
    runs,
    fetchedAt: Date.now(),
    demo: true,
  };
}
