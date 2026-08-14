import type { SelectedAddress } from "@/types"
import type { PropertyType } from "@/types"
import {
  ChimnieResidentialResponseSchema,
  SalePropensitySchema,
  type AreaSaleStats,
  type ChimnieResidentialResponse,
  type EnrichedAttributes,
  type EnrichmentResult,
} from "@/types/enrichment"
import { env } from "@/lib/env"

// ---------------------------------------------------------------------------
// Property enrichment: given a selected address, return real attributes from
// the Chimnie Data API, falling back to deterministic sample data when Chimnie
// is unavailable (no API key, no match, or an error).
//
// Server-only: never import this from client components — it reads the API
// key from the environment.
// ---------------------------------------------------------------------------

const CHIMNIE_BASE_URL = "https://api.chimnie.com"

/** Free sandbox postcode — works without an API key. */
export const CHIMNIE_SANDBOX_POSTCODE = "CH1 1MN"

// Explicit Core-tier field list. NEVER request with a blank fields parameter:
// blank means "everything" and bills at the Premium rate (15p) per lookup.
export const CHIMNIE_CORE_FIELDS = [
  "property.attributes.status.property_type_predicted",
  "property.attributes.status.epc_property_type",
  "property.attributes.status.epc_built_form",
  "property.attributes.indoor.bedrooms_declared_and_predicted",
  "property.attributes.indoor.floor_area_declared_and_predicted",
  "property.attributes.outdoor.parking",
  "property.attributes.outdoor.garage",
  "property.bills.tax.council_tax_band_declared_and_predicted",
  "property.bills.energy.current_energy_rating_declared_and_predicted",
  "property.value.sale.property_value",
  "property.value.sale.last_transaction_price",
  "property.value.sale.last_transaction_date",
  "property.value.sale.years_owned",
  "property.value.sale.sale_propensity",
  "surroundings.values.sale",
].join(",")

// ---------------------------------------------------------------------------
// Mapping: raw Chimnie response → domain attributes. Pure and unit-tested.
// ---------------------------------------------------------------------------

const PREDICTED_TYPE_MAP: Record<string, PropertyType> = {
  terraced: "terraced",
  "semi-detached": "semi-detached",
  detached: "detached",
  apartment: "flat",
  maisonette: "flat",
}

export function mapPropertyType(status: {
  property_type_predicted?: string | undefined
  epc_property_type?: string | undefined
  epc_built_form?: string | undefined
}): PropertyType | null {
  const epcType = status.epc_property_type?.toLowerCase() ?? ""
  // Bungalows are only identifiable from the EPC type — the predicted enum
  // has no bungalow value — so check that first.
  if (epcType.includes("bungalow")) return "bungalow"

  const predicted = PREDICTED_TYPE_MAP[status.property_type_predicted?.toLowerCase() ?? ""]
  if (predicted) return predicted

  if (epcType.includes("flat") || epcType.includes("maisonette")) return "flat"
  const builtForm = status.epc_built_form?.toLowerCase() ?? ""
  if (builtForm.includes("detached")) {
    return builtForm.includes("semi") ? "semi-detached" : "detached"
  }
  if (builtForm.includes("terrace")) return "terraced"
  return null
}

function normaliseBand(value: string | undefined, validBands: string): string | null {
  const band = value?.trim().toUpperCase() ?? ""
  return band.length === 1 && validBands.includes(band) ? band : null
}

