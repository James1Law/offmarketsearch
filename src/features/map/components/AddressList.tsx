"use client"

import type { SelectedAddress } from "@/types"
import { LIMITS } from "@/lib/constants"

interface AddressListProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  onToggle: (address: SelectedAddress) => void
  loading: boolean
  error: string | null
}

export function AddressList({ addresses, selectedIds, onToggle, loading, error }: AddressListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
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
    return (
      <div className="p-4 text-sm text-slate-500 text-center">
        No addresses yet. Draw a rectangle on the map.
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <span className="text-xs text-slate-500 font-medium">
          {addresses.length} addresses found
        </span>
        <button
          onClick={toggleAll}
          className="text-xs text-indigo-600 font-medium hover:underline"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

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
                className={`flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                  disabled ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(addr)}
                  className="mt-0.5 accent-indigo-600 shrink-0"
                />
                <span className="text-sm text-slate-700 leading-snug">{addr.displayAddress}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
