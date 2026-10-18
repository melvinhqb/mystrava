import type { Meta, StoryObj } from '@storybook/react-vite';
import { withBento } from '@/stories/decorators';
import { Tile } from '../Tile';
import { BarChart } from './BarChart';

const meta = {
  title: 'UI/BarChart',
  component: BarChart,
  decorators: [
    (Story) => <Tile span={2} className="chart-tile" title="Histogramme"><Story /></Tile>,
    withBento(4),
  ],
  args: {
    items: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => ({ label, value: [3, 8, 2, 7, 1, 4, 12][i] })),
  },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const AvecValeurs: Story = {
  args: {
    showValues: true,
    format: (v) => `${v.toFixed(1)}`,
    items: Array.from({ length: 12 }, (_, i) => ({ label: `S${i + 1}`, value: 15 + Math.sin(i) * 10 + i })),
    labelEvery: 2,
  },
};

export const Vide: Story = {
  args: { items: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label) => ({ label, value: 0 })) },
};
