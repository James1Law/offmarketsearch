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
 * Viewport fetch: returns an empty list when the area has no data — unlike the
 * polygon fetch, panning around should never surface mock addresses.
 */
export async function fetchAddressesInBBox(bbox: BBox): Promise<SelectedAddress[]> {
  const { south, west, north, east } = bbox
  const filter = `(${south},${west},${north},${east})`
  const found = await runAddressQuery(filter)
  return found ?? []
}

export async function fetchAddressesInPolygon(ring: PolygonRing): Promise<SelectedAddress[]> {
  // Overpass auto-closes the polygon, so drop a repeated closing point.
  const open = isClosed(ring) ? ring.slice(0, -1) : ring
  const poly = open.map(([lng, lat]) => `${lat} ${lng}`).join(" ")
  const filter = `(poly:"${poly}")`
  const found = await runAddressQuery(filter)
  return found ?? fallbackPolygonAddresses(open)
}

/** Returns null when the query failed or matched nothing, so callers can fall back. */
async function runAddressQuery(areaFilter: string): Promise<SelectedAddress[] | null> {
  const query = `
    [out:json][timeout:10];
    (
      node["addr:housenumber"]["addr:street"]${areaFilter};
      way["addr:housenumber"]["addr:street"]${areaFilter};
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
    if (!res.ok) return null
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

    return addresses.length > 0 ? addresses : null
  } catch {
    return null
  }
}

function isClosed(ring: PolygonRing): boolean {
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (!first || !last) return false
  return first[0] === last[0] && first[1] === last[1]
}

function fallbackPolygonAddresses(ring: PolygonRing): SelectedAddress[] {
  // Spread mock points along the bbox diagonal, pulled halfway towards the
  // centroid so they land inside typical hand-drawn shapes.
  const lngs = ring.map(([lng]) => lng)
  const lats = ring.map(([, lat]) => lat)
  const west = Math.min(...lngs)
  const east = Math.max(...lngs)
  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const centroidLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
  const centroidLat = lats.reduce((a, b) => a + b, 0) / lats.length
  return mockAddresses((i) => {
    const diagLat = south + ((north - south) * (i + 1)) / 9
    const diagLng = west + ((east - west) * (i + 1)) / 9
    return {
      lat: centroidLat + (diagLat - centroidLat) * 0.5,
      lng: centroidLng + (diagLng - centroidLng) * 0.5,
    }
  })
}

function mockAddresses(position: (i: number) => { lat: number; lng: number }): SelectedAddress[] {
  const streets = ["Maple Avenue", "Oak Street", "Church Lane", "High Street", "Victoria Road"]
  const postcodeArea = "SW1A"
  return Array.from({ length: 8 }, (_, i) => {
    const street = streets[i % streets.length] ?? "High Street"
    const number = (i + 1) * 3
    const { lat, lng } = position(i)
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
