"use client"

import type { SelectedAddress } from "@/types"
import { LIMITS } from "@/lib/constants"

interface AddressListProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  onToggle: (address: SelectedAddress) => void
  loading: boolean
  error: string | null
  /** True once a search has run, so "none here" reads differently to "not looked yet". */
  searched: boolean
  /** Matches before the campaign cap trimmed them, so truncation can be owned up to. */
  totalFound: number
  onLoadDemo?: (() => void) | undefined
}

export function AddressList({
  addresses,
  selectedIds,
  onToggle,
  loading,
  error,
  searched,
  totalFound,
  onLoadDemo,
}: AddressListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 bg-sand rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg mx-3">{error}</div>
    )
  }

  if (addresses.length === 0) {
    if (!searched) {
      return (
        <div className="p-4 text-sm text-navy-soft text-center">
          No addresses yet. Zoom in to see them on the map, or draw an area.
        </div>
      )
    }
    return (
      <div className="p-4 text-center">
        <p className="text-sm font-medium text-navy">No addresses found here</p>
        <p className="text-xs text-navy-soft mt-1 leading-relaxed">
          We only list addresses that appear in OpenStreetMap, and rural coverage can be
          patchy. Try a wider area, or somewhere more built-up.
        </p>
        {onLoadDemo && (
          <button onClick={onLoadDemo} className="text-xs text-coral font-medium hover:underline mt-2">
            Or try demo addresses →
          </button>
        )}
      </div>
    )
  }

  const allSelected = addresses.every((a) => selectedIds.has(a.id))
  const atCap = selectedIds.size >= LIMITS.MAX_LETTERS_PER_CAMPAIGN

  function toggleAll() {
    for (const addr of addresses) {
      const isSelected = selectedIds.has(addr.id)
      if (allSelected && isSelected) onToggle(addr)
      else if (!allSelected && !isSelected) onToggle(addr)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sand">
        <span className="text-xs text-navy-soft font-medium">
          {addresses.length} addresses found
        </span>
        <button
          onClick={toggleAll}
          className="text-xs text-coral font-medium hover:underline"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {totalFound > addresses.length && (
        <p className="text-xs text-navy-soft bg-cream px-3 py-2 border-b border-sand leading-relaxed">
          Showing the {addresses.length} homes closest to the middle of your circle, out of{" "}
          {totalFound} found. Shrink the radius to be more selective.
        </p>
      )}

      {atCap && !allSelected && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2">
          Maximum {LIMITS.MAX_LETTERS_PER_CAMPAIGN} letters per campaign.
        </p>
      )}

      <ul className="overflow-y-auto max-h-[calc(100vh-340px)]">
        {addresses.map((addr) => {
          const checked = selectedIds.has(addr.id)
          const disabled = !checked && atCap
          return (
            <li key={addr.id}>
              <label
                className={`flex items-start gap-3 px-3 py-2.5 hover:bg-cream cursor-pointer transition-colors ${
                  disabled ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(addr)}
                  className="mt-0.5 accent-coral shrink-0"
                />
                <span className="text-sm text-navy leading-snug">{addr.displayAddress}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
