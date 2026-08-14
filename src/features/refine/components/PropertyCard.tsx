import type { SelectedAddress } from "@/types"
import type { EnrichedAttributes, SalePropensity } from "@/types/enrichment"
import { PROPERTY_TYPE_LABELS } from "../filters"

interface PropertyCardProps {
  address: SelectedAddress
  attributes: EnrichedAttributes | null
  matched: boolean
  loading: boolean
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

// Bands predicting a sale within the next couple of years get a callout.
const HOT_PROPENSITY: ReadonlySet<SalePropensity> = new Set(["<1y", "1-2y"])

export function PropertyCard({ address, attributes, matched, loading }: PropertyCardProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-opacity ${
        matched ? "bg-white border-sand" : "bg-cream/60 border-sand/70 opacity-45"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-navy leading-snug">
          {address.displayAddress}
        </span>
        {!matched && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-navy-soft/70 bg-sand rounded-full px-2 py-0.5">
            Filtered out
          </span>
        )}
        {matched && attributes?.salePropensity && HOT_PROPENSITY.has(attributes.salePropensity) && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-coral-dark bg-coral-soft rounded-full px-2 py-0.5">
            May sell soon
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-1.5 mt-2" aria-label="Loading property details">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="h-5 w-16 rounded-full bg-sand animate-pulse" />
          ))}
        </div>
      ) : attributes ? (
        <>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {attributes.propertyType && (
              <AttributeChip>{PROPERTY_TYPE_LABELS[attributes.propertyType]}</AttributeChip>
            )}
            {attributes.bedrooms !== null && (
              <AttributeChip>
                {attributes.bedroomsEstimated ? "~" : ""}
                {attributes.bedrooms} bed{attributes.bedrooms === 1 ? "" : "s"}
              </AttributeChip>
            )}
            {attributes.floorAreaSqm !== null && (
              <AttributeChip>
                {attributes.floorAreaEstimated ? "~" : ""}
                {attributes.floorAreaSqm} m²
              </AttributeChip>
            )}
            {attributes.epcRating && <AttributeChip>EPC {attributes.epcRating}</AttributeChip>}
            {attributes.councilTaxBand && (
              <AttributeChip>Tax band {attributes.councilTaxBand}</AttributeChip>
            )}
            {attributes.garden === true && <AttributeChip>Garden</AttributeChip>}
            {attributes.parking === true && <AttributeChip>Parking</AttributeChip>}
            {attributes.garage === true && <AttributeChip>Garage</AttributeChip>}
          </div>
          {(attributes.estimatedValueGbp !== null || attributes.yearsOwned !== null) && (
            <p className="text-xs text-navy-soft mt-2">
              {attributes.estimatedValueGbp !== null && (
                <>Est. {GBP.format(attributes.estimatedValueGbp)}</>
              )}
              {attributes.estimatedValueGbp !== null && attributes.yearsOwned !== null && " · "}
              {attributes.yearsOwned !== null && (
                <>
                  Owned {attributes.yearsOwned} {attributes.yearsOwned === 1 ? "year" : "years"}
                  {attributes.lastSoldPriceGbp !== null &&
                    ` (bought ${GBP.format(attributes.lastSoldPriceGbp)})`}
                </>
              )}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-navy-soft/70 mt-2">No property details available</p>
      )}
    </div>
  )
}

function AttributeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] text-navy-soft bg-cream border border-sand rounded-full px-2 py-0.5">
      {children}
    </span>
  )
}
