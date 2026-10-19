import type { TileSize } from '@/components/ui';
import { blocks, type BlockDefinition, type BlockId, type BlockOptions, type BlockSize } from './blocks';

/** Un emplacement de la grille : le bloc à afficher et, si besoin, l'un de ses formats et ses réglages. */
export type LayoutItem = { [K in BlockId]: { block: K; size?: BlockSize<K>; options?: BlockOptions<K> } }[BlockId];

/** Disposition du tableau de bord, dans l'ordre de remplissage de la grille (4 colonnes). */
export type DashboardLayout = readonly LayoutItem[];

export const defaultLayout: DashboardLayout = [
  { block: 'distance', size: '2:2' },
  { block: 'kpi-runs', size: '1:1' },
  { block: 'kpi-time', size: '1:1' },
  { block: 'kpi-elevation', size: '1:1' },
  { block: 'heart-rate', size: '1:1' },
  { block: 'recent-runs', size: '2:2' },
  { block: 'records', size: '1:2' },
  { block: 'weekday', size: '1:1' },
  { block: 'distance-buckets', size: '1:1' },
  { block: 'streak', size: '4:1' },
  { block: 'pace', size: '2:1' },
  { block: 'totals', size: '2:1' },
  { block: 'map', size: '4:2' },
];

/** Anciens identifiants de blocs fusionnés, pour relire les dispositions sauvegardées. */
const RENAMED: Record<string, BlockId> = {
  hero: 'distance',
  heatmap: 'streak',
  'weekly-volume': 'distance',
  'kpi-pace': 'pace',
  'pace-trend': 'pace',
};

export const isBlockId = (v: unknown): v is BlockId => typeof v === 'string' && Object.hasOwn(blocks, v);

/** Formats proposés par un bloc. */
export const blockSizes = (block: BlockId): readonly TileSize[] => blocks[block].sizes;

/** Format effectif d'un emplacement : celui demandé, sinon le premier du bloc. */
export const itemSize = (item: LayoutItem): TileSize => item.size ?? blockSizes(item.block)[0];

/**
 * Emplacement pour `block` au format `size`, ou au format par défaut si le bloc ne le supporte pas.
 * Les réglages `options` sont relus par le bloc et ignorés s'ils sont invalides.
 */
export function layoutItem(block: BlockId, size?: TileSize, options?: unknown): LayoutItem {
  const sizes = blockSizes(block);
  const parsed = options === undefined ? undefined : (blocks[block] as BlockDefinition<TileSize, unknown>).parseOptions?.(options);
  return {
    block,
    size: size && sizes.includes(size) ? size : sizes[0],
    ...(parsed !== undefined && { options: parsed }),
  } as LayoutItem;
}

/**
 * Relit une disposition sauvegardée : ignore les blocs inconnus et les doublons,
 * ramène les formats non supportés au format par défaut et oublie les réglages invalides. Null si ce n'est pas une liste.
 */
export function parseLayout(value: unknown): DashboardLayout | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<BlockId>();
  const items: LayoutItem[] = [];
  for (const v of value) {
    const block: unknown = Object.hasOwn(RENAMED, v?.block) ? RENAMED[v.block] : v?.block;
    if (!isBlockId(block) || seen.has(block)) continue;
    seen.add(block);
    items.push(layoutItem(block, v.size, v.options));
  }
  return items;
}
