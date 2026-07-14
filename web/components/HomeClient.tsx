"use client";

import { useState } from "react";
import { RideCard } from "@/components/RideCard";
import { SearchPanel } from "@/components/SearchPanel";
import type { FanOutResponse } from "@/lib/providers/registry";
import type { RideType } from "@/lib/providers/types";

export function HomeClient() {
  const [data, setData] = useState<FanOutResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSearch(pickup: string, dropoff: string, rideType: RideType) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pickup, dropoff, rideType }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData((await res.json()) as FanOutResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const estimates = data?.estimates ?? [];
  const source = data?.route.source;
  const live = source === "ola" || source === "osm";
  const sourceLabel =
    source === "ola"
      ? "Ola Maps"
      : source === "osm"
        ? "OpenStreetMap"
        : "Offline estimate";

  return (
    <div className="mx-auto w-full max-w-2xl px-5">
      <SearchPanel onSearch={onSearch} loading={loading} />

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}

      {/* route summary bar */}
      {data && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm">
          <span className="font-medium">
            {data.route.distanceKm} km
            <span className="mx-1.5 text-faint">·</span>
            {data.route.durationMin} min
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "bg-accent" : "bg-faint"
              }`}
            />
            {live ? "Live route" : "Estimated"} · {sourceLabel}
          </span>
        </div>
      )}

      {/* provider response status */}
      {data && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {data.results.map((r) => (
            <span
              key={r.provider}
              className="chip px-2.5 py-1 text-xs text-muted"
              title={r.error ?? "responded"}
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  r.ok ? "bg-accent" : "bg-red-400"
                }`}
              />
              {r.label} · {r.ok ? `${r.latencyMs}ms` : "timed out"}
            </span>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-[168px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && estimates.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {estimates.map((e, i) => (
            <RideCard
              key={`${e.provider}-${e.productName}`}
              est={e}
              index={i}
              isCheapest={i === 0}
            />
          ))}
        </div>
      )}

      {!loading && data && estimates.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          No fares available right now — please try again.
        </p>
      )}
    </div>
  );
}
