import type { Meta, StoryObj } from '@storybook/react-vite';
import { lastDays, withoutHeartRate } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { HeartRateTile } from './HeartRateTile';

const meta = {
  title: 'Dashboard/HeartRateTile',
  component: HeartRateTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(90) },
} satisfies Meta<typeof HeartRateTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };

export const SansCardio: Story = { args: { runs: withoutHeartRate(lastDays(90)) } };
