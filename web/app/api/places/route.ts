import { NextResponse } from "next/server";
import { autocomplete } from "@/lib/places";

// Proxies place autocomplete. Uses Ola Maps if a key is set (kept server-side),
// otherwise keyless OpenStreetMap (Photon) — so the dropdown shows real public
// places for any address with no key required.
export const runtime = "nodejs";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("input")?.trim() ?? "";
  if (input.length < 2) return NextResponse.json({ suggestions: [] });

  const suggestions = await autocomplete(input);
  return NextResponse.json(
    { suggestions },
    { headers: { "cache-control": "no-store" } },
  );
}
