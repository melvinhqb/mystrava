import type { Meta, StoryObj } from '@storybook/react-vite';
import { withBento } from '@/stories/decorators';
import { Tile } from './Tile';

const meta = {
  title: 'UI/Tile',
  component: Tile,
  decorators: [withBento(4)],
  args: { children: <p className="muted">Contenu de la tuile</p> },
  argTypes: { size: { control: 'select', options: ['1:1', '2:1', '1:2', '2:2', '3:1', '3:3', '4:1', '4:2'] } },
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const AvecTitre: Story = {
  args: { title: 'Volume hebdomadaire', caption: '12 dernières semaines', size: '2:1' },
};

export const GrandeTuile: Story = {
  args: { title: 'Dernières sorties', size: '2:2' },
};

export const LargeurComplete: Story = {
  args: { title: 'Calendrier des sorties', size: '4:1' },
};
