import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer, Topbar } from '@/components/layout';
import { demoData } from '@/stories/fixtures';
import type { Period } from '@/types/strava';
import { Dashboard } from './Dashboard';
import { PeriodSelector } from './PeriodSelector';

const meta = {
  title: 'Dashboard/Dashboard',
  component: Dashboard,
  parameters: { layout: 'fullscreen' },
  args: { data: demoData, period: '365' },
  argTypes: { period: { control: 'inline-radio', options: ['30', '90', '365', 'all'] } },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

const inMain: Story['decorators'] = [(Story) => <main><Story /></main>];

export const Grille: Story = { decorators: inMain };

/** Page complète, telle que servie sur GitHub Pages en mode démo. */
export const PageComplete: Story = {
  render: function Render(args) {
    const [period, setPeriod] = useState<Period>(args.period);
    return (
      <>
        <Topbar athlete={args.data.athlete} demo actions={<PeriodSelector value={period} onChange={setPeriod} />} />
        <main><Dashboard {...args} period={period} /></main>
        <Footer info="Mode démo : données fictives" />
      </>
    );
  },
};

export const Mobile: Story = { decorators: inMain, globals: { viewport: { value: 'mobile2', isRotated: false } } };
