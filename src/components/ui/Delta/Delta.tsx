export interface DeltaProps {
  current: number;
  previous: number;
  /** Sans couleur (sur fond accentué). */
  plain?: boolean;
}

/** Évolution en % par rapport à la période précédente. */
export function Delta({ current, previous, plain = false }: DeltaProps) {
  if (!previous) return null;
  const p = Math.round(((current - previous) / previous) * 100);
  const className = plain ? undefined : p >= 0 ? 'delta-up' : 'delta-down';
  return (
    <>
      <span className={className} style={plain ? { fontWeight: 700 } : undefined}>
        {p >= 0 ? '+' : ''}{p} %
      </span>{' '}
      vs période préc.
    </>
  );
}
