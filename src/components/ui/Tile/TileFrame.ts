import { createContext, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Habillage ajouté à une `Tile` par un composant parent, sans que la tuile le sache :
 * sert par exemple au mode édition du tableau de bord (contrôles, déplacement au pointeur).
 */
export interface TileFrame {
  className?: string;
  props?: HTMLAttributes<HTMLElement> & { [data: `data-${string}`]: string };
  /** Contenu superposé à la tuile. */
  overlay?: ReactNode;
}

export const TileFrameContext = createContext<TileFrame | null>(null);
