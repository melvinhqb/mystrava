import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { StreakTile } from './StreakTile';

const meta = {
  title: 'Dashboard/StreakTile',
  component: StreakTile,
  decorators: [withBento(4)],
  args: { runs: demoRuns },
} satisfies Meta<typeof StreakTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };
