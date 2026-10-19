import { useEffect, useRef, type CSSProperties } from 'react';
import type { TileSize } from '@/components/ui';
import type { BlockId } from '../blocks';
import { sizeDims } from '../lib/layoutEditing';

/** Emplacement « + » affiché en fin de grille en mode édition. */
export function AddWidgetTile({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="tile add-tile" onClick={onClick}>
      <span aria-hidden="true">+</span>
      Ajouter un widget
    </button>
  );
}

export interface WidgetChoice {
  block: BlockId;
  label: string;
  sizes: readonly TileSize[];
}

export interface AddWidgetDialogProps {
  open: boolean;
  /** Widgets absents de la grille. */
  choices: WidgetChoice[];
  onAdd: (block: BlockId, size: TileSize) => void;
  onClose: () => void;
}

/** Catalogue des widgets à ajouter, chacun dans l'un de ses formats. */
export function AddWidgetDialog({ open, choices, onAdd, onClose }: AddWidgetDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="widget-dialog"
      aria-labelledby="widget-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <header>
        <h2 id="widget-dialog-title">Ajouter un widget</h2>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Fermer">×</button>
      </header>
      {choices.length === 0 ? (
        <p className="muted">Tous les widgets sont déjà affichés.</p>
      ) : (
        <ul className="widget-list">
          {choices.map((c) => (
            <li key={c.block}>
              <span className="widget-name">{c.label}</span>
              <span className="widget-sizes">
                {c.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onAdd(c.block, size)}
                    aria-label={`Ajouter « ${c.label} » au format ${size}`}
                  >
                    <SizePreview size={size} />
                    {size}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}

function SizePreview({ size }: { size: TileSize }) {
  const { cols, rows } = sizeDims(size);
  return <span className="size-preview" aria-hidden="true" style={{ '--c': cols, '--r': rows } as CSSProperties} />;
}
