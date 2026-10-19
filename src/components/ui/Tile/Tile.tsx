import { useContext, type HTMLAttributes, type ReactNode } from 'react';
import { TileFrameContext } from './TileFrame';

/** Format d'une tuile dans la grille bento : `colonnes:lignes` (la grille fait 4 colonnes). */
export type TileSize = `${1 | 2 | 3 | 4}:${1 | 2 | 3}`;

export interface TileProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Format occupé dans la grille bento, `1:1` par défaut. */
  size?: TileSize;
  /** Titre affiché dans l'en-tête de la tuile. */
  title?: ReactNode;
  /** Légende alignée à droite du titre. */
  caption?: ReactNode;
}

/** Carte de base de la grille bento. */
export function Tile({ size = '1:1', title, caption, className, children, ...rest }: TileProps) {
  const frame = useContext(TileFrameContext);
  const [cols, rows] = size.split(':');
  const classes = ['tile', cols !== '1' && `cols-${cols}`, rows !== '1' && `rows-${rows}`, className, frame?.className]
    .filter(Boolean)
    .join(' ');
  return (
    <article className={classes} {...rest} {...frame?.props}>
      {(title || caption) && (
        <header className="tile-head">
          {title && <h2>{title}</h2>}
          {typeof caption === 'string' ? <span className="muted">{caption}</span> : caption}
        </header>
      )}
      {children}
      {frame?.overlay}
    </article>
  );
}
