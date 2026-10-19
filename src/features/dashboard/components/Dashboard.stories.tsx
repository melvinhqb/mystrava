import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer, Topbar } from '@/components/layout';
import { demoData } from '@/stories/fixtures';
import type { Period } from '@/types/strava';
import type { DashboardLayout } from '../layout';
import { defaultLayout } from '../layout';
import { Dashboard } from './Dashboard';
import { LayoutControls } from './LayoutControls';
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

/** Exemple de disposition personnalisée, déclarée en code. */
export const DispositionPersonnalisee: Story = {
  decorators: inMain,
  args: {
    layout: [
      { block: 'streak', size: '4:1' },
      { block: 'recent-runs', size: '2:2' },
      { block: 'kpi-runs' },
      { block: 'pace' },
      { block: 'heart-rate', size: '2:1' },
      { block: 'kpi-elevation' },
      { block: 'kpi-time' },
      { block: 'totals', size: '2:1' },
    ],
  },
};

/** Mode personnalisation : déplacer, redimensionner, retirer et ajouter des widgets. */
export const Edition: Story = {
  render: function Render(args) {
    const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
    const [editing, setEditing] = useState(true);
    return (
      <>
        <Topbar
          athlete={args.data.athlete}
          demo
          actions={<LayoutControls editing={editing} onEditingChange={setEditing} onReset={() => setLayout(defaultLayout)} />}
        />
        <main>
          <Dashboard {...args} layout={layout} editing={editing} onLayoutChange={setLayout} />
        </main>
      </>
    );
  },
};

export const Mobile: Story = { decorators: inMain, globals: { viewport: { value: 'mobile2', isRotated: false } } };
