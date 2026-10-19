import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { blocks, type BlockId } from '../blocks';
import { AddWidgetDialog } from './AddWidget';

const choices = (['heart-rate', 'weekday', 'streak', 'records'] as BlockId[]).map((id) => ({
  block: id,
  label: blocks[id].label,
  sizes: blocks[id].sizes,
}));

const meta = {
  title: 'Dashboard/AddWidgetDialog',
  component: AddWidgetDialog,
  args: { open: true, choices, onAdd: fn(), onClose: fn() },
} satisfies Meta<typeof AddWidgetDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ouvert: Story = {};

export const ToutAffiche: Story = { args: { choices: [] } };
