// Provider registry + the parallel fan-out core (PROJECT_PLAN.md §3).
// Query every adapter concurrently, enforce a strict per-provider timeout, and
// return PARTIAL results rather than blocking on the slowest source.

import { coversLocation } from "./coverage";
import { ondcAdapter } from "./ondc";
import { olaAdapter } from "./ola";
import { rapidoAdapter } from "./rapido";
import { uberAdapter } from "./uber";
import type { EstimateRequest, ProviderAdapter, RideEstimate } from "./types";

export const ADAPTERS: ProviderAdapter[] = [
  ondcAdapter,
  uberAdapter,
  olaAdapter,
  rapidoAdapter,
];

export interface ProviderResult {
  provider: string;
  label: string;
  ok: boolean;
  estimates: RideEstimate[];
  latencyMs: number;
  error?: string;
}

export interface FanOutResponse {
  results: ProviderResult[];
  estimates: RideEstimate[]; // flattened, cheapest-first
  cheapestProvider: string | null;
  route: {
    from: string;
    to: string;
    distanceKm: number;
    durationMin: number;
    source: "ola" | "osm" | "estimate";
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}

export async function fanOut(
  req: EstimateRequest,
  adapters: ProviderAdapter[] = ADAPTERS,
  timeoutMs = 2500,
): Promise<Omit<FanOutResponse, "route">> {
  // Only query providers that actually operate at the pickup location.
  const active = adapters.filter((a) =>
    coversLocation(a.coverage, req.route.pickup),
  );
  const settled = await Promise.allSettled(
    active.map(async (a): Promise<ProviderResult> => {
      const started = Date.now();
      try {
        const estimates = await withTimeout(a.getEstimates(req), timeoutMs);
        return {
          provider: a.id,
          label: a.label,
          ok: true,
          estimates,
          latencyMs: Date.now() - started,
        };
      } catch (err) {
        return {
          provider: a.id,
          label: a.label,
          ok: false,
          estimates: [],
          latencyMs: Date.now() - started,
          error: err instanceof Error ? err.message : "unknown error",
        };
      }
    }),
  );

  const results = settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : {
          provider: "unknown",
          label: "unknown",
          ok: false,
          estimates: [],
          latencyMs: 0,
          error: "adapter crashed",
        },
  );

  const estimates = results
    .flatMap((r) => r.estimates)
    .sort((a, b) => a.fareMin - b.fareMin);

  return {
    results,
    estimates,
    cheapestProvider: estimates[0]?.provider ?? null,
  };
}
