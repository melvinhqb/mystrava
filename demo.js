// Données de démonstration : ~2 ans de course à pied générés de façon déterministe,
// au même format que la réponse de /api/dashboard.

window.makeDemoData = function makeDemoData() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const names = {
    easy: ['Footing du matin', 'Sortie tranquille', 'Récup en endurance', 'Footing bords de Seine', 'Petit tour du parc'],
    tempo: ['Tempo run', 'Allure seuil', 'Fractionné 6×1000 m', 'VMA 10×400 m', 'Côtes'],
    long: ['Sortie longue', 'Sortie longue du dimanche', 'Long run en forêt', 'Prépa semi'],
    race: ['Course 10 km', 'Semi-marathon', 'Trail des Crêtes'],
  };
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const pad = (n) => String(n).padStart(2, '0');

  const runs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = 730;
  let id = 9000000000;

  for (let d = days; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dow = date.getDay();
    const progress = 1 - d / days; // 0 → 1 : on progresse au fil du temps
    const winter = [11, 0, 1].includes(date.getMonth()) ? 0.15 : 0;
    const chance = { 0: 0.85, 2: 0.6, 4: 0.6, 6: 0.35 }[dow] ?? 0.12;
    if (rand() > chance - winter) continue;

    let kind = 'easy';
    if (dow === 0) kind = rand() < 0.08 ? 'race' : 'long';
    else if (dow === 2 || dow === 4) kind = rand() < 0.55 ? 'tempo' : 'easy';

    const base = { easy: 7, tempo: 9, long: 14 + progress * 6, race: rand() < 0.6 ? 10 : 21.1 }[kind];
    const km = kind === 'race' ? base : Math.max(3, base + (rand() - 0.5) * 4);
    const paceBase = 345 - progress * 25; // s/km
    const pace = paceBase + { easy: 20, tempo: -25, long: 15, race: -35 }[kind] + (rand() - 0.5) * 20;
    const hilly = rand() < 0.15;
    const hour = dow === 0 || dow === 6 ? 8 + Math.floor(rand() * 3) : rand() < 0.5 ? 7 : 19;

    runs.push({
      id: id++,
      name: kind === 'race' && km > 20 ? 'Semi-marathon' : pick(names[kind]),
      type: hilly ? 'TrailRun' : 'Run',
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(Math.floor(rand() * 60))}:00Z`,
      distance: Math.round(km * 1000),
      moving_time: Math.round(km * pace),
      elevation: Math.round(km * (hilly ? 35 + rand() * 30 : 4 + rand() * 8)),
      average_speed: 1000 / pace,
      average_heartrate: Math.round(145 + { easy: -8, tempo: 12, long: 0, race: 18 }[kind] + (rand() - 0.5) * 10),
      kudos: Math.floor(rand() * 25),
    });
  }
  // Meilleurs efforts : sur une distance plus courte que la sortie, on court un peu plus vite.
  const efforts = [['400m', 400], ['1/2 mile', 804.67], ['1K', 1000], ['1 mile', 1609.34], ['2 mile', 3218.69], ['5K', 5000],
    ['10K', 10000], ['15K', 15000], ['10 mile', 16093.4], ['20K', 20000], ['Half-Marathon', 21097.5]];
  for (const r of runs) {
    const pace = r.moving_time / (r.distance / 1000);
    r.efforts = Object.fromEntries(efforts
      .filter(([, m]) => m <= r.distance)
      .map(([key, m]) => [key, Math.round((m / 1000) * pace * Math.pow(m / r.distance, 0.06) * (0.97 + rand() * 0.06))]));
  }
  runs.reverse(); // plus récentes d'abord, comme l'API Strava

  const totals = (list) => ({
    count: list.length,
    distance: list.reduce((s, r) => s + r.distance, 0),
    moving_time: list.reduce((s, r) => s + r.moving_time, 0),
    elevation_gain: list.reduce((s, r) => s + r.elevation, 0),
  });
  const since = (n) => runs.filter((r) => Date.now() - new Date(r.date.slice(0, 10)) < n * 86400000);
  const yearStart = `${today.getFullYear()}-01-01`;

  return {
    athlete: { firstname: 'Coureur', lastname: 'Démo', profile: null, city: 'Paris' },
    stats: {
      all: totals(runs),
      ytd: totals(runs.filter((r) => r.date >= yearStart)),
      recent: totals(since(28)),
    },
    runs,
    fetchedAt: Date.now(),
    demo: true,
  };
};
