import { olaDeepLink } from "@/lib/deeplink";
import { computeFare, TARIFFS } from "@/lib/fare/tariff";
import type { EstimateRequest, ProviderAdapter, RideEstimate } from "./types";

const PRODUCTS: Record<string, string> = {
  cab: "Ola Mini",
  auto: "Ola Auto",
  bike: "Ola Bike",
};

export const olaAdapter: ProviderAdapter = {
  id: "ola",
  label: "Ola",
  bookingMode: "deep_link",
  coverage: "national",
  async getEstimates(req: EstimateRequest): Promise<RideEstimate[]> {
    const { route, rideType } = req;
    const fare = computeFare(
      route.distanceKm,
      route.durationMin,
      TARIFFS.ola[rideType],
    );
    return [
      {
        provider: "ola",
        providerLabel: "Ola",
        productName: PRODUCTS[rideType],
        rideType,
        currency: "INR",
        ...fare,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        bookingMode: "deep_link",
        deepLink: olaDeepLink(route.pickup, route.dropoff),
        brandColor: "#c7f000",
        note: "Tariff estimate · excl. live surge",
      },
    ];
  },
};
