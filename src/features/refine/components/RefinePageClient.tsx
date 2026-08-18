"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefineFilterControls } from "./RefineFilterControls"
import { PropertyCard } from "./PropertyCard"
import { AreaInsights } from "./AreaInsights"
import { DataAttribution } from "./DataAttribution"
import { useEnrichment } from "../hooks/useEnrichment"
import { matchesFilters, normaliseFilters, type RefineFilters } from "../filters"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import { describeDataSource } from "../data-source"

export function RefinePageClient() {
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
    // While details are still loading, keep the property visibly in play.
    const matched = result === null ? true : matchesFilters(result.attributes, filters)
    return { address, result, loading, matched }
  })

  const matchedRows = rows.filter((r) => r.matched)
  const loadingCount = rows.filter((r) => r.loading).length
  const liveCount = rows.filter((r) => r.result?.source === "chimnie").length
  const excludedForUnknown = filters.includeUnknownData
    ? 0
    : rows.filter(
        (r) =>
          !r.matched &&
          r.result !== null &&
          matchesFilters(r.result.attributes, { ...filters, includeUnknownData: true }),
      ).length
  const anyEstimated = rows.some(
    (r) =>
      r.matched &&
      (r.result?.attributes.bedroomsEstimated === true ||
        r.result?.attributes.floorAreaEstimated === true),
  )
  const areaStats =
    (rows.find((r) => r.result?.source === "chimnie" && r.result.areaStats) ??
      rows.find((r) => r.result?.areaStats))?.result?.areaStats ?? null

  function handleNext() {
    if (matchedRows.length === 0) return
    campaignStore.setAddresses(matchedRows.map((r) => r.address))
    campaignStore.setRefineFilters(filters)
    router.push("/letter")
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
        <p className="text-navy-soft">You haven&apos;t selected any addresses yet.</p>
        <button
          onClick={() => router.push("/map")}
          className="text-coral font-medium hover:underline"
        >
          ← Go back to the map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: filters */}
      <aside className="w-80 shrink-0 bg-white border-r border-sand flex flex-col overflow-y-auto">
        <div className="px-5 py-4 border-b border-sand">
          <h2 className="font-semibold text-navy">Refine your results</h2>
          <p className="text-sm text-navy-soft mt-0.5">
            Narrow down by property type, size and features
          </p>
        </div>
        <div className="px-5 py-4 flex-1">
          <RefineFilterControls filters={filters} onChange={setFilters} />
        </div>
        <div className="px-5 py-4 border-t border-sand">
          <button
            onClick={handleNext}
            disabled={matchedRows.length === 0}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral hover:bg-coral-dark text-white"
          >
            {matchedRows.length === 0
              ? "No properties match your filters"
              : `Next: Write your letter (${matchedRows.length}) →`}
          </button>
        </div>
      </aside>

      {/* Right: property list */}
      <div className="flex-1 overflow-y-auto bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-baseline justify-between mb-4 gap-4">
            <h1 className="text-lg font-semibold text-navy">
              {matchedRows.length} of {rows.length} properties match
            </h1>
            <span className="text-xs text-navy-soft/70 text-right">
              {loadingCount > 0
                ? `Fetching property details (${rows.length - loadingCount}/${rows.length})…`
                : describeDataSource(liveCount, rows.length)}
            </span>
          </div>
          {excludedForUnknown > 0 && (
            <p className="text-xs text-navy-soft bg-white border border-sand rounded-lg px-3 py-2 mb-4">
              {excludedForUnknown}{" "}
              {excludedForUnknown === 1 ? "property is" : "properties are"} hidden only because
              a filtered detail is unknown.{" "}
              <button
                onClick={() => setFilters({ ...filters, includeUnknownData: true })}
                className="text-coral font-medium hover:underline"
              >
                Include them anyway
              </button>
            </p>
          )}
          {areaStats && <AreaInsights stats={areaStats} />}
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(({ address, result, loading, matched }) => (
              <PropertyCard
                key={address.id}
                address={address}
                attributes={result?.attributes ?? null}
                matched={matched}
                loading={loading}
                source={result?.source ?? null}
              />
            ))}
          </div>
          {anyEstimated && (
            <p className="text-[10px] text-navy-soft/60 mt-3">
              ~ estimated from Chimnie&apos;s property model where no declared value exists
            </p>
          )}
          {liveCount > 0 && <DataAttribution />}
        </div>
      </div>
    </div>
  )
}
