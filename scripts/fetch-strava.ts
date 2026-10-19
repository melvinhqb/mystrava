// Récupère mes courses sur l'API Strava et les écrit dans public/data.json (lu par la page publique).
// Exécuté avant le build par .github/workflows/deploy.yml, et périodiquement par le serveur de l'image
// Docker (scripts/server.ts) : le fichier n'est jamais commité.
// Usage : npm run sync (ou npx tsx scripts/fetch-strava.ts [fichier de sortie]).

import { rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { decodePolyline, encodePolyline, trimEnds } from '../src/lib/polyline.ts';
import type { LatLng, RawRun, StravaData, Totals } from '../src/types/strava.ts';

// Sous-ensemble des réponses de l'API Strava utilisé ici.
interface TokenResponse { access_token: string; refresh_token?: string }
interface StravaAthlete { id: number; firstname: string; lastname: string; profile: string; profile_medium?: string; city: string | null; state?: string | null; country?: string | null }
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
  private?: boolean;
  map?: { summary_polyline?: string | null };
}

// En local, les secrets peuvent être placés dans .env (voir .env.example).
// Les variables déjà définies (secrets de la GitHub Action, variables du conteneur) ne sont pas écrasées.
try {
  process.loadEnvFile();
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;
const API = 'https://www.strava.com/api/v3';
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);
const MAX_PAGES = 10; // 10 × 200 activités, pour rester sous les limites de l'API
/** Distance retirée au début et à la fin de chaque tracé publié, pour ne pas révéler les lieux de départ. */
const TRIM_METERS = 300;

/** Les trois secrets Strava sont-ils définis ? */
export const hasStravaSecrets = () => Boolean(STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET && STRAVA_REFRESH_TOKEN);

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

/** Tracé publiable d'une activité : rogné aux extrémités, jamais pour une activité privée. */
function publicPolyline(a: StravaActivity): string | undefined {
  const encoded = a.map?.summary_polyline;
  if (a.private || !encoded) return undefined;
  const points = trimEnds(decodePolyline(encoded), TRIM_METERS);
  return points.length ? encodePolyline(points) : undefined;
}

/** Centre de la ville du profil, via Nominatim (OpenStreetMap) ; null si introuvable. Repli de la carte sans tracé. */
async function geocodeCity(athlete: StravaAthlete): Promise<LatLng | null> {
  if (!athlete.city) return null;
  const query = [athlete.city, athlete.state, athlete.country].filter(Boolean).join(', ');
  try {
    // featureType=city : seulement des villes ou villages (sans lui, « Cergy-Pontoise » donne une université).
    const params = new URLSearchParams({ format: 'json', limit: '1', featureType: 'city', q: query });
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'mystrava (https://github.com/melvinhqb/mystrava)' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const [place] = (await r.json()) as { lat: string; lon: string }[];
    return place ? [Number(place.lat), Number(place.lon)] : null;
  } catch (err) {
    console.warn(`::warning::Ville « ${query} » introuvable (${(err as Error).message}).`);
    return null;
  }
}

/** Écrit les données Strava dans `output` et renvoie le nombre de sorties. */
export async function syncStrava(output: string): Promise<number> {
  if (!hasStravaSecrets()) {
    throw new Error('Secrets manquants : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET et STRAVA_REFRESH_TOKEN sont requis.');
  }
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
      // Seuls les champs utiles à l'affichage sont publiés : le tracé est rogné, la position de départ omise.
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
        polyline: publicPolyline(a),
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
      cityCenter: await geocodeCity(athlete),
    },
    stats: { all: stats.all_run_totals, ytd: stats.ytd_run_totals, recent: stats.recent_run_totals },
    runs,
    fetchedAt: Date.now(),
  };
  // Écriture puis renommage : le serveur ne sert jamais un fichier à moitié écrit.
  await writeFile(`${output}.tmp`, JSON.stringify(data, null, 1) + '\n');
  await rename(`${output}.tmp`, output);
  return runs.length;
}

// Exécuté directement (et non importé par le serveur) : synchronise une fois puis s'arrête.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[2] || 'public/data.json';
  syncStrava(output)
    .then((count) => console.log(`${count} sorties écrites dans ${output}`))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
