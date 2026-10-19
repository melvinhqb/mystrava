import type { TileSize } from '@/components/ui';

export type Axis = 'cols' | 'rows';

export const sizeDims = (size: TileSize) => {
  const [cols, rows] = size.split(':').map(Number);
  return { cols, rows };
};

/** Vrai si les formats proposés diffèrent sur cet axe (le bloc peut s'élargir ou s'allonger). */
export const canResize = (sizes: readonly TileSize[], axis: Axis) => new Set(sizes.map((s) => sizeDims(s)[axis])).size > 1;

/**
 * Format suivant parmi `sizes`, un cran plus grand (`dir = 1`) ou plus petit (`dir = -1`) sur `axis`,
 * en restant au plus près sur l'autre axe ; null s'il n'y en a pas.
 */
export function nextSize(sizes: readonly TileSize[], current: TileSize, axis: Axis, dir: 1 | -1): TileSize | null {
  const cur = sizeDims(current);
  const other: Axis = axis === 'cols' ? 'rows' : 'cols';
  const dist = (s: TileSize, a: Axis) => Math.abs(sizeDims(s)[a] - cur[a]);
  const candidates = sizes
    .filter((s) => (sizeDims(s)[axis] - cur[axis]) * dir > 0)
    .sort((a, b) => dist(a, other) - dist(b, other) || dist(a, axis) - dist(b, axis));
  return candidates[0] ?? null;
}

/** Copie de `list` où l'élément d'indice `from` est déplacé à l'indice `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}
