"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { BottomSheet, type SnapRequest } from "@/components/mobile/BottomSheet"
import { MobileAddressList } from "./MobileAddressList"
import { AreaSelectControl } from "./AreaSelectControl"
import { SavedCampaignNotice } from "./SavedCampaignNotice"
import { ClearListButton } from "./ClearListButton"
import { useOverpassAddresses } from "../hooks/useOverpassAddresses"
import { useNominatimSearch } from "../hooks/useNominatimSearch"
import { loadSandboxAddresses } from "../actions"
import { useCampaignStore, campaignStore, isCampaignStale } from "@/lib/campaign-store"
import { MAP_DEFAULTS, LIMITS, AREA_SELECT } from "@/lib/constants"
import { circleAreaToRing, type CircleArea } from "../area-select"
import type { BBox, SelectedAddress } from "@/types"

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-sand animate-pulse" /> },
)

export function MobileMapPageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const { addresses, totalFound, loading, error, searched, fetchPolygon, fetchViewport, clear } =
    useOverpassAddresses()
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clear: clearSearch,
  } = useNominatimSearch()
  const [circle, setCircle] = useState<CircleArea | null>(null)
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

  function handleCircleCenterChange(center: [lng: number, lat: number]) {
    setCircle((current) => ({
      center,
      radiusMetres: current?.radiusMetres ?? AREA_SELECT.DEFAULT_RADIUS_M,
    }))
    // Get the sheet out of the way so the circle is visible while sizing it.
    setSnapRequest({ index: 0, token: Date.now() })
  }

  function handleRadiusChange(metres: number) {
    setCircle((current) => (current ? { ...current, radiusMetres: metres } : current))
  }

  // Deliberately only on the button, not on every slider nudge — dragging the
  // radius must not fire an Overpass query per pixel.
  async function handleSearchCircle() {
    if (!circle) return
    clear()
    await fetchPolygon(circleAreaToRing(circle))
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
  const showSavedNotice = isCampaignStale(campaignState)
  const showZoomHint = !circle && zoom < MAP_DEFAULTS.PIN_ZOOM && addresses.length === 0

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {showSavedNotice && <SavedCampaignNotice count={selectedCount} />}

      {/* Top control bar */}
      <div className="px-3 pt-2 bg-white shrink-0 flex items-center gap-2">
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
      </div>

      <div className="px-3 pb-2 bg-white border-b border-sand shrink-0">
        <AreaSelectControl
          circle={circle}
          onRadiusChange={handleRadiusChange}
          onSearchCircle={handleSearchCircle}
          loading={loading}
          compact
        />
      </div>

      {/* Map + sheet */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0">
          <PropertyMap
            addresses={pinAddresses}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            circle={circle}
            onCircleCenterChange={handleCircleCenterChange}
            onViewportChange={handleViewportChange}
            touchTargets
            showNavControl={false}
          />
        </div>

        {showZoomHint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[85%] bg-white/95 text-navy-soft text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none text-center">
            Tap the map to place a search area, or zoom in to see addresses
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
                {!loading && selectedCount > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {addresses.length > 0 && (
                      <span className="text-coral font-medium">{selectedCount} selected</span>
                    )}
                    <ClearListButton count={selectedCount} />
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
              {addresses.length === 0 && (
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
            searched={searched}
            totalFound={totalFound}
            onLoadDemo={handleLoadDemo}
          />
        </BottomSheet>
      </div>
    </div>
  )
}
