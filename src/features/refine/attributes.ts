import type { PropertyAttributes, PropertyType, SelectedAddress } from "@/types"

// Prototype-only: property attributes are indicative sample data, derived
// deterministically from the address id so they stay stable across renders
// and page reloads. Swap this module for a real property-data API
// (e.g. PropertyData) when the integration lands.

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

const TYPE_POOL: PropertyType[] = [
  "terraced",
  "terraced",
  "semi-detached",
  "semi-detached",
  "detached",
  "flat",
  "flat",
  "bungalow",
]

const BEDROOM_RANGES: Record<PropertyType, [min: number, max: number]> = {
  flat: [1, 3],
  terraced: [2, 4],
  "semi-detached": [2, 4],
  bungalow: [2, 3],
  detached: [3, 6],
}

function pick<T>(pool: readonly T[], roll: number, fallback: T): T {
  return pool[Math.floor(roll * pool.length)] ?? fallback
}

export function getPropertyAttributes(address: SelectedAddress): PropertyAttributes {
  const rand = mulberry32(hashString(address.id))
  const propertyType = pick(TYPE_POOL, rand(), "terraced")
  const [minBeds, maxBeds] = BEDROOM_RANGES[propertyType]
  const bedrooms = minBeds + Math.floor(rand() * (maxBeds - minBeds + 1))
  const floorAreaSqm = Math.round(bedrooms * 28 + 20 + rand() * 40)
  const hasGarden = propertyType === "flat" ? rand() < 0.2 : rand() < 0.85
  const hasParking = rand() < (propertyType === "detached" ? 0.9 : 0.55)
  return { propertyType, bedrooms, floorAreaSqm, hasGarden, hasParking }
}
