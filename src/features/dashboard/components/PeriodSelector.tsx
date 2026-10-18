import { SegmentedControl } from '@/components/ui';
import type { Period } from '@/types/strava';
import { PERIODS } from '../lib/periods';

export interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return <SegmentedControl label="Période" options={PERIODS} value={value} onChange={onChange} />;
}
