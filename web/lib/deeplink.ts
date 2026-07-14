// Deep-link builders for the walled-garden providers (compare → hand off).
// Uber's universal-link format is confirmed:
//   https://developer.uber.com/docs/deep-linking
// Ola & Rapido deep-link params are UNVERIFIED (Phase 0 task in the plan) —
// these are best-effort placeholders, clearly flagged.

import type { GeoPoint } from "@/lib/geo";

export function uberDeepLink(pickup: GeoPoint, dropoff: GeoPoint): string {
  const p = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": String(pickup.lat),
    "pickup[longitude]": String(pickup.lng),
    "pickup[nickname]": pickup.label,
    "dropoff[latitude]": String(dropoff.lat),
    "dropoff[longitude]": String(dropoff.lng),
    "dropoff[nickname]": dropoff.label,
  });
  // Universal link works on mobile web (launches app) with web fallback.
  return `https://m.uber.com/ul/?${p.toString()}`;
}

// TODO(Phase 0): verify Ola supports pre-filled booking deep links.
export function olaDeepLink(pickup: GeoPoint, dropoff: GeoPoint): string {
  const p = new URLSearchParams({
    lat: String(pickup.lat),
    lng: String(pickup.lng),
    drop_lat: String(dropoff.lat),
    drop_lng: String(dropoff.lng),
    utm_source: "cabaggregator",
  });
  return `https://book.olacabs.com/?${p.toString()}`;
}

// TODO(Phase 0): verify Rapido deep-link support.
export function rapidoDeepLink(pickup: GeoPoint, dropoff: GeoPoint): string {
  const p = new URLSearchParams({
    pickup: `${pickup.lat},${pickup.lng}`,
    drop: `${dropoff.lat},${dropoff.lng}`,
    utm_source: "cabaggregator",
  });
  return `https://www.rapido.bike/?${p.toString()}`;
}
