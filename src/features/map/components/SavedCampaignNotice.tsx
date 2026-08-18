"use client"

import { campaignStore } from "@/lib/campaign-store"

interface SavedCampaignNoticeProps {
  count: number
}

/**
 * Shown when a stale campaign is restored from localStorage. Without it, an old
 * selection reappears on the map with no explanation — which is how someone
 * borrowing a phone ends up looking at a search they never made.
 */
export function SavedCampaignNotice({ count }: SavedCampaignNoticeProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 bg-cream border-b border-sand text-sm">
      <span className="text-navy">
        You have <strong className="font-semibold">{count}</strong>{" "}
        {count === 1 ? "address" : "addresses"} saved from an earlier search.
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => campaignStore.touch()}
          className="font-medium text-navy-soft hover:text-navy px-2 py-1"
        >
          Keep them
        </button>
        <button
          onClick={() => campaignStore.clear()}
          className="font-medium px-3 py-1 rounded-lg bg-coral text-white hover:bg-coral-dark transition-colors"
        >
          Start fresh
        </button>
      </div>
    </div>
  )
}
