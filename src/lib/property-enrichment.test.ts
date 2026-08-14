import { describe, it, expect } from "vitest"
import {
  mapChimnieResponse,
  mapPropertyType,
  sampleEnrichment,
  isSandboxAddress,
  CHIMNIE_CORE_FIELDS,
} from "./property-enrichment"
import {
  ChimnieResidentialResponseSchema,
  EnrichmentResultSchema,
} from "@/types/enrichment"
import type { SelectedAddress } from "@/types"

const FULL_RESPONSE = {
  id: "999000000001",
  exact_match: true,
  sandbox: true,
  property: {
    attributes: {
      status: {
        property_type_predicted: "Semi-detached",
        epc_property_type: "House",
        epc_built_form: "Semi-Detached",
        latitude: 53.19,
        longitude: -2.89,
      },
      indoor: {
        bedrooms_declared_and_predicted: 3,
        bedrooms_declared_only: 3,
        floor_area_declared_and_predicted: 92.4,
        // No floor_area_declared_only — the floor area is modelled.
      },
      outdoor: { parking: true, garage: false },
    },
    bills: {
      tax: { council_tax_band_declared_and_predicted: "d" },
      energy: { current_energy_rating_declared_and_predicted: "C" },
    },
    value: {
      sale: {
        property_value: 285000,
        last_transaction_price: 167500,
        last_transaction_date: "2011-03-14",
        years_owned: 15,
        sale_propensity: "2-5y",
      },
    },
  },
  surroundings: {
    values: {
      sale: {
        price_per_sqft: 412.5,
        days_to_sell: 63,
        sales_nearby_12m: 431,
        sales_yoy: -12,
        average_years_owned: 11.2,
      },
    },
  },
  // Unknown keys must be tolerated (stripped) at the boundary.
  unexpected_future_field: { foo: "bar" },
}

const ADDRESS: SelectedAddress = {
  id: "osm-123",
  displayAddress: "1 Chimnie Road, CH1 1MN",
  streetAddress: "1 Chimnie Road",
  postcode: "CH1 1MN",
  lat: 53.19,
  lng: -2.89,
}

describe("ChimnieResidentialResponseSchema", () => {
  it("parses a full response and strips unknown keys", () => {
    const parsed = ChimnieResidentialResponseSchema.parse(FULL_RESPONSE)
    expect(parsed.id).toBe("999000000001")
    expect("unexpected_future_field" in parsed).toBe(false)
  })

  it("parses a sparse response with whole branches missing", () => {
    const parsed = ChimnieResidentialResponseSchema.parse({ id: "999000000009" })
    expect(parsed.property).toBeUndefined()
  })
})

describe("mapChimnieResponse", () => {
  it("maps a full response to domain attributes", () => {
    const parsed = ChimnieResidentialResponseSchema.parse(FULL_RESPONSE)
    const result = mapChimnieResponse(ADDRESS.id, parsed)

    expect(EnrichmentResultSchema.parse(result)).toBeTruthy()
    expect(result.source).toBe("chimnie")
    expect(result.uprn).toBe("999000000001")
    expect(result.attributes).toMatchObject({
      propertyType: "semi-detached",
      bedrooms: 3,
      bedroomsEstimated: false,
      floorAreaSqm: 92,
      floorAreaEstimated: true,
      parking: true,
      garage: false,
      epcRating: "C",
      councilTaxBand: "D",
      estimatedValueGbp: 285000,
      lastSoldPriceGbp: 167500,
      lastSoldDate: "2011-03-14",
      yearsOwned: 15,
      salePropensity: "2-5y",
    })
    expect(result.areaStats).toMatchObject({ pricePerSqft: 412.5, daysToSell: 63 })
  })

  it("maps a sparse response to all-null attributes", () => {
    const parsed = ChimnieResidentialResponseSchema.parse({ id: "999000000009" })
    const result = mapChimnieResponse("a1", parsed)

    expect(EnrichmentResultSchema.parse(result)).toBeTruthy()
    expect(result.attributes.propertyType).toBeNull()
    expect(result.attributes.bedrooms).toBeNull()
    expect(result.attributes.bedroomsEstimated).toBeNull()
    expect(result.attributes.salePropensity).toBeNull()
    expect(result.areaStats).toBeNull()
  })

  it("rejects invalid propensity and band values instead of storing junk", () => {
    const parsed = ChimnieResidentialResponseSchema.parse({
      property: {
        bills: {
          tax: { council_tax_band_declared_and_predicted: "Band Z" },
          energy: { current_energy_rating_declared_and_predicted: "X" },
        },
        value: { sale: { sale_propensity: "soonish" } },
      },
    })
    const result = mapChimnieResponse("a1", parsed)
    expect(result.attributes.councilTaxBand).toBeNull()
    expect(result.attributes.epcRating).toBeNull()
    expect(result.attributes.salePropensity).toBeNull()
  })
})

