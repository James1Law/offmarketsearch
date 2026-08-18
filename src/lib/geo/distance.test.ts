import { describe, it, expect } from "vitest"
import { haversineMetres, ringCentroid } from "./distance"
import type { PolygonRing } from "@/types"

describe("haversineMetres", () => {
  it("is zero for the same point", () => {
    expect(haversineMetres([-2.35, 50.75], [-2.35, 50.75])).toBe(0)
  })

  // Published great-circle distance London (Charing Cross) to Oxford (Carfax)
  // is roughly 82km.
  it("matches a known city-to-city distance", () => {
    const london: [number, number] = [-0.1281, 51.5074]
    const oxford: [number, number] = [-1.2577, 51.752]
    const km = haversineMetres(london, oxford) / 1000
    expect(km).toBeGreaterThan(80)
    expect(km).toBeLessThan(84)
  })

  it("is symmetric", () => {
    const a: [number, number] = [-2.35, 50.75]
    const b: [number, number] = [-1.25, 51.75]
    expect(haversineMetres(a, b)).toBeCloseTo(haversineMetres(b, a), 6)
  })

  it("measures a degree of latitude as about 111km", () => {
    const km = haversineMetres([0, 50], [0, 51]) / 1000
    expect(km).toBeCloseTo(111.2, 0)
  })
})

describe("ringCentroid", () => {
  it("finds the middle of a square", () => {
    const square: PolygonRing = [
      [-1, 50],
      [1, 50],
      [1, 52],
      [-1, 52],
    ]
    expect(ringCentroid(square)).toEqual([0, 51])
  })

  // A closed ring repeats its first point; counting it twice would drag the
  // centroid towards that corner.
  it("ignores the repeated closing point", () => {
    const open: PolygonRing = [
      [-1, 50],
      [1, 50],
      [1, 52],
      [-1, 52],
    ]
    const closed: PolygonRing = [...open, [-1, 50]]
    expect(ringCentroid(closed)).toEqual(ringCentroid(open))
  })
})
