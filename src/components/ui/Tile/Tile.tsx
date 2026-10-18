import type { HTMLAttributes, ReactNode } from 'react';

export interface TileProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Nombre de colonnes occupées dans la grille bento. */
  span?: 2 | 4;
  /** Nombre de lignes occupées dans la grille bento. */
  rows?: 2;
  /** Titre affiché dans l'en-tête de la tuile. */
  title?: ReactNode;
  /** Légende alignée à droite du titre. */
  caption?: ReactNode;
}

/** Carte de base de la grille bento. */
export function Tile({ span, rows, title, caption, className, children, ...rest }: TileProps) {
  const classes = ['tile', span && `span-${span}`, rows && `rows-${rows}`, className].filter(Boolean).join(' ');
  return (
    <article className={classes} {...rest}>
      {(title || caption) && (
        <header className="tile-head">
          {title && <h2>{title}</h2>}
          {typeof caption === 'string' ? <span className="muted">{caption}</span> : caption}
        </header>
      )}
      {children}
    </article>
  );
}
