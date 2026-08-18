import { z } from "zod"
import { OverpassElementSchema } from "@/types"
import type { AreaSearchResult, BBox, PolygonRing, SelectedAddress } from "@/types"
import { MAP_DEFAULTS } from "@/lib/constants"
import { haversineMetres, ringCentroid } from "@/lib/geo/distance"

// ---------------------------------------------------------------------------
// Server-only. These calls used to run in the browser, where overpass-api.de
// rejected them: "blocked by CORS policy: No 'Access-Control-Allow-Origin'
// header". Going through our own server removes the cross-origin problem
// entirely and lets us send the descriptive User-Agent Overpass asks for, which
// anonymous browser traffic gets rate-limited without.
//
// Reach these through the server actions in features/map/actions.ts.
// ---------------------------------------------------------------------------

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"

const USER_AGENT = "Offline.homes/1.0 (+https://offline.homes; letters to homeowners)"

/**
 * How many matches to ask Overpass for. Larger than the campaign cap on
 * purpose: we rank by distance from the middle of the search area and keep the
 * closest, so we need a pool to rank.
 */
const OVERPASS_RESULT_LIMIT = 400

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
})

/**
 * Both lookups return only genuine OpenStreetMap addresses, and an empty list
 * when an area has none. Nothing here may invent an address: these feed the
 * basket, and a letter costs real money to post to a real letterbox.
 */
export async function fetchAddressesInBBox(bbox: BBox): Promise<AreaSearchResult> {
  const { south, west, north, east } = bbox
  const found = await runAddressQuery(`(${south},${west},${north},${east})`)
  return rankAndCap(found, [(west + east) / 2, (south + north) / 2])
}

export async function fetchAddressesInPolygon(ring: PolygonRing): Promise<AreaSearchResult> {
  // Overpass auto-closes the polygon, so drop a repeated closing point.
  const open = isClosed(ring) ? ring.slice(0, -1) : ring
  const poly = open.map(([lng, lat]) => `${lat} ${lng}`).join(" ")
  const found = await runAddressQuery(`(poly:"${poly}")`)
  return rankAndCap(found, ringCentroid(ring))
}

/**
 * Keeps the addresses closest to the centre of the search area.
 *
 * A 5km circle over a city matches thousands of homes but a campaign is capped
 * at 50 letters, so something has to give. Ranking by distance makes the cap
 * mean "the 50 nearest the middle of your circle" rather than "whichever 50
 * Overpass happened to list first".
 */
function rankAndCap(
  addresses: SelectedAddress[],
  centre: [lng: number, lat: number],
): AreaSearchResult {
  const ranked = [...addresses].sort(
    (a, b) => haversineMetres(centre, [a.lng, a.lat]) - haversineMetres(centre, [b.lng, b.lat]),
  )
  return {
    addresses: ranked.slice(0, MAP_DEFAULTS.MAX_ADDRESSES_PER_DRAW),
    totalFound: ranked.length,
  }
}

/**
 * Throws when the address service could not be reached or its response made no
 * sense; returns an empty array when the area genuinely has no addresses. The
 * two are different things to tell the user, so they stay distinguishable.
 */
async function runAddressQuery(areaFilter: string): Promise<SelectedAddress[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["addr:housenumber"]["addr:street"]${areaFilter};
      way["addr:housenumber"]["addr:street"]${areaFilter};
    );
    out center ${OVERPASS_RESULT_LIMIT};
  `
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  })

  // Overpass sheds load with 429 and 504 rather than queueing, and it is a free
  // shared service, so this is a normal condition worth naming precisely.
  if (res.status === 429 || res.status === 504) {
    throw new Error(`Overpass is busy: ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`)
  }

  const raw: unknown = await res.json()
  const parsed = OverpassResponseSchema.parse(raw)

  return parsed.elements
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
