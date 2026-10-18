import type { Meta, StoryObj } from '@storybook/react-vite';
import { withBento } from '@/stories/decorators';
import { Delta } from '../Delta';
import { StatTile } from './StatTile';

const meta = {
  title: 'UI/StatTile',
  component: StatTile,
  decorators: [withBento(4)],
  args: { label: 'Sorties', value: '42' },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const AvecUnite: Story = {
  args: { label: 'Allure moyenne', value: '5:12', unit: '/km', sub: '11,5 km/h' },
};

export const AvecEvolution: Story = {
  args: { label: 'Sorties', value: '18', sub: <Delta current={18} previous={15} /> },
};

export const EvolutionNegative: Story = {
  args: { label: 'Sorties', value: '9', sub: <Delta current={9} previous={15} /> },
};

export const SansDonnees: Story = {
  args: { label: 'Fréquence cardiaque', value: '–', sub: 'Aucune donnée cardio sur la période' },
};
