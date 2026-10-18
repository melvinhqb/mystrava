import { BarChart, Tile } from '@/components/ui';
import { plural } from '@/lib/format';
import type { Run } from '@/types/strava';
import { distanceBuckets } from '../lib/stats';

export function DistanceBucketsTile({ runs }: { runs: Run[] }) {
  const items = distanceBuckets(runs).map((b) => ({
    label: b.label,
    value: b.count,
    title: `${b.label} km : ${plural(b.count, 'sortie')}`,
  }));
  return (
    <Tile className="chart-tile" title="Distances">
      <BarChart items={items} />
    </Tile>
  );
}
