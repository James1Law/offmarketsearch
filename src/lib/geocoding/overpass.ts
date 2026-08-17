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

/** A polygon ring as [lng, lat] tuples. May or may not repeat the first point at the end. */
export type PolygonRing = [number, number][]

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
})

/**
 * Both fetches return only genuine OpenStreetMap addresses, and an empty list
 * when an area has none. Nothing here may invent an address: these feed the
 * basket, and a letter costs real money to post to a real letterbox.
 */
export async function fetchAddressesInBBox(bbox: BBox): Promise<SelectedAddress[]> {
  const { south, west, north, east } = bbox
  return runAddressQuery(`(${south},${west},${north},${east})`)
}

export async function fetchAddressesInPolygon(ring: PolygonRing): Promise<SelectedAddress[]> {
  // Overpass auto-closes the polygon, so drop a repeated closing point.
  const open = isClosed(ring) ? ring.slice(0, -1) : ring
  const poly = open.map(([lng, lat]) => `${lat} ${lng}`).join(" ")
  return runAddressQuery(`(poly:"${poly}")`)
}

/**
 * Throws when the address service could not be reached or its response made no
 * sense; returns an empty array when the area genuinely has no addresses. The
 * two are different things to tell the user, so they stay distinguishable.
 */
async function runAddressQuery(areaFilter: string): Promise<SelectedAddress[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["addr:housenumber"]["addr:street"]${areaFilter};
      way["addr:housenumber"]["addr:street"]${areaFilter};
    );
    out center 100;
  `
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`)
  }
  const raw: unknown = await res.json()
  const parsed = OverpassResponseSchema.parse(raw)

  return parsed.elements
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
}

function isClosed(ring: PolygonRing): boolean {
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (!first || !last) return false
  return first[0] === last[0] && first[1] === last[1]
}
