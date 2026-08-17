"use client"

import { useState } from "react"
import { campaignStore } from "@/lib/campaign-store"

interface ClearListButtonProps {
  count: number
  className?: string
}

/**
 * Clearing throws away work, so it confirms in place rather than firing on the
 * first tap. Inline rather than window.confirm to stay inside the app's styling
 * and to avoid a blocking dialog on mobile.
 */
export function ClearListButton({ count, className = "" }: ClearListButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (count === 0) return null

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className={`text-xs text-navy-soft hover:text-navy underline underline-offset-2 ${className}`}
      >
        Clear
      </button>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className="text-navy-soft">Clear all {count}?</span>
      <button
        onClick={() => {
          campaignStore.clear()
          setConfirming(false)
        }}
        className="font-semibold text-coral hover:text-coral-dark"
      >
        Yes
      </button>
      <button onClick={() => setConfirming(false)} className="text-navy-soft hover:text-navy">
        No
      </button>
    </span>
  )
}
