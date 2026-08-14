import type { PropertyType, RefineFilters } from "@/types"
import type { EnrichedAttributes } from "@/types/enrichment"

export type { RefineFilters }

export const DEFAULT_FILTERS: RefineFilters = {
  propertyTypes: [],
  minBedrooms: 0,
  minFloorAreaSqm: 0,
  mustHaveParking: false,
  mustHaveGarage: false,
  minYearsOwned: 0,
  minEstimatedValueGbp: 0,
  maxEstimatedValueGbp: 0,
  includeUnknownData: false,
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  detached: "Detached",
  "semi-detached": "Semi-detached",
  terraced: "Terraced",
  flat: "Flat",
  bungalow: "Bungalow",
}

export const BEDROOM_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "5+" },
] as const

export const FLOOR_AREA_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 50, label: "50+ m²" },
  { value: 75, label: "75+ m²" },
  { value: 100, label: "100+ m²" },
  { value: 150, label: "150+ m²" },
] as const

export const YEARS_OWNED_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 5, label: "5+ years" },
  { value: 10, label: "10+ years" },
  { value: 15, label: "15+ years" },
  { value: 20, label: "20+ years" },
] as const

const VALUE_STEPS = [
  100_000, 150_000, 200_000, 250_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000,
  2_000_000,
]

function formatValueLabel(value: number): string {
  return value >= 1_000_000 ? `£${value / 1_000_000}m` : `£${value / 1000}k`
}

export const MIN_VALUE_OPTIONS = [
  { value: 0, label: "No min" },
  ...VALUE_STEPS.slice(0, -1).map((v) => ({ value: v, label: formatValueLabel(v) })),
]

export const MAX_VALUE_OPTIONS = [
  { value: 0, label: "No max" },
  ...VALUE_STEPS.map((v) => ({ value: v, label: formatValueLabel(v) })),
]

/**
 * When a filter is active and the property's data for that field is unknown,
 * the property is excluded — unless `includeUnknownData` is on. A known value
 * that fails the filter is always excluded.
 */
export function matchesFilters(attributes: EnrichedAttributes, filters: RefineFilters): boolean {
  const allowUnknown = filters.includeUnknownData

  function check<T>(active: boolean, value: T | null, passes: (value: T) => boolean): boolean {
    if (!active) return true
    if (value === null) return allowUnknown
    return passes(value)
  }

  return (
    check(filters.propertyTypes.length > 0, attributes.propertyType, (t) =>
      filters.propertyTypes.includes(t),
    ) &&
    check(filters.minBedrooms > 0, attributes.bedrooms, (b) => b >= filters.minBedrooms) &&
    check(
      filters.minFloorAreaSqm > 0,
      attributes.floorAreaSqm,
      (a) => a >= filters.minFloorAreaSqm,
    ) &&
    check(filters.mustHaveParking, attributes.parking, (p) => p) &&
    check(filters.mustHaveGarage, attributes.garage, (g) => g) &&
    check(filters.minYearsOwned > 0, attributes.yearsOwned, (y) => y >= filters.minYearsOwned) &&
    check(
      filters.minEstimatedValueGbp > 0,
      attributes.estimatedValueGbp,
      (v) => v >= filters.minEstimatedValueGbp,
    ) &&
    check(
      filters.maxEstimatedValueGbp > 0,
      attributes.estimatedValueGbp,
      (v) => v <= filters.maxEstimatedValueGbp,
    )
  )
}

export function isDefaultFilters(filters: RefineFilters): boolean {
  return (
    filters.propertyTypes.length === 0 &&
    filters.minBedrooms === 0 &&
    filters.minFloorAreaSqm === 0 &&
    !filters.mustHaveParking &&
    !filters.mustHaveGarage &&
    filters.minYearsOwned === 0 &&
    filters.minEstimatedValueGbp === 0 &&
    filters.maxEstimatedValueGbp === 0 &&
    !filters.includeUnknownData
  )
}

/**
 * Merge possibly-stale stored filters (saved before fields were added or
 * renamed) over the defaults so every field is present.
 */
export function normaliseFilters(stored: Partial<RefineFilters> | null): RefineFilters {
  const merged: RefineFilters = { ...DEFAULT_FILTERS }
  if (!stored) return merged
  for (const key of Object.keys(DEFAULT_FILTERS) as Array<keyof RefineFilters>) {
    const value = stored[key]
    if (value !== undefined) {
      // Keys come from DEFAULT_FILTERS, so value has the right type for key.
      merged[key] = value as never
    }
  }
  return merged
}
