import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelcomeScreen } from './WelcomeScreen';

const meta = {
  title: 'Layout/WelcomeScreen',
  component: WelcomeScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WelcomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
