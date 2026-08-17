"use client"

import { AREA_SELECT } from "@/lib/constants"
import { formatRadius, type AreaMode, type CircleArea } from "../area-select"

interface AreaSelectControlProps {
  mode: AreaMode
  onModeChange: (mode: AreaMode) => void
  circle: CircleArea | null
  onRadiusChange: (metres: number) => void
  /** Runs the address search for the current circle. */
  onSearchCircle: () => void
  /** Lasso only: whether a draw is in progress. */
  drawing: boolean
  onDrawingChange: (drawing: boolean) => void
  loading: boolean
  /** Compact layout for the mobile map overlay. */
  compact?: boolean
}

export function AreaSelectControl({
  mode,
  onModeChange,
  circle,
  onRadiusChange,
  onSearchCircle,
  drawing,
  onDrawingChange,
  loading,
  compact = false,
}: AreaSelectControlProps) {
  return (
    <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-3"}>
      <div className="flex rounded-lg border border-sand overflow-hidden bg-white shrink-0">
        <ModeButton active={mode === "circle"} onClick={() => onModeChange("circle")}>
          Circle
        </ModeButton>
        <ModeButton active={mode === "lasso"} onClick={() => onModeChange("lasso")}>
          Freehand
        </ModeButton>
      </div>

      {mode === "circle" ? (
        circle ? (
          <div className={`flex items-center gap-2 ${compact ? "w-full" : ""}`}>
            <label className="flex items-center gap-2 text-xs text-navy-soft whitespace-nowrap">
              <span className="sr-only">Search radius</span>
              <input
                type="range"
                min={AREA_SELECT.MIN_RADIUS_M}
                max={AREA_SELECT.MAX_RADIUS_M}
                step={AREA_SELECT.RADIUS_STEP_M}
                value={circle.radiusMetres}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="accent-coral w-28"
                aria-label="Search radius in metres"
              />
              <span className="tabular-nums w-12">{formatRadius(circle.radiusMetres)}</span>
            </label>
            <button
              onClick={onSearchCircle}
              disabled={loading}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-coral text-white hover:bg-coral-dark transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Searching…" : "Find homes here"}
            </button>
          </div>
        ) : (
          <span className="text-sm text-coral-dark font-medium bg-cream px-3 py-1.5 rounded-lg">
            Tap the map to place your search area
          </span>
        )
      ) : !drawing ? (
        <button
          onClick={() => onDrawingChange(true)}
          className="text-sm font-medium px-3 py-1.5 rounded-lg bg-coral text-white hover:bg-coral-dark transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3l8 5-3 10H7L4 8z" strokeLinejoin="round" />
          </svg>
          Draw area
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-coral-dark font-medium bg-cream px-3 py-1.5 rounded-lg">
            Drag around the homes you want — release to finish
          </span>
          <button
            onClick={() => onDrawingChange(false)}
            className="text-sm text-navy-soft hover:text-navy px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-sm font-medium px-3 py-1.5 transition-colors ${
        active ? "bg-coral text-white" : "text-navy-soft hover:bg-cream"
      }`}
    >
      {children}
    </button>
  )
}
