import { BarChart, Delta, StatTile, Tile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { km, nf, plural, shortDate } from '@/lib/format';
import type { Period, Run } from '@/types/strava';
import { periodDescription } from '../lib/periods';
import { sum, weeklyTotals } from '../lib/stats';

export interface DistanceTileProps {
  /** Sorties de la période. */
  runs: Run[];
  /** Sorties de la période précédente, null pour « Tout ». */
  prevRuns: Run[] | null;
  /** Toutes les sorties, pour les tendances hebdomadaires (par défaut `runs`). */
  allRuns?: Run[];
  period: Period;
  spanDays: number;
  /**
   * Format de la tuile (colonnes:lignes) :
   * - `1:1` : distance de la période et évolution ;
   * - `2:1` : + volume des 12 dernières semaines ;
   * - `2:2` : + tendance sur 26 semaines et moyennes par semaine et par sortie.
   */
  size?: '1:1' | '2:1' | '2:2';
}

/** Distance parcourue : la tuile principale, sur fond accentué quel que soit son format. */
export function DistanceTile({ runs, prevRuns, allRuns = runs, period, spanDays, size = '2:2' }: DistanceTileProps) {
  const dist = sum(runs, 'distance');
  const value = km(dist, dist >= 1e6 ? 0 : 1);
  const delta = prevRuns && <Delta current={dist} previous={sum(prevRuns, 'distance')} plain />;

  if (size !== '2:2') {
    return (
      <StatTile
        size={size}
        className={size === '2:1' ? 'hero kpi-wide' : 'hero'}
        label="Distance parcourue"
        value={value}
        unit="km"
        sub={delta || periodDescription(period)}
      >
        {size === '2:1' && <WeeklyBars runs={allRuns} />}
      </StatTile>
    );
  }

  return (
    <Tile size={size} className="hero hero-large">
      <p className="label">Distance parcourue</p>
      <p className="hero-value">{value}<small> km</small></p>
      <p className="hero-sub">
        {periodDescription(period)}
        {delta && <> · {delta}</>}
      </p>
      <Sparkline values={weeklyTotals(allRuns, 26).map((w) => w.distance)} />
      <dl className="hero-meta">
        <div><dt>Moy. / semaine</dt><dd>{km(dist / (spanDays / 7))} km</dd></div>
        <div><dt>Moy. / sortie</dt><dd>{runs.length ? `${km(dist / runs.length)} km` : '–'}</dd></div>
      </dl>
    </Tile>
  );
}

function WeeklyBars({ runs }: { runs: Run[] }) {
  const items = weeklyTotals(runs, 12).map((w) => ({
    label: `${w.start.getDate()}/${w.start.getMonth() + 1}`,
    value: w.distance / 1000,
    title: `Semaine du ${shortDate(w.start)} : ${km(w.distance)} km, ${plural(w.runs, 'sortie')}`,
  }));
  return (
    <BarChart
      items={items}
      showValues
      labelEvery={(w) => (w < 420 ? 2 : 1)}
      format={(v) => nf(v < 100 ? 1 : 0).format(v)}
    />
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
