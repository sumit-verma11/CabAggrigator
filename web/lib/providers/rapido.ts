import { rapidoDeepLink } from "@/lib/deeplink";
import { computeFare, TARIFFS } from "@/lib/fare/tariff";
import type { EstimateRequest, ProviderAdapter, RideEstimate } from "./types";

const PRODUCTS: Record<string, string> = {
  cab: "Rapido Cab",
  auto: "Rapido Auto",
  bike: "Rapido Bike",
};

export const rapidoAdapter: ProviderAdapter = {
  id: "rapido",
  label: "Rapido",
  bookingMode: "deep_link",
  coverage: "national",
  async getEstimates(req: EstimateRequest): Promise<RideEstimate[]> {
    const { route, rideType } = req;
    const fare = computeFare(
      route.distanceKm,
      route.durationMin,
      TARIFFS.rapido[rideType],
    );
    return [
      {
        provider: "rapido",
        providerLabel: "Rapido",
        productName: PRODUCTS[rideType],
        rideType,
        currency: "INR",
        ...fare,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        bookingMode: "deep_link",
        deepLink: rapidoDeepLink(route.pickup, route.dropoff),
        brandColor: "#f8d000",
        note: "Tariff estimate · excl. live surge",
      },
    ];
  },
};
