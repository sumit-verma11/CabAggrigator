import { computeFare, TARIFFS } from "@/lib/fare/tariff";
import { ONDC_COVERAGE } from "./coverage";
import type { EstimateRequest, ProviderAdapter, RideEstimate } from "./types";

// ONDC / Beckn (e.g. Namma Yatri) = OPEN network → REAL in-app booking.
// In Phase 2 this adapter drives the real Beckn BAP flow (search → select →
// init → confirm → status). Today it returns a tariff-card estimate (no surge)
// and is flagged as the in-app booking path.
const PRODUCTS: Record<string, string> = {
  cab: "Namma Yatri Cab",
  auto: "Namma Yatri Auto",
  bike: "Namma Yatri Bike",
};

export const ondcAdapter: ProviderAdapter = {
  id: "ondc",
  label: "Namma Yatri (ONDC)",
  bookingMode: "in_app",
  coverage: ONDC_COVERAGE,
  async getEstimates(req: EstimateRequest): Promise<RideEstimate[]> {
    const { route, rideType } = req;
    const fare = computeFare(
      route.distanceKm,
      route.durationMin,
      TARIFFS.ondc[rideType],
    );
    return [
      {
        provider: "ondc",
        providerLabel: "Namma Yatri (ONDC)",
        productName: PRODUCTS[rideType],
        rideType,
        currency: "INR",
        ...fare,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        bookingMode: "in_app",
        brandColor: "#00c281",
        note: "Zero-commission meter fare · no surge",
      },
    ];
  },
};
