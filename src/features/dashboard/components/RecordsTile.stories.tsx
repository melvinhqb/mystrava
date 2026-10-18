import type { Meta, StoryObj } from '@storybook/react-vite';
import { lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { RecordsTile } from './RecordsTile';

const meta = {
  title: 'Dashboard/RecordsTile',
  component: RecordsTile,
  decorators: [withBento(2)],
  args: { runs: lastDays(365) },
} satisfies Meta<typeof RecordsTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const SansSortie: Story = { args: { runs: [] } };
