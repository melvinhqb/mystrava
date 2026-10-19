import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns, lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { DistanceTile } from './DistanceTile';

const meta = {
  title: 'Dashboard/DistanceTile',
  component: DistanceTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(365), prevRuns: lastDays(730).slice(lastDays(365).length), allRuns: demoRuns, period: '365', spanDays: 365 },
  argTypes: { size: { control: 'inline-radio', options: ['1:1', '2:1', '2:2'] } },
} satisfies Meta<typeof DistanceTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small : distance de la période et évolution. */
export const Small: Story = { args: { size: '1:1' } };

/** Medium : + volume des 12 dernières semaines. */
export const Medium: Story = { args: { size: '2:1' } };

/** Large : + tendance sur 26 semaines et moyennes. */
export const Large: Story = { args: { size: '2:2' } };

export const TrenteJours: Story = {
  args: { size: '2:2', runs: lastDays(30), prevRuns: lastDays(60).slice(lastDays(30).length), period: '30', spanDays: 30 },
};

/** Période « Tout » : pas de comparaison, la période est rappelée à la place. */
export const Tout: Story = { args: { size: '2:1', runs: demoRuns, prevRuns: null, period: 'all', spanDays: 730 } };

export const SansSortie: Story = { args: { size: '2:1', runs: [], prevRuns: [], allRuns: [], period: '30', spanDays: 30 } };
