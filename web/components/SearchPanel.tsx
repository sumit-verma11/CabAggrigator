"use client";

import { useRef, useState } from "react";
import { POIS } from "@/lib/geo";
import type { RideType } from "@/lib/providers/types";

const RIDE_TYPES: { id: RideType; label: string }[] = [
  { id: "cab", label: "Cab" },
  { id: "auto", label: "Auto" },
  { id: "bike", label: "Bike" },
];

function poiFallback(q: string): string[] {
  const s = q.trim().toLowerCase();
  return POIS.filter((p) => p.label.toLowerCase().includes(s))
    .map((p) => p.label)
    .slice(0, 6);
}

export function SearchPanel({
  onSearch,
  loading,
}: {
  onSearch: (pickup: string, dropoff: string, rideType: RideType) => void;
  loading: boolean;
}) {
  const [pickup, setPickup] = useState("Indiranagar, Bengaluru");
  const [dropoff, setDropoff] = useState("Kempegowda Intl Airport (BLR)");
  const [rideType, setRideType] = useState<RideType>("cab");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pickup.trim() && dropoff.trim()) onSearch(pickup, dropoff, rideType);
  }

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-2xl p-4 sm:p-5">
      <div className="relative z-20 flex flex-col gap-2.5">
        <AutocompleteField
          label="From"
          dotClass="bg-accent"
          value={pickup}
          onChange={setPickup}
          placeholder="Pickup location"
        />
        <AutocompleteField
          label="To"
          dotClass="bg-text"
          value={dropoff}
          onChange={setDropoff}
          placeholder="Destination"
        />
        <button
          type="button"
          onClick={swap}
          aria-label="Swap pickup and drop"
          className="btn btn-secondary absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 !rounded-full p-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* segmented control */}
        <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
          {RIDE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRideType(t.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                rideType === t.id
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-5 py-2.5 text-sm"
        >
          {loading ? "Comparing…" : "Compare fares"}
        </button>
      </div>
    </form>
  );
}

function AutocompleteField({
  label,
  dotClass,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  dotClass: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(v: string) {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      let list: string[] = [];
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(v)}`);
        const j = await res.json();
        list = (j.suggestions ?? [])
          .map((s: { description: string }) => s.description)
          .filter(Boolean);
      } catch {
        /* fall through to offline suggestions */
      }
      if (list.length === 0) list = poiFallback(v);
      setSuggestions(list);
      setOpen(list.length > 0);
    }, 250);
  }

  function pick(s: string) {
    onChange(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className={`relative ${open ? "z-30" : ""}`}>
      <label className="field flex items-center gap-3 px-3.5 py-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <span className="w-8 shrink-0 text-xs font-medium uppercase tracking-wide text-faint">
          {label}
        </span>
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
      </label>
      {open && (
        <ul className="popover absolute z-40 mt-1.5 max-h-60 w-full overflow-auto p-1.5">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="flex w-full items-center gap-2.5 truncate rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-surface-2 hover:text-text"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-faint"
                  aria-hidden
                >
                  <path
                    d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
