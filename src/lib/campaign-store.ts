"use client"

import { useSyncExternalStore } from "react"
import type { CampaignState, SelectedAddress, LetterContent, RefineFilters } from "@/types"
import type { EnrichmentResult } from "@/types/enrichment"
import { CAMPAIGN_STALE_MS } from "@/lib/constants"

const STORAGE_KEY = "offline-homes-campaign"

const defaultState: CampaignState = {
  selectedAddresses: [],
  refineFilters: null,
  enrichment: {},
  letterContent: null,
  lastUpdatedAt: 0,
}

/** Drop enrichment entries whose address is no longer selected. */
function pruneEnrichment(
  enrichment: CampaignState["enrichment"],
  addresses: SelectedAddress[],
): CampaignState["enrichment"] {
  const keep = new Set(addresses.map((a) => a.id))
  return Object.fromEntries(Object.entries(enrichment).filter(([id]) => keep.has(id)))
}

function readFromStorage(): CampaignState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    // Spread over defaults so state saved before newer fields existed still loads.
    return { ...defaultState, ...(JSON.parse(raw) as Partial<CampaignState>) }
  } catch {
    return defaultState
  }
}

function writeToStorage(state: CampaignState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let currentState: CampaignState = defaultState
const listeners = new Set<() => void>()

function getSnapshot(): CampaignState {
  return currentState
}

function getServerSnapshot(): CampaignState {
  return defaultState
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const l of listeners) l()
}

function setState(next: CampaignState): void {
  currentState = { ...next, lastUpdatedAt: Date.now() }
  writeToStorage(currentState)
  notify()
}

/**
 * A campaign survives in localStorage indefinitely, so returning to the map can
 * silently restore a selection made hours ago — or by whoever last held the
 * phone. Past CAMPAIGN_STALE_MS we ask instead of assuming.
 */
export function isCampaignStale(state: CampaignState, now: number = Date.now()): boolean {
  if (state.selectedAddresses.length === 0) return false
  // Saved before the timestamp existed: age unknown, so confirm it.
  if (!state.lastUpdatedAt) return true
  return now - state.lastUpdatedAt > CAMPAIGN_STALE_MS
}

// Hydrate from localStorage on first client render.
if (typeof window !== "undefined") {
  currentState = readFromStorage()
}

export const campaignStore = {
  setAddresses(addresses: SelectedAddress[]): void {
    setState({
      ...currentState,
      selectedAddresses: addresses,
      enrichment: pruneEnrichment(currentState.enrichment, addresses),
    })
  },
  toggleAddress(address: SelectedAddress): void {
    const exists = currentState.selectedAddresses.some((a) => a.id === address.id)
    const next = exists
      ? currentState.selectedAddresses.filter((a) => a.id !== address.id)
      : [...currentState.selectedAddresses, address]
    setState({
      ...currentState,
      selectedAddresses: next,
      enrichment: pruneEnrichment(currentState.enrichment, next),
    })
  },
  mergeEnrichment(results: EnrichmentResult[]): void {
    const merged = { ...currentState.enrichment }
    for (const result of results) merged[result.addressId] = result
    setState({
      ...currentState,
      enrichment: pruneEnrichment(merged, currentState.selectedAddresses),
    })
  },
  setRefineFilters(filters: RefineFilters): void {
    setState({ ...currentState, refineFilters: filters })
  },
  setLetterContent(content: LetterContent): void {
    setState({ ...currentState, letterContent: content })
  },
  /** Marks the campaign as current, e.g. when the user confirms they want it. */
  touch(): void {
    setState(currentState)
  },
  clear(): void {
    setState(defaultState)
  },
}

export function useCampaignStore(): CampaignState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
