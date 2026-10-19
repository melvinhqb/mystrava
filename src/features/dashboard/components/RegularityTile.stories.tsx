import type { Meta, StoryObj } from '@storybook/react-vite';
import { demoRuns } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { RegularityTile } from './RegularityTile';

const meta = {
  title: 'Dashboard/RegularityTile',
  component: RegularityTile,
  decorators: [withBento(4)],
  args: { runs: demoRuns },
  argTypes: { size: { control: 'inline-radio', options: ['1:1', '2:1', '2:2', '4:1'] } },
} satisfies Meta<typeof RegularityTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small : série en cours et 12 dernières semaines. */
export const Small: Story = { args: { size: '1:1' } };

/** Medium : + calendrier sur quelques mois. */
export const Medium: Story = { args: { size: '2:1' } };

/** Large : calendrier plus grand et légende. */
export const Large: Story = { args: { size: '2:2' } };

/** Pleine largeur : calendrier sur un an et plus. */
export const PleineLargeur: Story = { args: { size: '4:1' } };

export const SansSortie: Story = { args: { size: '2:1', runs: [] } };
