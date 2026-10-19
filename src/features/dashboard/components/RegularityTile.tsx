import { StatTile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { addDays, startOfDay, startOfWeek } from '@/lib/dates';
import { km, MONTHS, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { distancePerDay, heatLevel, streaks, weeklyTotals } from '../lib/stats';

export interface RegularityTileProps {
  /** Toutes les sorties. */
  runs: Run[];
  /**
   * Format de la tuile (colonnes:lignes) :
   * - `1:1` : série en cours et 12 dernières semaines ;
   * - `2:1` : + calendrier des sorties sur quelques mois ;
   * - `2:2` : calendrier plus grand et légende ;
   * - `4:1` : calendrier sur un an et plus.
   */
  size?: '1:1' | '2:1' | '2:2' | '4:1';
}

/** Régularité : semaines consécutives avec au moins une sortie, puis calendrier jour par jour. */
export function RegularityTile({ runs, size = '1:1' }: RegularityTileProps) {
  const { current, best } = streaks(runs);
  const className = { '1:1': 'streak', '2:1': 'streak kpi-wide', '2:2': 'streak kpi-large', '4:1': 'streak kpi-wide' }[size];
  return (
    <StatTile
      size={size}
      className={className}
      label="Régularité"
      value={current}
      unit="sem."
      sub={`consécutives · record : ${best}`}
    >
      {size === '1:1' ? (
        <div className="week-dots" aria-hidden="true">
          {weeklyTotals(runs, 12).map((w) => <i key={w.start.getTime()} className={w.runs ? 'on' : ''} />)}
        </div>
      ) : (
        <Heatmap runs={runs} />
      )}
      {(size === '2:2' || size === '4:1') && <HeatLegend />}
    </StatTile>
  );
}

function HeatLegend() {
  return (
    <span className="legend" aria-hidden="true">
      <span>Moins</span><i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /><span>Plus</span>
    </span>
  );
}

const LEFT = 18;
const TOP = 14;
const GAP = 3;
/** Taille maximale d'une case, pour que les grands formats montrent plus de semaines plutôt que de grosses cases. */
const MAX_CELL = 24;

/** Calendrier des sorties : autant de semaines que la place en contient, deux ans au plus. */
function Heatmap({ runs }: { runs: Run[] }) {
  const [ref, { width: w, height: h }] = useElementSize();
  // Case limitée par la hauteur disponible, puis nombre de semaines qui tiennent en largeur.
  const maxCell = Math.max(4, Math.min(MAX_CELL, (h - TOP - 6 * GAP) / 7));
  const weeks = Math.max(1, Math.min(104, Math.floor((w - LEFT + GAP) / (maxCell + GAP))));
  const cell = Math.min(maxCell, (w - LEFT - GAP * (weeks - 1)) / weeks);
  return <div className="chart heatmap" ref={ref}>{w > 0 && <HeatmapSvg runs={runs} width={w} weeks={weeks} cell={cell} />}</div>;
}

function HeatmapSvg({ runs, width: w, weeks, cell }: { runs: Run[]; width: number; weeks: number; cell: number }) {
  const perDay = distancePerDay(runs);
  const h = TOP + 7 * cell + 6 * GAP;
  const first = addDays(startOfWeek(new Date()), -(weeks - 1) * 7);
  const today = startOfDay(new Date()).getTime();

  const cells = [];
  const months = [];
  let lastMonth = -1;
  for (let wk = 0; wk < weeks; wk++) {
    const x = LEFT + wk * (cell + GAP);
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, wk * 7 + d);
      const t = date.getTime();
      if (t > today) continue;
      if (d === 0 && date.getMonth() !== lastMonth && date.getDate() <= 7) {
        lastMonth = date.getMonth();
        months.push(<text key={`m${wk}`} x={x} y="9">{MONTHS[lastMonth]}</text>);
      }
      const m = perDay.get(t) ?? 0;
      cells.push(
        <rect key={t} className={`l${heatLevel(m)}`} x={x} y={TOP + d * (cell + GAP)} width={cell} height={cell}>
          <title>{`${shortDate(date)} ${date.getFullYear()} : ${m ? `${km(m)} km` : 'repos'}`}</title>
        </rect>,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Calendrier des sorties des ${weeks} dernières semaines`}>
      {['L', 'M', 'V'].map((l, i) => (
        <text key={l} x="0" y={TOP + [0, 2, 4][i] * (cell + GAP) + cell * 0.8}>{l}</text>
      ))}
      {months}
      {cells}
    </svg>
  );
}
