// Tableau de bord course à pied : calcule les statistiques et dessine les tuiles bento.

const $ = (id) => document.getElementById(id);
const DAY = 86400000;
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const state = { data: null, period: '365', mounts: [] };

// ---------- Formatage ----------

const nf = (digits = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const km = (m, digits = 1) => nf(digits).format(m / 1000);

function duration(s) {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${nf().format(h)} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

function pace(secPerKm) {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '–';
  const total = Math.round(secPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const paceOf = (runs) => {
  const d = runs.reduce((s, r) => s + r.distance, 0);
  return d ? runs.reduce((s, r) => s + r.moving_time, 0) / (d / 1000) : NaN;
};

const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// start_date_local est l'heure locale suffixée d'un « Z » : on l'interprète sans décalage.
function localDate(str) {
  const [y, mo, d, h = 0, mi = 0] = str.match(/\d+/g).map(Number);
  return new Date(y, mo - 1, d, h, mi);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // lundi
  return x;
}

const weekKey = (d) => startOfWeek(d).getTime();
const dayKey = (d) => startOfDay(d).getTime();

function delta(current, previous) {
  if (!previous) return '';
  const p = Math.round(((current - previous) / previous) * 100);
  const cls = p >= 0 ? 'delta-up' : 'delta-down';
  return `<span class="${cls}">${p >= 0 ? '+' : ''}${p} %</span> vs période préc.`;
}

// ---------- Rendu SVG adaptatif ----------

// Redessine un graphique à chaque changement de taille de son conteneur.
function mount(el, draw) {
  const render = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w > 0) el.innerHTML = draw(w, h);
  };
  const ro = new ResizeObserver(render);
  ro.observe(el);
  state.mounts.push(ro);
  render();
}

function barChart(items, { w, h, labelEvery = 1, showValues = false, format = (v) => v }) {
  if (!items.some((i) => i.value > 0)) return '<div class="empty">Aucune sortie sur la période</div>';
  const top = showValues ? 18 : 6;
  const bottom = 20;
  const max = Math.max(...items.map((i) => i.value));
  const slot = w / items.length;
  const bw = Math.max(4, Math.min(slot * 0.62, 42));
  const ch = h - top - bottom;
  let svg = `<svg viewBox="0 0 ${w} ${h}" role="img">`;
  svg += `<line class="gridline" x1="0" x2="${w}" y1="${top + ch}" y2="${top + ch}"/>`;
  items.forEach((it, i) => {
    const bh = max ? Math.max(it.value > 0 ? 3 : 0, (it.value / max) * ch) : 0;
    const x = i * slot + (slot - bw) / 2;
    const y = top + ch - bh;
    svg += `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${Math.min(6, bw / 3)}"><title>${escapeHtml(it.title || `${it.label} : ${format(it.value)}`)}</title></rect>`;
    if (showValues && it.value > 0 && (it.value === max || i === items.length - 1)) {
      svg += `<text class="value-label" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${format(it.value)}</text>`;
    }
    if (i % labelEvery === 0) {
      svg += `<text x="${x + bw / 2}" y="${h - 4}" text-anchor="middle">${escapeHtml(it.label)}</text>`;
    }
  });
  return svg + '</svg>';
}

// ---------- Calculs ----------

function periodBounds(period) {
  const end = Date.now();
  if (period === 'all') return { start: -Infinity, end, prevStart: null };
  const days = Number(period);
  return { start: end - days * DAY, end, prevStart: end - 2 * days * DAY };
}

function weeklyTotals(runs, count) {
  const current = startOfWeek(new Date());
  const weeks = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    weeks.push({ start: d, distance: 0, runs: 0 });
  }
  const byKey = new Map(weeks.map((w) => [w.start.getTime(), w]));
  for (const r of runs) {
    const w = byKey.get(weekKey(r._date));
    if (w) { w.distance += r.distance; w.runs++; }
  }
  return weeks;
}

function streaks(runs) {
  const weeks = new Set(runs.map((r) => weekKey(r._date)));
  const prev = (t) => { const d = new Date(t); d.setDate(d.getDate() - 7); return startOfWeek(d).getTime(); };

  // La semaine en cours compte si elle a déjà une sortie, sinon la série démarre la semaine précédente.
  let cursor = weekKey(new Date());
  if (!weeks.has(cursor)) cursor = prev(cursor);
  let current = 0;
  while (weeks.has(cursor)) { current++; cursor = prev(cursor); }

  let best = 0;
  for (const w of weeks) {
    if (weeks.has(prev(w))) continue; // pas un début de série
    let len = 0;
    let t = w;
    while (weeks.has(t)) { len++; const d = new Date(t); d.setDate(d.getDate() + 7); t = startOfWeek(d).getTime(); }
    best = Math.max(best, len);
  }
  return { current, best };
}

// ---------- Tuiles ----------

function renderAthlete(data) {
  const a = data.athlete;
  const img = a.profile && a.profile.startsWith('http') ? `<img src="${escapeHtml(a.profile)}" alt="">` : '';
  $('athlete').innerHTML = `${img}<span><strong>${escapeHtml(`${a.firstname || ''} ${a.lastname || ''}`.trim())}</strong>${a.city ? ` · ${escapeHtml(a.city)}` : ''}${data.demo ? ' · <em>démo</em>' : ''}</span>`;
  $('athlete').hidden = false;
}

function renderKpis(runs, prevRuns, bounds) {
  const dist = runs.reduce((s, r) => s + r.distance, 0);
  const time = runs.reduce((s, r) => s + r.moving_time, 0);
  const elev = runs.reduce((s, r) => s + r.elevation, 0);
  const prevDist = prevRuns ? prevRuns.reduce((s, r) => s + r.distance, 0) : 0;
  const first = runs.length ? runs[runs.length - 1]._date.getTime() : Date.now();
  const spanDays = Math.max(7, (bounds.end - (isFinite(bounds.start) ? bounds.start : first)) / DAY);

  $('kpi-distance').textContent = km(dist, dist >= 1e6 ? 0 : 1);
  $('kpi-period').innerHTML = {
    30: '30 derniers jours', 90: '90 derniers jours', 365: '12 derniers mois', all: 'depuis la première sortie',
  }[state.period] + (prevRuns ? ` · ${delta(dist, prevDist).replace(/class="delta-(up|down)"/, 'style="font-weight:700"')}` : '');
  $('kpi-week-avg').textContent = `${km(dist / (spanDays / 7))} km`;
  $('kpi-run-avg').textContent = runs.length ? `${km(dist / runs.length)} km` : '–';

  $('kpi-runs').textContent = nf().format(runs.length);
  $('kpi-runs-sub').innerHTML = prevRuns ? delta(runs.length, prevRuns.length) : `${nf(1).format(runs.length / (spanDays / 7))} par semaine`;

  $('kpi-time').textContent = duration(time);
  $('kpi-time-sub').textContent = runs.length ? `${duration(time / runs.length)} par sortie` : '';

  const p = paceOf(runs);
  const prevP = prevRuns ? paceOf(prevRuns) : NaN;
  $('kpi-pace').innerHTML = `${pace(p)}<small> /km</small>`;
  if (isFinite(p) && isFinite(prevP)) {
    const diff = Math.round(prevP - p);
    const cls = diff >= 0 ? 'delta-up' : 'delta-down';
    $('kpi-pace-sub').innerHTML = `<span class="${cls}">${diff >= 0 ? '−' : '+'}${Math.abs(diff)} s/km</span> vs période préc.`;
  } else {
    $('kpi-pace-sub').textContent = isFinite(p) ? `${nf(1).format(3600 / p)} km/h` : '';
  }

  $('kpi-elev').innerHTML = `${nf().format(Math.round(elev))}<small> m</small>`;
  $('kpi-elev-sub').textContent = dist ? `${nf().format(Math.round(elev / (dist / 1000) * 10))} m / 10 km` : '';
}

function renderHeroSpark(allRuns) {
  const weeks = weeklyTotals(allRuns, 26);
  mount($('hero-spark'), (w, h) => {
    const max = Math.max(1, ...weeks.map((x) => x.distance));
    const step = w / (weeks.length - 1);
    const pts = weeks.map((x, i) => [i * step, h - 4 - (x.distance / max) * (h - 12)]);
    const line = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    const last = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${w} ${h}">
      <polygon points="0,${h} ${line} ${w},${h}" fill="rgba(255,255,255,.18)"/>
      <polyline points="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="#fff"/>
    </svg>`;
  });
}

function renderWeekly(allRuns) {
  const weeks = weeklyTotals(allRuns, 12);
  const items = weeks.map((x) => ({
    label: `${x.start.getDate()}/${x.start.getMonth() + 1}`,
    value: x.distance / 1000,
    title: `Semaine du ${shortDate(x.start)} : ${km(x.distance)} km, ${x.runs} sortie${x.runs > 1 ? 's' : ''}`,
  }));
  mount($('chart-weekly'), (w, h) => barChart(items, {
    w, h, showValues: true, labelEvery: w < 420 ? 2 : 1, format: (v) => `${nf(v < 100 ? 1 : 0).format(v)}`,
  }));
}

function renderPaceTrend(allRuns) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = allRuns.filter((r) => r._date.getFullYear() === d.getFullYear() && r._date.getMonth() === d.getMonth());
    months.push({ d, pace: paceOf(inMonth), n: inMonth.length });
  }
  const pts = months.filter((m) => isFinite(m.pace));
  mount($('chart-pace'), (w, h) => {
    if (pts.length < 2) return '<div class="empty">Pas assez de données</div>';
    const left = 38;
    const top = 12;
    const bottom = 20;
    const vals = pts.map((m) => m.pace);
    const lo = Math.floor((Math.min(...vals) - 5) / 15) * 15;
    const hi = Math.ceil((Math.max(...vals) + 5) / 15) * 15;
    const ch = h - top - bottom;
    const step = (w - left - 8) / (months.length - 1);
    // Axe inversé : plus haut = plus rapide.
    const y = (v) => top + ((v - lo) / (hi - lo)) * ch;
    const x = (i) => left + i * step;
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Allure moyenne mensuelle">`;
    const ticks = 3;
    for (let t = 0; t <= ticks; t++) {
      const v = lo + ((hi - lo) * t) / ticks;
      svg += `<line class="gridline" x1="${left}" x2="${w}" y1="${y(v)}" y2="${y(v)}"/><text x="0" y="${y(v) + 4}">${pace(v)}</text>`;
    }
    const coords = months.map((m, i) => (isFinite(m.pace) ? [x(i), y(m.pace)] : null)).filter(Boolean);
    const line = coords.map((c) => c.join(',')).join(' ');
    svg += `<polygon class="area" points="${coords[0][0]},${top + ch} ${line} ${coords[coords.length - 1][0]},${top + ch}"/>`;
    svg += `<polyline class="line" points="${line}"/>`;
    months.forEach((m, i) => {
      if (isFinite(m.pace)) {
        svg += `<circle class="dot" cx="${x(i)}" cy="${y(m.pace)}" r="4"><title>${MONTHS[m.d.getMonth()]} ${m.d.getFullYear()} : ${pace(m.pace)} /km (${m.n} sorties)</title></circle>`;
      }
      if (i % (w < 420 ? 3 : 2) === 0 || i === months.length - 1) {
        svg += `<text x="${x(i)}" y="${h - 4}" text-anchor="middle">${MONTHS[m.d.getMonth()]}</text>`;
      }
    });
    return svg + '</svg>';
  });
}

function renderRecords(runs) {
  const list = $('records');
  if (!runs.length) { list.innerHTML = '<li class="empty">Aucune sortie sur la période</li>'; return; }
  const longest = runs.reduce((a, b) => (b.distance > a.distance ? b : a));
  const fastPool = runs.filter((r) => r.distance >= 5000);
  const fastest = fastPool.length ? fastPool.reduce((a, b) => (b.average_speed > a.average_speed ? b : a)) : null;
  const climb = runs.reduce((a, b) => (b.elevation > a.elevation ? b : a));
  const weeks = new Map();
  for (const r of runs) weeks.set(weekKey(r._date), (weeks.get(weekKey(r._date)) || 0) + r.distance);
  const [bestWeek, bestWeekDist] = [...weeks].reduce((a, b) => (b[1] > a[1] ? b : a));

  const item = (label, value, meta) => `<li><span class="r-label">${label}</span><span class="r-value">${value}</span><span class="r-meta">${meta}</span></li>`;
  const meta = (r) => `${escapeHtml(r.name)} · ${shortDate(r._date)}`;
  list.innerHTML = [
    item('Plus longue sortie', `${km(longest.distance)} km`, meta(longest)),
    fastest ? item('Allure la plus rapide (≥ 5 km)', `${pace(1000 / fastest.average_speed)} /km`, meta(fastest)) : '',
    item('Plus gros dénivelé', `${nf().format(Math.round(climb.elevation))} m`, meta(climb)),
    item('Meilleure semaine', `${km(bestWeekDist)} km`, `Semaine du ${shortDate(new Date(bestWeek))}`),
  ].join('');
}

function renderStreak(allRuns) {
  const { current, best } = streaks(allRuns);
  $('streak-current').innerHTML = `${current}<small> sem.</small>`;
  $('streak-best').textContent = `Semaines consécutives avec au moins une sortie · record : ${best}`;
  $('streak-dots').innerHTML = weeklyTotals(allRuns, 12).map((w) => `<i class="${w.runs ? 'on' : ''}"></i>`).join('');
}

function renderHeartRate(runs) {
  const withHr = runs.filter((r) => r.average_heartrate);
  if (!withHr.length) {
    $('kpi-hr').textContent = '–';
    $('kpi-hr-sub').textContent = 'Aucune donnée cardio sur la période';
    return;
  }
  const time = withHr.reduce((s, r) => s + r.moving_time, 0);
  const avg = withHr.reduce((s, r) => s + r.average_heartrate * r.moving_time, 0) / time;
  $('kpi-hr').innerHTML = `${Math.round(avg)}<small> bpm</small>`;
  $('kpi-hr-sub').textContent = `Moyenne pondérée sur ${withHr.length} sortie${withHr.length > 1 ? 's' : ''}`;
}

function renderHeatmap(allRuns) {
  const perDay = new Map();
  for (const r of allRuns) perDay.set(dayKey(r._date), (perDay.get(dayKey(r._date)) || 0) + r.distance);
  const level = (m) => (!m ? 0 : m < 5000 ? 1 : m < 10000 ? 2 : m < 15000 ? 3 : 4);

  mount($('heatmap'), (w) => {
    const weeks = w < 480 ? 26 : 52;
    $('heatmap-caption').textContent = `${weeks} dernières semaines`;
    const left = 18;
    const top = 14;
    const gap = 3;
    const cell = Math.max(4, (w - left - gap * (weeks - 1)) / weeks);
    const h = top + 7 * cell + 6 * gap;
    const first = startOfWeek(new Date());
    first.setDate(first.getDate() - (weeks - 1) * 7);
    const today = startOfDay(new Date()).getTime();
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Calendrier des sorties">`;
    ['L', 'M', 'V'].forEach((l, i) => { svg += `<text x="0" y="${top + [0, 2, 4][i] * (cell + gap) + cell * 0.8}">${l}</text>`; });
    let lastMonth = -1;
    for (let wk = 0; wk < weeks; wk++) {
      const x = left + wk * (cell + gap);
      for (let d = 0; d < 7; d++) {
        const date = new Date(first);
        date.setDate(first.getDate() + wk * 7 + d);
        const t = date.getTime();
        if (t > today) continue;
        if (d === 0 && date.getMonth() !== lastMonth && date.getDate() <= 7) {
          lastMonth = date.getMonth();
          svg += `<text x="${x}" y="9">${MONTHS[lastMonth]}</text>`;
        }
        const m = perDay.get(t) || 0;
        svg += `<rect class="l${level(m)}" x="${x}" y="${top + d * (cell + gap)}" width="${cell}" height="${cell}"><title>${shortDate(date)} ${date.getFullYear()} : ${m ? `${km(m)} km` : 'repos'}</title></rect>`;
      }
    }
    return svg + '</svg>';
  });
}

function renderWeekday(runs) {
  const counts = Array(7).fill(0);
  for (const r of runs) counts[(r._date.getDay() + 6) % 7]++;
  const items = counts.map((c, i) => ({ label: WEEKDAYS[i], value: c, title: `${['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i]} : ${c} sortie${c > 1 ? 's' : ''}` }));
  mount($('chart-weekday'), (w, h) => barChart(items, { w, h }));
}

function renderBuckets(runs) {
  const buckets = [
    { label: '<5', max: 5000 },
    { label: '5–10', max: 10000 },
    { label: '10–15', max: 15000 },
    { label: '15–21', max: 21000 },
    { label: '21+', max: Infinity },
  ].map((b) => ({ ...b, value: 0 }));
  for (const r of runs) buckets.find((b) => r.distance < b.max).value++;
  const items = buckets.map((b) => ({ ...b, title: `${b.label} km : ${b.value} sortie${b.value > 1 ? 's' : ''}` }));
  mount($('chart-buckets'), (w, h) => barChart(items, { w, h }));
}

function renderRecent(allRuns, demo) {
  $('recent').innerHTML = allRuns.slice(0, 7).map((r) => {
    const href = demo ? '#' : `https://www.strava.com/activities/${encodeURIComponent(r.id)}`;
    const hr = r.average_heartrate ? ` · ${Math.round(r.average_heartrate)} bpm` : '';
    return `<li><a href="${href}" ${demo ? '' : 'target="_blank" rel="noopener"'}>
      <span class="run-date"><span><b>${r._date.getDate()}</b><span>${MONTHS[r._date.getMonth()]}</span></span></span>
      <span class="run-text"><span class="run-name">${escapeHtml(r.name)}</span><span class="run-meta">${duration(r.moving_time)} · ${pace(1000 / r.average_speed)} /km${hr}</span></span>
      <span class="run-dist">${km(r.distance)} km<small>${nf().format(Math.round(r.elevation))} m D+</small></span>
    </a></li>`;
  }).join('') || '<li class="empty">Aucune sortie</li>';
}

function renderTotals(stats) {
  const block = (title, t) => (t ? `<section><h3>${title}</h3>
    <p><b>${km(t.distance, 0)}</b> km</p>
    <p>${nf().format(t.count)} sorties · ${duration(t.moving_time)}</p>
    <p>${nf().format(Math.round(t.elevation_gain))} m D+</p></section>` : '');
  $('totals').innerHTML = [
    block('4 dernières semaines', stats.recent),
    block(`Année ${new Date().getFullYear()}`, stats.ytd),
    block('Depuis toujours', stats.all),
  ].join('');
}

// ---------- Orchestration ----------

function render() {
  state.mounts.forEach((ro) => ro.disconnect());
  state.mounts = [];

  const { data, period } = state;
  const all = data.runs;
  const bounds = periodBounds(period);
  const runs = all.filter((r) => r._date.getTime() >= bounds.start);
  const prevRuns = bounds.prevStart ? all.filter((r) => r._date.getTime() >= bounds.prevStart && r._date.getTime() < bounds.start) : null;

  document.querySelectorAll('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === period)));

  renderKpis(runs, prevRuns, bounds);
  renderHeroSpark(all);
  renderWeekly(all);
  renderPaceTrend(all);
  renderRecords(runs);
  renderStreak(all);
  renderHeartRate(runs);
  renderHeatmap(all);
  renderWeekday(runs);
  renderBuckets(runs);
  renderRecent(all, data.demo);
  renderTotals(data.stats);
}

function show(data) {
  data.runs.forEach((r) => { r._date = localDate(r.date); });
  data.runs.sort((a, b) => b._date - a._date);
  state.data = data;

  $('welcome').hidden = true;
  $('status').textContent = '';
  $('dashboard').hidden = false;
  $('actions').hidden = false;
  $('refresh').hidden = Boolean(data.demo);
  $('logout').textContent = data.demo ? 'Quitter la démo' : 'Déconnexion';
  $('logout').href = data.demo ? '/' : '/auth/logout';
  $('fetched-at').textContent = data.demo
    ? 'Mode démo : données fictives'
    : `${data.runs.length} sorties · synchronisé le ${new Date(data.fetchedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
  renderAthlete(data);
  render();
}

async function loadDashboard(refresh = false) {
  const r = await fetch(`/api/dashboard${refresh ? '?refresh' : ''}`, { credentials: 'same-origin' });
  if (r.status === 401) return showWelcome(true);
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || `Erreur ${r.status}`);
  show(body);
}

function showWelcome(configured, error = false) {
  $('status').textContent = '';
  $('welcome').hidden = false;
  $('config-note').hidden = configured;
  $('auth-error').hidden = !error;
  if (!configured) $('connect').setAttribute('aria-disabled', 'true');
}

async function init() {
  try {
    const saved = localStorage.getItem('mystrava.period');
    if (saved) state.period = saved;
  } catch { /* stockage indisponible */ }

  document.querySelectorAll('[data-period]').forEach((btn) => btn.addEventListener('click', () => {
    state.period = btn.dataset.period;
    try { localStorage.setItem('mystrava.period', state.period); } catch { /* ignoré */ }
    render();
  }));

  $('refresh').addEventListener('click', async () => {
    $('refresh').classList.add('spinning');
    try { await loadDashboard(true); } catch (e) { $('status').textContent = e.message; }
    $('refresh').classList.remove('spinning');
  });

  const params = new URLSearchParams(location.search);
  if (params.has('demo')) return show(window.makeDemoData());

  $('status').textContent = 'Chargement…';
  let config;
  try {
    config = await (await fetch('/auth/config')).json();
  } catch {
    // Page ouverte sans le serveur : seule la démo est possible.
    return showWelcome(false);
  }
  if (!config.connected) return showWelcome(config.configured, params.get('error') === 'auth');

  $('status').textContent = 'Récupération de vos sorties sur Strava…';
  try {
    await loadDashboard();
  } catch (e) {
    $('status').textContent = e.message;
  }
}

init();
