"use client"

import { AREA_SELECT } from "@/lib/constants"
import { formatRadius, type CircleArea } from "../area-select"

interface AreaSelectControlProps {
  circle: CircleArea | null
  onRadiusChange: (metres: number) => void
  /** Runs the address search for the current circle. */
  onSearchCircle: () => void
  loading: boolean
  /** Stack rather than sit on one row, for the mobile map overlay. */
  compact?: boolean
}

/**
 * One way to mark out an area: tap the map, size the circle, search. There is
 * deliberately no second mode — offering a freehand lasso alongside this made
 * the first decision "which tool?", which is not a decision anyone wants to
 * make before they have found a single house.
 */
export function AreaSelectControl({
  circle,
  onRadiusChange,
  onSearchCircle,
  loading,
  compact = false,
}: AreaSelectControlProps) {
  if (!circle) {
    return (
      <span className="text-sm text-coral-dark font-medium bg-cream px-3 py-1.5 rounded-lg">
        Tap the map to place your search area
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "w-full" : ""}`}>
      <label className="flex items-center gap-2 text-xs text-navy-soft whitespace-nowrap flex-1 min-w-0">
        <span className="sr-only">Search radius</span>
        <input
          type="range"
          min={AREA_SELECT.MIN_RADIUS_M}
          max={AREA_SELECT.MAX_RADIUS_M}
          step={AREA_SELECT.RADIUS_STEP_M}
          value={circle.radiusMetres}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="accent-coral flex-1 min-w-16"
          aria-label="Search radius"
        />
        <span className="tabular-nums w-12 shrink-0">{formatRadius(circle.radiusMetres)}</span>
      </label>
      <button
        onClick={onSearchCircle}
        disabled={loading}
        className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg bg-coral text-white hover:bg-coral-dark transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? "Searching…" : "Find homes here"}
      </button>
    </div>
  )
}
