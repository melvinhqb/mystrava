import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PeriodSelector } from '@/features/dashboard';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/Topbar',
  component: Topbar,
  parameters: { layout: 'fullscreen' },
  args: { athlete: { firstname: 'Coureur', lastname: 'Démo', city: 'Paris', profile: null } },
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AvecPeriode: Story = {
  args: { actions: <PeriodSelector value="365" onChange={fn()} /> },
};

export const Demo: Story = {
  args: { demo: true, actions: <PeriodSelector value="90" onChange={fn()} /> },
};

/** Avant le chargement des données : pas d'avatar ni d'actions. */
export const SansAthlete: Story = { args: { athlete: undefined } };
