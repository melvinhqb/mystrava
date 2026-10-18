import { StatTile } from '@/components/ui';
import { plural } from '@/lib/format';
import type { Run } from '@/types/strava';
import { averageHeartRate } from '../lib/stats';

export function HeartRateTile({ runs }: { runs: Run[] }) {
  const hr = averageHeartRate(runs);
  return hr ? (
    <StatTile
      className="hr"
      label="Fréquence cardiaque"
      value={Math.round(hr.bpm)}
      unit="bpm"
      sub={`Moyenne pondérée sur ${plural(hr.count, 'sortie')}`}
    />
  ) : (
    <StatTile className="hr" label="Fréquence cardiaque" value="–" sub="Aucune donnée cardio sur la période" />
  );
}
