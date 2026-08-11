"use client"

import { PROPERTY_TYPES, type PropertyType } from "@/types"
import {
  BEDROOM_OPTIONS,
  DEFAULT_FILTERS,
  FLOOR_AREA_OPTIONS,
  PROPERTY_TYPE_LABELS,
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
              checked={filters.mustHaveGarden}
              onChange={(e) => onChange({ ...filters, mustHaveGarden: e.target.checked })}
              className="accent-coral"
            />
            Garden
          </label>
          <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
            <input
              type="checkbox"
              checked={filters.mustHaveParking}
              onChange={(e) => onChange({ ...filters, mustHaveParking: e.target.checked })}
              className="accent-coral"
            />
            Off-street parking
          </label>
        </div>
      </fieldset>

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
