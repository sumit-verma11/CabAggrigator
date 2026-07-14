# RideCompare — Cab Aggregator (Web MVP)

Web-first MVP for the Cab Aggregator project. Compares cab/auto/bike fares
across **Uber, Ola, Rapido (deep-link)** and **Namma Yatri / ONDC (real
in-app)** — per the strategy in [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md).

## Run

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Architecture (matches PROJECT_PLAN.md §3–4)

```
app/
  page.tsx                 Server Component — hero + SEO sections
  layout.tsx               SEO metadata
  api/estimates/route.ts   Fan-out BFF (Zod-validated). At MVP the Next.js API
                           route IS the aggregation backend; extracted to NestJS
                           in Phase 2.
lib/
  geo.ts                   Mock geocoder + haversine (→ Ola Maps in Phase 1)
  deeplink.ts              Uber/Ola/Rapido universal-link builders
  providers/
    types.ts               ProviderAdapter contract + normalized RideEstimate
    registry.ts            Parallel fan-out, per-provider timeout, PARTIAL results
    uber.ts ola.ts rapido.ts   deep_link adapters (compare → hand off)
    ondc.ts                in_app adapter (real booking path)
    mockFare.ts            Shared mock fare model (swap per real adapter)
components/
  HomeClient.tsx           Search → fetch → results orchestration
  SearchPanel.tsx          Pickup/drop + ride-type + POI autocomplete
  RideCard.tsx             3D tilt comparison card (Framer Motion)
  scene/HeroCanvas.tsx     WebGL canvas wrapper (dynamic, ssr:false)
  scene/RideGlobe.tsx      react-three-fiber globe + route arcs
```

### Adding a provider

Implement `ProviderAdapter` in a new `lib/providers/<name>.ts`, add it to
`ADAPTERS` in `registry.ts`. No changes to the fan-out core or UI. Classify it
`in_app` (open network → real booking) or `deep_link` (walled garden).

## What's mocked (Phase 0/1 TODO)

- Fares come from `mockFare.ts`, not live APIs.
- Ola/Rapido deep-link params are **unverified** (`deeplink.ts`) — Phase 0 task.
- ONDC adapter returns an estimate; the real Beckn search→confirm flow is Phase 2.
- Geocoding is a small Bengaluru POI list; replace with Ola Maps / Mapbox.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Framer Motion · react-three-fiber + drei · Zod.
