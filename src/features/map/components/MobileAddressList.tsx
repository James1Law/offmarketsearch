"use client"

import type { SelectedAddress } from "@/types"
import { LIMITS } from "@/lib/constants"

interface MobileAddressListProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  onToggle: (address: SelectedAddress) => void
  loading: boolean
  error: string | null
}

export function MobileAddressList({
  addresses,
  selectedIds,
  onToggle,
  loading,
  error,
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
    return (
      <div className="p-6 text-sm text-navy-soft text-center">
        Draw a rectangle on the map to find addresses.
      </div>
    )
  }

  const atCap = selectedIds.size >= LIMITS.MAX_LETTERS_PER_CAMPAIGN

  return (
    <>
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
