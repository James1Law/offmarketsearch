"use client"

import type { SelectedAddress } from "@/types"
import { LIMITS } from "@/lib/constants"

interface MobileAddressListProps {
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

export function MobileAddressList({
  addresses,
  selectedIds,
  onToggle,
  loading,
  error,
  searched,
  totalFound,
  onLoadDemo,
}: MobileAddressListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 bg-sand rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="m-3 p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
  }

  if (addresses.length === 0) {
    if (!searched) {
      return (
        <div className="p-6 text-sm text-navy-soft text-center">
          Zoom in to see addresses on the map, or draw an area around the homes you want.
        </div>
      )
    }
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium text-navy">No addresses found here</p>
        <p className="text-xs text-navy-soft mt-1 leading-relaxed">
          We only list addresses that appear in OpenStreetMap, and rural coverage can be
          patchy. Try a wider area, or somewhere more built-up.
        </p>
        {onLoadDemo && (
          <button onClick={onLoadDemo} className="text-sm text-coral font-medium py-2 mt-1">
            Or try demo addresses →
          </button>
        )}
      </div>
    )
  }

  const atCap = selectedIds.size >= LIMITS.MAX_LETTERS_PER_CAMPAIGN

  return (
    <>
      {totalFound > addresses.length && (
        <p className="text-xs text-navy-soft bg-cream px-4 py-2 border-b border-sand leading-relaxed">
          Showing the {addresses.length} closest to the middle of your circle, out of {totalFound}{" "}
          found. Shrink the radius to be more selective.
        </p>
      )}
      {atCap && (
        <p className="text-xs text-amber-700 bg-amber-50 px-4 py-2 border-y border-amber-100">
          Maximum {LIMITS.MAX_LETTERS_PER_CAMPAIGN} letters per campaign.
        </p>
      )}
      <ul className="divide-y divide-sand">
        {addresses.map((addr) => {
          const checked = selectedIds.has(addr.id)
          const disabled = !checked && atCap
          return (
            <li key={addr.id}>
              <label
                className={`flex items-center gap-3 px-4 py-3 active:bg-cream transition-colors ${
                  disabled ? "opacity-40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(addr)}
                  className="w-5 h-5 accent-coral shrink-0"
                />
                <span className="text-sm text-navy leading-snug">{addr.displayAddress}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </>
  )
}
