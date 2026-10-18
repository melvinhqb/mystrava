import type { Decorator } from '@storybook/react-vite';

/**
 * Place la story dans une grille bento de `columns` colonnes, comme dans l'application,
 * pour que les tuiles aient leur taille réelle.
 */
export const withBento = (columns = 4, maxWidth = 1232): Decorator => (Story) => (
  <div className="bento" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, maxWidth }}>
    <Story />
  </div>
);
