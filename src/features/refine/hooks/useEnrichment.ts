"use client"

import { useEffect, useRef, useState } from "react"
import type { SelectedAddress } from "@/types"
import type { EnrichmentResult } from "@/types/enrichment"
import { campaignStore } from "@/lib/campaign-store"
import { enrichAddresses } from "../actions"

// Enrich in small chunks so results appear progressively — Chimnie lookups
// take ~1s each and the keyless sandbox is limited to 1 request/second.
const CHUNK_SIZE = 5

interface UseEnrichmentResult {
  /** Address ids currently being enriched. */
  pendingIds: Set<string>
  /** True if a lookup batch failed outright (individual misses fall back to sample data). */
  failed: boolean
}

export function useEnrichment(
  addresses: SelectedAddress[],
  enrichment: Record<string, EnrichmentResult>,
): UseEnrichmentResult {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [failed, setFailed] = useState(false)
  const requestedIds = useRef<Set<string>>(new Set())

  // No cancellation on re-render: results merge into the module-level
  // campaign store, so a batch loop must run to completion even though
  // each merge re-triggers this effect (where `missing` is then empty).
  useEffect(() => {
    const missing = addresses.filter(
      (a) => !enrichment[a.id] && !requestedIds.current.has(a.id),
    )
    if (missing.length === 0) return

    for (const address of missing) requestedIds.current.add(address.id)
    setPendingIds((prev) => new Set([...prev, ...missing.map((a) => a.id)]))

    async function run() {
      for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
        const chunk = missing.slice(i, i + CHUNK_SIZE)
        try {
          const { results } = await enrichAddresses(chunk)
          campaignStore.mergeEnrichment(results)
        } catch (error) {
          console.warn("Enrichment batch failed:", error)
          setFailed(true)
          // Allow a retry on next mount for the failed chunk.
          for (const address of chunk) requestedIds.current.delete(address.id)
        } finally {
          setPendingIds((prev) => {
            const next = new Set(prev)
            for (const address of chunk) next.delete(address.id)
            return next
          })
        }
      }
    }

    void run()
  }, [addresses, enrichment])

  return { pendingIds, failed }
}
