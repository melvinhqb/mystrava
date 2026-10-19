import { Fragment, useMemo, useState, type DragEvent } from 'react';
import { TileFrameContext, type TileSize } from '@/components/ui';
import type { DashboardData, Period } from '@/types/strava';
import { blocks, type BlockContext, type BlockDefinition, type BlockId } from '../blocks';
import { blockSizes, defaultLayout, itemSize, layoutItem, type DashboardLayout } from '../layout';
import { moveItem } from '../lib/layoutEditing';
import { periodBounds, periodSpanDays, splitByPeriod } from '../lib/stats';
import { AddWidgetDialog, AddWidgetTile } from './AddWidget';
import { TileEditor } from './TileEditor';

export interface DashboardProps {
  data: DashboardData;
  period: Period;
  /** Blocs à afficher et leur format, `defaultLayout` par défaut. */
  layout?: DashboardLayout;
  /** Mode édition : les widgets peuvent être déplacés, redimensionnés, retirés ou ajoutés. */
  editing?: boolean;
  onLayoutChange?: (layout: DashboardLayout) => void;
}

/**
 * Grille bento assemblée d'après `layout`. Les blocs liés à la période reçoivent `runs`,
 * les tendances (semaines, mois, calendrier) reçoivent toutes les sorties.
 */
export function Dashboard({ data, period, layout = defaultLayout, editing = false, onLayoutChange }: DashboardProps) {
  const all = data.runs;
  const ctx = useMemo<BlockContext>(() => {
    const bounds = periodBounds(period);
    const split = splitByPeriod(all, bounds);
    return { data, period, all, ...split, spanDays: periodSpanDays(split.runs, bounds) };
  }, [data, all, period]);

  const [dragged, setDragged] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const change = (next: DashboardLayout) => onLayoutChange?.(next);
  const move = (from: number, to: number) => change(moveItem(layout, from, to));
  const resize = (i: number, size: TileSize) => change(layout.map((it, j) => (j === i ? layoutItem(it.block, size) : it)));
  const remove = (i: number) => change(layout.filter((_, j) => j !== i));
  const add = (block: BlockId, size: TileSize) => {
    change([...layout, layoutItem(block, size)]);
    setAdding(false);
  };
  const endDrag = () => {
    setDragged(null);
    setOver(null);
  };

  if (!editing && layout.length === 0) {
    return <p className="status">Aucun widget affiché : utilisez « Personnaliser » pour en ajouter.</p>;
  }

  const shown = new Set(layout.map((it) => it.block));
  const choices = (Object.keys(blocks) as BlockId[])
    .filter((id) => !shown.has(id))
    .map((id) => ({ block: id, label: blocks[id].label, sizes: blockSizes(id) }));

  return (
    <>
      <section className={editing ? 'bento editing' : 'bento'}>
        {layout.map((item, i) => {
          // `LayoutItem` garantit que la taille fait partie des formats de ce bloc.
          const block = blocks[item.block] as unknown as BlockDefinition;
          const size = itemSize(item);
          const content = block.render(ctx, size);
          if (!editing) return <Fragment key={item.block}>{content}</Fragment>;

          const frame = {
            className: ['editable', i === dragged && 'dragging', i === over && i !== dragged && 'drop-target']
              .filter(Boolean)
              .join(' '),
            props: {
              draggable: true,
              onDragStart: (e: DragEvent) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.block);
                setDragged(i);
              },
              onDragOver: (e: DragEvent) => {
                if (dragged === null) return;
                e.preventDefault();
                setOver(i);
              },
              onDragLeave: () => setOver((o) => (o === i ? null : o)),
              onDrop: (e: DragEvent) => {
                e.preventDefault();
                if (dragged !== null && dragged !== i) move(dragged, i);
                endDrag();
              },
              onDragEnd: endDrag,
            },
            overlay: (
              <TileEditor
                label={block.label}
                size={size}
                sizes={block.sizes}
                index={i}
                count={layout.length}
                onResize={(s) => resize(i, s)}
                onMove={(to) => move(i, to)}
                onRemove={() => remove(i)}
              />
            ),
          };
          return <TileFrameContext.Provider key={item.block} value={frame}>{content}</TileFrameContext.Provider>;
        })}
        {editing && <AddWidgetTile onClick={() => setAdding(true)} />}
      </section>
      {editing && <AddWidgetDialog open={adding} choices={choices} onAdd={add} onClose={() => setAdding(false)} />}
    </>
  );
}
