export const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const WEEKDAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatters = new Map<number, Intl.NumberFormat>();

/** Formateur de nombres fr-FR à nombre de décimales fixe. */
export function nf(digits = 0): Intl.NumberFormat {
  let f = formatters.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(digits, f);
  }
  return f;
}

/** Mètres → kilomètres formatés. */
export const km = (m: number, digits = 1) => nf(digits).format(m / 1000);

/** Secondes → « 1 h 05 » ou « 42 min ». */
export function duration(s: number): string {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${nf().format(h)} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

/** Secondes par km → « 5:12 ». */
export function pace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '–';
  const total = Math.round(secPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
