"use server"

import { ChimnieSandboxAddressesSchema } from "@/types/enrichment"
import { BBoxSchema, PolygonRingSchema } from "@/types"
import type { AreaSearchResult, SelectedAddress } from "@/types"
import { fetchAddressesInBBox, fetchAddressesInPolygon } from "@/lib/geocoding/overpass"
import { env } from "@/lib/env"

// ---------------------------------------------------------------------------
// Address lookup. These wrap Overpass because the browser cannot call it
// directly — overpass-api.de returns no Access-Control-Allow-Origin header, so
// every client-side attempt failed CORS. Inputs are validated here because a
// server action is a public HTTP endpoint whatever the call site looks like.
// ---------------------------------------------------------------------------

/** Addresses inside a drawn or placed area. */
export async function findAddressesInArea(ring: unknown): Promise<AreaSearchResult> {
  return fetchAddressesInPolygon(PolygonRingSchema.parse(ring))
}

/** Addresses inside the current viewport, once zoomed in far enough. */
export async function findAddressesInViewport(bbox: unknown): Promise<AreaSearchResult> {
  return fetchAddressesInBBox(BBoxSchema.parse(bbox))
}

// Chester city centre — the sandbox postcode CH1 1MN is fictional, so demo
// markers are spread around a plausible location.
const SANDBOX_BASE = { lat: 53.1934, lng: -2.8931 }

/**
 * Load Chimnie's free sandbox properties as selectable addresses, so the
 * whole flow can be demoed against real API responses without an API key.
 */
export async function loadSandboxAddresses(): Promise<SelectedAddress[]> {
  const headers: Record<string, string> = {}
  if (env.CHIMNIE_API_KEY) headers["Authorization"] = `Bearer ${env.CHIMNIE_API_KEY}`

  const res = await fetch("https://api.chimnie.com/info/sandbox-addresses", {
    headers,
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to load sandbox addresses: ${res.status}`)
  }

  const raw: unknown = await res.json()
  const parsed = ChimnieSandboxAddressesSchema.parse(raw)

  return parsed.properties
    .filter((p) => p.classification === "Residential")
    .map((p, i) => ({
      id: `chimnie-sandbox-${p.uprn}`,
      displayAddress: p.address,
      streetAddress: p.address.split(",")[0] ?? p.address,
      postcode: parsed.postcode,
      lat: SANDBOX_BASE.lat + (i % 6) * 0.0006,
      lng: SANDBOX_BASE.lng + Math.floor(i / 6) * 0.0009,
    }))
}
