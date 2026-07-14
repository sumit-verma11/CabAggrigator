// Real published-tariff fare engine. Fares are computed from actual rate-card
// structures (base + per-km + per-min + minimum) over the REAL route distance
// and duration — the same approach RideGuru uses. These are representative
// Indian-metro rates and should be tuned per city from official/aggregator
// rate cards; live surge is NOT modelled (it needs the provider's private API).

import type { RideType } from "@/lib/providers/types";

export interface Tariff {
  base: number; // flag-down fare (INR), covers the included minimum distance
  perKm: number; // INR per km
  perMin: number; // INR per minute (ride time)
  minimum: number; // minimum total fare (INR)
}

// provider id -> ride type -> tariff
export const TARIFFS: Record<string, Record<RideType, Tariff>> = {
  uber: {
    cab: { base: 50, perKm: 14, perMin: 1.5, minimum: 80 },
    auto: { base: 30, perKm: 15, perMin: 1.0, minimum: 40 },
    bike: { base: 20, perKm: 8, perMin: 0.8, minimum: 30 },
  },
  ola: {
    cab: { base: 50, perKm: 13, perMin: 1.4, minimum: 75 },
    auto: { base: 30, perKm: 14, perMin: 1.0, minimum: 40 },
    bike: { base: 20, perKm: 8, perMin: 0.8, minimum: 30 },
  },
  rapido: {
    cab: { base: 40, perKm: 12, perMin: 1.0, minimum: 60 },
    auto: { base: 25, perKm: 12, perMin: 0.8, minimum: 35 },
    bike: { base: 15, perKm: 7, perMin: 0.6, minimum: 25 },
  },
  // ONDC / Namma Yatri — zero-commission, meter-aligned, typically cheapest.
  ondc: {
    cab: { base: 45, perKm: 11, perMin: 1.0, minimum: 60 },
    auto: { base: 30, perKm: 13, perMin: 0.0, minimum: 35 }, // govt auto meter
    bike: { base: 15, perKm: 7, perMin: 0.5, minimum: 25 },
  },
};

export interface FareRange {
  fareMin: number;
  fareMax: number;
}

// Point estimate from the tariff, widened to a range to reflect real-world
// variance (traffic, waiting time). No surge applied.
export function computeFare(
  distanceKm: number,
  durationMin: number,
  t: Tariff,
): FareRange {
  const raw = Math.max(
    t.minimum,
    t.base + t.perKm * distanceKm + t.perMin * durationMin,
  );
  return { fareMin: Math.round(raw), fareMax: Math.round(raw * 1.15) };
}
