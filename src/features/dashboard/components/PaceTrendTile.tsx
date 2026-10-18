import { EmptyState, Tile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { MONTHS, pace } from '@/lib/format';
import type { Run } from '@/types/strava';
import { monthlyPace } from '../lib/stats';

export function PaceTrendTile({ runs }: { runs: Run[] }) {
  return (
    <Tile span={2} className="chart-tile" title="Évolution de l'allure" caption="moyenne mensuelle, min/km">
      <PaceChart runs={runs} />
    </Tile>
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
  const ticks = [0, 1, 2, 3].map((t) => lo + ((hi - lo) * t) / 3);
  const coords = months.flatMap((m, i) => (isFinite(m.pace) ? [[x(i), y(m.pace)]] : []));
  const line = coords.map((c) => c.join(',')).join(' ');
  const labelEvery = w < 420 ? 3 : 2;

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Allure moyenne mensuelle">
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
            {(i % labelEvery === 0 || i === months.length - 1) && (
              <text x={x(i)} y={h - 4} textAnchor="middle">{MONTHS[m.date.getMonth()]}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
