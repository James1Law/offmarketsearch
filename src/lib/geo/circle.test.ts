import { describe, it, expect } from "vitest"
import { circleToPolygonRing } from "./circle"

// Puddletown, Dorset — the village Will's sister was searching.
const PUDDLETOWN: [number, number] = [-2.3527, 50.7501]

/** Haversine distance in metres, independent of the implementation under test. */
function distanceM(a: [number, number], b: [number, number]): number {
  const R = 6371008.8
  const rad = Math.PI / 180
  const dLat = (b[1] - a[1]) * rad
  const dLng = (b[0] - a[0]) * rad
  const lat1 = a[1] * rad
  const lat2 = b[1] * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

describe("circleToPolygonRing", () => {
  it("returns a closed ring of steps + 1 points", () => {
    const ring = circleToPolygonRing(PUDDLETOWN, 250, 64)
    expect(ring).toHaveLength(65)
    expect(ring[0]).toEqual(ring[64])
  })

  it("puts every vertex at the requested radius", () => {
    const ring = circleToPolygonRing(PUDDLETOWN, 250, 64)
    for (const point of ring) {
      // Half a metre of tolerance over a 250m radius.
      expect(distanceM(PUDDLETOWN, point)).toBeCloseTo(250, 0)
    }
  })

  it("holds its radius at a 1km spread", () => {
    const ring = circleToPolygonRing(PUDDLETOWN, 1000, 64)
    const distances = ring.map((p) => distanceM(PUDDLETOWN, p))
    expect(Math.min(...distances)).toBeGreaterThan(998)
    expect(Math.max(...distances)).toBeLessThan(1002)
  })

  it("stays circular at Scottish latitudes where longitude degrees narrow", () => {
    const lerwick: [number, number] = [-1.1494, 60.1546]
    const ring = circleToPolygonRing(lerwick, 500, 32)
    for (const point of ring) {
      expect(distanceM(lerwick, point)).toBeCloseTo(500, 0)
    }
  })

  it("rejects a non-positive radius", () => {
    expect(() => circleToPolygonRing(PUDDLETOWN, 0, 64)).toThrow(/positive/)
    expect(() => circleToPolygonRing(PUDDLETOWN, -10, 64)).toThrow(/positive/)
  })

  it("rejects too few steps to form a polygon", () => {
    expect(() => circleToPolygonRing(PUDDLETOWN, 250, 2)).toThrow(/3 steps/)
  })

  it("rejects a non-finite centre", () => {
    expect(() => circleToPolygonRing([NaN, 50.75], 250, 64)).toThrow(/finite/)
  })
})
