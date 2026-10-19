// Tracés GPS au format « encoded polyline » de Google, celui de map.summary_polyline dans l'API Strava.
// Sans alias `@/` : aussi importé par scripts/fetch-strava.ts (et copié dans l'image Docker).

import type { LatLng } from '../types/strava.ts';

/** Décode un tracé (précision 5 : environ 1 m). */
export function decodePolyline(str: string): LatLng[] {
  const points: LatLng[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && i < str.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < str.length) {
    lat += next();
    lng += next();
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/** Encode un tracé (inverse de `decodePolyline`). */
export function encodePolyline(points: LatLng[]): string {
  let out = '';
  let prevLat = 0;
  let prevLng = 0;
  const push = (delta: number) => {
    let v = delta < 0 ? ~(delta << 1) : delta << 1;
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    out += String.fromCharCode(v + 63);
  };
  for (const [lat, lng] of points) {
    const a = Math.round(lat * 1e5);
    const b = Math.round(lng * 1e5);
    push(a - prevLat);
    push(b - prevLng);
    prevLat = a;
    prevLng = b;
  }
  return out;
}

/** Distance en mètres entre deux positions (formule de haversine). */
export function distanceMeters([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Indice du premier point situé à plus de `meters` du début de `points`, en suivant le tracé. */
function cutIndex(points: LatLng[], meters: number): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += distanceMeters(points[i - 1], points[i]);
    if (d >= meters) return i;
  }
  return points.length;
}

/**
 * Retire les `meters` premiers et derniers mètres d'un tracé, pour ne pas révéler les lieux
 * de départ et d'arrivée (le domicile, souvent). Tableau vide si le tracé est trop court.
 */
export function trimEnds(points: LatLng[], meters: number): LatLng[] {
  const start = cutIndex(points, meters);
  const end = points.length - cutIndex([...points].reverse(), meters);
  return end - start >= 2 ? points.slice(start, end) : [];
}
