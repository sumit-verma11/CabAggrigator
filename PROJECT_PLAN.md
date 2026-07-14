# Cab Aggregator — Project Plan

> A cross-platform app to **compare** cab/auto/bike fares across ride-hailing
> platforms and **book** them from one place.
>
> **Locked decisions (2026-07-14):**
> - **Market:** India-first.
> - **Data-access model:** Deep-link handoff for walled-garden players
>   (Uber / Ola / Rapido); real in-app booking via **ONDC / Beckn**
>   (Namma Yatri and other Beckn-enabled providers).
> - **Status:** Planning / refinement. No code scaffolded yet.

---

## 1. The core constraint (read this first)

Uber, Ola, and Rapido **do not offer public price or booking APIs**. Uber gates
its price-estimate and ride-request endpoints behind partner approval; Ola and
Rapido have no open developer program. There are only three legitimate ways to
get fare data and booking capability:

| Model | How it works | In-app booking? | Risk | Our use |
|---|---|---|---|---|
| **A. Deep-linking** | Show our own estimate, hand off to the provider app with pickup/dropoff pre-filled | ❌ Finishes in their app | ✅ Sanctioned | **Uber / Ola / Rapido** |
| **B. Account-proxy** | User logs into their own account; we fetch their fares | ⚠️ Sometimes | ⚠️ ToS + credential risk | **Rejected** |
| **C. Open networks (ONDC/Beckn)** | Real open booking APIs (Namma Yatri etc.) | ✅ End-to-end | ✅ Open & legit | **Primary booking path** |

**Design consequence:** the UX is honest about capability — a ride is either
**"Book here"** (ONDC/Beckn) or **"Open in Uber/Ola/Rapido"** (deep-link). We
never store third-party passwords and never scrape behind a login.

### Reference links
- Uber price-estimate API (partner-gated): https://developer.uber.com/docs/riders/references/api/v1.2/estimates-price-get
- Uber deep-linking: https://developer.uber.com/docs/deep-linking
- Namma Yatri (open source, Beckn/ONDC): https://github.com/nammayatri/nammayatri
- Existing comparison apps (India): https://justbobit.com/ , https://comparify.pro/cabs

---

## 2. Product strategy & differentiators

Comparison alone is a crowded space (bob, Comparify, Choose.app). Differentiate
on things incumbents can't easily copy:

1. **Real booking where it's legal (ONDC/Beckn) + honest compare-only elsewhere.**
2. **True total cost, not sticker price** — surge state, wait-time, tolls,
   platform fees, and a **reliability score** (how often the quoted ETA/price
   actually held, from our own history).
3. **Predictive timing** — "airport fares are usually ~22% cheaper in 15 min,"
   powered by our accumulated price time-series. This is the moat: **we own our
   longitudinal data; competitors don't.**
4. **One profile / one wallet / one receipt history** across platforms.
5. **Safety & accessibility layer** — shared live trip, SOS, filters. Good UX
   and good PR.

---

## 3. Architecture

Start as a **modular monolith**; split into services only where load demands it.

```
                    ┌─────────────────────────┐
   Mobile app  ───▶ │   API Gateway / BFF     │ ◀── Web (Next.js)
  (Flutter)         │  auth · rate-limit ·    │
                    │  request aggregation    │
                    └───────────┬─────────────┘
                                │
     ┌──────────────┬───────────┼────────────┬──────────────┐
     ▼              ▼           ▼            ▼              ▼
 Aggregation   Booking     Identity/    Pricing/       Notification
 Service       Service     Wallet       Analytics      Service
 (fan-out,     (Beckn BAP  (KYC, auth,  (history,      (push/SMS)
  normalize)    node +      payments)    surge model)
                deep links)
     │
     ▼
 Provider Adapters (one per source, common interface):
   • ONDC-BAP      → real booking (search→select→init→confirm→status)
   • Uber-deeplink → estimate + handoff
   • Ola-deeplink  → estimate + handoff
   • Rapido-deeplink → estimate + handoff
```

**Key patterns**
- **Provider Adapter interface** — `getEstimates()` / `book()` / `getStatus()`.
  Adding a source = one new adapter, zero core changes.
- **Parallel fan-out with strict per-provider timeouts** — return partial
  results in ~2–3s rather than block on the slowest. Circuit-breakers per source.
- **Geohash-keyed estimate cache** — key on (origin-cell, dest-cell, product,
  time-bucket), short TTL (30–60s) to stay surge-accurate without hammering
  sources.
- **Beckn BAP node** — Buyer App Platform implementing the ONDC mobility flow;
  this is what enables genuine in-app booking.

---

## 4. Tech stack

**Build order: WEB FIRST, then mobile.** The web is mobile-web-first / PWA —
that's where the "compare → open in provider app" deep-link handoff completes,
and SSR comparison pages are a free SEO acquisition channel an app can't offer.

