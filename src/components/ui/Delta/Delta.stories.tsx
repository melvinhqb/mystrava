import type { Meta, StoryObj } from '@storybook/react-vite';
import { Delta } from './Delta';

const meta = {
  title: 'UI/Delta',
  component: Delta,
  render: (args) => <p className="sub"><Delta {...args} /></p>,
  args: { current: 120, previous: 100 },
} satisfies Meta<typeof Delta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hausse: Story = {};

export const Baisse: Story = { args: { current: 80, previous: 100 } };

/** Variante sans couleur, utilisée sur la tuile héros orange. */
export const SurFondAccent: Story = {
  args: { plain: true },
  render: (args) => (
    <p className="hero-sub" style={{ background: 'var(--accent)', padding: 12, borderRadius: 12 }}>
      <Delta {...args} />
    </p>
  ),
};
