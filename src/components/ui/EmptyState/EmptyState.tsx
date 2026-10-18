import type { ReactNode } from 'react';

export function EmptyState({ children = 'Aucune sortie sur la période' }: { children?: ReactNode }) {
  return <div className="empty">{children}</div>;
}
