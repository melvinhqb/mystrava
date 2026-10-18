import { localDate } from '@/lib/dates';
import type { DashboardData, StravaData } from '@/types/strava';

// data.json est généré au déploiement par scripts/fetch-strava.ts et n'est jamais commité.
// `no-cache` : le navigateur garde sa copie en cache mais la revalide (ETag) à chaque visite.
const DATA_URL = `${import.meta.env.BASE_URL}data.json`;

/** Charge data.json ; null s'il n'a pas encore été généré. */
export async function fetchStravaData(): Promise<StravaData | null> {
  const r = await fetch(DATA_URL, { cache: 'no-cache' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Impossible de charger les données (${r.status})`);
  // Le serveur de dev Vite répond index.html (200) pour un fichier absent : on le traite comme un 404.
  if (!r.headers.get('content-type')?.includes('json')) return null;
  return r.json();
}

/** Ajoute la date locale de chaque sortie et les trie de la plus récente à la plus ancienne. */
export function toDashboardData(data: StravaData): DashboardData {
  const runs = data.runs
    .map((r) => ({ ...r, startDate: localDate(r.date) }))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  return { ...data, runs };
}
