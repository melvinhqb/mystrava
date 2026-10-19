// Heatmap des tracés : chaque pixel compte les sorties qui y passent, puis est coloré selon la palette --map-heat
// (magma, définie dans global.css pour chaque thème).

/** Opacité ajoutée par sortie dans la couche de comptage (alpha sur 255) : au-delà de 255 / 4 ≈ 63 passages, saturé. */
const STEP = 4;
/** Épaisseur des tracés, en pixels CSS. */
const LINE = 3;

export interface HeatLayer {
  /** Nombre de passages par pixel (en pixels physiques, ligne par ligne). */
  counts: Uint8Array;
  width: number;
  /** Plus grand nombre de passages visible. */
  max: number;
}

/** Paliers de la variable CSS --map-heat (couleurs hexadécimales séparées par des virgules), du moins au plus fréquenté. */
export const heatPalette = (el: Element): string[] =>
  getComputedStyle(el).getPropertyValue('--map-heat').split(',').map((c) => c.trim()).filter(Boolean);

/** Couleurs [r, g, b] d'une palette hexadécimale. */
export const heatStops = (palette: string[]): [number, number, number][] =>
  palette.map((c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16)) as [number, number, number]);

/**
 * Dessine `tracks` (en pixels CSS relatifs au canvas) sur `canvas`, à la résolution `dpr`.
 * Les tracés sont d'abord additionnés dans le canal alpha d'un canvas de travail (une sortie qui repasse
 * sur ses propres pas ne compte qu'une fois), puis chaque pixel prend la couleur de son nombre de passages
 * sur une échelle logarithmique : quelques passages suffisent à se distinguer d'un passage unique.
 */
export function drawHeat(
  canvas: HTMLCanvasElement,
  scratch: HTMLCanvasElement,
  tracks: [number, number][][],
  stops: [number, number, number][],
  dpr: number,
): HeatLayer {
  const width = Math.round(canvas.clientWidth * dpr);
  const height = Math.round(canvas.clientHeight * dpr);
  for (const c of [canvas, scratch]) {
    c.width = width;
    c.height = height;
  }
  const acc = scratch.getContext('2d', { willReadFrequently: true })!;
  acc.globalCompositeOperation = 'lighter';
  acc.strokeStyle = `rgba(0, 0, 0, ${STEP / 255})`;
  acc.lineWidth = LINE * dpr;
  acc.lineCap = 'round';
  acc.lineJoin = 'round';
  for (const track of tracks) {
    acc.beginPath();
    track.forEach(([x, y], i) => (i ? acc.lineTo(x * dpr, y * dpr) : acc.moveTo(x * dpr, y * dpr)));
    acc.stroke();
  }

  const alpha = acc.getImageData(0, 0, width, height).data;
  const counts = new Uint8Array(width * height);
  let max = 0;
  for (let i = 0; i < counts.length; i++) {
    const c = Math.round(alpha[i * 4 + 3] / STEP);
    counts[i] = c;
    if (c > max) max = c;
  }

  // Couleur par nombre de passages : interpolation entre les quatre paliers, en échelle logarithmique.
  const lut = Array.from({ length: max + 1 }, (_, c) => {
    const t = max > 1 ? Math.log(Math.max(1, c)) / Math.log(max) : 1;
    const pos = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(pos));
    const f = pos - i;
    return stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  });

  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(width, height);
  for (let i = 0; i < counts.length; i++) {
    const a = alpha[i * 4 + 3];
    if (!a) continue;
    const [r, g, b] = lut[counts[i]];
    out.data[i * 4] = r;
    out.data[i * 4 + 1] = g;
    out.data[i * 4 + 2] = b;
    // Bords anticrénelés d'un tracé unique : opacité partielle.
    out.data[i * 4 + 3] = Math.min(255, Math.round((a / STEP) * 255));
  }
  ctx.putImageData(out, 0, 0);
  return { counts, width, max };
}
