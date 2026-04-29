import { z } from "zod"
import { OverpassElementSchema } from "@/types"
import type { SelectedAddress } from "@/types"
import { MAP_DEFAULTS } from "@/lib/constants"

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"

interface BBox {
  south: number
  west: number
  north: number
  east: number
}

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
})

export async function fetchAddressesInBBox(bbox: BBox): Promise<SelectedAddress[]> {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:10];
    (
      node["addr:housenumber"]["addr:street"](${south},${west},${north},${east});
      way["addr:housenumber"]["addr:street"](${south},${west},${north},${east});
    );
    out center 100;
  `
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return fallbackAddresses(bbox)
    const raw: unknown = await res.json()
    const parsed = OverpassResponseSchema.parse(raw)
    const addresses = parsed.elements
      .slice(0, MAP_DEFAULTS.MAX_ADDRESSES_PER_DRAW)
      .map((el): SelectedAddress | null => {
        const tags: Record<string, string> = el.tags ?? {}
        const houseNumber = tags["addr:housenumber"]
        const street = tags["addr:street"]
        if (!houseNumber || !street) return null
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        if (lat === undefined || lng === undefined) return null
        const postcode = tags["addr:postcode"]
        const displayAddress = postcode
          ? `${houseNumber} ${street}, ${postcode}`
          : `${houseNumber} ${street}`
        return {
          id: `osm-${el.id}`,
          displayAddress,
          streetAddress: `${houseNumber} ${street}`,
          postcode,
          lat,
          lng,
        }
      })
      .filter((a): a is SelectedAddress => a !== null)

    return addresses.length > 0 ? addresses : fallbackAddresses(bbox)
  } catch {
    return fallbackAddresses(bbox)
  }
}

function fallbackAddresses(bbox: BBox): SelectedAddress[] {
  const streets = ["Maple Avenue", "Oak Street", "Church Lane", "High Street", "Victoria Road"]
  const postcodeArea = "SW1A"
  return Array.from({ length: 8 }, (_, i) => {
    const street = streets[i % streets.length] ?? "High Street"
    const number = (i + 1) * 3
    const lat = bbox.south + ((bbox.north - bbox.south) * (i + 1)) / 9
    const lng = bbox.west + ((bbox.east - bbox.west) * (i + 1)) / 9
    return {
      id: `mock-${i}`,
      displayAddress: `${number} ${street}, ${postcodeArea} ${i + 1}AA`,
      streetAddress: `${number} ${street}`,
      postcode: `${postcodeArea} ${i + 1}AA`,
      lat,
      lng,
    }
  })
}
