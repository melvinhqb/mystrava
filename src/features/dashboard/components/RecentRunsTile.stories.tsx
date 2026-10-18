import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { RecentRunsTile } from './RecentRunsTile';

const meta = {
  title: 'Dashboard/RecentRunsTile',
  component: RecentRunsTile,
  decorators: [withBento(2, 640)],
  args: { runs: demoRuns, demo: true },
} satisfies Meta<typeof RecentRunsTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const NomsLongs: Story = {
  args: { runs: demoRuns.map((r) => ({ ...r, name: `${r.name} – boucle des étangs et retour par la forêt domaniale` })) },
};

export const SansSortie: Story = { args: { runs: [] } };
