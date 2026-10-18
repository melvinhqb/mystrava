import type { Athlete } from '@/types/strava';

export const athleteName = (a?: Athlete) => `${a?.firstname ?? ''} ${a?.lastname ?? ''}`.trim();
