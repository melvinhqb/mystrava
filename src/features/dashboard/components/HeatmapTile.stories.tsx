import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { HeatmapTile } from './HeatmapTile';

const meta = {
  title: 'Dashboard/HeatmapTile',
  component: HeatmapTile,
  args: { runs: demoRuns },
} satisfies Meta<typeof HeatmapTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = { decorators: [withBento(4)] };

/** Sous 480 px de large, le calendrier passe à 26 semaines. */
export const Mobile: Story = { decorators: [withBento(4, 400)] };

export const SansSortie: Story = { args: { runs: [] }, decorators: [withBento(4)] };
