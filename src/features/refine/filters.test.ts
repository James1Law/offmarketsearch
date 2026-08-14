import { describe, it, expect } from "vitest"
import { DEFAULT_FILTERS, matchesFilters, normaliseFilters, isDefaultFilters } from "./filters"
import type { EnrichedAttributes } from "@/types/enrichment"

const FULL: EnrichedAttributes = {
  propertyType: "semi-detached",
  bedrooms: 3,
  floorAreaSqm: 92,
  parking: true,
  garage: false,
  epcRating: "C",
  councilTaxBand: "D",
  estimatedValueGbp: 285000,
  lastSoldPriceGbp: 167500,
  lastSoldDate: "2011-03-14",
  yearsOwned: 15,
  salePropensity: "2-5y",
}

const UNKNOWN: EnrichedAttributes = {
  propertyType: null,
  bedrooms: null,
  floorAreaSqm: null,
  parking: null,
  garage: null,
  epcRating: null,
  councilTaxBand: null,
  estimatedValueGbp: null,
  lastSoldPriceGbp: null,
  lastSoldDate: null,
  yearsOwned: null,
  salePropensity: null,
}

describe("matchesFilters", () => {
  it("matches everything with default filters, even all-unknown attributes", () => {
    expect(matchesFilters(FULL, DEFAULT_FILTERS)).toBe(true)
    expect(matchesFilters(UNKNOWN, DEFAULT_FILTERS)).toBe(true)
  })

  it("filters by property type, treating unknown as no match", () => {
    const filters = { ...DEFAULT_FILTERS, propertyTypes: ["detached" as const] }
    expect(matchesFilters(FULL, filters)).toBe(false)
    expect(matchesFilters({ ...FULL, propertyType: "detached" }, filters)).toBe(true)
    expect(matchesFilters(UNKNOWN, filters)).toBe(false)
  })

  it("filters by minimum bedrooms and floor area", () => {
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minBedrooms: 3 })).toBe(true)
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minBedrooms: 4 })).toBe(false)
    expect(matchesFilters(UNKNOWN, { ...DEFAULT_FILTERS, minBedrooms: 1 })).toBe(false)
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minFloorAreaSqm: 100 })).toBe(false)
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minFloorAreaSqm: 75 })).toBe(true)
  })

  it("requires parking/garage to be affirmatively true", () => {
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, mustHaveParking: true })).toBe(true)
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, mustHaveGarage: true })).toBe(false)
    expect(matchesFilters(UNKNOWN, { ...DEFAULT_FILTERS, mustHaveParking: true })).toBe(false)
  })

  it("filters by years owned", () => {
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minYearsOwned: 10 })).toBe(true)
    expect(matchesFilters(FULL, { ...DEFAULT_FILTERS, minYearsOwned: 20 })).toBe(false)
    expect(matchesFilters(UNKNOWN, { ...DEFAULT_FILTERS, minYearsOwned: 5 })).toBe(false)
  })
})

describe("normaliseFilters", () => {
  it("returns defaults for null", () => {
    expect(normaliseFilters(null)).toEqual(DEFAULT_FILTERS)
  })

  it("fills fields missing from filters stored by older app versions", () => {
    const legacy = { propertyTypes: ["flat"], minBedrooms: 2 } as Parameters<
      typeof normaliseFilters
    >[0]
    const result = normaliseFilters(legacy)
    expect(result.propertyTypes).toEqual(["flat"])
    expect(result.minBedrooms).toBe(2)
    expect(result.mustHaveGarage).toBe(false)
    expect(result.minYearsOwned).toBe(0)
  })
})

describe("isDefaultFilters", () => {
  it("detects default and non-default filters", () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true)
    expect(isDefaultFilters({ ...DEFAULT_FILTERS, minYearsOwned: 10 })).toBe(false)
  })
})
