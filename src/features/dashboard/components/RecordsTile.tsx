import { Tile } from '@/components/ui';
import { km, nf, pace, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { records } from '../lib/stats';

export function RecordsTile({ runs, size = '1:2' }: { runs: Run[]; size?: '1:2' }) {
  const r = records(runs);
  // La date d'abord : c'est elle qui reste visible quand le nom est tronqué.
  const meta = (run: Run) => `${shortDate(run.startDate)} · ${run.name}`;
  return (
    <Tile size={size} className="records" title="Records">
      <ul className="record-list">
        {!r ? <li className="empty">Aucune sortie sur la période</li> : (
          <>
            <RecordItem label="Plus longue sortie" value={`${km(r.longest.distance)} km`} meta={meta(r.longest)} />
            {r.fastest && (
              <RecordItem label="Plus rapide (5 km+)" value={`${pace(1000 / r.fastest.average_speed)} /km`} meta={meta(r.fastest)} />
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
