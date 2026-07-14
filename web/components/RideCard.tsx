"use client";

import { motion } from "framer-motion";
import type { RideEstimate } from "@/lib/providers/types";

export function RideCard({
  est,
  isCheapest,
  index,
}: {
  est: RideEstimate;
  isCheapest: boolean;
  index: number;
}) {
  const inApp = est.bookingMode === "in_app";

  function book() {
    if (inApp) {
      alert(
        `Booking ${est.productName} via ONDC/Beckn (mock).\n` +
          `Phase 2 runs the real search → select → init → confirm flow.`,
      );
    } else if (est.deepLink) {
      window.open(est.deepLink, "_blank", "noopener");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28, ease: "easeOut" }}
      className="card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-6 w-6 rounded-md ring-1 ring-border"
            style={{ background: est.brandColor }}
          />
          <div className="text-sm font-medium text-muted">
            {est.providerLabel}
          </div>
        </div>
        {isCheapest && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">
            Cheapest
          </span>
        )}
      </div>

      <div className="mt-3 text-base font-semibold tracking-tight">
        {est.productName}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[28px] font-semibold leading-none tracking-tight">
            ₹{est.fareMin}
            <span className="ml-0.5 text-base font-normal text-muted">
              –{est.fareMax}
            </span>
          </div>
          <div className="mt-2 text-[13px] text-muted">
            {est.distanceKm} km · {est.durationMin} min
          </div>
        </div>
        <button
          onClick={book}
          className={`btn px-4 py-2 text-sm ${
            inApp ? "btn-accent" : "btn-secondary"
          }`}
        >
          {inApp ? "Book now" : "Open app"}
          {!inApp && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 17 17 7M9 7h8v8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t divider pt-3">
        <span className="text-xs font-medium text-muted">
          {inApp ? "In-app booking" : `Books in ${est.providerLabel}`}
        </span>
        <span className="text-xs text-faint">{est.note}</span>
      </div>
    </motion.div>
  );
}
