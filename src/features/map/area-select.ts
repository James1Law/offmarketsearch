import { circleToPolygonRing } from "@/lib/geo/circle"
import { AREA_SELECT } from "@/lib/constants"
import type { PolygonRing } from "@/lib/geocoding/overpass"

/**
 * How the user marks out an area.
 *
 * "circle" is the default: tap a point, size it with a slider. It needs no drag
 * gesture, so it never competes with panning the map — which is what made the
 * lasso hard to use, especially on touch. "lasso" stays available for
 * irregular areas.
 */
export type AreaMode = "circle" | "lasso"

export interface CircleArea {
  center: [lng: number, lat: number]
  radiusMetres: number
}

/** Circles are queried as polygons, so both modes share one Overpass path. */
export function circleAreaToRing(circle: CircleArea): PolygonRing {
  return circleToPolygonRing(circle.center, circle.radiusMetres, AREA_SELECT.CIRCLE_STEPS)
}

export function formatRadius(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}
