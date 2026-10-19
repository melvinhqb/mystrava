import type { TileSize } from '@/components/ui';
import { canResize, nextSize, type Axis } from '../lib/layoutEditing';

export interface TileEditorProps {
  /** Nom du widget, pour les libellés accessibles. */
  label: string;
  size: TileSize;
  /** Formats proposés par le bloc. */
  sizes: readonly TileSize[];
  index: number;
  count: number;
  onResize: (size: TileSize) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}

const AXES: { axis: Axis; icon: string; name: string }[] = [
  { axis: 'cols', icon: '↔', name: 'largeur' },
  { axis: 'rows', icon: '↕', name: 'hauteur' },
];

/** Contrôles superposés à une tuile en mode édition : retirer, déplacer, redimensionner. */
export function TileEditor({ label, size, sizes, index, count, onResize, onMove, onRemove }: TileEditorProps) {
  return (
    <div className="tile-edit">
      <button type="button" className="tile-remove" onClick={onRemove} aria-label={`Retirer « ${label} »`} title="Retirer">
        ×
      </button>
      <div className="tile-edit-bar" role="toolbar" aria-label={`Disposition de « ${label} »`}>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          aria-label={`Déplacer « ${label} » vers le début`}
          title="Déplacer vers le début"
        >
          ←
        </button>
        {AXES.filter(({ axis }) => canResize(sizes, axis)).map(({ axis, icon, name }) => {
          const smaller = nextSize(sizes, size, axis, -1);
          const bigger = nextSize(sizes, size, axis, 1);
          return (
            <span key={axis} className="tile-edit-group" role="group" aria-label={name}>
              <span aria-hidden="true">{icon}</span>
              <button
                type="button"
                disabled={!smaller}
                onClick={() => smaller && onResize(smaller)}
                aria-label={`Réduire la ${name} de « ${label} »`}
                title={`Réduire la ${name}`}
              >
                −
              </button>
              <button
                type="button"
                disabled={!bigger}
                onClick={() => bigger && onResize(bigger)}
                aria-label={`Augmenter la ${name} de « ${label} »`}
                title={`Augmenter la ${name}`}
              >
                +
              </button>
            </span>
          );
        })}
        <span className="tile-edit-size" aria-label={`Format ${size}`}>{size}</span>
        <button
          type="button"
          disabled={index === count - 1}
          onClick={() => onMove(index + 1)}
          aria-label={`Déplacer « ${label} » vers la fin`}
          title="Déplacer vers la fin"
        >
          →
        </button>
      </div>
    </div>
  );
}
