import { Tile } from '@/components/ui';
import { km, nf, pace, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { records } from '../lib/stats';

export function RecordsTile({ runs }: { runs: Run[] }) {
  const r = records(runs);
  const meta = (run: Run) => `${run.name} · ${shortDate(run.startDate)}`;
  return (
    <Tile rows={2} className="records" title="Records">
      <ul className="record-list">
        {!r ? <li className="empty">Aucune sortie sur la période</li> : (
          <>
            <RecordItem label="Plus longue sortie" value={`${km(r.longest.distance)} km`} meta={meta(r.longest)} />
            {r.fastest && (
              <RecordItem label="Allure la plus rapide (≥ 5 km)" value={`${pace(1000 / r.fastest.average_speed)} /km`} meta={meta(r.fastest)} />
            )}
            <RecordItem label="Plus gros dénivelé" value={`${nf().format(Math.round(r.climb.elevation))} m`} meta={meta(r.climb)} />
            <RecordItem label="Meilleure semaine" value={`${km(r.bestWeek.distance)} km`} meta={`Semaine du ${shortDate(r.bestWeek.start)}`} />
          </>
        )}
      </ul>
    </Tile>
  );
}

function RecordItem({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <li>
      <span className="r-label">{label}</span>
      <span className="r-value">{value}</span>
      <span className="r-meta">{meta}</span>
    </li>
  );
}