export function mapChimnieResponse(
  addressId: string,
  raw: ChimnieResidentialResponse,
): EnrichmentResult {
  const attrs = raw.property?.attributes
  const sale = raw.property?.value?.sale
  const areaSale = raw.surroundings?.values?.sale

  const propensity = SalePropensitySchema.safeParse(sale?.sale_propensity)

  const attributes: EnrichedAttributes = {
    propertyType: mapPropertyType(attrs?.status ?? {}),
    bedrooms: attrs?.indoor?.bedrooms_declared_and_predicted ?? null,
    floorAreaSqm:
      attrs?.indoor?.floor_area_declared_and_predicted != null
        ? Math.round(attrs.indoor.floor_area_declared_and_predicted)
        : null,
    parking: attrs?.outdoor?.parking ?? null,
    garage: attrs?.outdoor?.garage ?? null,
    epcRating: normaliseBand(
      raw.property?.bills?.energy?.current_energy_rating_declared_and_predicted,
      "ABCDEFG",
    ),
    councilTaxBand: normaliseBand(
      raw.property?.bills?.tax?.council_tax_band_declared_and_predicted,
      "ABCDEFGHI",
    ),
    estimatedValueGbp: sale?.property_value != null ? Math.round(sale.property_value) : null,
    lastSoldPriceGbp:
      sale?.last_transaction_price != null ? Math.round(sale.last_transaction_price) : null,
    lastSoldDate: sale?.last_transaction_date ?? null,
    yearsOwned: sale?.years_owned ?? null,
    salePropensity: propensity.success ? propensity.data : null,
  }

  const areaStats: AreaSaleStats | null = areaSale
    ? {
        pricePerSqft: areaSale.price_per_sqft ?? null,
        daysToSell: areaSale.days_to_sell ?? null,
        salesNearby12m: areaSale.sales_nearby_12m ?? null,
        salesYoy: areaSale.sales_yoy ?? null,
        averageYearsOwned: areaSale.average_years_owned ?? null,
      }
    : null

  return {
    addressId,
    source: "chimnie",
    uprn: raw.id ?? null,
    attributes,
    areaStats,
  }
}

// ---------------------------------------------------------------------------
// Chimnie provider
// ---------------------------------------------------------------------------

export function isSandboxAddress(address: SelectedAddress): boolean {
  const haystack = `${address.postcode ?? ""} ${address.displayAddress}`.toUpperCase()
  return haystack.includes(CHIMNIE_SANDBOX_POSTCODE)
}

async function fetchChimnieByAddress(
  address: SelectedAddress,
): Promise<{ result: EnrichmentResult; costPence: number } | null> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (env.CHIMNIE_API_KEY) headers["Authorization"] = `Bearer ${env.CHIMNIE_API_KEY}`

  const res = await fetch(`${CHIMNIE_BASE_URL}/residential/address`, {
    method: "POST",
    headers,
    body: JSON.stringify({ address: address.displayAddress, fields: CHIMNIE_CORE_FIELDS }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  })

  // 404 = no matching property or no data for the requested fields;
  // 409 = the address resolved to a non-residential property.
  if (res.status === 404 || res.status === 409) return null
  if (!res.ok) {
    throw new Error(`Chimnie request failed: ${res.status} ${res.statusText}`)
  }

  const raw: unknown = await res.json()
  const parsed = ChimnieResidentialResponseSchema.parse(raw)
  const costPence = Number(res.headers.get("chimnie-balance-used") ?? "0")
  return { result: mapChimnieResponse(address.id, parsed), costPence }
}

// ---------------------------------------------------------------------------
// Sample fallback — deterministic per address id, so the demo stays stable
// across renders and reloads. Same generator approach the refine step already
// used, extended to the full attribute shape.
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SAMPLE_TYPE_POOL: PropertyType[] = [
  "terraced",
  "terraced",
  "semi-detached",
  "semi-detached",
  "detached",
  "flat",
  "flat",
  "bungalow",
]

const SAMPLE_BEDROOM_RANGES: Record<PropertyType, [min: number, max: number]> = {
  flat: [1, 3],
  terraced: [2, 4],
  "semi-detached": [2, 4],
  bungalow: [2, 3],
  detached: [3, 6],
}

function pick<T>(pool: readonly T[], roll: number, fallback: T): T {
  return pool[Math.floor(roll * pool.length)] ?? fallback
}

