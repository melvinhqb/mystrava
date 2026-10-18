import type { Meta, StoryObj } from '@storybook/react-vite';
import { lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { PeriodKpis } from './PeriodKpis';

const meta = {
  title: 'Dashboard/PeriodKpis',
  component: PeriodKpis,
  decorators: [withBento(4)],
  args: { runs: lastDays(90), prevRuns: lastDays(180).slice(lastDays(90).length), spanDays: 90 },
} satisfies Meta<typeof PeriodKpis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AvecComparaison: Story = {};

/** Période « Tout » : pas de période précédente, on affiche des moyennes. */
export const SansComparaison: Story = { args: { prevRuns: null } };

export const SansSortie: Story = { args: { runs: [], prevRuns: [] } };
