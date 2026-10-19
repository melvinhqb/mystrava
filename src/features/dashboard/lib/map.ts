import type { LatLng } from '@/types/strava';

/** Côté d'une tuile de fond de carte, en pixels CSS. */
export const TILE = 256;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 17;
/** Zoom par défaut : une ville et ses environs. */
export const DEFAULT_ZOOM = 12;

/** Vue de la carte choisie en mode personnalisation. */
export interface MapView {
  center: LatLng;
  zoom: number;
}

const MAX_LAT = 85.0511; // au-delà, la projection de Mercator diverge

export const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(z)));

/** Position en pixels « monde » au niveau `zoom` (projection Web Mercator, comme les fonds de carte). */
export function project([lat, lng]: LatLng, zoom: number): [number, number] {
  const scale = TILE * 2 ** zoom;
  const s = Math.sin((Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180);
  return [((lng + 180) / 360) * scale, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale];
}

/** Inverse de `project` ; la longitude est ramenée dans [-180, 180[. */
export function unproject([x, y]: [number, number], zoom: number): LatLng {
  const scale = TILE * 2 ** zoom;
  const lat = (Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / scale)) * 180) / Math.PI;
  const lng = (((((x / scale) * 360) % 360) + 360) % 360) - 180;
  return [Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)), lng];
}

/** Zoom et côté (en pixels) des cases utilisées pour repérer la zone la plus parcourue : environ 3 km. */
const CLUSTER_ZOOM = DEFAULT_ZOOM;
const CLUSTER_CELL = 128;

/**
 * Centre de la zone la plus parcourue, null sans tracé. Les tracés sont répartis dans une grille ;
 * chaque case compte les sorties qui la traversent, et la fenêtre de 3 × 3 cases (environ 9 km, la taille
 * de la carte au zoom par défaut) qui en totalise le plus l'emporte. Le centre est la moyenne de ses points.
 */
export function densestCenter(tracks: LatLng[][]): LatLng | null {
  const cells = new Map<string, { runs: number; x: number; y: number; n: number }>();
  for (const track of tracks) {
    const seen = new Set<string>();
    for (const p of track) {
      const [x, y] = project(p, CLUSTER_ZOOM);
      const key = `${Math.floor(x / CLUSTER_CELL)},${Math.floor(y / CLUSTER_CELL)}`;
      let cell = cells.get(key);
      if (!cell) cells.set(key, (cell = { runs: 0, x: 0, y: 0, n: 0 }));
      cell.x += x;
      cell.y += y;
      cell.n++;
      if (!seen.has(key)) {
        seen.add(key);
        cell.runs++;
      }
    }
  }

  let best: [number, number] | null = null;
  let bestRuns = 0;
  for (const key of cells.keys()) {
    const [i, j] = key.split(',').map(Number);
    let [runs, x, y, n] = [0, 0, 0, 0];
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const cell = cells.get(`${i + di},${j + dj}`);
        if (!cell) continue;
        runs += cell.runs;
        x += cell.x;
        y += cell.y;
        n += cell.n;
      }
    }
    if (runs > bestRuns) {
      bestRuns = runs;
      best = [x / n, y / n];
    }
  }
  return best && unproject(best, CLUSTER_ZOOM);
}

const isLatLng = (v: unknown): v is LatLng =>
  Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)) && Math.abs(v[0]) <= 90;

/** Relit une vue sauvegardée ; undefined si elle est invalide. */
export function parseMapView(value: unknown): MapView | undefined {
  const v = value as Partial<MapView> | null;
  if (!v || !isLatLng(v.center) || typeof v.zoom !== 'number') return undefined;
  return { center: [v.center[0], v.center[1]], zoom: clampZoom(v.zoom) };
}
