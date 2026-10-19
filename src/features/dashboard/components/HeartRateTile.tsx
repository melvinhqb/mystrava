import { EmptyState, StatTile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { plural, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { averageHeartRate, heartRateSeries } from '../lib/stats';

export interface HeartRateTileProps {
  /** Sorties de la période, plus récentes d'abord. */
  runs: Run[];
  /**
   * Format de la tuile (colonnes:lignes) :
   * - `1:1` : moyenne seule ;
   * - `2:1` : moyenne et courbe de la fréquence moyenne par séance.
   */
  size?: '1:1' | '2:1';
}

export function HeartRateTile({ runs, size = '1:1' }: HeartRateTileProps) {
  const hr = averageHeartRate(runs);
  const wide = size !== '1:1';
  return (
    <StatTile
      size={size}
      className={wide ? 'hr kpi-wide' : 'hr'}
      label="Fréquence cardiaque"
      value={hr ? Math.round(hr.bpm) : '–'}
      unit={hr ? 'bpm' : undefined}
      sub={hr ? `Moyenne sur ${plural(hr.count, 'sortie')}` : 'Pas de données cardio'}
    >
      {wide && <HeartRateChart runs={runs} average={hr?.bpm} />}
    </StatTile>
  );
}

function HeartRateChart({ runs, average }: { runs: Run[]; average?: number }) {
  const [ref, { width: w, height: h }] = useElementSize();
  const series = heartRateSeries(runs);

  if (series.length < 2) return <div className="chart" ref={ref}><EmptyState>Pas assez de données cardio</EmptyState></div>;
  if (w === 0) return <div className="chart" ref={ref} />;

  const left = 30;
  const top = 8;
  const bottom = 20;
  const vals = series.map((p) => p.bpm);
  const lo = Math.floor((Math.min(...vals) - 2) / 10) * 10;
  const hi = Math.ceil((Math.max(...vals) + 2) / 10) * 10;
  const ch = h - top - bottom;
  const step = (w - left - 6) / (series.length - 1);
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo)) * ch;
  const x = (i: number) => left + i * step;
  const ticks = [lo, (lo + hi) / 2, hi];
  const line = series.map((p, i) => `${x(i)},${y(p.bpm)}`).join(' ');
  const first = series[0].run.startDate;
  const last = series[series.length - 1].run.startDate;

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Fréquence cardiaque moyenne des ${series.length} dernières séances`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="gridline" x1={left} x2={w} y1={y(v)} y2={y(v)} />
            <text x="0" y={y(v) + 4}>{Math.round(v)}</text>
          </g>
        ))}
        {average && <line className="avg-line" x1={left} x2={w} y1={y(average)} y2={y(average)} />}
        <polyline className="line" points={line} />
        {series.map((p, i) => (
          <circle key={p.run.id} className="dot" cx={x(i)} cy={y(p.bpm)} r="3">
            <title>{`${shortDate(p.run.startDate)} · ${p.run.name} : ${Math.round(p.bpm)} bpm`}</title>
          </circle>
        ))}
        <text x={left} y={h - 4}>{shortDate(first)}</text>
        <text x={w} y={h - 4} textAnchor="end">{shortDate(last)}</text>
      </svg>
    </div>
  );
}
