import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns, lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { HeroTile } from './HeroTile';

const meta = {
  title: 'Dashboard/HeroTile',
  component: HeroTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(365), prevRuns: lastDays(730).slice(lastDays(365).length), allRuns: demoRuns, period: '365', spanDays: 365 },
} satisfies Meta<typeof HeroTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnAn: Story = {};

export const TrenteJours: Story = {
  args: { runs: lastDays(30), prevRuns: lastDays(60).slice(lastDays(30).length), period: '30', spanDays: 30 },
};

export const Tout: Story = { args: { runs: demoRuns, prevRuns: null, period: 'all', spanDays: 730 } };

export const SansSortie: Story = { args: { runs: [], prevRuns: [], allRuns: [], period: '30', spanDays: 30 } };
