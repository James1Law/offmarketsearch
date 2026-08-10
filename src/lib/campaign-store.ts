"use client"

import { useSyncExternalStore } from "react"
import type { CampaignState, SelectedAddress, LetterContent } from "@/types"

const STORAGE_KEY = "offline-homes-campaign"

const defaultState: CampaignState = {
  selectedAddresses: [],
  letterContent: null,
}

function readFromStorage(): CampaignState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return JSON.parse(raw) as CampaignState
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
  currentState = next
  writeToStorage(next)
  notify()
}

// Hydrate from localStorage on first client render.
if (typeof window !== "undefined") {
  currentState = readFromStorage()
}

export const campaignStore = {
  setAddresses(addresses: SelectedAddress[]): void {
    setState({ ...currentState, selectedAddresses: addresses })
  },
  toggleAddress(address: SelectedAddress): void {
    const exists = currentState.selectedAddresses.some((a) => a.id === address.id)
    const next = exists
      ? currentState.selectedAddresses.filter((a) => a.id !== address.id)
      : [...currentState.selectedAddresses, address]
    setState({ ...currentState, selectedAddresses: next })
  },
  setLetterContent(content: LetterContent): void {
    setState({ ...currentState, letterContent: content })
  },
  clear(): void {
    setState(defaultState)
  },
}

export function useCampaignStore(): CampaignState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
