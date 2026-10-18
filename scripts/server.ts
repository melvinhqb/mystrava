// Serveur de l'image Docker : sert le build statique (dist/) et rafraîchit data.json périodiquement.
// Node.js >= 24 (exécute le TypeScript directement), sans dépendance.
// Variables : PORT (8080), STATIC_DIR (dist), SYNC_INTERVAL_HOURS (12) et les secrets STRAVA_*.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { hasStravaSecrets, syncStrava } from './fetch-strava.ts';

const PORT = Number(process.env.PORT) || 8080;
const ROOT = resolve(process.env.STATIC_DIR || 'dist');
const DATA_FILE = join(ROOT, 'data.json');
const SYNC_INTERVAL = (Number(process.env.SYNC_INTERVAL_HOURS) || 12) * 3600_000;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

// ---------- Synchronisation ----------

async function sync() {
  try {
    log(`Synchronisation Strava : ${await syncStrava(DATA_FILE)} sorties.`);
  } catch (err) {
    log(`Échec de la synchronisation Strava : ${(err as Error).message}`);
  }
}

let timer: NodeJS.Timeout | undefined;
if (hasStravaSecrets()) {
  void sync();
  timer = setInterval(sync, SYNC_INTERVAL);
} else {
  log('Secrets STRAVA_* absents : aucune synchronisation, la page affichera l\'écran d\'accueil.');
}

// ---------- Fichiers statiques ----------

// Les fichiers de assets/ ont un hash dans leur nom : ils peuvent être mis en cache indéfiniment.
const cacheControl = (path: string) =>
  path.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    let info = await stat(path);
    if (info.isDirectory()) {
      path = join(path, 'index.html');
      info = await stat(path);
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(path)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Last-Modified': info.mtime.toUTCString(),
      'Cache-Control': cacheControl(path),
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
  }
});

server.listen(PORT, () => log(`Serveur prêt sur le port ${PORT} (${ROOT}).`));

// Arrêt propre sur `docker stop` (le processus est PID 1 dans le conteneur).
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    log(`${signal} reçu, arrêt.`);
    clearInterval(timer);
    server.close(() => process.exit(0));
  });
}
