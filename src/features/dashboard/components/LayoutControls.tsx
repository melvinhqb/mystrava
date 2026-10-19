export interface LayoutControlsProps {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  /** Revient à la disposition par défaut. */
  onReset: () => void;
}

/** Boutons de la barre du haut pour entrer et sortir du mode personnalisation. */
export function LayoutControls({ editing, onEditingChange, onReset }: LayoutControlsProps) {
  if (!editing) {
    return <button type="button" className="btn-pill" onClick={() => onEditingChange(true)}>Personnaliser</button>;
  }
  return (
    <>
      <button
        type="button"
        className="btn-pill"
        onClick={() => window.confirm('Revenir à la disposition par défaut ?') && onReset()}
      >
        Réinitialiser
      </button>
      <button type="button" className="btn-pill primary" onClick={() => onEditingChange(false)}>Terminer</button>
    </>
  );
}
