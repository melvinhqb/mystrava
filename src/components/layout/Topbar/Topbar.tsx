import type { ReactNode } from 'react';
import { athleteName } from '@/lib/athlete';
import type { Athlete } from '@/types/strava';

export interface TopbarProps {
  athlete?: Athlete;
  demo?: boolean;
  /** Contrôles alignés à droite (sélecteur de période). */
  actions?: ReactNode;
}

export function Topbar({ athlete, demo = false, actions }: TopbarProps) {
  const name = athleteName(athlete);
  return (
    <header className="topbar">
      <div className="athlete">
        {athlete && (
          <span className="avatar" aria-hidden="true">
            {athlete.profile?.startsWith('http')
              ? <img src={athlete.profile} alt="" />
              : (athlete.firstname || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="athlete-name">{name || 'Course à pied'}</p>
          {athlete && (
            <p className="athlete-meta">{['Course à pied', athlete.city, demo && 'démo'].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      </div>
      {actions && <nav className="actions">{actions}</nav>}
    </header>
  );
}
