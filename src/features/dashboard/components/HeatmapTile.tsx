import { Tile } from '@/components/ui';
import { useElementSize } from '@/hooks/useElementSize';
import { addDays, startOfDay, startOfWeek } from '@/lib/dates';
import { km, MONTHS, shortDate } from '@/lib/format';
import type { Run } from '@/types/strava';
import { distancePerDay, heatLevel } from '../lib/stats';

/** Calendrier des sorties : 52 semaines (26 sur petit écran). */
export function HeatmapTile({ runs }: { runs: Run[] }) {
  const [ref, { width: w }] = useElementSize();
  const weeks = w > 0 && w < 480 ? 26 : 52;

  return (
    <Tile span={4} className="heatmap-tile" title="Calendrier des sorties" caption={`${weeks} dernières semaines`}>
      <div className="heatmap" ref={ref}>{w > 0 && <HeatmapSvg runs={runs} width={w} weeks={weeks} />}</div>
      <div className="legend" aria-hidden="true">
        <span>Moins</span><i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /><span>Plus</span>
      </div>
    </Tile>
  );
}

function HeatmapSvg({ runs, width: w, weeks }: { runs: Run[]; width: number; weeks: number }) {
  const perDay = distancePerDay(runs);
  const left = 18;
  const top = 14;
  const gap = 3;
  const cell = Math.max(4, (w - left - gap * (weeks - 1)) / weeks);
  const h = top + 7 * cell + 6 * gap;
  const first = addDays(startOfWeek(new Date()), -(weeks - 1) * 7);
  const today = startOfDay(new Date()).getTime();

  const cells = [];
  const months = [];
  let lastMonth = -1;
  for (let wk = 0; wk < weeks; wk++) {
    const x = left + wk * (cell + gap);
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
        <rect key={t} className={`l${heatLevel(m)}`} x={x} y={top + d * (cell + gap)} width={cell} height={cell}>
          <title>{`${shortDate(date)} ${date.getFullYear()} : ${m ? `${km(m)} km` : 'repos'}`}</title>
        </rect>,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Calendrier des sorties">
      {['L', 'M', 'V'].map((l, i) => (
        <text key={l} x="0" y={top + [0, 2, 4][i] * (cell + gap) + cell * 0.8}>{l}</text>
      ))}
      {months}
      {cells}
    </svg>
  );
}
