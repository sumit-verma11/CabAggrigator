// Geo provider orchestrator. Tries the best available source and degrades
// gracefully: Ola Maps (if OLA_MAPS_API_KEY is set) → keyless OSM (Photon +
// OSRM) → null (caller uses the offline fallback). Server-only.
import "server-only";
import type { GeoPoint } from "@/lib/geo";
import * as ola from "@/lib/olamaps";
import * as osm from "@/lib/osm";

export type GeoSource = "ola" | "osm";

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  source: GeoSource;
}

export async function geocode(address: string): Promise<GeoPoint | null> {
  return (await ola.geocode(address)) ?? (await osm.geocode(address));
}

export async function directions(
  a: GeoPoint,
  b: GeoPoint,
): Promise<RouteResult | null> {
  const viaOla = await ola.directions(a, b);
  if (viaOla) return { ...viaOla, source: "ola" };
  const viaOsm = await osm.directions(a, b);
  if (viaOsm) return { ...viaOsm, source: "osm" };
  return null;
}

export async function autocomplete(input: string): Promise<osm.Suggestion[]> {
  const viaOla = await ola.autocomplete(input);
  if (viaOla.length) return viaOla;
  return osm.autocomplete(input);
}
