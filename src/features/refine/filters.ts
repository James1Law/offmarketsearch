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

/**
 * Strict matching: when a filter is active, a property with unknown data for
 * that field does not match. Cards surface unknowns so this stays legible.
 */
export function matchesFilters(attributes: EnrichedAttributes, filters: RefineFilters): boolean {
  if (filters.propertyTypes.length > 0) {
    if (attributes.propertyType === null) return false
    if (!filters.propertyTypes.includes(attributes.propertyType)) return false
  }
  if (filters.minBedrooms > 0) {
    if (attributes.bedrooms === null || attributes.bedrooms < filters.minBedrooms) return false
  }
  if (filters.minFloorAreaSqm > 0) {
    if (attributes.floorAreaSqm === null || attributes.floorAreaSqm < filters.minFloorAreaSqm) {
      return false
    }
  }
  if (filters.mustHaveParking && attributes.parking !== true) return false
  if (filters.mustHaveGarage && attributes.garage !== true) return false
  if (filters.minYearsOwned > 0) {
    if (attributes.yearsOwned === null || attributes.yearsOwned < filters.minYearsOwned) {
      return false
    }
  }
  return true
}

export function isDefaultFilters(filters: RefineFilters): boolean {
  return (
    filters.propertyTypes.length === 0 &&
    filters.minBedrooms === 0 &&
    filters.minFloorAreaSqm === 0 &&
    !filters.mustHaveParking &&
    !filters.mustHaveGarage &&
    filters.minYearsOwned === 0
  )
}

/**
 * Merge possibly-stale stored filters (saved before fields were added or
 * renamed) over the defaults so every field is present.
 */
export function normaliseFilters(stored: Partial<RefineFilters> | null): RefineFilters {
  return {
    ...DEFAULT_FILTERS,
    ...(stored ?? {}),
    propertyTypes: stored?.propertyTypes ?? [],
    minBedrooms: stored?.minBedrooms ?? 0,
    minFloorAreaSqm: stored?.minFloorAreaSqm ?? 0,
    mustHaveParking: stored?.mustHaveParking ?? false,
    mustHaveGarage: stored?.mustHaveGarage ?? false,
    minYearsOwned: stored?.minYearsOwned ?? 0,
  }
}
