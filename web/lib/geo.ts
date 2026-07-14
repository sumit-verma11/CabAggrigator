// Lightweight geo helpers + a mock geocoder for the MVP.
// Phase 1 real work replaces `geocode()` with Ola Maps / Mapbox.

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

// Curated POIs across major Indian cities — power the search autocomplete +
// demo routes with REAL coordinates (so distances/fares are geographically
// correct). Phase 1 replaces this with a live geocoder (Ola Maps / Mapbox) for
// any address, any city.
export const POIS: GeoPoint[] = [
  // — Bengaluru —
  { label: "Kempegowda Intl Airport (BLR)", lat: 13.1986, lng: 77.7066 },
  { label: "MG Road, Bengaluru", lat: 12.9756, lng: 77.6068 },
  { label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245 },
  { label: "Indiranagar, Bengaluru", lat: 12.9719, lng: 77.6412 },
  { label: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7499 },
  { label: "Electronic City, Bengaluru", lat: 12.8452, lng: 77.6602 },
  { label: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446 },
  // — Delhi NCR —
  { label: "Indira Gandhi Intl Airport (DEL)", lat: 28.5562, lng: 77.1 },
  { label: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167 },
  { label: "Cyber City, Gurugram", lat: 28.4949, lng: 77.0895 },
  { label: "Noida Sector 18", lat: 28.5708, lng: 77.3261 },
  // — Mumbai —
  { label: "Chhatrapati Shivaji Airport (BOM)", lat: 19.0896, lng: 72.8656 },
  { label: "Bandra, Mumbai", lat: 19.0596, lng: 72.8295 },
  { label: "Andheri, Mumbai", lat: 19.1197, lng: 72.8468 },
  { label: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147 },
  // — Hyderabad —
  { label: "Rajiv Gandhi Intl Airport (HYD)", lat: 17.2403, lng: 78.4294 },
  { label: "HITEC City, Hyderabad", lat: 17.4435, lng: 78.3772 },
  { label: "Banjara Hills, Hyderabad", lat: 17.412, lng: 78.4483 },
  // — Chennai —
  { label: "Chennai Intl Airport (MAA)", lat: 12.9941, lng: 80.1709 },
  { label: "T. Nagar, Chennai", lat: 13.0418, lng: 80.2341 },
  // — Pune / Kolkata —
  { label: "Pune Airport (PNQ)", lat: 18.5793, lng: 73.9089 },
  { label: "Hinjewadi, Pune", lat: 18.5913, lng: 73.7389 },
  { label: "Park Street, Kolkata", lat: 22.5535, lng: 88.352 },
];

// Deterministic pseudo-coords for anything not in the POI list, spread across
// the populated India band (not one city), so ANY place name yields a stable,
// plausible fare in the demo. Phase 1 replaces this whole function with a live
// geocoder (Ola Maps / Mapbox) that resolves real addresses in any city.
function hashCoord(q: string): GeoPoint {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) | 0;
  const r = Math.abs(h);
  return {
    label: q,
    lat: 12.5 + (r % 1600) / 100, // ~12.5–28.5 N
    lng: 72 + ((r >> 10) % 1600) / 100, // ~72–88 E
  };
}

// Offline fallback used only when Ola Maps geocoding is unavailable (no key /
// API error). Matches a curated POI, else derives stable pseudo-coords.
export function geocodeFallback(query: string): GeoPoint {
  const q = query.trim();
  const hit = POIS.find((p) => p.label.toLowerCase() === q.toLowerCase());
  return hit ?? hashCoord(q || "Unknown");
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(2);
}
