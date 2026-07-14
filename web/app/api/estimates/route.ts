import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeFallback, haversineKm, type GeoPoint } from "@/lib/geo";
import * as places from "@/lib/places";
import { fanOut, type FanOutResponse } from "@/lib/providers/registry";
import type { ResolvedRoute } from "@/lib/providers/types";

// At MVP the Next.js API route IS the aggregation BFF (PROJECT_PLAN.md §4).
// It resolves the route ONCE (real geocode + directions via Ola Maps, with an
// offline fallback) then fans out to every provider adapter.

export const runtime = "nodejs";

const BodySchema = z.object({
  pickup: z.string().min(1).max(160),
  dropoff: z.string().min(1).max(160),
  rideType: z.enum(["cab", "auto", "bike"]).default("cab"),
});

// City average speed used only to estimate duration in the offline fallback.
const FALLBACK_KMPH = 22;

async function resolveRoute(
  pickup: string,
  dropoff: string,
): Promise<ResolvedRoute> {
  // Real geocoding (Ola if keyed, else keyless OSM); offline fallback last.
  const [a, b] = await Promise.all([
    places.geocode(pickup),
    places.geocode(dropoff),
  ]);
  const from: GeoPoint = a ?? geocodeFallback(pickup);
  const to: GeoPoint = b ?? geocodeFallback(dropoff);

  const routed = await places.directions(from, to);
  if (routed) {
    return {
      pickup: from,
      dropoff: to,
      distanceKm: routed.distanceKm,
      durationMin: routed.durationMin,
      source: routed.source,
    };
  }

  const distanceKm = haversineKm(from, to);
  return {
    pickup: from,
    dropoff: to,
    distanceKm,
    durationMin: Math.max(3, Math.round((distanceKm / FALLBACK_KMPH) * 60)),
    source: "estimate",
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { pickup, dropoff, rideType } = parsed.data;
  const route = await resolveRoute(pickup, dropoff);
  const fan = await fanOut({ route, rideType });

  const body: FanOutResponse = {
    ...fan,
    route: {
      from: route.pickup.label,
      to: route.dropoff.label,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      source: route.source,
    },
  };

  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
