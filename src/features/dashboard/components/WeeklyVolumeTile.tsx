import { BarChart, Tile } from '@/components/ui';
import { km, nf, plural, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { weeklyTotals } from '../lib/stats';

export function WeeklyVolumeTile({ runs }: { runs: Run[] }) {
  const items = weeklyTotals(runs, 12).map((w) => ({
    label: `${w.start.getDate()}/${w.start.getMonth() + 1}`,
    value: w.distance / 1000,
    title: `Semaine du ${shortDate(w.start)} : ${km(w.distance)} km, ${plural(w.runs, 'sortie')}`,
  }));
  return (
    <Tile span={2} className="chart-tile" title="Volume hebdomadaire" caption="12 dernières semaines">
      <BarChart
        items={items}
        showValues
        labelEvery={(w) => (w < 420 ? 2 : 1)}
        format={(v) => nf(v < 100 ? 1 : 0).format(v)}
      />
    </Tile>
  );
}
