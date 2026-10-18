// Récupère mes courses sur l'API Strava et les écrit dans data.json (lu par la page publique).
// Exécuté par la GitHub Action .github/workflows/strava.yml avec les secrets du dépôt.
// Node.js >= 18, sans dépendance.

import { readFile, writeFile } from 'node:fs/promises';

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;
const OUTPUT = process.argv[2] || 'data.json';
const API = 'https://www.strava.com/api/v3';
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);
const MAX_PAGES = 10; // 10 × 200 activités, pour rester sous les limites de l'API
// Les meilleurs temps (400 m, 1 km, 5 km…) ne sont fournis que par le détail de chaque activité :
// une requête par sortie, plafonnée par exécution pour rester sous 100 requêtes / 15 min.
const DETAIL_BUDGET = Number(process.env.STRAVA_DETAIL_BUDGET) || 80;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
  console.error('Secrets manquants : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET et STRAVA_REFRESH_TOKEN sont requis.');
  process.exit(1);
}

async function accessToken() {
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
  const t = await r.json();
  if (t.refresh_token && t.refresh_token !== STRAVA_REFRESH_TOKEN) {
    console.warn('::warning::Strava a renvoyé un nouveau refresh token : mettez à jour le secret STRAVA_REFRESH_TOKEN.');
  }
  return t.access_token;
}

// Meilleurs temps déjà connus, repris du data.json précédent : id d'activité → { "5K": secondes, … }.
async function previousEfforts() {
  try {
    const previous = JSON.parse(await readFile(OUTPUT, 'utf8'));
    return new Map(previous.runs.filter((r) => r.efforts).map((r) => [r.id, r.efforts]));
  } catch {
    return new Map();
  }
}

async function main() {
  const token = await accessToken();
  const get = async (endpoint) => {
    const r = await fetch(API + endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      throw Object.assign(new Error(`Erreur API Strava sur ${endpoint} (${r.status}) : ${await r.text()}`), { status: r.status });
    }
    return r.json();
  };

  const athlete = await get('/athlete');
  const stats = await get(`/athletes/${athlete.id}/stats`);

  const runs = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await get(`/athlete/activities?per_page=200&page=${page}`);
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
        average_heartrate: a.has_heartrate ? a.average_heartrate : null,
        kudos: a.kudos_count,
      });
    }
    if (batch.length < 200) break;
  }

  // Récupère les meilleurs temps des sorties pas encore analysées, des plus récentes aux plus anciennes.
  const known = await previousEfforts();
  let fetched = 0;
  let limited = false;
  for (const run of runs) {
    if (known.has(run.id)) {
      run.efforts = known.get(run.id);
      continue;
    }
    if (limited || fetched >= DETAIL_BUDGET) continue;
    try {
      const detail = await get(`/activities/${run.id}`);
      fetched++;
      run.efforts = Object.fromEntries((detail.best_efforts || []).map((e) => [e.name, e.elapsed_time]));
    } catch (err) {
      if (err.status !== 429) throw err;
      console.warn('::warning::Limite de requêtes Strava atteinte : la suite des meilleurs temps sera récupérée à la prochaine exécution.');
      limited = true;
    }
  }
  const pending = runs.filter((r) => !r.efforts).length;
  console.log(`Meilleurs temps : ${fetched} sorties analysées, ${pending} restantes.`);

  const data = {
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

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
