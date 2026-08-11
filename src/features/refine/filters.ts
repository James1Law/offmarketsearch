import type { PropertyAttributes, PropertyType } from "@/types"

export interface RefineFilters {
  /** Empty array means "any property type". */
  propertyTypes: PropertyType[]
  /** 0 means "any". */
  minBedrooms: number
  /** 0 means "any". */
  minFloorAreaSqm: number
  mustHaveGarden: boolean
  mustHaveParking: boolean
}

export const DEFAULT_FILTERS: RefineFilters = {
  propertyTypes: [],
  minBedrooms: 0,
  minFloorAreaSqm: 0,
  mustHaveGarden: false,
  mustHaveParking: false,
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

export function matchesFilters(attributes: PropertyAttributes, filters: RefineFilters): boolean {
  if (
    filters.propertyTypes.length > 0 &&
    !filters.propertyTypes.includes(attributes.propertyType)
  ) {
    return false
  }
  if (attributes.bedrooms < filters.minBedrooms) return false
  if (attributes.floorAreaSqm < filters.minFloorAreaSqm) return false
  if (filters.mustHaveGarden && !attributes.hasGarden) return false
  if (filters.mustHaveParking && !attributes.hasParking) return false
  return true
}

export function isDefaultFilters(filters: RefineFilters): boolean {
  return (
    filters.propertyTypes.length === 0 &&
    filters.minBedrooms === 0 &&
    filters.minFloorAreaSqm === 0 &&
    !filters.mustHaveGarden &&
    !filters.mustHaveParking
  )
}
