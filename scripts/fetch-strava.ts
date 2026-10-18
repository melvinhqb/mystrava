// Récupère mes courses sur l'API Strava et les écrit dans public/data.json (lu par la page publique).
// Exécuté avant le build par .github/workflows/deploy.yml : le fichier n'est jamais commité.
// Usage : npm run sync (ou npx tsx scripts/fetch-strava.ts [fichier de sortie]).

import { writeFile } from 'node:fs/promises';
import type { RawRun, StravaData, Totals } from '../src/types/strava.ts';

// Sous-ensemble des réponses de l'API Strava utilisé ici.
interface TokenResponse { access_token: string; refresh_token?: string }
interface StravaAthlete { id: number; firstname: string; lastname: string; profile: string; profile_medium?: string; city: string | null }
interface StravaStats { all_run_totals: Totals; ytd_run_totals: Totals; recent_run_totals: Totals }
interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
  has_heartrate: boolean;
  average_heartrate?: number;
  kudos_count: number;
}

// En local, les secrets peuvent être placés dans .env (voir .env.example).
// Les variables déjà définies (secrets de la GitHub Action) ne sont pas écrasées.
try {
  process.loadEnvFile();
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;
const OUTPUT = process.argv[2] || 'public/data.json';
const API = 'https://www.strava.com/api/v3';
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);
const MAX_PAGES = 10; // 10 × 200 activités, pour rester sous les limites de l'API

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
  console.error('Secrets manquants : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET et STRAVA_REFRESH_TOKEN sont requis.');
  process.exit(1);
}

async function accessToken(): Promise<string> {
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: STRAVA_REFRESH_TOKEN,
    }),
  });
  if (!r.ok) throw new Error(`Échec du rafraîchissement du jeton Strava (${r.status}) : ${await r.text()}`);
  const t = (await r.json()) as TokenResponse;
  if (t.refresh_token && t.refresh_token !== STRAVA_REFRESH_TOKEN) {
    console.warn('::warning::Strava a renvoyé un nouveau refresh token : mettez à jour le secret STRAVA_REFRESH_TOKEN.');
  }
  return t.access_token;
}

async function main() {
  const token = await accessToken();
  const get = async <T>(endpoint: string): Promise<T> => {
    const r = await fetch(API + endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Erreur API Strava sur ${endpoint} (${r.status}) : ${await r.text()}`);
    return (await r.json()) as T;
  };

  const athlete = await get<StravaAthlete>('/athlete');
  const stats = await get<StravaStats>(`/athletes/${athlete.id}/stats`);

  const runs: RawRun[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await get<StravaActivity[]>(`/athlete/activities?per_page=200&page=${page}`);
    for (const a of batch) {
      if (!RUN_TYPES.has(a.sport_type || a.type)) continue;
      // Seuls les champs utiles à l'affichage sont publiés (pas de tracé GPS ni de position).
      runs.push({
        id: a.id,
        name: a.name,
        type: a.sport_type || a.type,
        date: a.start_date_local,
        distance: a.distance,
        moving_time: a.moving_time,
        elevation: a.total_elevation_gain,
        average_speed: a.average_speed,
        average_heartrate: a.has_heartrate ? (a.average_heartrate ?? null) : null,
        kudos: a.kudos_count,
      });
    }
    if (batch.length < 200) break;
  }

  const data: StravaData = {
    athlete: {
      id: athlete.id,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profile: athlete.profile_medium || athlete.profile,
      city: athlete.city,
    },
    stats: { all: stats.all_run_totals, ytd: stats.ytd_run_totals, recent: stats.recent_run_totals },
    runs,
    fetchedAt: Date.now(),
  };
  await writeFile(OUTPUT, JSON.stringify(data, null, 1) + '\n');
  console.log(`${runs.length} sorties écrites dans ${OUTPUT}`);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
