"use client"

import { PROPERTY_TYPES, type PropertyType } from "@/types"
import {
  BEDROOM_OPTIONS,
  DEFAULT_FILTERS,
  FLOOR_AREA_OPTIONS,
  MAX_VALUE_OPTIONS,
  MIN_VALUE_OPTIONS,
  PROPERTY_TYPE_LABELS,
  YEARS_OWNED_OPTIONS,
  isDefaultFilters,
  type RefineFilters,
} from "../filters"

interface RefineFilterControlsProps {
  filters: RefineFilters
  onChange: (filters: RefineFilters) => void
}

export function RefineFilterControls({ filters, onChange }: RefineFilterControlsProps) {
  function toggleType(type: PropertyType) {
    const next = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type]
    onChange({ ...filters, propertyTypes: next })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Property type */}
      <fieldset>
        <legend className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
          Property type
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((type) => {
            const active = filters.propertyTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-coral text-white border-coral"
                    : "bg-white text-navy-soft border-sand hover:border-coral"
                }`}
              >
                {PROPERTY_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-navy-soft/70 mt-1.5">
          {filters.propertyTypes.length === 0 ? "Showing all types" : "Showing selected types only"}
        </p>
      </fieldset>

      {/* Bedrooms */}
      <div>
        <label
          htmlFor="refine-bedrooms"
          className="block text-xs font-semibold text-navy uppercase tracking-wide mb-2"
        >
          Bedrooms
        </label>
        <select
          id="refine-bedrooms"
          value={filters.minBedrooms}
          onChange={(e) => onChange({ ...filters, minBedrooms: Number(e.target.value) })}
          className="w-full text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
        >
          {BEDROOM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Floor area */}
      <div>
        <label
          htmlFor="refine-floor-area"
          className="block text-xs font-semibold text-navy uppercase tracking-wide mb-2"
        >
          Floor area
        </label>
        <select
          id="refine-floor-area"
          value={filters.minFloorAreaSqm}
          onChange={(e) => onChange({ ...filters, minFloorAreaSqm: Number(e.target.value) })}
          className="w-full text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
        >
          {FLOOR_AREA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Must-have attributes */}
      <fieldset>
        <legend className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
          Must have
        </legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
            <input
              type="checkbox"
              checked={filters.mustHaveParking}
              onChange={(e) => onChange({ ...filters, mustHaveParking: e.target.checked })}
              className="accent-coral"
            />
            Off-street parking
          </label>
          <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
            <input
              type="checkbox"
              checked={filters.mustHaveGarage}
              onChange={(e) => onChange({ ...filters, mustHaveGarage: e.target.checked })}
              className="accent-coral"
            />
            Garage
          </label>
        </div>
      </fieldset>

      {/* Budget — filters the list only, never written into the letter */}
      <fieldset>
        <legend className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
          Estimated value
        </legend>
        <div className="flex gap-2">
          <select
            aria-label="Minimum estimated value"
            value={filters.minEstimatedValueGbp}
            onChange={(e) =>
              onChange({ ...filters, minEstimatedValueGbp: Number(e.target.value) })
            }
            className="flex-1 min-w-0 text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
          >
            {MIN_VALUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Maximum estimated value"
            value={filters.maxEstimatedValueGbp}
            onChange={(e) =>
              onChange({ ...filters, maxEstimatedValueGbp: Number(e.target.value) })
            }
            className="flex-1 min-w-0 text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
          >
            {MAX_VALUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-navy-soft/70 mt-1.5">
          Your budget stays private — it&apos;s never mentioned in the letter
        </p>
      </fieldset>

      {/* Ownership length — long-term owners are the strongest off-market leads */}
      <div>
        <label
          htmlFor="refine-years-owned"
          className="block text-xs font-semibold text-navy uppercase tracking-wide mb-2"
        >
          Current owner for
        </label>
        <select
          id="refine-years-owned"
          value={filters.minYearsOwned}
          onChange={(e) => onChange({ ...filters, minYearsOwned: Number(e.target.value) })}
          className="w-full text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
        >
          {YEARS_OWNED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-navy-soft/70 mt-1.5">
          Long-term owners are more likely to consider an off-market sale
        </p>
      </div>

      {/* Missing data behaviour */}
      <label className="flex items-start gap-2 text-xs text-navy-soft cursor-pointer">
        <input
          type="checkbox"
          checked={filters.includeUnknownData}
          onChange={(e) => onChange({ ...filters, includeUnknownData: e.target.checked })}
          className="accent-coral mt-0.5"
        />
        <span>
          Include properties with missing data
          <span className="block text-[11px] text-navy-soft/70">
            Keep properties even when a filtered detail is unknown
          </span>
        </span>
      </label>

      {!isDefaultFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="self-start text-xs text-coral font-medium hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  )
}
