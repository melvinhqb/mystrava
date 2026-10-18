import { StatTile } from '@/components/ui';
import type { Run } from '@/types/strava';
import { streaks, weeklyTotals } from '../lib/stats';

export function StreakTile({ runs }: { runs: Run[] }) {
  const { current, best } = streaks(runs);
  return (
    <StatTile
      className="streak"
      label="Régularité"
      value={current}
      unit="sem."
      sub={`Semaines consécutives avec au moins une sortie · record : ${best}`}
    >
      <div className="week-dots" aria-hidden="true">
        {weeklyTotals(runs, 12).map((w) => <i key={w.start.getTime()} className={w.runs ? 'on' : ''} />)}
      </div>
    </StatTile>
  );
}
