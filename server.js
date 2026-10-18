// Serveur MyStrava : OAuth Strava + proxy API + fichiers statiques.
// Aucune dépendance : Node.js >= 18 (fetch natif).

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const PUBLIC_DIR = path.join(__dirname, 'public');
const STRAVA_API = 'https://www.strava.com/api/v3';
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);
const MAX_PAGES = 10; // 10 x 200 activités, pour rester sous les limites de l'API
const CACHE_TTL = 10 * 60 * 1000;

// sid -> { tokens, athlete, cache: { runs, stats, at } }
const sessions = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookie(name, value, maxAge) {
  const secure = BASE_URL.startsWith('https') ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function redirect(res, location, cookies = []) {
  res.writeHead(302, { Location: location, 'Set-Cookie': cookies });
  res.end();
}

async function tokenRequest(params) {
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
  });
  if (!r.ok) throw new Error(`Échec OAuth Strava (${r.status})`);
  return r.json();
}

async function accessToken(session) {
  // Strava renvoie expires_at en secondes ; on rafraîchit une minute avant.
  if (session.tokens.expires_at * 1000 - 60_000 < Date.now()) {
    const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: session.tokens.refresh_token });
    session.tokens = { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at };
  }
  return session.tokens.access_token;
}

async function stravaGet(session, endpoint) {
  const r = await fetch(STRAVA_API + endpoint, {
    headers: { Authorization: `Bearer ${await accessToken(session)}` },
  });
  if (r.status === 429) throw Object.assign(new Error('Limite de requêtes Strava atteinte, réessayez dans 15 minutes.'), { status: 429 });
  if (!r.ok) throw Object.assign(new Error(`Erreur API Strava (${r.status})`), { status: r.status });
  return r.json();
}

async function fetchRuns(session) {
  const runs = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await stravaGet(session, `/athlete/activities?per_page=200&page=${page}`);
    for (const a of batch) {
      if (!RUN_TYPES.has(a.sport_type || a.type)) continue;
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
  return runs;
}

async function handleApi(req, res, url, session) {
  if (!session) return json(res, 401, { error: 'Non connecté' });

  if (url.pathname === '/api/dashboard') {
    const fresh = url.searchParams.has('refresh');
    if (fresh || !session.cache || Date.now() - session.cache.at > CACHE_TTL) {
      const [runs, stats] = await Promise.all([
        fetchRuns(session),
        stravaGet(session, `/athletes/${session.athlete.id}/stats`),
      ]);
      session.cache = { runs, stats, at: Date.now() };
    }
    const a = session.athlete;
    return json(res, 200, {
      athlete: { firstname: a.firstname, lastname: a.lastname, profile: a.profile_medium || a.profile, city: a.city },
      stats: {
        all: session.cache.stats.all_run_totals,
        ytd: session.cache.stats.ytd_run_totals,
        recent: session.cache.stats.recent_run_totals,
      },
      runs: session.cache.runs,
      fetchedAt: session.cache.at,
    });
  }
  json(res, 404, { error: 'Introuvable' });
}

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return json(res, 403, { error: 'Interdit' });
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: 'Introuvable' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const cookies = parseCookies(req);
  const session = sessions.get(cookies.sid);

  try {
    if (url.pathname === '/auth/config') {
      return json(res, 200, { configured: Boolean(CLIENT_ID && CLIENT_SECRET), connected: Boolean(session) });
    }

    if (url.pathname === '/auth/login') {
      if (!CLIENT_ID || !CLIENT_SECRET) return json(res, 500, { error: 'STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET manquants' });
      const state = crypto.randomBytes(16).toString('hex');
      const auth = new URL('https://www.strava.com/oauth/authorize');
      auth.search = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: `${BASE_URL}/auth/callback`,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'read,activity:read_all',
        state,
      });
      return redirect(res, auth.toString(), [cookie('oauth_state', state, 600)]);
    }

    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      if (!code || url.searchParams.get('state') !== cookies.oauth_state) return redirect(res, '/?error=auth');
      const t = await tokenRequest({ code, grant_type: 'authorization_code' });
      const sid = crypto.randomBytes(24).toString('hex');
      sessions.set(sid, {
        tokens: { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at },
        athlete: t.athlete,
      });
      return redirect(res, '/', [cookie('sid', sid, 30 * 24 * 3600), cookie('oauth_state', '', 0)]);
    }

    if (url.pathname === '/auth/logout') {
      sessions.delete(cookies.sid);
      return redirect(res, '/', [cookie('sid', '', 0)]);
    }

    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url, session);

    serveStatic(res, url.pathname);
  } catch (err) {
    console.error(err);
    json(res, err.status === 429 ? 429 : 502, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`MyStrava sur ${BASE_URL}`);
  if (!CLIENT_ID || !CLIENT_SECRET) console.log('⚠  Identifiants Strava absents : seul le mode démo est disponible (voir .env.example).');
});