| Layer | Choice | Why |
|---|---|---|
| **Web (first)** | **Next.js (React + TypeScript)** | SSR/SSG for SEO on comparison pages; App Router; mobile-web-first + PWA |
| Web BFF (MVP) | **Next.js API routes = aggregation layer** | One deployable at MVP; split out NestJS in Phase 2 |
| Web UI | **Tailwind CSS + shadcn/ui**, **TanStack Query** | Fast responsive UI; clean parallel fan-out + partial-results UX |
| Web maps | **Mapbox GL JS** or Ola Maps web SDK | Geolocation, autocomplete, route display |
| Web hosting | **Vercel** (or ECS) | Zero-config Next.js SSR at the edge |
| Mobile (later) | **Flutter** | One codebase, smooth maps; built after web validates |
| Backend | **NestJS (Node.js)** — Go if fan-out concurrency dominates | Structure + fast dev; standalone from Phase 2 |
| Primary DB | **PostgreSQL + PostGIS** | Geo queries, ACID for bookings/wallet |
| Time-series | **TimescaleDB** (Postgres ext) | Pricing-history moat |
| Cache / queue | **Redis** + **Kafka/RabbitMQ** | Estimate cache; async booking + price events |
| Maps / geocoding | **Ola Maps** or Mapbox | Ola Maps cheaper in India |
| Payments | **Razorpay** (PCI SAQ-A) | Delegate all card handling |
| Infra | **Docker**; start managed (Vercel/Railway/ECS), K8s later | Don't over-provision at MVP |
| Observability | OpenTelemetry + Grafana/Loki + Sentry | Per-provider latency/error dashboards |

> **Deep-link nuance on web:** on a **mobile browser** universal links launch the
> Uber/Ola/Rapido app directly; on **desktop** they fall back to the provider's
> website or a "continue on your phone" QR. Hence mobile-web-first.

---

## 5. Security (non-negotiable)

- **Never store raw third-party passwords.** Model B is rejected precisely to
  avoid this liability.
- **Payments: stay PCI-DSS SAQ-A** — card data never touches our servers; the
  gateway tokenizes everything.
- **Auth:** OAuth2/OIDC, short-lived JWT access + rotating refresh tokens,
  device binding, MFA for wallet actions.
- **Data protection:** TLS 1.3 in transit; encryption at rest with KMS-managed
  keys; field-level encryption for PII/KYC.
- **API hardening:** gateway rate-limiting, per-user quotas, WAF, bot detection.
- **Secrets** in a vault (AWS Secrets Manager / HashiCorp Vault) — never in the
  repo or plain env files.
- **Threat model early (STRIDE)** before writing the booking service. Top risks:
  credential theft, booking fraud/replay, location-data leakage.

### Locked security & dependency choices (web)

> Principle: **fewer, well-chosen dependencies = smaller attack surface.**
> MCP is NOT part of the product — it's AI-agent dev tooling only; it does not
> secure the app.

| Concern | Locked choice | Note |
|---|---|---|
| Auth | **Clerk** (MVP) | Phone-OTP + social + session rotation out of the box; migrate to Auth.js later only if cost/self-hosting demands |
| ORM | **Drizzle** | TS-native, first-class PostGIS + raw-SQL for geo/TimescaleDB |
| Input validation | **Zod** | Validate every API-route input |
| Rate limit / bot | **Upstash rate-limit** + **Cloudflare Turnstile** | Edge-friendly; protects provider fan-out |
| Headers / CSP | Next.js middleware (CSP, HSTS, X-Frame-Options) | Blocks XSS/clickjacking |
| Payments | **Razorpay** | India + PCI SAQ-A |
| Secrets | **Doppler** or Vercel env + vault | Never in repo |
| Monitoring | **Sentry** | Errors + security triage |
| Supply chain | **Dependabot / Snyk + `npm audit`** | Real risk — keep deps patched |

---

## 6. Legal / compliance (settle before building)

- **DPDP Act 2023** (India): consent, data-minimization, breach notification.
- **Deep-linking is explicitly sanctioned**; scraping / credential-proxying
  often violates ToS — another reason for the Model-A + Model-C stack.
- **ONDC/Beckn**: register as a Buyer App — the clean, integration-friendly path.
- Consumer protection: transparent pricing, clear "estimate, not final price"
  disclaimers, refund/cancellation policy.
- **Motor Vehicle Aggregator Guidelines 2020** apply only if we ever *dispatch*
  rides ourselves (not in current scope).

---

## 7. Roadmap

**Phase 0 — Validation & legal (2–3 wks).** Confirm ONDC Buyer-App access,
provider ToS, deep-link parameters. Draft Uber/Ola partnership outreach.

**Phase 1 — MVP, compare-only, WEB (6–10 wks).** Next.js mobile-web/PWA.
Estimates from ONDC + deep-link handoff to Uber/Ola/Rapido. Single city.
Geocoding, fan-out aggregation, normalized comparison UI, deep-link booking,
SSR comparison pages for SEO, TimescaleDB price logging from day one. *No wallet
yet.*

**Phase 2 — Real booking + mobile (8–12 wks).** Beckn BAP node → genuine in-app
booking + live tracking. Split standalone NestJS backend out of Next.js. Begin
**Flutter** app reusing the same backend. Accounts, ride history, ratings.

**Phase 3 — Moat & monetization (ongoing).** Pricing-history/prediction engine,
unified wallet, loyalty, safety features, multi-city, B2B/corporate dashboard.

---

## 8. Monetization

Affiliate/referral commissions (deep-link partners) · ONDC booking margin ·
corporate/B2B travel subscriptions · premium features (price alerts,
predictions) · anonymized mobility-insights data products (at scale).

---

## 9. Open questions / next steps

- [ ] Confirm ONDC Buyer-App registration path and timeline.
- [ ] Verify current deep-link parameter support for Ola & Rapido (Uber
      confirmed).
- [ ] Choose launch city (rider density + ONDC coverage, e.g. Bengaluru).
- [ ] Decide NestJS vs Go for the aggregation service.
- [ ] Then: scaffold repo (backend + provider-adapter interface + Flutter shell).
```
