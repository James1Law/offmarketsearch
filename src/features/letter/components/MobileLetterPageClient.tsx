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

  const exampleAddress =
    campaignState.selectedAddresses[0]?.displayAddress ?? "14 Maple Avenue"

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
        <p className="text-sm text-slate-600">You haven&apos;t selected any addresses yet.</p>
        <button
          onClick={() => router.push("/m/map")}
          className="text-indigo-600 font-medium text-sm hover:underline"
        >
          ← Go back to the map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="px-4 py-4 border-b border-slate-100">
        <h1 className="text-base font-semibold text-slate-900">Personalise your letter</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          One letter sent to all {campaignState.selectedAddresses.length} addresses
        </p>
      </div>

      <section className="px-4 py-5 border-b border-slate-100">
        <LetterEditor initial={campaignState.letterContent} onChange={handleChange} />
      </section>

      <section className="px-4 py-5 bg-slate-50">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Preview
        </h2>
        <LetterPreview
          content={
            draft ?? {
              templateId: "friendly-home-mover",
              senderName: "",
              senderAddress: "",
              personalMessage: "",
            }
          }
          recipientAddress={exampleAddress}
        />
        <p className="text-[11px] text-slate-400 text-center mt-3">
          This is a preview of the letter that will be printed and posted to each homeowner.
        </p>
      </section>

      <StickyCTA>
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 active:bg-indigo-700 text-white"
        >
          {isComplete ? "Next: Review basket →" : "Fill in your name and address"}
        </button>
      </StickyCTA>
    </div>
  )
}
