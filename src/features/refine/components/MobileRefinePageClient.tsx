"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { StickyCTA } from "@/components/mobile/StickyCTA"
import { RefineFilterControls } from "./RefineFilterControls"
import { PropertyCard } from "./PropertyCard"
import { getPropertyAttributes } from "../attributes"
import { DEFAULT_FILTERS, matchesFilters, type RefineFilters } from "../filters"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"

export function MobileRefinePageClient() {
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
    router.push("/m/letter")
  }

  if (properties.length === 0) {
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
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy">
            {matchedCount} of {properties.length} match
          </h2>
          <span className="text-[10px] text-navy-soft/70">Sample data for this prototype</span>
        </div>
        <div className="flex flex-col gap-2.5 pb-4">
          {properties.map((p) => (
            <PropertyCard
              key={p.address.id}
              address={p.address}
              attributes={p.attributes}
              matched={matchesFilters(p.attributes, filters)}
            />
          ))}
        </div>
      </section>

      <StickyCTA>
        <button
          onClick={handleNext}
          disabled={matchedCount === 0}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral active:bg-coral-dark text-white"
        >
          {matchedCount === 0
            ? "No properties match your filters"
            : `Next: Write your letter (${matchedCount}) →`}
        </button>
      </StickyCTA>
    </div>
  )
}
