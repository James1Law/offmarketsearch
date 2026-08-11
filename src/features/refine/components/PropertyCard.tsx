import type { PropertyAttributes, SelectedAddress } from "@/types"
import { PROPERTY_TYPE_LABELS } from "../filters"

interface PropertyCardProps {
  address: SelectedAddress
  attributes: PropertyAttributes
  matched: boolean
}

export function PropertyCard({ address, attributes, matched }: PropertyCardProps) {
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
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <AttributeChip>{PROPERTY_TYPE_LABELS[attributes.propertyType]}</AttributeChip>
        <AttributeChip>
          {attributes.bedrooms} bed{attributes.bedrooms === 1 ? "" : "s"}
        </AttributeChip>
        <AttributeChip>{attributes.floorAreaSqm} m²</AttributeChip>
        {attributes.hasGarden && <AttributeChip>Garden</AttributeChip>}
        {attributes.hasParking && <AttributeChip>Parking</AttributeChip>}
      </div>
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
