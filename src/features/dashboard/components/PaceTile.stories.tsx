import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns, lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { PaceTile } from './PaceTile';

const meta = {
  title: 'Dashboard/PaceTile',
  component: PaceTile,
  decorators: [withBento(4)],
  args: { runs: lastDays(90), prevRuns: lastDays(180).slice(lastDays(90).length), allRuns: demoRuns },
  argTypes: { size: { control: 'inline-radio', options: ['1:1', '2:1', '2:2'] } },
} satisfies Meta<typeof PaceTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small : allure moyenne et écart avec la période précédente. */
export const Small: Story = { args: { size: '1:1' } };

/** Medium : + courbe de l'allure mensuelle sur 12 mois. */
export const Medium: Story = { args: { size: '2:1' } };

/** Large : + record et allure par tranche de distance. */
export const Large: Story = { args: { size: '2:2' } };

/** Période « Tout » : pas de comparaison, la vitesse remplace l'écart. */
export const SansComparaison: Story = { args: { size: '2:2', prevRuns: null } };

export const SansSortie: Story = { args: { size: '2:2', runs: [], prevRuns: [], allRuns: [] } };
