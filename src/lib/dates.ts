export const DAY = 86400000;

// start_date_local est l'heure locale suffixée d'un « Z » : on l'interprète sans décalage.
export function localDate(str: string): Date {
  const [y, mo, d, h = 0, mi = 0] = (str.match(/\d+/g) ?? []).map(Number);
  return new Date(y, mo - 1, d, h, mi);
}

export function startOfDay(d: Date | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d: Date | number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // lundi
  return x;
}

export function addDays(d: Date | number, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export const weekKey = (d: Date | number) => startOfWeek(d).getTime();
export const dayKey = (d: Date | number) => startOfDay(d).getTime();
