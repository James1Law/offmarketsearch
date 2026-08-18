import type { PolygonRing } from "@/types"

/** WGS-84 mean earth radius in metres. */
const EARTH_RADIUS_M = 6371008.8

const RAD = Math.PI / 180

/** Great-circle distance between two [lng, lat] points, in metres. */
export function haversineMetres(a: [lng: number, lat: number], b: [lng: number, lat: number]): number {
  const [lngA, latA] = a
  const [lngB, latB] = b
  const dLat = (latB - latA) * RAD
  const dLng = (lngB - lngA) * RAD
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * RAD) * Math.cos(latB * RAD) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Mean of the ring's vertices. Good enough to rank addresses by how central
 * they are: a search area is capped at 50 addresses, so when more match we want
 * the ones nearest the middle of what the user drew rather than an arbitrary 50.
 */
export function ringCentroid(ring: PolygonRing): [lng: number, lat: number] {
  const open = isClosed(ring) ? ring.slice(0, -1) : ring
  const first = open[0]
  if (!first) throw new Error("ringCentroid: ring is empty")

  let lngSum = 0
  let latSum = 0
  for (const [lng, lat] of open) {
    lngSum += lng
    latSum += lat
  }
  return [lngSum / open.length, latSum / open.length]
}

function isClosed(ring: PolygonRing): boolean {
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (!first || !last) return false
  return first[0] === last[0] && first[1] === last[1]
}
