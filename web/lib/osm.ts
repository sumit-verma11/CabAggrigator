// Keyless real geo provider built on OpenStreetMap services — NO API key.
//   - Photon (https://photon.komoot.io)  → place autocomplete + geocoding
//   - OSRM   (https://router.project-osrm.org) → road distance + duration
// Great for building/MVP; both are shared free services with fair-use limits,
// so swap to a keyed/self-hosted provider (Ola Maps / Mapbox / self-host) at
// production scale. Server-only: called from Route Handlers.
import "server-only";
import type { GeoPoint } from "@/lib/geo";

const PHOTON = "https://photon.komoot.io/api";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
// India bounding box (minLon,minLat,maxLon,maxLat) to bias suggestions.
const INDIA_BBOX = "68.0,6.5,97.5,37.5";
const UA = "RideCompare/1.0 (cab-aggregator MVP)";

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Turn a Photon feature's address parts into one readable line.
function describe(props: Record<string, any>): string {
  const line1 = [props.name, props.housenumber && props.street]
    .filter(Boolean)
    .join(" ");
  const parts = [
    line1 || props.street,
    props.district || props.city || props.county,
    props.state,
  ].filter((p, i, a) => p && a.indexOf(p) === i);
  return parts.join(", ");
}

export interface Suggestion {
  description: string;
  lat?: number;
  lng?: number;
}

export async function autocomplete(input: string): Promise<Suggestion[]> {
  if (input.trim().length < 2) return [];
  const url = `${PHOTON}/?q=${encodeURIComponent(
    input,
  )}&limit=6&lang=en&bbox=${INDIA_BBOX}`;
  const j = await getJson(url);
  const feats: any[] = j?.features ?? [];
  return feats
    .map((f) => {
      const [lng, lat] = f.geometry?.coordinates ?? [];
      return { description: describe(f.properties ?? {}), lat, lng };
    })
    .filter((s) => s.description);
}

export async function geocode(address: string): Promise<GeoPoint | null> {
  const url = `${PHOTON}/?q=${encodeURIComponent(
    address,
  )}&limit=1&lang=en&bbox=${INDIA_BBOX}`;
  const j = await getJson(url);
  const f = j?.features?.[0];
  const [lng, lat] = f?.geometry?.coordinates ?? [];
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { label: describe(f.properties ?? {}) || address, lat, lng };
}

export async function directions(
  origin: GeoPoint,
  dest: GeoPoint,
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const url = `${OSRM}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false&alternatives=false&steps=false`;
  const j = await getJson(url);
  const route = j?.routes?.[0];
  if (j?.code !== "Ok" || typeof route?.distance !== "number") return null;
  return {
    distanceKm: +(route.distance / 1000).toFixed(2),
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  };
}
