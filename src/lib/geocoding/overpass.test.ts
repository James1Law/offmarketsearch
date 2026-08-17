import { describe, it, expect, vi, afterEach } from "vitest"
import { fetchAddressesInBBox, fetchAddressesInPolygon } from "./overpass"
import type { PolygonRing } from "@/types"

const BBOX = { south: 50.7, west: -2.4, north: 50.8, east: -2.3 }
const RING: PolygonRing = [
  [-2.4, 50.7],
  [-2.3, 50.7],
  [-2.3, 50.8],
  [-2.4, 50.8],
]

function mockOverpass(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: "",
    json: async () => body,
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("overpass address lookup", () => {
  it("maps OSM elements to addresses", async () => {
    mockOverpass({
      elements: [
        {
          type: "node",
          id: 42,
          lat: 50.75,
          lon: -2.35,
          tags: {
            "addr:housenumber": "12",
            "addr:street": "The Square",
            "addr:postcode": "DT2 8SL",
          },
        },
      ],
    })

    const { addresses } = await fetchAddressesInPolygon(RING)

    expect(addresses).toEqual([
      {
        id: "osm-42",
        displayAddress: "12 The Square, DT2 8SL",
        streetAddress: "12 The Square",
        postcode: "DT2 8SL",
        lat: 50.75,
        lng: -2.35,
      },
    ])
  })

  it("reads the centre point of a way", async () => {
    mockOverpass({
      elements: [
        {
          type: "way",
          id: 7,
          center: { lat: 50.75, lon: -2.35 },
          tags: { "addr:housenumber": "1", "addr:street": "High Street" },
        },
      ],
    })

    const { addresses } = await fetchAddressesInPolygon(RING)

    expect(addresses[0]).toMatchObject({ id: "osm-7", lat: 50.75, lng: -2.35 })
    expect(addresses[0]?.displayAddress).toBe("1 High Street")
  })

  it("skips elements missing a house number, street or position", async () => {
    mockOverpass({
      elements: [
        { type: "node", id: 1, lat: 50.75, lon: -2.35, tags: { "addr:street": "No Number Road" } },
        { type: "node", id: 2, lat: 50.75, lon: -2.35, tags: { "addr:housenumber": "4" } },
        { type: "node", id: 3, tags: { "addr:housenumber": "4", "addr:street": "Nowhere Lane" } },
      ],
    })

    await expect(fetchAddressesInPolygon(RING)).resolves.toEqual({
      addresses: [],
      totalFound: 0,
    })
  })

  // The point of this group: a drawn area that finds nothing must say nothing.
  // A fabricated address here becomes a real letter to a real letterbox.
  describe("never invents addresses", () => {
    it("returns empty for a drawn area with no OSM coverage", async () => {
      mockOverpass({ elements: [] })
      await expect(fetchAddressesInPolygon(RING)).resolves.toEqual({
        addresses: [],
        totalFound: 0,
      })
    })

    it("returns empty for a viewport with no OSM coverage", async () => {
      mockOverpass({ elements: [] })
      await expect(fetchAddressesInBBox(BBOX)).resolves.toEqual({
        addresses: [],
        totalFound: 0,
      })
    })

    it("throws rather than substituting data when Overpass errors", async () => {
      mockOverpass({}, { ok: false, status: 429 })
      await expect(fetchAddressesInPolygon(RING)).rejects.toThrow(/429/)
    })

    it("throws rather than substituting data when the request fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
      await expect(fetchAddressesInPolygon(RING)).rejects.toThrow("network down")
    })

    it("throws rather than substituting data when the response is malformed", async () => {
      mockOverpass({ unexpected: true })
      await expect(fetchAddressesInPolygon(RING)).rejects.toThrow()
    })
  })

  // A wide radius over a city matches far more homes than a campaign can post
  // to, so the cap has to choose. Choosing by distance makes it "the closest
  // 50 to the middle" rather than "whichever 50 Overpass listed first".
  describe("ranking when more match than a campaign can hold", () => {
    // 60 addresses marching east from the ring's centre, listed furthest first
    // so insertion order cannot be mistaken for distance order.
    function spreadEastwards(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        type: "node",
        id: i,
        lat: 50.75,
        lon: -2.35 + (count - i) * 0.001,
        tags: { "addr:housenumber": `${i}`, "addr:street": "Long Road" },
      }))
    }

    it("keeps the closest 50 and reports the true total", async () => {
      mockOverpass({ elements: spreadEastwards(60) })

      const { addresses, totalFound } = await fetchAddressesInPolygon(RING)

      expect(totalFound).toBe(60)
      expect(addresses).toHaveLength(50)
      // Highest ids are nearest the centre, so they are the ones kept.
      expect(addresses[0]?.id).toBe("osm-59")
    })

    it("orders results nearest-first", async () => {
      mockOverpass({ elements: spreadEastwards(10) })

      const { addresses } = await fetchAddressesInPolygon(RING)

      const centre: [number, number] = [-2.35, 50.75]
      const distances = addresses.map((a) => Math.abs(a.lng - centre[0]))
      expect(distances).toEqual([...distances].sort((x, y) => x - y))
    })

    it("reports no truncation when everything fits", async () => {
      mockOverpass({ elements: spreadEastwards(3) })

      const { addresses, totalFound } = await fetchAddressesInPolygon(RING)

      expect(totalFound).toBe(3)
      expect(addresses).toHaveLength(3)
    })
  })

  it("closes the polygon ring without repeating the first point", async () => {
    const fetchMock = mockOverpass({ elements: [] })
    const closed: PolygonRing = [...RING, [-2.4, 50.7]]

    await fetchAddressesInPolygon(closed)

    const body = String((fetchMock.mock.calls[0]?.[1] as { body: string }).body)
    const poly = decodeURIComponent(body).match(/poly:"([^"]+)"/)?.[1] ?? ""
    expect(poly.trim().split(/\s+/)).toHaveLength(RING.length * 2)
  })
})
