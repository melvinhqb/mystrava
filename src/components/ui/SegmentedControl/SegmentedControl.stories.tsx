import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
  { value: '365', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  args: { label: 'Période', options, value: '365', onChange: fn() },
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const Interactif: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={(v) => { setValue(v); args.onChange(v); }} />;
  },
};
