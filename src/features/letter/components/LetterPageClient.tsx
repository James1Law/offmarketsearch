"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LetterEditor } from "./LetterEditor"
import { LetterPreview } from "./LetterPreview"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import type { LetterContent } from "@/types"

export function LetterPageClient() {
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
    router.push("/basket")
  }

  if (campaignState.selectedAddresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
        <p className="text-slate-600">You haven&apos;t selected any addresses yet.</p>
        <button
          onClick={() => router.push("/map")}
          className="text-indigo-600 font-medium hover:underline"
        >
          ← Go back to the map
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left: editor */}
        <aside className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Personalise your letter</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              One letter sent to all {campaignState.selectedAddresses.length} addresses
            </p>
          </div>
          <div className="px-5 py-4 flex-1">
            <LetterEditor initial={campaignState.letterContent} onChange={handleChange} />
          </div>
          <div className="px-5 py-4 border-t border-slate-100">
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isComplete ? "Next: Review basket →" : "Fill in your name and address"}
            </button>
          </div>
        </aside>

        {/* Right: preview */}
        <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
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
          <p className="text-xs text-slate-400 text-center mt-4">
            This is a preview of the letter that will be printed and posted to each homeowner.
          </p>
        </main>
      </div>
    </div>
  )
}