export function sampleEnrichment(address: SelectedAddress): EnrichmentResult {
  const rand = mulberry32(hashString(address.id))
  const propertyType = pick(SAMPLE_TYPE_POOL, rand(), "terraced")
  const [minBeds, maxBeds] = SAMPLE_BEDROOM_RANGES[propertyType]
  const bedrooms = minBeds + Math.floor(rand() * (maxBeds - minBeds + 1))
  const floorAreaSqm = Math.round(bedrooms * 28 + 20 + rand() * 40)
  const parking = rand() < (propertyType === "detached" ? 0.9 : 0.55)
  const garage = parking && rand() < 0.5
  const epcRating = pick(["B", "C", "C", "D", "D", "D", "E", "F"], rand(), "D")
  const councilTaxBand = pick(["B", "C", "C", "D", "D", "E", "F"], rand(), "D")
  const yearsOwned = 1 + Math.floor(rand() * 30)
  const lastSoldYear = new Date().getFullYear() - yearsOwned
  const estimatedValueGbp = Math.round((floorAreaSqm * (3000 + rand() * 4000)) / 500) * 500
  const lastSoldPriceGbp =
    Math.round((estimatedValueGbp * (0.35 + rand() * 0.45)) / 500) * 500
  const salePropensity = pick(
    ["<1y", "1-2y", "2-5y", "2-5y", "5-10y", "5-10y", "10+y"] as const,
    rand(),
    "5-10y",
  )

  // Deterministic per postcode district so neighbouring addresses agree.
  const areaSeed = mulberry32(hashString(address.postcode?.split(" ")[0] ?? "SW1A"))
  const areaStats: AreaSaleStats = {
    pricePerSqft: Math.round(350 + areaSeed() * 400),
    daysToSell: Math.round(40 + areaSeed() * 80),
    salesNearby12m: Math.round(100 + areaSeed() * 900),
    salesYoy: Math.round((areaSeed() - 0.5) * 200),
    averageYearsOwned: Math.round((8 + areaSeed() * 10) * 10) / 10,
  }

  return {
    addressId: address.id,
    source: "sample",
    uprn: null,
    attributes: {
      propertyType,
      bedrooms,
      floorAreaSqm,
      parking,
      garage,
      epcRating,
      councilTaxBand,
      estimatedValueGbp,
      lastSoldPriceGbp,
      lastSoldDate: `${lastSoldYear}-06-01`,
      yearsOwned,
      salePropensity,
    },
    areaStats,
  }
}

// ---------------------------------------------------------------------------
// Orchestrator with in-memory cache. Cache only real Chimnie results: sample
// data is free to regenerate, and caching it would block an upgrade to real
// data once an API key is configured.
// ---------------------------------------------------------------------------

const chimnieCache = new Map<string, EnrichmentResult>()

function cacheKey(address: SelectedAddress): string {
  return address.displayAddress.trim().toLowerCase()
}

function shouldTryChimnie(address: SelectedAddress): boolean {
  // Sandbox addresses work without an API key; everything else needs one.
  return Boolean(env.CHIMNIE_API_KEY) || isSandboxAddress(address)
}

export interface EnrichmentOutcome {
  result: EnrichmentResult
  costPence: number
  fromCache: boolean
}

export async function enrichAddress(address: SelectedAddress): Promise<EnrichmentOutcome> {
  const key = cacheKey(address)
  const cached = chimnieCache.get(key)
  if (cached) {
    return { result: { ...cached, addressId: address.id }, costPence: 0, fromCache: true }
  }

  if (shouldTryChimnie(address)) {
    try {
      const outcome = await fetchChimnieByAddress(address)
      if (outcome) {
        chimnieCache.set(key, outcome.result)
        return { result: outcome.result, costPence: outcome.costPence, fromCache: false }
      }
    } catch (error) {
      console.warn(`Chimnie enrichment failed for "${address.displayAddress}":`, error)
    }
  }

  return { result: sampleEnrichment(address), costPence: 0, fromCache: false }
}
