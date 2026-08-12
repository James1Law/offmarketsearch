"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LetterEditor } from "./LetterEditor"
import { LetterPreview } from "./LetterPreview"
import { StickyCTA } from "@/components/mobile/StickyCTA"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import type { LetterContent } from "@/types"

export function MobileLetterPageClient() {
  const router = useRouter()
  const campaignState = useCampaignStore()
  const [draft, setDraft] = useState<LetterContent | null>(campaignState.letterContent)

  const handleChange = useCallback((content: LetterContent) => {
    setDraft(content)
  }, [])

  const exampleRecipient = campaignState.selectedAddresses[0] ?? null

  const isComplete =
    draft !== null &&
    draft.senderName.trim().length > 0 &&
    draft.senderAddress.trim().length > 0

  function handleNext() {
    if (!draft || !isComplete) return
    campaignStore.setLetterContent(draft)
    router.push("/m/basket")
  }

  if (campaignState.selectedAddresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6 py-12">
        <p className="text-sm text-navy-soft">You haven&apos;t selected any addresses yet.</p>
        <button
          onClick={() => router.push("/m/map")}
          className="text-coral font-semibold text-sm px-5 py-3 rounded-xl bg-coral-soft active:bg-coral-soft/70"
        >
          ← Go back to the map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 py-4 border-b border-sand">
        <h1 className="text-base font-semibold text-navy">Personalise your letter</h1>
        <p className="text-xs text-navy-soft mt-0.5">
          One letter sent to all {campaignState.selectedAddresses.length} addresses
        </p>
      </div>

      <section className="px-4 py-5 border-b border-sand">
        <LetterEditor initial={campaignState.letterContent} onChange={handleChange} />
      </section>

      <section className="px-4 py-5 bg-cream">
        <h2 className="text-xs font-semibold text-navy-soft uppercase tracking-wider mb-3">
          Preview
        </h2>
        <LetterPreview
          content={
            draft ?? {
              templateId: "friendly-home-mover",
              senderName: "",
              senderAddress: "",
            }
          }
          recipient={exampleRecipient}
          refineFilters={campaignState.refineFilters}
        />
        <p className="text-[11px] text-navy-soft/70 text-center mt-3">
          This is a preview of the letter that will be printed and posted to each homeowner.
        </p>
      </section>

      <StickyCTA>
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-coral active:bg-coral-dark text-white"
        >
          {isComplete ? "Next: Review basket →" : "Fill in your name and address"}
        </button>
      </StickyCTA>
    </div>
  )
}
