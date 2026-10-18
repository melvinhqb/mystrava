const REPO_URL = 'https://github.com/melvinhqb/mystrava';

export function Footer({ info }: { info?: string }) {
  return (
    <footer className="footer">
      <span>
        Données fournies par Strava ·{' '}
        <a className="small-link" href={REPO_URL} target="_blank" rel="noopener">Code source sur GitHub ↗</a>
      </span>
      {info && <span>{info}</span>}
    </footer>
  );
}
