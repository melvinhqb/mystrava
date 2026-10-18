import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { PaceTrendTile } from './PaceTrendTile';

const meta = {
  title: 'Dashboard/PaceTrendTile',
  component: PaceTrendTile,
  decorators: [withBento(2)],
  args: { runs: demoRuns },
} satisfies Meta<typeof PaceTrendTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };
