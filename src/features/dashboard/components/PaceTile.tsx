import { EmptyState, StatTile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { MONTHS, nf, pace } from '@/lib/format';
import type { Run } from '@/types/strava';
import { monthlyPace, paceByDistance, paceOf, records } from '../lib/stats';

export interface PaceTileProps {
  /** Sorties de la période. */
  runs: Run[];
  /** Sorties de la période précédente, null pour « Tout ». */
  prevRuns: Run[] | null;
  /** Toutes les sorties, pour la courbe mensuelle sur 12 mois (par défaut `runs`). */
  allRuns?: Run[];
  /**
   * Format de la tuile (colonnes:lignes) :
   * - `1:1` : allure moyenne et écart avec la période précédente ;
   * - `2:1` : + courbe de l'allure mensuelle ;
   * - `2:2` : + record et allure par tranche de distance.
   */
  size?: '1:1' | '2:1' | '2:2';
}

export function PaceTile({ runs, prevRuns, allRuns = runs, size = '1:1' }: PaceTileProps) {
  const p = paceOf(runs);
  const className = { '1:1': 'pace', '2:1': 'pace kpi-wide', '2:2': 'pace kpi-large' }[size];
  return (
    <StatTile
      size={size}
      className={className}
      label="Allure moyenne"
      value={pace(p)}
      unit="/km"
      sub={<PaceDelta pace={p} previous={prevRuns ? paceOf(prevRuns) : NaN} />}
    >
      {size !== '1:1' && <PaceChart runs={allRuns} />}
      {size === '2:2' && <PaceDetails runs={runs} />}
    </StatTile>
  );
}

function PaceDelta({ pace: p, previous }: { pace: number; previous: number }) {
  if (!isFinite(p)) return null;
  if (!isFinite(previous)) return <>{nf(1).format(3600 / p)} km/h</>;
  const diff = Math.round(previous - p);
  if (diff === 0) return <>Stable vs période préc.</>;
  return (
    <>
      <span className={diff > 0 ? 'delta-up' : 'delta-down'}>{diff > 0 ? '−' : '+'}{Math.abs(diff)} s/km</span> vs période préc.
    </>
  );
}

/** Meilleure allure sur 5 km et plus, puis allure moyenne par tranche de distance. */
function PaceDetails({ runs }: { runs: Run[] }) {
  const fastest = records(runs)?.fastest;
  return (
    <dl className="pace-details">
      <div className="best" title="Meilleure allure sur une sortie de 5 km et plus">
        <dt>Record</dt>
        <dd>{fastest ? pace(1000 / fastest.average_speed) : '–'}</dd>
      </div>
      {paceByDistance(runs).map((b) => (
        <div key={b.label} title={`${b.label} km : ${b.count} sortie${b.count > 1 ? 's' : ''}`}>
          <dt>{b.label} km</dt>
          <dd>{pace(b.pace)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PaceChart({ runs }: { runs: Run[] }) {
  const [ref, { width: w, height: h }] = useElementSize();
  const months = monthlyPace(runs);
  const pts = months.filter((m) => isFinite(m.pace));

  if (pts.length < 2) return <div className="chart" ref={ref}><EmptyState>Pas assez de données</EmptyState></div>;
  if (w === 0) return <div className="chart" ref={ref} />;

  const left = 38;
  const top = 12;
  const bottom = 20;
  const vals = pts.map((m) => m.pace);
  const lo = Math.floor((Math.min(...vals) - 5) / 15) * 15;
  const hi = Math.ceil((Math.max(...vals) + 5) / 15) * 15;
  const ch = h - top - bottom;
  const step = (w - left - 8) / (months.length - 1);
  // Axe inversé : plus haut = plus rapide.
  const y = (v: number) => top + ((v - lo) / (hi - lo)) * ch;
  const x = (i: number) => left + i * step;
  // Moins de graduations quand la courbe est basse (format large sur mobile).
  const steps = ch < 90 ? 1 : 3;
  const ticks = Array.from({ length: steps + 1 }, (_, t) => lo + ((hi - lo) * t) / steps);
  const coords = months.flatMap((m, i) => (isFinite(m.pace) ? [[x(i), y(m.pace)]] : []));
  const line = coords.map((c) => c.join(',')).join(' ');
  // Un mois sur `labelEvery`, calé sur le dernier pour qu'il soit toujours affiché sans chevauchement.
  const labelEvery = Math.max(2, Math.ceil((34 * months.length) / (w - left)));

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Allure moyenne mensuelle sur 12 mois">
        {ticks.map((v) => (
          <g key={v}>
            <line className="gridline" x1={left} x2={w} y1={y(v)} y2={y(v)} />
            <text x="0" y={y(v) + 4}>{pace(v)}</text>
          </g>
        ))}
        <polygon className="area" points={`${coords[0][0]},${top + ch} ${line} ${coords[coords.length - 1][0]},${top + ch}`} />
        <polyline className="line" points={line} />
        {months.map((m, i) => (
          <g key={i}>
            {isFinite(m.pace) && (
              <circle className="dot" cx={x(i)} cy={y(m.pace)} r="4">
                <title>{`${MONTHS[m.date.getMonth()]} ${m.date.getFullYear()} : ${pace(m.pace)} /km (${m.count} sorties)`}</title>
              </circle>
            )}
            {(months.length - 1 - i) % labelEvery === 0 && (
              <text x={x(i)} y={h - 4} textAnchor="middle">{MONTHS[m.date.getMonth()]}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
