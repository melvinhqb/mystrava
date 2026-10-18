/** Écran affiché tant que data.json n'a pas été généré. */
export function WelcomeScreen() {
  return (
    <section className="welcome">
      <div className="tile welcome-hero">
        <p className="eyebrow">Tableau de bord course à pied</p>
        <h1>Données bientôt<br />disponibles.</h1>
        <p className="muted">
          Les sorties Strava n'ont pas encore été synchronisées. Relancez la GitHub Action
          « Déploiement GitHub Pages ».
        </p>
      </div>
    </section>
  );
}
