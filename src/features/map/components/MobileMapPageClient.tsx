"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { BottomSheet, type SnapRequest } from "@/components/mobile/BottomSheet"
import { MobileAddressList } from "./MobileAddressList"
import { useOverpassAddresses, type BBox } from "../hooks/useOverpassAddresses"
import { useNominatimSearch } from "../hooks/useNominatimSearch"
import { loadSandboxAddresses } from "../actions"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import { MAP_DEFAULTS, LIMITS } from "@/lib/constants"
import type { SelectedAddress } from "@/types"
import type { PolygonRing } from "@/lib/geocoding/overpass"

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-sand animate-pulse" /> },
)

// Keep drawn results visible above the collapsed bottom sheet when fitting the map.
const MOBILE_FIT_PADDING = { top: 40, bottom: 240, left: 40, right: 40 }

export function MobileMapPageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const { addresses, loading, error, fetchPolygon, fetchViewport, clear } = useOverpassAddresses()
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clear: clearSearch,
  } = useNominatimSearch()
  const [drawing, setDrawing] = useState(false)
  const [zoom, setZoom] = useState<number>(MAP_DEFAULTS.ZOOM)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [snapRequest, setSnapRequest] = useState<SnapRequest | undefined>(undefined)
  const [demoLoading, setDemoLoading] = useState(false)

  async function handleLoadDemo() {
    setDemoLoading(true)
    try {
      const demo = await loadSandboxAddresses()
      campaignStore.setAddresses(demo)
      router.push("/m/refine")
    } catch {
      setDemoLoading(false)
    }
  }

  const selectedIds = useMemo(
    () => new Set(campaignState.selectedAddresses.map((a) => a.id)),
    [campaignState.selectedAddresses],
  )

  // Pins show viewport/polygon results plus anything already selected, so
  // selected addresses stay visible when the user pans elsewhere.
  const pinAddresses = useMemo(() => {
    const byId = new Map(addresses.map((a) => [a.id, a]))
    for (const a of campaignState.selectedAddresses) {
      if (!byId.has(a.id)) byId.set(a.id, a)
    }
    return [...byId.values()]
  }, [addresses, campaignState.selectedAddresses])

  function handleToggle(address: SelectedAddress) {
    const adding = !selectedIds.has(address.id)
    if (adding && selectedIds.size >= LIMITS.MAX_LETTERS_PER_CAMPAIGN) return
    campaignStore.toggleAddress(address)
  }

  function startDrawing() {
    // Collapse the sheet so the map has maximum room while drawing.
    setSnapRequest({ index: 0, token: Date.now() })
    setDrawing(true)
  }

  async function handlePolygonComplete(ring: PolygonRing) {
    clear()
    await fetchPolygon(ring)
    // Surface the results (or the error/empty message): expand the sheet to mid height.
    setSnapRequest({ index: 1, token: Date.now() })
  }

  function handleViewportChange(bbox: BBox, newZoom: number) {
    setZoom(newZoom)
    if (newZoom >= MAP_DEFAULTS.PIN_ZOOM) fetchViewport(bbox)
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

  const allOnScreenSelected =
    addresses.length > 0 && addresses.every((addr) => selectedIds.has(addr.id))

  function toggleAllOnScreen() {
    for (const addr of addresses) {
      const isSelected = selectedIds.has(addr.id)
      if (allOnScreenSelected ? isSelected : !isSelected) handleToggle(addr)
    }
  }

  const selectedCount = campaignState.selectedAddresses.length
  const showZoomHint = !drawing && zoom < MAP_DEFAULTS.PIN_ZOOM && addresses.length === 0

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
            className="w-full text-base border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral"
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
                    className="w-full text-left text-sm px-3 py-2.5 active:bg-cream truncate"
                    onClick={() => handleSearchSelect(r)}
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!drawing ? (
          <button
            onClick={startDrawing}
            className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-lg bg-coral active:bg-coral-dark text-white"
            aria-label="Draw area"
          >
            Draw area
          </button>
        ) : (
          <button
            onClick={() => setDrawing(false)}
            className="shrink-0 text-sm font-medium px-4 py-2.5 rounded-lg border border-sand text-navy-soft"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Map + sheet */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0">
          <PropertyMap
            addresses={pinAddresses}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            drawing={drawing}
            onDrawingChange={setDrawing}
            onPolygonComplete={handlePolygonComplete}
            onViewportChange={handleViewportChange}
            touchTargets
            showNavControl={false}
            fitPadding={MOBILE_FIT_PADDING}
          />
        </div>

        {drawing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[85%] bg-coral text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md pointer-events-none text-center">
            Draw around the homes you want — lift your finger to finish
          </div>
        )}

        {showZoomHint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[85%] bg-white/95 text-navy-soft text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none text-center">
            Search or zoom in to see addresses — or draw an area
          </div>
        )}

        <BottomSheet
          initialSnap={0}
          snapRequest={snapRequest}
          header={
            <div className="px-4 py-2 border-b border-sand flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-navy">
                  {loading
                    ? "Finding addresses…"
                    : addresses.length > 0
                      ? `${addresses.length} addresses found`
                      : selectedCount > 0
                        ? `${selectedCount} selected`
                        : "Selected addresses"}
                </div>
                {!loading && addresses.length > 0 && selectedCount > 0 && (
                  <div className="text-xs text-coral font-medium">
                    {selectedCount} selected
                  </div>
                )}
              </div>
              {!loading && addresses.length > 0 && (
                <button
                  onClick={toggleAllOnScreen}
                  className="text-sm text-coral font-semibold px-2 py-2"
                >
                  {allOnScreenSelected ? "Clear all" : "Select all"}
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
                onClick={() => router.push("/m/refine")}
                disabled={selectedCount === 0}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral active:bg-coral-dark text-white"
              >
                {selectedCount === 0
                  ? "Select at least one address"
                  : `Next: Refine your results (${selectedCount}) →`}
              </button>
              {selectedCount === 0 && (
                <button
                  onClick={handleLoadDemo}
                  disabled={demoLoading}
                  className="w-full text-center text-xs text-coral font-medium py-2 disabled:opacity-50"
                >
                  {demoLoading ? "Loading demo addresses…" : "Or try demo addresses →"}
                </button>
              )}
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
