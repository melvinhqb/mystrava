import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { WeeklyVolumeTile } from './WeeklyVolumeTile';

const meta = {
  title: 'Dashboard/WeeklyVolumeTile',
  component: WeeklyVolumeTile,
  decorators: [withBento(2)],
  args: { runs: demoRuns },
} satisfies Meta<typeof WeeklyVolumeTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };
