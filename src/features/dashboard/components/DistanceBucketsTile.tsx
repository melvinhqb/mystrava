import { BarChart, Tile } from '@/components/ui';
import { plural } from '@/lib/format';
import type { Run } from '@/types/strava';
import { distanceBuckets } from '../lib/stats';

export function DistanceBucketsTile({ runs, size = '1:1' }: { runs: Run[]; size?: '1:1' }) {
  const items = distanceBuckets(runs).map((b) => ({
    label: b.label,
    value: b.count,
    title: `${b.label} km : ${plural(b.count, 'sortie')}`,
  }));
  return (
    <Tile size={size} className="chart-tile" title="Distances">
      <BarChart items={items} />
    </Tile>
  );
}
