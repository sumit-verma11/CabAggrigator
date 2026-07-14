// Server-only Ola Maps client. The API key is read from OLA_MAPS_API_KEY and
// MUST never reach the browser — all three functions run in Route Handlers.
// Every call fails soft (returns null / []) so the app degrades gracefully to
// the offline fallback when no key is set or the API errors.
//
// Docs: https://maps.olakrutrim.com/docs  ·  host: https://api.olamaps.io
import "server-only";
import type { GeoPoint } from "@/lib/geo";

const BASE = "https://api.olamaps.io";

function apiKey(): string | null {
  return process.env.OLA_MAPS_API_KEY?.trim() || null;
}

export function hasOlaKey(): boolean {
  return apiKey() !== null;
}

async function getJson(url: string, init?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, { ...init, cache: "no-store" });
    if (!res.ok) {
      console.warn(`[olamaps] ${res.status} for ${url.split("?")[0]}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn("[olamaps] request failed:", e);
    return null;
  }
}

/** Address / place name -> coordinates. */
export async function geocode(address: string): Promise<GeoPoint | null> {
  const key = apiKey();
  if (!key) return null;
  const url = `${BASE}/places/v1/geocode?address=${encodeURIComponent(
    address,
  )}&api_key=${key}`;
  const j = await getJson(url);
  const g = j?.geocodingResults?.[0] ?? j?.results?.[0];
  const loc = g?.geometry?.location;
  if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
  return { label: g.formatted_address ?? address, lat: loc.lat, lng: loc.lng };
}

/** Real routed distance (km) + duration (min) between two points. */
export async function directions(
  origin: GeoPoint,
  dest: GeoPoint,
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const key = apiKey();
  if (!key) return null;
  const url = `${BASE}/routing/v1/directions?origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&api_key=${key}`;
  const j = await getJson(url, { method: "POST" });
  const leg = j?.routes?.[0]?.legs?.[0];
  const meters = leg?.distance;
  const seconds = leg?.duration;
  if (typeof meters !== "number" || typeof seconds !== "number") return null;
  return {
    distanceKm: +(meters / 1000).toFixed(2),
    durationMin: Math.max(1, Math.round(seconds / 60)),
  };
}

export interface Suggestion {
  description: string;
  lat?: number;
  lng?: number;
}

/** Place autocomplete suggestions for the search box. */
export async function autocomplete(input: string): Promise<Suggestion[]> {
  const key = apiKey();
  if (!key || input.trim().length < 2) return [];
  const url = `${BASE}/places/v1/autocomplete?input=${encodeURIComponent(
    input,
  )}&api_key=${key}`;
  const j = await getJson(url);
  const preds = j?.predictions ?? [];
  return preds.slice(0, 6).map((p: any) => ({
    description: p.description ?? p.structured_formatting?.main_text ?? "",
    lat: p.geometry?.location?.lat,
    lng: p.geometry?.location?.lng,
  }));
}
