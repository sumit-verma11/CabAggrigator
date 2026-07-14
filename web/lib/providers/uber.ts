import { uberDeepLink } from "@/lib/deeplink";
import { computeFare, TARIFFS } from "@/lib/fare/tariff";
import type { EstimateRequest, ProviderAdapter, RideEstimate } from "./types";

// Uber = walled garden → deep-link handoff only. Fare is a real tariff-card
// estimate over the real route (Uber's live price API is partner-gated).
const PRODUCTS: Record<string, string> = {
  cab: "Uber Go",
  auto: "Uber Auto",
  bike: "Uber Moto",
};

export const uberAdapter: ProviderAdapter = {
  id: "uber",
  label: "Uber",
  bookingMode: "deep_link",
  coverage: "national",
  async getEstimates(req: EstimateRequest): Promise<RideEstimate[]> {
    const { route, rideType } = req;
    const fare = computeFare(
      route.distanceKm,
      route.durationMin,
      TARIFFS.uber[rideType],
    );
    return [
      {
        provider: "uber",
        providerLabel: "Uber",
        productName: PRODUCTS[rideType],
        rideType,
        currency: "INR",
        ...fare,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        bookingMode: "deep_link",
        deepLink: uberDeepLink(route.pickup, route.dropoff),
        brandColor: "#c9c9c9",
        note: "Tariff estimate · excl. live surge",
      },
    ];
  },
};
