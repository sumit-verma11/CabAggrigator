---
name: cab-aggregator
description: Project context, architecture, and guardrails for the Cab Aggregator app (India-first ride-fare comparison + booking). Invoke when working on this codebase — building features, designing APIs, adding a ride provider, or making architecture/security/legal decisions — so choices stay consistent with the locked plan in PROJECT_PLAN.md.
---

# Cab Aggregator — working context

An India-first app that **compares** cab/auto/bike fares across ride-hailing
platforms and lets users **book** from one place. Full plan lives in
[PROJECT_PLAN.md](../../../PROJECT_PLAN.md) — read it before non-trivial work.

## Non-negotiable ground rules

1. **Data-access model is fixed:**
   - **Uber / Ola / Rapido → deep-link only.** Show our estimate, then hand off
     to their app to book. Never book these in-app, never scrape behind a login.
   - **ONDC / Beckn (Namma Yatri etc.) → real in-app booking** via a Beckn
     Buyer-App Platform (BAP) node.
   - **Account-proxy (storing user's provider credentials) is REJECTED.** Do not
     propose or implement it — it's the project's biggest legal/security
     liability.
2. **UX must be honest about capability:** a ride is either **"Book here"**
   (ONDC/Beckn) or **"Open in <provider>"** (deep-link). Never imply we book
   Uber/Ola/Rapido directly.
3. **Never store raw third-party passwords.** Payments stay **PCI-DSS SAQ-A** —
   card data never touches our servers (Razorpay tokenizes).
4. **Comply with India's DPDP Act 2023** — consent, data-minimization, breach
   notification. Field-level encryption for PII/KYC.

## Architecture at a glance

- **Modular monolith** first; split to services only under real load.
- **Provider Adapter pattern** — every source implements a common interface
  (`getEstimates()`, `book()`, `getStatus()`). Adding a provider = one new
  adapter, no core changes.
- **Parallel fan-out** to all providers with strict per-provider timeouts
  (~2–3s) and circuit-breakers; return partial results rather than blocking.
- **Geohash-keyed estimate cache** in Redis, short TTL (30–60s) for surge
  accuracy.
- **Pricing history in TimescaleDB** — this longitudinal data is the moat
  (reliability scores + predictive timing). Preserve and grow it.

## Build order & default tech stack

**WEB FIRST, then mobile.** Web is mobile-web-first / PWA (that's where the
deep-link handoff completes) and SSR comparison pages are the SEO acquisition
channel.

- **Web (Phase 1):** Next.js (React + TS) · Tailwind + shadcn/ui · TanStack
  Query · Mapbox GL JS / Ola Maps web · PWA · hosted on Vercel. At MVP the
  Next.js API routes ARE the aggregation BFF — one deployable.
- **Backend (Phase 2 split-out):** NestJS/Node (Go only if fan-out concurrency
  dominates), extracted from Next.js when mobile + load justify it.
- **Mobile (Phase 2):** Flutter, reusing the same backend.
- **Data:** PostgreSQL + PostGIS · TimescaleDB · Redis + Kafka/RabbitMQ.
- **Infra:** Ola Maps or Mapbox · Razorpay · Docker (managed hosting first, K8s
  later) · OpenTelemetry + Sentry.

Deep-link nuance: mobile browser → launches provider app; desktop → provider
website or "continue on phone" QR. Confirm with the user before deviating.

## When adding a new ride provider

1. Classify it: open network (ONDC/Beckn → real booking) or walled garden
   (deep-link only)?
2. Implement the adapter against the common interface — do not special-case it
   in the aggregation core.
3. Add per-provider timeout, circuit-breaker, and error/latency metrics.
4. Normalize its response to the shared estimate schema (fare breakdown, ETA,
   surge state, product type).
5. Verify ToS allows the integration; deep-linking is sanctioned, scraping is
   not.

## Security checklist for any feature touching bookings, payments, or PII

- [ ] No secrets in code/env committed to the repo (use a vault).
- [ ] Auth: short-lived JWT + rotating refresh tokens; MFA for wallet actions.
- [ ] Rate-limit and quota at the gateway; validate all input.
- [ ] TLS 1.3 in transit, KMS-managed encryption at rest.
- [ ] Run a STRIDE pass on new booking/payment flows (top risks: credential
      theft, booking fraud/replay, location-data leakage).

## Current status

Planning/refinement complete for strategy. **No code scaffolded yet.** Next
milestone: Phase 1 MVP (compare-only, single city). See the roadmap in
PROJECT_PLAN.md.
