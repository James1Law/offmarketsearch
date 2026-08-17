import type { PolygonRing } from "@/types"

/** WGS-84 mean earth radius in metres. */
const EARTH_RADIUS_M = 6371008.8

const DEG = 180 / Math.PI
const RAD = Math.PI / 180

/**
 * Near the poles a degree of longitude shrinks towards zero, which would blow
 * the east–west radius up towards infinity. Clamping the cosine keeps the
 * output finite; UK latitudes are nowhere near this bound.
 */
const MIN_LAT_COS = 1e-6

/**
 * Approximates a circle on the earth's surface as a polygon ring of `steps`
 * points, closed by repeating the first point.
 *
 * Overpass takes an arbitrary polygon, so a circle drawn by the user is sent
 * through the same query path as a hand-drawn lasso — there is no separate
 * radius search to maintain.
 */
export function circleToPolygonRing(
  center: [lng: number, lat: number],
  radiusMetres: number,
  steps: number,
): PolygonRing {
  const [lng, lat] = center

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new Error("circleToPolygonRing: centre must be finite")
  }
  if (!Number.isFinite(radiusMetres) || radiusMetres <= 0) {
    throw new Error("circleToPolygonRing: radius must be a positive number of metres")
  }
  if (!Number.isInteger(steps) || steps < 3) {
    throw new Error("circleToPolygonRing: need at least 3 steps to form a polygon")
  }

  const latCos = Math.max(Math.abs(Math.cos(lat * RAD)), MIN_LAT_COS)
  const latSpan = (radiusMetres / EARTH_RADIUS_M) * DEG
  const lngSpan = latSpan / latCos

  const ring: PolygonRing = []
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * 2 * Math.PI
    ring.push([lng + lngSpan * Math.sin(theta), lat + latSpan * Math.cos(theta)])
  }

  // Repeat the first point so the ring is explicitly closed for GeoJSON.
  const first = ring[0]
  if (first) ring.push([first[0], first[1]])
  return ring
}
