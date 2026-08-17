import { describe, it, expect, vi, afterEach } from "vitest"
import { fetchAddressesInBBox, fetchAddressesInPolygon, type PolygonRing } from "./overpass"

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

    const found = await fetchAddressesInPolygon(RING)

    expect(found).toEqual([
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

    const found = await fetchAddressesInPolygon(RING)

    expect(found[0]).toMatchObject({ id: "osm-7", lat: 50.75, lng: -2.35 })
    expect(found[0]?.displayAddress).toBe("1 High Street")
  })

  it("skips elements missing a house number, street or position", async () => {
    mockOverpass({
      elements: [
        { type: "node", id: 1, lat: 50.75, lon: -2.35, tags: { "addr:street": "No Number Road" } },
        { type: "node", id: 2, lat: 50.75, lon: -2.35, tags: { "addr:housenumber": "4" } },
        { type: "node", id: 3, tags: { "addr:housenumber": "4", "addr:street": "Nowhere Lane" } },
      ],
    })

    await expect(fetchAddressesInPolygon(RING)).resolves.toEqual([])
  })

  // The point of this group: a drawn area that finds nothing must say nothing.
  // A fabricated address here becomes a real letter to a real letterbox.
  describe("never invents addresses", () => {
    it("returns empty for a drawn area with no OSM coverage", async () => {
      mockOverpass({ elements: [] })
      await expect(fetchAddressesInPolygon(RING)).resolves.toEqual([])
    })

    it("returns empty for a viewport with no OSM coverage", async () => {
      mockOverpass({ elements: [] })
      await expect(fetchAddressesInBBox(BBOX)).resolves.toEqual([])
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

  it("closes the polygon ring without repeating the first point", async () => {
    const fetchMock = mockOverpass({ elements: [] })
    const closed: PolygonRing = [...RING, [-2.4, 50.7]]

    await fetchAddressesInPolygon(closed)

    const body = String((fetchMock.mock.calls[0]?.[1] as { body: string }).body)
    const poly = decodeURIComponent(body).match(/poly:"([^"]+)"/)?.[1] ?? ""
    expect(poly.trim().split(/\s+/)).toHaveLength(RING.length * 2)
  })
})
