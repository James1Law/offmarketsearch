"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { AddressList } from "./AddressList"
import { useOverpassAddresses, type BBox } from "../hooks/useOverpassAddresses"
import { useNominatimSearch } from "../hooks/useNominatimSearch"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import type { SelectedAddress } from "@/types"

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-sand animate-pulse" /> },
)

type DrawMode = "idle" | "first-click" | "second-click"

export function MapPageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const { addresses, loading, error, fetch: fetchAddresses, clear } = useOverpassAddresses()
  const { results: searchResults, loading: searchLoading, search, clear: clearSearch } = useNominatimSearch()
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
    // The map will pan via the flyTo we need to trigger — pass through a ref or event
    // For now, user can manually navigate; search sets context
    const event = new CustomEvent("nominatim-select", { detail: result })
    window.dispatchEvent(event)
  }

  const selectedCount = campaignState.selectedAddresses.length

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-sand shrink-0">
        {/* Location search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search area, e.g. Hampstead, London"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full text-sm border border-sand rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-coral"
          />
          {searchLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-soft/70 text-xs">
              ...
            </span>
          )}
          {showSearchResults && searchResults.length > 0 && (
            <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-sand rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((r) => (
                <li key={r.place_id}>
                  <button
                    className="w-full text-left text-sm px-3 py-2 hover:bg-cream truncate"
                    onClick={() => handleSearchSelect(r)}
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Draw control */}
        <div className="flex items-center gap-2">
          {drawMode === "idle" ? (
            <button
              onClick={() => setDrawMode("first-click")}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-coral text-white hover:bg-coral-dark transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Draw area
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-coral-dark font-medium bg-cream px-3 py-1.5 rounded-lg">
                {drawMode === "first-click" ? "Click first corner" : "Click opposite corner"}
              </span>
              <button
                onClick={() => setDrawMode("idle")}
                className="text-sm text-navy-soft hover:text-navy px-2 py-1.5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <PropertyMap
            addresses={addresses}
            selectedIds={selectedIds}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            onAreaDrawn={handleAreaDrawn}
          />
          {/* Attribution helper */}
          <div className="absolute bottom-6 left-2 text-[10px] text-navy-soft/70 pointer-events-none">
            Tip: draw a rectangle to find addresses
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-white border-l border-sand flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-sand">
            <h2 className="text-sm font-semibold text-navy">
              Selected addresses
              {selectedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-coral text-white text-xs">
                  {selectedCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-navy-soft mt-0.5">
              Draw a rectangle on the map to find addresses
            </p>
          </div>
          <AddressList
            addresses={addresses}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            loading={loading}
            error={error}
          />
          <div className="p-3 border-t border-sand mt-auto">
            <button
              onClick={() => router.push("/refine")}
              disabled={selectedCount === 0}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral hover:bg-coral-dark text-white"
            >
              {selectedCount === 0
                ? "Select at least one address"
                : `Next: Refine your results (${selectedCount}) →`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
