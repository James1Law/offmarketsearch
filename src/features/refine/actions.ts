"use server"

import { z } from "zod"
import { SelectedAddressSchema } from "@/types"
import type { SelectedAddress } from "@/types"
import type { EnrichmentResult } from "@/types/enrichment"
import { enrichAddress } from "@/lib/property-enrichment"
import { env } from "@/lib/env"
import { LIMITS } from "@/lib/constants"

const EnrichRequestSchema = z
  .array(SelectedAddressSchema)
  .min(1)
  .max(LIMITS.MAX_LETTERS_PER_CAMPAIGN)

export interface EnrichAddressesResponse {
  results: EnrichmentResult[]
  totalCostPence: number
}

/**
 * Enrich the given addresses with property data. Chimnie responses are
 * ~1s each, so lookups run in a small concurrent pool: wider with an API key,
 * sequential without one (the keyless sandbox is rate-limited to 1 req/s).
 */
export async function enrichAddresses(input: unknown): Promise<EnrichAddressesResponse> {
  const addresses = EnrichRequestSchema.parse(input)

  const concurrency = env.CHIMNIE_API_KEY ? 5 : 1
  const results: EnrichmentResult[] = new Array(addresses.length)
  let totalCostPence = 0
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < addresses.length) {
      const index = nextIndex++
      const address = addresses[index] as SelectedAddress
      const outcome = await enrichAddress(address)
      results[index] = outcome.result
      totalCostPence += outcome.costPence
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, addresses.length) }, worker))

  if (totalCostPence > 0) {
    console.info(
      `Chimnie enrichment: ${addresses.length} addresses, ${totalCostPence}p consumed`,
    )
  }

  return { results, totalCostPence }
}
