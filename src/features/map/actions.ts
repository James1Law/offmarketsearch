"use server"

import { ChimnieSandboxAddressesSchema } from "@/types/enrichment"
import type { SelectedAddress } from "@/types"
import { env } from "@/lib/env"

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
