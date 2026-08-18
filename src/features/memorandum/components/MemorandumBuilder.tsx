"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { emptyDraft, memorandumFromDraft } from "@/types/memorandum"
import type { Acknowledgement, Memorandum, MemorandumDraft } from "@/types/memorandum"
import { MemorandumForm } from "./MemorandumForm"
import { MemorandumPreview } from "./MemorandumPreview"
import { AcknowledgementPanel } from "./AcknowledgementPanel"
import { ShareLinkPanel } from "./ShareLinkPanel"

/**
 * The seller's side: fill it in, check the preview, acknowledge, then hand it
 * over. The seller goes first because they own the property and therefore set
 * what is included — the buyer confirms rather than negotiates here.
 */
export function MemorandumBuilder() {
  const [draft, setDraft] = useState<MemorandumDraft>(emptyDraft)
  const [acknowledgement, setAcknowledgement] = useState<Acknowledgement | null>(null)

  // Re-validated on every keystroke so the preview shows the real document as
  // soon as it becomes one, rather than only at submit.
  const parsed = useMemo(() => memorandumFromDraft(draft), [draft])
  const memorandum: Memorandum | null = parsed.success ? parsed.data : null

  const missing = useMemo(() => describeMissing(draft), [draft])

  const signed: Memorandum | null = useMemo(() => {
    if (!acknowledgement) return null
    const result = memorandumFromDraft(draft, { seller: acknowledgement })
    return result.success ? result.data : null
  }, [draft, acknowledgement])

  if (signed) {
    return (
      <div className="flex flex-col gap-6">
        <ShareLinkPanel
          memorandum={signed}
          heading="Ready to send to your buyer"
          intro="You've confirmed your terms. Two things left."
          recipientAction="Send it to your buyer however you like — email, WhatsApp, text. They'll see your terms, add their own details and confirm. You'll get a completed copy back."
        />
        <MemorandumPreview memorandum={signed} />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-1/2 lg:sticky lg:top-6 flex flex-col gap-8">
        <MemorandumForm draft={draft} onChange={setDraft} role="seller" />

        <AcknowledgementPanel
          partyName={draft.seller.name}
          role="seller"
          disabled={memorandum === null}
          disabledReason={missing ? `Still needed: ${missing}.` : undefined}
          onAcknowledge={(typedName) =>
            setAcknowledgement({ typedName, at: new Date().toISOString() })
          }
        />

        <p className="text-xs text-navy-soft/80 leading-relaxed">
          Not sure what a memorandum of sale is for?{" "}
          <Link href="/sell" className="text-coral font-medium hover:underline">
            Read the guide to selling without an agent
          </Link>
          .
        </p>
      </div>

      <div className="w-full lg:w-1/2">
        {memorandum ? (
          <MemorandumPreview memorandum={memorandum} />
        ) : (
          <div className="rounded-xl border border-dashed border-sand bg-white/60 p-8 text-center">
            <p className="text-sm font-medium text-navy">Your memorandum will appear here</p>
            <p className="text-xs text-navy-soft mt-1.5 leading-relaxed">
              Fill in the property, the agreed price and both names to see it take shape.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Plain-English list of what is still missing, rather than a Zod error dump. */
function describeMissing(draft: MemorandumDraft): string | null {
  const missing: string[] = []
  if (draft.propertyAddress.trim() === "") missing.push("the property address")
  if (draft.price.trim() === "") missing.push("the agreed price")
  if (draft.seller.name.trim() === "") missing.push("the seller's name")
  if (draft.buyer.name.trim() === "") missing.push("the buyer's name")

  if (missing.length === 0) {
    // Everything required is present but the document still will not parse —
    // almost always a price that is not a number.
    return "a valid price, in pounds"
  }
  if (missing.length === 1) return missing[0] ?? null
  return `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`
}
