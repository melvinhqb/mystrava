// Format de data.json, produit par scripts/fetch-strava.ts et lu par la page.

export type RunType = 'Run' | 'TrailRun' | 'VirtualRun';

/** Sortie telle que publiée dans data.json (sous-ensemble d'une activité Strava). */
export interface RawRun {
  id: number;
  name: string;
  type: RunType | string;
  /** start_date_local : heure locale suffixée d'un « Z ». */
  date: string;
  /** mètres */
  distance: number;
  /** secondes */
  moving_time: number;
  /** mètres de dénivelé positif */
  elevation: number;
  /** m/s */
  average_speed: number;
  average_heartrate: number | null;
  kudos: number;
}

/** Totaux renvoyés par /athletes/{id}/stats. */
export interface Totals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time?: number;
  elevation_gain: number;
  achievement_count?: number;
}

export interface Athlete {
  id?: number;
  firstname?: string;
  lastname?: string;
  profile?: string | null;
  city?: string | null;
}

export interface AthleteStats {
  all: Totals;
  ytd: Totals;
  recent: Totals;
}

export interface StravaData {
  athlete: Athlete;
  stats: AthleteStats;
  runs: RawRun[];
  fetchedAt: number;
  demo?: boolean;
}

/** Sortie enrichie de sa date locale, utilisée par les calculs. */
export interface Run extends RawRun {
  startDate: Date;
}

export interface DashboardData extends Omit<StravaData, 'runs'> {
  /** Plus récentes d'abord. */
  runs: Run[];
}

export type Period = '30' | '90' | '365' | 'all';
