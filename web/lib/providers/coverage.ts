import { haversineKm, type GeoPoint } from "@/lib/geo";
import type { Coverage } from "./types";

// Does a provider's coverage include this pickup point?
export function coversLocation(coverage: Coverage, point: GeoPoint): boolean {
  if (coverage === "national") return true;
  return coverage.some(
    (area) =>
      haversineKm({ label: area.name, lat: area.lat, lng: area.lng }, point) <=
      area.radiusKm,
  );
}

// ONDC / Namma Yatri service areas. Bengaluru-first; extend as the network
// expands (Namma Yatri also runs in a few other cities). Keeping it
// conservative means we never falsely show ONDC where it doesn't operate.
export const ONDC_COVERAGE: Coverage = [
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, radiusKm: 60 },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, radiusKm: 30 },
  { name: "Tumakuru", lat: 13.3379, lng: 77.1173, radiusKm: 25 },
];
