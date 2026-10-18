import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoData } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { TotalsTile } from './TotalsTile';

const meta = {
  title: 'Dashboard/TotalsTile',
  component: TotalsTile,
  decorators: [withBento(2, 640)],
  args: { stats: demoData.stats },
} satisfies Meta<typeof TotalsTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
