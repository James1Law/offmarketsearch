import { circleToPolygonRing } from "@/lib/geo/circle"
import { AREA_SELECT } from "@/lib/constants"
import type { PolygonRing } from "@/types"

export interface CircleArea {
  center: [lng: number, lat: number]
  radiusMetres: number
}

/** The circle is queried as a polygon, reusing the one Overpass path. */
export function circleAreaToRing(circle: CircleArea): PolygonRing {
  return circleToPolygonRing(circle.center, circle.radiusMetres, AREA_SELECT.CIRCLE_STEPS)
}

export function formatRadius(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}
