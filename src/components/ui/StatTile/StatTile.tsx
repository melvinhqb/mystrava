import type { ReactNode } from 'react';
import { Tile, type TileProps } from '../Tile';

export interface StatTileProps extends Omit<TileProps, 'title' | 'caption'> {
  label: string;
  value: ReactNode;
  /** Unité affichée en petit après la valeur. */
  unit?: string;
  /** Ligne d'information sous la valeur. */
  sub?: ReactNode;
}

/** Tuile d'indicateur : libellé, grande valeur et ligne de contexte. */
export function StatTile({ label, value, unit, sub, className, children, ...rest }: StatTileProps) {
  return (
    <Tile className={['kpi', className].filter(Boolean).join(' ')} {...rest}>
      <p className="label">{label}</p>
      <p className="value">
        {value}
        {unit && <small> {unit}</small>}
      </p>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </Tile>
  );
}
