import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from './Footer';

const meta = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AvecDonnees: Story = { args: { info: '73 sorties · mis à jour le 19 octobre 2026 à 07:17' } };

export const Demo: Story = { args: { info: 'Mode démo : données fictives' } };

export const SansDonnees: Story = {};
