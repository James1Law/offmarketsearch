"use client"

import { useState, useRef, type ReactNode, type PointerEvent } from "react"

const SNAPS = [0.3, 0.6, 0.92] as const
const MIN_RATIO = 0.18
const MAX_RATIO = 0.96
const TAP_THRESHOLD_PX = 5

type SnapIndex = 0 | 1 | 2

interface BottomSheetProps {
  children: ReactNode
  initialSnap?: SnapIndex
  /** Sticky header inside the sheet (above the scrollable area). */
  header?: ReactNode
  /** Sticky footer inside the sheet (below the scrollable area). Always visible. */
  footer?: ReactNode
}

interface DragState {
  startY: number
  parentH: number
  moved: boolean
}

/**
 * Bottom sheet for mobile layouts. Must live inside a `relative` parent with a known height.
 * Three snap points; drag the handle or tap to cycle through them.
 * Footer stays anchored to the bottom of the screen at all snaps.
 */
export function BottomSheet({ children, initialSnap = 0, header, footer }: BottomSheetProps) {
  const [snap, setSnap] = useState<SnapIndex>(initialSnap)
  const [dragOffsetRatio, setDragOffsetRatio] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    const parent = sheetRef.current?.parentElement
    if (!parent) return
    const parentH = parent.getBoundingClientRect().height
    if (parentH === 0) return
    dragRef.current = { startY: e.clientY, parentH, moved: false }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dy = e.clientY - drag.startY
    if (Math.abs(dy) > TAP_THRESHOLD_PX) drag.moved = true
    // Drag down → smaller sheet; drag up → larger sheet
    setDragOffsetRatio(-dy / drag.parentH)
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
    setDragging(false)

    if (!drag.moved) {
      setSnap(((snap + 1) % SNAPS.length) as SnapIndex)
      setDragOffsetRatio(0)
      return
    }

    const currentRatio = SNAPS[snap] ?? SNAPS[0] ?? 0.3
    const draggedRatio = currentRatio + dragOffsetRatio
    let nearest: SnapIndex = 0
    let minDist = Infinity
    SNAPS.forEach((s, i) => {
      const d = Math.abs(s - draggedRatio)
      if (d < minDist) {
        minDist = d
        nearest = i as SnapIndex
      }
    })
    setSnap(nearest)
    setDragOffsetRatio(0)
  }

  const snapRatio = SNAPS[snap] ?? SNAPS[0] ?? 0.3
  const liveRatio = snapRatio + dragOffsetRatio
  const clampedRatio = Math.max(MIN_RATIO, Math.min(liveRatio, MAX_RATIO))

  return (
    <div
      ref={sheetRef}
      className="absolute inset-x-0 bottom-0 z-20 bg-white border-t border-slate-200 rounded-t-2xl flex flex-col"
      style={{
        height: `${clampedRatio * 100}%`,
        transition: dragging ? "none" : "height 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        boxShadow: "0 -4px 20px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        className="shrink-0 px-4 pt-2 pb-1 select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="button"
        aria-label="Drag to resize sheet"
      >
        <div className="w-10 h-1 mx-auto rounded-full bg-slate-300" />
      </div>
      {header && <div className="shrink-0">{header}</div>}
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 border-t border-slate-100">{footer}</div>}
    </div>
  )
}
