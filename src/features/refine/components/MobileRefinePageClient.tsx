"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StickyCTA } from "@/components/mobile/StickyCTA"
import { RefineFilterControls } from "./RefineFilterControls"
import { PropertyCard } from "./PropertyCard"
import { useEnrichment } from "../hooks/useEnrichment"
import { matchesFilters, normaliseFilters, type RefineFilters } from "../filters"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"

export function MobileRefinePageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const [filters, setFilters] = useState<RefineFilters>(() =>
    normaliseFilters(campaignState.refineFilters),
  )
  const { pendingIds } = useEnrichment(
    campaignState.selectedAddresses,
    campaignState.enrichment,
  )

  const rows = campaignState.selectedAddresses.map((address) => {
    const result = campaignState.enrichment[address.id] ?? null
    const loading = pendingIds.has(address.id) && result === null
    const matched = result === null ? true : matchesFilters(result.attributes, filters)
    return { address, result, loading, matched }
  })

  const matchedRows = rows.filter((r) => r.matched)
  const loadingCount = rows.filter((r) => r.loading).length
  const liveCount = rows.filter((r) => r.result?.source === "chimnie").length

  function handleNext() {
    if (matchedRows.length === 0) return
    campaignStore.setAddresses(matchedRows.map((r) => r.address))
    campaignStore.setRefineFilters(filters)
    router.push("/m/letter")
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6 py-12">
        <p className="text-sm text-navy-soft">You haven&apos;t selected any addresses yet.</p>
        <button
          onClick={() => router.push("/m/map")}
          className="text-coral font-semibold text-sm px-5 py-3 rounded-xl bg-coral-soft active:bg-coral-soft/70"
        >
          ← Go back to the map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 py-4 border-b border-sand">
        <h1 className="text-base font-semibold text-navy">Refine your results</h1>
        <p className="text-xs text-navy-soft mt-0.5">
          Narrow down by property type, size and features
        </p>
      </div>

      <section className="px-4 py-5 border-b border-sand bg-white">
        <RefineFilterControls filters={filters} onChange={setFilters} />
      </section>

      <section className="px-4 py-5 flex-1 bg-cream">
        <div className="flex items-baseline justify-between mb-3 gap-3">
          <h2 className="text-sm font-semibold text-navy">
            {matchedRows.length} of {rows.length} match
          </h2>
          <span className="text-[10px] text-navy-soft/70 text-right">
            {loadingCount > 0
              ? `Fetching details (${rows.length - loadingCount}/${rows.length})…`
              : liveCount > 0
                ? "Property data by Chimnie"
                : "Sample data for this prototype"}
          </span>
        </div>
        <div className="flex flex-col gap-2.5 pb-4">
          {rows.map(({ address, result, loading, matched }) => (
            <PropertyCard
              key={address.id}
              address={address}
              attributes={result?.attributes ?? null}
              matched={matched}
              loading={loading}
            />
          ))}
        </div>
      </section>

      <StickyCTA>
        <button
          onClick={handleNext}
          disabled={matchedRows.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral active:bg-coral-dark text-white"
        >
          {matchedRows.length === 0
            ? "No properties match your filters"
            : `Next: Write your letter (${matchedRows.length}) →`}
        </button>
      </StickyCTA>
    </div>
  )
}
