import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { Tile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { plural } from '@/lib/format';
import { decodePolyline } from '@/lib/polyline';
import type { LatLng, Run } from '@/types/strava';
import { drawHeat, heatPalette, heatStops, type HeatLayer } from '../lib/heatmap';
import { clampZoom, DEFAULT_ZOOM, densestCenter, MAX_ZOOM, MIN_ZOOM, project, TILE, unproject, type MapView } from '../lib/map';

export interface MapTileProps {
  /** Sorties dont les tracés (`polyline`) sont dessinés. */
  runs: Run[];
  /** Toutes les sorties : la carte se centre par défaut sur leur zone la plus parcourue (par défaut `runs`). */
  allRuns?: Run[];
  /** Centre de repli sans aucun tracé : la ville de l'athlète. */
  home?: LatLng | null;
  /** Vue choisie en mode personnalisation ; sinon centre par défaut au zoom 12. */
  view?: MapView;
  /**
   * La carte se déplace (glisser, flèches) et se zoome (molette, + −) dans tous les cas.
   * En mode personnalisation, la vue est enregistrée (`onViewChange`) ; sinon elle est seulement explorée,
   * et la molette ne zoome qu'avec Ctrl ou ⌘ pour laisser défiler la page.
   */
  editing?: boolean;
  /** Nouvelle vue choisie en mode personnalisation, ou undefined pour revenir au centre par défaut. */
  onViewChange?: (view: MapView | undefined) => void;
  /** Format de la tuile (colonnes:lignes) : small `1:1`, medium `2:2`, large `4:2`. */
  size?: '1:1' | '2:2' | '4:2';
}

const PARIS: LatLng = [48.8566, 2.3522];
/** Pixels parcourus par une flèche du clavier. */
const KEY_STEP = 80;
/** Cumul de molette déclenchant un cran de zoom (une molette de souris envoie ~100 par cran). */
const WHEEL_STEP = 100;
/** Durée d'affichage de l'aide « Ctrl + molette », en ms. */
const HINT_DELAY = 1500;

/** Fond de carte OpenStreetMap, sans clé d'API ; atténué (et inversé en thème sombre) par global.css. */
const tileUrl = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** Rayon de recherche du survol, en pixels CSS : les tracés ne font que 3 px de large. */
const HOVER_RADIUS = 4;

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
const subscribeDark = (cb: () => void) => {
  darkQuery?.addEventListener('change', cb);
  return () => darkQuery?.removeEventListener('change', cb);
};

const decodeTracks = (runs: Run[]) => runs.flatMap((r) => (r.polyline ? [decodePolyline(r.polyline)] : []));

/** Carte de mes passages : heatmap des tracés de la période, colorée selon le nombre de passages. */
export function MapTile({ runs, allRuns = runs, home, view, editing = false, onViewChange, size = '2:2' }: MapTileProps) {
  const [ref, { width: w, height: h }] = useElementSize();
  // Tracés en pixels « monde » au zoom 0 : il suffit ensuite de les mettre à l'échelle.
  const tracks = useMemo(() => decodeTracks(runs), [runs]);
  const world = useMemo(() => tracks.map((t) => t.map((p) => project(p, 0))), [tracks]);
  // Calculé sur toutes les sorties : le centre ne change pas avec la période.
  const fallback = useMemo(
    () => densestCenter(allRuns === runs ? tracks : decodeTracks(allRuns)) ?? home ?? PARIS,
    [allRuns, runs, tracks, home],
  );

  // Vue explorée hors personnalisation, jamais enregistrée : oubliée dès que la vue choisie
  // change ou que la personnalisation commence (elle porte la vue sur laquelle elle s'appuie).
  const [explored, setExplored] = useState<{ view: MapView; base: MapView | undefined } | null>(null);
  const local = !editing && explored && explored.base === view ? explored.view : null;
  // Centre en cours de glisser-déplacer, appliqué au relâchement.
  const [draft, setDraft] = useState<LatLng | null>(null);
  const drag = useRef<{ x: number; y: number; center: [number, number] } | null>(null);
  const [hint, setHint] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number; count: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const layer = useRef<HeatLayer | null>(null);
  const [maxCount, setMaxCount] = useState(0);
  const [palette, setPalette] = useState<string[]>([]);
  // La palette --heat-* change avec le thème : on redessine alors la heatmap.
  const dark = useSyncExternalStore(subscribeDark, () => darkQuery?.matches ?? false, () => false);
  const current = local ?? view;
  const zoom = current?.zoom ?? DEFAULT_ZOOM;
  const center = draft ?? current?.center ?? fallback;
  const [cx, cy] = project(center, zoom);
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(cy - h / 2);

  const commit = (next: MapView) => (editing ? onViewChange?.(next) : setExplored({ view: next, base: view }));
  const canReset = editing ? Boolean(view) : Boolean(local);
  const reset = () => (editing ? onViewChange?.(undefined) : setExplored(null));
  /** Zoome d'un cran en gardant fixe le point (ax, ay) de la tuile, le centre par défaut. */
  const zoomBy = (dz: 1 | -1, ax = w / 2, ay = h / 2) => {
    const z = clampZoom(zoom + dz);
    if (z === zoom) return;
    const k = 2 ** (z - zoom);
    commit({ zoom: z, center: unproject([(x0 + ax) * k - ax + w / 2, (y0 + ay) * k - ay + h / 2], z) });
  };
  const panBy = (dx: number, dy: number) => commit({ zoom, center: unproject([cx + dx, cy + dy], zoom) });

  // Molette : écouteur natif, car React enregistre `wheel` en passif (preventDefault y est ignoré).
  const zoomByRef = useRef(zoomBy);
  useEffect(() => { zoomByRef.current = zoomBy; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      // Hors personnalisation, la molette seule fait défiler la page.
      if (!editing && !e.ctrlKey && !e.metaKey) {
        setHint(true);
        return;
      }
      e.preventDefault();
      setHint(false);
      // Pincement sur pavé tactile : ctrlKey et petits écarts ; Firefox compte parfois en lignes.
      acc += e.deltaY * (e.deltaMode === 1 ? 33 : 1) * (e.ctrlKey ? 10 : 1);
      if (Math.abs(acc) < WHEEL_STEP) return;
      const rect = el.getBoundingClientRect();
      zoomByRef.current(acc < 0 ? 1 : -1, e.clientX - rect.left, e.clientY - rect.top);
      acc = 0;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [editing, ref]);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), HINT_DELAY);
    return () => clearTimeout(t);
  }, [hint]);

  const pointer = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, center: [cx, cy] };
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const count = countAt(x, y);
        setHover(count ? { x, y, count } : null);
        return;
      }
      setHover(null);
      setDraft(unproject([d.center[0] - (e.clientX - d.x), d.center[1] - (e.clientY - d.y)], zoom));
    },
    onPointerUp: () => {
      if (draft) commit({ zoom, center: draft });
      drag.current = null;
      setDraft(null);
    },
    onPointerLeave: () => setHover(null),
    onPointerCancel: () => {
      drag.current = null;
      setDraft(null);
    },
    // Empêche la sélection de texte et, en personnalisation, le glisser-déposer de la tuile entière.
    onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault(),
    onKeyDown: (e: KeyboardEvent) => {
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP],
      };
      if (moves[e.key]) panBy(...moves[e.key]);
      else if (e.key === '+' || e.key === '=') zoomBy(1);
      else if (e.key === '-') zoomBy(-1);
      else return;
      e.preventDefault();
    },
    tabIndex: 0,
    role: 'application',
    'aria-roledescription': 'carte',
    'aria-label': `Carte de ${plural(tracks.length, 'tracé')} : glisser ou flèches pour déplacer, ${editing ? 'molette' : 'Ctrl + molette'} ou + − pour zoomer`,
  };

  const tiles = [];
  const n = 2 ** zoom;
  if (w > 0) {
    for (let ty = Math.max(0, Math.floor(y0 / TILE)); ty <= Math.min(n - 1, Math.floor((y0 + h) / TILE)); ty++) {
      for (let tx = Math.floor(x0 / TILE); tx <= Math.floor((x0 + w) / TILE); tx++) {
        const x = ((tx % n) + n) % n;
        const style = { left: tx * TILE - x0, top: ty * TILE - y0 };
        tiles.push(
          <img key={`${tx}/${ty}`} className="map-img" src={tileUrl(zoom, x, ty)} style={style} alt="" draggable={false} />,
        );
      }
    }
  }

  // Heatmap redessinée à chaque changement de vue, de taille, de tracés ou de thème.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || w === 0) return;
    scratch.current ??= document.createElement('canvas');
    // Les points à moins d'un pixel du précédent sont ignorés : moins de segments aux petits zooms.
    const scale = 2 ** zoom;
    const pixels = world.map((track) => {
      const out: [number, number][] = [];
      let [px, py] = [Infinity, Infinity];
      for (const [wx, wy] of track) {
        const x = wx * scale - x0;
        const y = wy * scale - y0;
        if (Math.abs(x - px) < 1 && Math.abs(y - py) < 1) continue;
        out.push([x, y]);
        [px, py] = [x, y];
      }
      return out;
    });
    const colors = heatPalette(canvas);
    layer.current = drawHeat(canvas, scratch.current, pixels, heatStops(colors), Math.min(2, devicePixelRatio || 1));
    setMaxCount(layer.current.max);
    setPalette((prev) => (prev.join() === colors.join() ? prev : colors));
  }, [world, zoom, x0, y0, w, h, dark]);

  /** Plus grand nombre de passages autour du point (x, y) de la carte, en pixels CSS. */
  const countAt = (x: number, y: number) => {
    const l = layer.current;
    if (!l) return 0;
    const dpr = l.width / w;
    const height = l.counts.length / l.width;
    let best = 0;
    for (let dy = -HOVER_RADIUS; dy <= HOVER_RADIUS; dy++) {
      for (let dx = -HOVER_RADIUS; dx <= HOVER_RADIUS; dx++) {
        const px = Math.round((x + dx) * dpr);
        const py = Math.round((y + dy) * dpr);
        if (px >= 0 && py >= 0 && px < l.width && py < height) best = Math.max(best, l.counts[py * l.width + px]);
      }
    }
    return best;
  };

  return (
    <Tile size={size} className="map-tile">
      <div ref={ref} className={draft ? 'map dragging' : 'map'} {...pointer}>
        {tiles}
        <canvas ref={canvasRef} className="map-tracks" aria-hidden="true" />
        {hover && !draft && (
          <p className="map-tip" style={{ left: hover.x, top: hover.y }}>{plural(hover.count, 'passage')}</p>
        )}
      </div>
      <p className="map-label">
        Carte <span className="muted">· {tracks.length ? plural(tracks.length, 'tracé') : 'aucun tracé'}</span>
      </p>
      {maxCount > 1 && (
        <p className="map-legend">
          <span>1</span>
          <span className="map-legend-ramp" style={{ background: `linear-gradient(to right, ${palette.join()})` }} aria-hidden="true" />
          <span>{plural(maxCount, 'passage')}</span>
        </p>
      )}
      {hint && <p className="map-hint" aria-hidden="true">Ctrl ou ⌘ + molette pour zoomer</p>}
      <div className="map-controls" role="group" aria-label="Zoom de la carte">
        <button type="button" onClick={() => zoomBy(1)} disabled={zoom >= MAX_ZOOM} aria-label="Zoomer" title="Zoomer">+</button>
        <button type="button" onClick={() => zoomBy(-1)} disabled={zoom <= MIN_ZOOM} aria-label="Dézoomer" title="Dézoomer">−</button>
        <button
          type="button"
          onClick={reset}
          disabled={!canReset}
          aria-label={editing ? 'Revenir à la vue par défaut' : 'Recentrer la carte'}
          title={editing ? 'Revenir à la vue par défaut' : 'Recentrer la carte'}
        >
          ⌖
        </button>
      </div>
      <p className="map-attrib">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a>
      </p>
    </Tile>
  );
}
