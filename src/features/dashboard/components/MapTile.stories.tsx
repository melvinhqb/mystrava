import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoData, demoRuns, lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import type { MapView } from '../lib/map';
import { MapTile } from './MapTile';

const meta = {
  title: 'Dashboard/MapTile',
  component: MapTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(365), home: demoData.athlete.cityCenter },
  argTypes: { size: { control: 'inline-radio', options: ['1:1', '2:2', '4:2'] } },
} satisfies Meta<typeof MapTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small : un aperçu du quartier. */
export const Small: Story = { args: { size: '1:1' } };

/** Medium. La carte s'explore : glisser, Ctrl + molette ou + −, puis ⌖ pour recentrer. */
export const Medium: Story = { args: { size: '2:2' } };

/** Large : toute la largeur de la grille. */
export const Large: Story = { args: { size: '4:2' } };

/** Vue choisie en personnalisation : bois de Vincennes, zoom 14. */
export const VuePersonnalisee: Story = { args: { size: '2:2', view: { center: [48.835, 2.435], zoom: 14 } } };

/** Mode personnalisation : glisser pour déplacer, molette ou + − pour zoomer, ⌖ pour revenir à la vue par défaut. */
export const Edition: Story = {
  args: { size: '4:2', runs: demoRuns, editing: true },
  render: function Render(args) {
    const [view, setView] = useState<MapView | undefined>();
    return <MapTile {...args} view={view} onViewChange={setView} />;
  },
};

/** Ville du profil éloignée (Lyon) : la carte reste centrée sur la zone la plus parcourue. */
export const AutreVille: Story = { args: { size: '2:2', home: [45.7578, 4.832] } };

/** Sans aucun tracé : repli sur la ville du profil. */
export const SansTraceVilleDuProfil: Story = { args: { size: '2:2', runs: [], home: [45.7578, 4.832] } };

export const SansTrace: Story = { args: { size: '2:2', runs: [] } };
