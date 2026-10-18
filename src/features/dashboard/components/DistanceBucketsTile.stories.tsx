import type { Meta, StoryObj } from '@storybook/react-vite';
import { lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { DistanceBucketsTile } from './DistanceBucketsTile';

const meta = {
  title: 'Dashboard/DistanceBucketsTile',
  component: DistanceBucketsTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(365) },
} satisfies Meta<typeof DistanceBucketsTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };
