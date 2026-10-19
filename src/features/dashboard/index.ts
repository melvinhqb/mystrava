// API publique de la feature : le reste de l'application n'importe que depuis ce fichier.
export { Dashboard } from './components/Dashboard';
export { LayoutControls } from './components/LayoutControls';
export { PeriodSelector } from './components/PeriodSelector';
export { blocks, type BlockId, type BlockSize } from './blocks';
export { useDashboardLayout } from './hooks/useDashboardLayout';
export { defaultLayout, type DashboardLayout, type LayoutItem } from './layout';
export { DEFAULT_PERIOD, isPeriod } from './lib/periods';
