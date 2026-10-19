import { BarChart, Tile } from '@/components/ui';
import { plural, WEEKDAY_NAMES, WEEKDAYS } from '@/lib/format';
import type { Run } from '@/types/strava';
import { weekdayCounts } from '../lib/stats';

export function WeekdayTile({ runs, size = '1:1' }: { runs: Run[]; size?: '1:1' }) {
  const items = weekdayCounts(runs).map((c, i) => ({
    label: WEEKDAYS[i],
    value: c,
    title: `${WEEKDAY_NAMES[i]} : ${plural(c, 'sortie')}`,
  }));
  return (
    <Tile size={size} className="chart-tile" title="Jours de sortie">
      <BarChart items={items} />
    </Tile>
  );
}
