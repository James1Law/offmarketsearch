"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { BottomSheet } from "@/components/mobile/BottomSheet"
import { MobileAddressList } from "./MobileAddressList"
import { useOverpassAddresses, type BBox } from "../hooks/useOverpassAddresses"
import { useNominatimSearch } from "../hooks/useNominatimSearch"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import type { SelectedAddress } from "@/types"

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-sand animate-pulse" /> },
)

type DrawMode = "idle" | "first-click" | "second-click"

export function MobileMapPageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const { addresses, loading, error, fetch: fetchAddresses, clear } = useOverpassAddresses()
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clear: clearSearch,
  } = useNominatimSearch()
  const [drawMode, setDrawMode] = useState<DrawMode>("idle")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)

  const selectedIds = useMemo(
    () => new Set(campaignState.selectedAddresses.map((a) => a.id)),
    [campaignState.selectedAddresses],
  )

  function handleToggle(address: SelectedAddress) {
    campaignStore.toggleAddress(address)
  }

  function handleAreaDrawn(bbox: BBox) {
    clear()
    fetchAddresses(bbox)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setShowSearchResults(true)
    search(value)
  }

  function handleSearchSelect(result: (typeof searchResults)[number]) {
    setSearchQuery(result.display_name.split(",")[0] ?? result.display_name)
    setShowSearchResults(false)
    clearSearch()
    const event = new CustomEvent("nominatim-select", { detail: result })
    window.dispatchEvent(event)
  }

  function selectAllOnScreen() {
    for (const addr of addresses) {
      if (!selectedIds.has(addr.id)) handleToggle(addr)
    }
  }

  const selectedCount = campaignState.selectedAddresses.length
  const drawPrompt =
    drawMode === "first-click"
      ? "Tap the map to set the first corner"
      : drawMode === "second-click"
        ? "Tap the map to set the opposite corner"
        : null

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top control bar */}
      <div className="px-3 py-2 bg-white border-b border-sand shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search e.g. Hampstead"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full text-sm border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-soft/70 text-xs">
              ...
            </span>
          )}
          {showSearchResults && searchResults.length > 0 && (
            <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-sand rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((r) => (
                <li key={r.place_id}>
                  <button
                    className="w-full text-left text-sm px-3 py-2 active:bg-cream truncate"
                    onClick={() => handleSearchSelect(r)}
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {drawMode === "idle" ? (
          <button
            onClick={() => setDrawMode("first-click")}
            className="shrink-0 text-sm font-semibold px-3 py-2 rounded-lg bg-coral active:bg-coral-dark text-white"
            aria-label="Draw area"
          >
            Draw
          </button>
        ) : (
          <button
            onClick={() => setDrawMode("idle")}
            className="shrink-0 text-sm font-medium px-3 py-2 rounded-lg border border-sand text-navy-soft"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Map + sheet */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0">
          <PropertyMap
            addresses={addresses}
            selectedIds={selectedIds}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            onAreaDrawn={handleAreaDrawn}
          />
        </div>

        {drawPrompt && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-coral text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md pointer-events-none">
            {drawPrompt}
          </div>
        )}

        <BottomSheet
          initialSnap={0}
          header={
            <div className="px-4 py-2 border-b border-sand flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-navy">
                  {addresses.length > 0
                    ? `${addresses.length} addresses found`
                    : selectedCount > 0
                      ? `${selectedCount} selected`
                      : "Selected addresses"}
                </div>
                {selectedCount > 0 && (
                  <div className="text-xs text-coral font-medium">
                    {selectedCount} selected
                  </div>
                )}
              </div>
              {addresses.length > 0 && (
                <button
                  onClick={selectAllOnScreen}
                  className="text-xs text-coral font-semibold px-2 py-1"
                >
                  Select all
                </button>
              )}
            </div>
          }
          footer={
            <div
              className="px-4 pt-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={() => router.push("/m/letter")}
                disabled={selectedCount === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral active:bg-coral-dark text-white"
              >
                {selectedCount === 0
                  ? "Select at least one address"
                  : `Next: Write your letter (${selectedCount}) →`}
              </button>
            </div>
          }
        >
          <MobileAddressList
            addresses={addresses}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            loading={loading}
            error={error}
          />
        </BottomSheet>
      </div>
    </div>
  )
}
