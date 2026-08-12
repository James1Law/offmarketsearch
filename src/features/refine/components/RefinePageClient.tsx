"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { RefineFilterControls } from "./RefineFilterControls"
import { PropertyCard } from "./PropertyCard"
import { getPropertyAttributes } from "../attributes"
import { DEFAULT_FILTERS, matchesFilters, type RefineFilters } from "../filters"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"

export function RefinePageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const [filters, setFilters] = useState<RefineFilters>(
    campaignState.refineFilters ?? DEFAULT_FILTERS,
  )

  const properties = useMemo(
    () =>
      campaignState.selectedAddresses.map((address) => ({
        address,
        attributes: getPropertyAttributes(address),
      })),
    [campaignState.selectedAddresses],
  )

  const matched = properties.filter((p) => matchesFilters(p.attributes, filters))
  const matchedCount = matched.length

  function handleNext() {
    if (matchedCount === 0) return
    campaignStore.setAddresses(matched.map((m) => m.address))
    campaignStore.setRefineFilters(filters)
    router.push("/letter")
  }

  if (properties.length === 0) {
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
            disabled={matchedCount === 0}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral hover:bg-coral-dark text-white"
          >
            {matchedCount === 0
              ? "No properties match your filters"
              : `Next: Write your letter (${matchedCount}) →`}
          </button>
        </div>
      </aside>

      {/* Right: property list */}
      <div className="flex-1 overflow-y-auto bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-lg font-semibold text-navy">
              {matchedCount} of {properties.length} properties match
            </h1>
            <span className="text-xs text-navy-soft/70">
              Property details are sample data for this prototype
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <PropertyCard
                key={p.address.id}
                address={p.address}
                attributes={p.attributes}
                matched={matchesFilters(p.attributes, filters)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
