import type { Meta, StoryObj } from '@storybook/react-vite';
import { withBento } from '@/stories/decorators';
import { Tile } from './Tile';

const meta = {
  title: 'UI/Tile',
  component: Tile,
  decorators: [withBento(4)],
  args: { children: <p className="muted">Contenu de la tuile</p> },
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const AvecTitre: Story = {
  args: { title: 'Volume hebdomadaire', caption: '12 dernières semaines', span: 2 },
};

export const GrandeTuile: Story = {
  args: { title: 'Dernières sorties', span: 2, rows: 2 },
};

export const LargeurComplete: Story = {
  args: { title: 'Calendrier des sorties', span: 4 },
};
