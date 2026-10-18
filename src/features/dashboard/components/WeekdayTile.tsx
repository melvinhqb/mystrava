import { BarChart, Tile } from '@/components/ui';
import { plural, WEEKDAY_NAMES, WEEKDAYS } from '@/lib/format';
import type { Run } from '@/types/strava';
import { weekdayCounts } from '../lib/stats';

export function WeekdayTile({ runs }: { runs: Run[] }) {
  const items = weekdayCounts(runs).map((c, i) => ({
    label: WEEKDAYS[i],
    value: c,
    title: `${WEEKDAY_NAMES[i]} : ${plural(c, 'sortie')}`,
  }));
  return (
    <Tile className="chart-tile" title="Jours de sortie">
      <BarChart items={items} />
    </Tile>
  );
}
