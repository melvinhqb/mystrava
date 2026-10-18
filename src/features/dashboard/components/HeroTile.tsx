import { Delta, Tile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { km } from '@/lib/format';
import type { Period, Run } from '@/types/strava';
import { periodDescription } from '../lib/periods';
import { sum, weeklyTotals } from '../lib/stats';

export interface HeroTileProps {
  /** Sorties de la période. */
  runs: Run[];
  /** Sorties de la période précédente, null pour « Tout ». */
  prevRuns: Run[] | null;
  /** Toutes les sorties, pour la tendance sur 26 semaines. */
  allRuns: Run[];
  period: Period;
  spanDays: number;
}

/** Tuile principale : distance de la période et tendance hebdomadaire. */
export function HeroTile({ runs, prevRuns, allRuns, period, spanDays }: HeroTileProps) {
  const dist = sum(runs, 'distance');
  return (
    <Tile span={2} rows={2} className="hero">
      <p className="label">Distance parcourue</p>
      <p className="hero-value">{km(dist, dist >= 1e6 ? 0 : 1)}<small> km</small></p>
      <p className="hero-sub">
        {periodDescription(period)}
        {prevRuns && <> · <Delta current={dist} previous={sum(prevRuns, 'distance')} plain /></>}
      </p>
      <Sparkline values={weeklyTotals(allRuns, 26).map((w) => w.distance)} />
      <dl className="hero-meta">
        <div><dt>Moy. / semaine</dt><dd>{km(dist / (spanDays / 7))} km</dd></div>
        <div><dt>Moy. / sortie</dt><dd>{runs.length ? `${km(dist / runs.length)} km` : '–'}</dd></div>
      </dl>
    </Tile>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const [ref, { width: w, height: h }] = useElementSize();
  let svg = null;
  if (w > 0 && values.length > 1) {
    const max = Math.max(1, ...values);
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => [i * step, h - 4 - (v / max) * (h - 12)]);
    const line = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    const [lx, ly] = pts[pts.length - 1];
    svg = (
      <svg viewBox={`0 0 ${w} ${h}`}>
        <polygon points={`0,${h} ${line} ${w},${h}`} fill="rgba(255,255,255,.18)" />
        <polyline points={line} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lx} cy={ly} r="4.5" fill="#fff" />
      </svg>
    );
  }
  return <div className="hero-spark" ref={ref} aria-hidden="true">{svg}</div>;
}
