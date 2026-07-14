// The Provider Adapter contract — the architectural centerpiece from
// PROJECT_PLAN.md §3. Every source implements this SAME interface. Adding a
// provider = one new adapter file, zero changes to the aggregation core.

import type { GeoPoint } from "@/lib/geo";

export type RideType = "cab" | "auto" | "bike";

// Honest capability distinction:
//  - in_app    → real end-to-end booking (ONDC / Beckn networks)
//  - deep_link → compare only, hand off to the provider app to book
export type BookingMode = "in_app" | "deep_link";

// A route resolved ONCE (real distance/duration from Ola Maps, or haversine
// fallback) and shared with every adapter, so we don't re-route per provider.
export interface ResolvedRoute {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  distanceKm: number;
  durationMin: number;
  // where the distance came from: real routed (ola/osm) vs offline estimate
  source: "ola" | "osm" | "estimate";
}

export interface EstimateRequest {
  route: ResolvedRoute;
  rideType: RideType;
}

// Normalized shape EVERY adapter returns. Fields are REAL: fares from published
// tariff cards over the real route; distance/duration from the routing API.
// (No fabricated pickup-ETA / surge / reliability — those need the providers'
// private APIs and would be hardcoded guesses.)
export interface RideEstimate {
  provider: string;
  providerLabel: string;
  productName: string;
  rideType: RideType;
  currency: string;
  fareMin: number;
  fareMax: number;
  distanceKm: number;
  durationMin: number; // real trip time
  bookingMode: BookingMode;
  deepLink?: string;
  brandColor: string;
  note: string; // e.g. "Tariff estimate · excl. live surge"
}

// Where a provider actually operates. Uber/Ola/Rapido are effectively
// national; ONDC/Namma Yatri runs only in specific cities.
export interface ServiceArea {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}
export type Coverage = "national" | ServiceArea[];

export interface ProviderAdapter {
  id: string;
  label: string;
  bookingMode: BookingMode;
  coverage: Coverage; // only queried when the pickup is inside its coverage
  getEstimates(req: EstimateRequest): Promise<RideEstimate[]>;
}
