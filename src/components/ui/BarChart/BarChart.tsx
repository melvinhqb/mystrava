import { useElementSize } from '@/hooks/useElementSize';
import { EmptyState } from '../EmptyState';

export interface BarChartItem {
  label: string;
  value: number;
  /** Infobulle ; par défaut « label : valeur ». */
  title?: string;
}

export interface BarChartProps {
  items: BarChartItem[];
  /** Affiche une étiquette sur 1 barre sur n (peut dépendre de la largeur). */
  labelEvery?: number | ((width: number) => number);
  /** Affiche la valeur au-dessus de la barre maximale et de la dernière. */
  showValues?: boolean;
  format?: (v: number) => string;
}

/** Histogramme SVG qui s'adapte à la taille de son conteneur. */
export function BarChart({ items, labelEvery = 1, showValues = false, format = String }: BarChartProps) {
  const [ref, { width: w, height: h }] = useElementSize();
  const empty = !items.some((i) => i.value > 0);

  let svg = null;
  if (!empty && w > 0) {
    const every = typeof labelEvery === 'function' ? labelEvery(w) : labelEvery;
    const top = showValues ? 18 : 6;
    const bottom = 20;
    const max = Math.max(...items.map((i) => i.value));
    const slot = w / items.length;
    const bw = Math.max(4, Math.min(slot * 0.62, 42));
    const ch = h - top - bottom;
    svg = (
      <svg viewBox={`0 0 ${w} ${h}`} role="img">
        <line className="gridline" x1="0" x2={w} y1={top + ch} y2={top + ch} />
        {items.map((it, i) => {
          const bh = max ? Math.max(it.value > 0 ? 3 : 0, (it.value / max) * ch) : 0;
          const x = i * slot + (slot - bw) / 2;
          const y = top + ch - bh;
          return (
            <g key={i}>
              <rect className="bar" x={x} y={y} width={bw} height={bh} rx={Math.min(6, bw / 3)}>
                <title>{it.title ?? `${it.label} : ${format(it.value)}`}</title>
              </rect>
              {showValues && it.value > 0 && (it.value === max || i === items.length - 1) && (
                <text className="value-label" x={x + bw / 2} y={y - 5} textAnchor="middle">{format(it.value)}</text>
              )}
              {i % every === 0 && <text x={x + bw / 2} y={h - 4} textAnchor="middle">{it.label}</text>}
            </g>
          );
        })}
      </svg>
    );
  }

  return <div className="chart" ref={ref}>{empty ? <EmptyState /> : svg}</div>;
}
