import { Tile } from '@/components/ui';
import { duration, km, MONTHS, nf, pace } from '@/lib/format';
import type { Run } from '@/types/strava';

export interface RecentRunsTileProps {
  /** Plus récentes d'abord ; seules les 7 premières sont affichées. */
  runs: Run[];
  athleteId?: number;
  /** En démo, les liens vers Strava sont désactivés. */
  demo?: boolean;
  /** Format de la tuile (colonnes:lignes). */
  size?: '2:2';
}

export function RecentRunsTile({ runs, athleteId, demo = false, size = '2:2' }: RecentRunsTileProps) {
  const profile = athleteId ? `https://www.strava.com/athletes/${encodeURIComponent(athleteId)}` : 'https://www.strava.com/';
  return (
    <Tile
      size={size}
      className="recent"
      title="Dernières sorties"
      caption={<a className="muted small-link" href={profile} target="_blank" rel="noopener">Tout voir ↗</a>}
    >
      <ol className="run-list">
        {runs.length === 0 && <li className="empty">Aucune sortie</li>}
        {runs.slice(0, 7).map((r) => (
          <li key={r.id}>
            <a
              href={demo ? '#' : `https://www.strava.com/activities/${encodeURIComponent(r.id)}`}
              {...(demo ? {} : { target: '_blank', rel: 'noopener' })}
            >
              <span className="run-date">
                <span><b>{r.startDate.getDate()}</b><span>{MONTHS[r.startDate.getMonth()]}</span></span>
              </span>
              <span className="run-text">
                <span className="run-name">{r.name}</span>
                <span className="run-meta">
                  {duration(r.moving_time)} · {pace(1000 / r.average_speed)} /km
                  {r.average_heartrate ? ` · ${Math.round(r.average_heartrate)} bpm` : ''}
                </span>
              </span>
              <span className="run-dist">
                {km(r.distance)} km<small>{nf().format(Math.round(r.elevation))} m D+</small>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </Tile>
  );
}