describe("mapPropertyType", () => {
  it.each([
    [{ property_type_predicted: "Terraced" }, "terraced"],
    [{ property_type_predicted: "Semi-detached" }, "semi-detached"],
    [{ property_type_predicted: "Detached" }, "detached"],
    [{ property_type_predicted: "Apartment" }, "flat"],
    [{ property_type_predicted: "Maisonette" }, "flat"],
    [{ epc_property_type: "Bungalow", property_type_predicted: "Detached" }, "bungalow"],
    [{ property_type_predicted: "Other", epc_property_type: "Flat" }, "flat"],
    [
      { property_type_predicted: "Other", epc_property_type: "House", epc_built_form: "Mid-Terrace" },
      "terraced",
    ],
    [
      { property_type_predicted: "Other", epc_property_type: "House", epc_built_form: "Semi-Detached" },
      "semi-detached",
    ],
    [{ property_type_predicted: "Other" }, null],
    [{}, null],
  ])("maps %j to %s", (status, expected) => {
    expect(mapPropertyType(status)).toBe(expected)
  })
})

describe("sampleEnrichment", () => {
  it("is deterministic per address id and schema-valid", () => {
    const a = sampleEnrichment(ADDRESS)
    const b = sampleEnrichment(ADDRESS)
    expect(a).toEqual(b)
    expect(EnrichmentResultSchema.parse(a)).toBeTruthy()
    expect(a.source).toBe("sample")
    expect(a.attributes.bedrooms).not.toBeNull()
  })

  it("varies across address ids", () => {
    const results = Array.from({ length: 12 }, (_, i) =>
      sampleEnrichment({ ...ADDRESS, id: `osm-${i}` }),
    )
    const types = new Set(results.map((r) => r.attributes.propertyType))
    expect(types.size).toBeGreaterThan(1)
  })
})

describe("isSandboxAddress", () => {
  it("detects the sandbox postcode from postcode or display address", () => {
    expect(isSandboxAddress(ADDRESS)).toBe(true)
    const withoutPostcode: SelectedAddress = { ...ADDRESS }
    delete withoutPostcode.postcode
    expect(isSandboxAddress(withoutPostcode)).toBe(true)
    expect(isSandboxAddress({ ...ADDRESS, displayAddress: "1 Real St", postcode: "SW1A 1AA" })).toBe(
      false,
    )
  })
})

describe("CHIMNIE_CORE_FIELDS", () => {
  it("never includes plus or premium tier fields", () => {
    for (const field of CHIMNIE_CORE_FIELDS.split(",")) {
      expect(field.startsWith("plus.")).toBe(false)
      expect(field.startsWith("premium.")).toBe(false)
    }
  })

  it("is a non-empty explicit list (blank fields would bill at Premium rate)", () => {
    expect(CHIMNIE_CORE_FIELDS.length).toBeGreaterThan(0)
  })
})
