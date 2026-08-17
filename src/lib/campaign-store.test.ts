import { describe, it, expect } from "vitest"
import { isCampaignStale } from "./campaign-store"
import { CAMPAIGN_STALE_MS } from "./constants"
import type { CampaignState } from "@/types"

const NOW = 1_755_000_000_000

function campaign(overrides: Partial<CampaignState> = {}): CampaignState {
  return {
    selectedAddresses: [
      {
        id: "osm-1",
        displayAddress: "1 The Square, DT2 8SL",
        streetAddress: "1 The Square",
        lat: 50.75,
        lng: -2.35,
      },
    ],
    refineFilters: null,
    enrichment: {},
    letterContent: null,
    lastUpdatedAt: NOW,
    ...overrides,
  }
}

describe("isCampaignStale", () => {
  it("is not stale when just updated", () => {
    expect(isCampaignStale(campaign(), NOW)).toBe(false)
  })

  it("is not stale within the window", () => {
    expect(isCampaignStale(campaign(), NOW + CAMPAIGN_STALE_MS - 1)).toBe(false)
  })

  it("is stale past the window", () => {
    expect(isCampaignStale(campaign(), NOW + CAMPAIGN_STALE_MS + 1)).toBe(true)
  })

  it("is never stale with nothing selected — there is nothing to confirm", () => {
    expect(isCampaignStale(campaign({ selectedAddresses: [] }), NOW + CAMPAIGN_STALE_MS * 10)).toBe(
      false,
    )
  })

  // Campaigns saved before lastUpdatedAt existed have an unknown age. Confirming
  // once is harmless; silently restoring is the behaviour being fixed.
  it("treats an unknown age as stale", () => {
    expect(isCampaignStale(campaign({ lastUpdatedAt: 0 }), NOW)).toBe(true)
  })
})
