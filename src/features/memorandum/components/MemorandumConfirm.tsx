"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { draftFromMemorandum, memorandumFromDraft } from "@/types/memorandum"
import type { Acknowledgement, Memorandum, MemorandumDraft } from "@/types/memorandum"
import { decodeMemorandum, type DecodeFailure } from "../share-link"
import { memorandumStage } from "../document"
import { MemorandumForm } from "./MemorandumForm"
import { MemorandumPreview } from "./MemorandumPreview"
import { AcknowledgementPanel } from "./AcknowledgementPanel"
import { ShareLinkPanel } from "./ShareLinkPanel"
import { DownloadPdfButton } from "./DownloadPdfButton"

type LoadState =
  | { status: "loading" }
  | { status: "failed"; reason: DecodeFailure }
  | { status: "loaded"; memorandum: Memorandum }

const FAILURE_MESSAGES: Record<DecodeFailure, string> = {
  empty:
    "This page needs a link from the seller. Ask them to send it again, or start a new memorandum of sale.",
  "unknown-version":
    "This link was made by a different version of this tool and can't be opened here. Ask the seller to send a fresh one.",
  malformed:
    "This link looks incomplete — messaging apps sometimes cut long links in half. Ask the seller to send it again, and paste the whole thing into your browser.",
  "too-large": "This link is too large to open. Ask the seller to send a fresh one.",
  "not-a-memorandum":
    "This link doesn't contain a memorandum of sale. Ask the seller to send it again.",
}

/**
 * The counterparty's side.
 *
 * The document arrives in the URL fragment, which the server never sees — so
 * decoding happens after mount, and there is a genuine loading state rather
 * than a flash of the wrong thing.
 */
export function MemorandumConfirm() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" })
  const [draft, setDraft] = useState<MemorandumDraft | null>(null)
  const [buyerAck, setBuyerAck] = useState<Acknowledgement | null>(null)

  useEffect(() => {
    let cancelled = false
    decodeMemorandum(window.location.hash)
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setLoad({ status: "failed", reason: result.reason })
          return
        }
        setLoad({ status: "loaded", memorandum: result.memorandum })
        setDraft(draftFromMemorandum(result.memorandum))
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: "failed", reason: "malformed" })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sellerAcknowledgement =
    load.status === "loaded" ? load.memorandum.sellerAcknowledgement : undefined

  const working: Memorandum | null = useMemo(() => {
    if (!draft || !sellerAcknowledgement) return null
    const result = memorandumFromDraft(draft, {
      seller: sellerAcknowledgement,
      buyer: buyerAck ?? undefined,
    })
    return result.success ? result.data : null
  }, [draft, sellerAcknowledgement, buyerAck])

  if (load.status === "loading") {
    return (
      <div className="rounded-xl border border-sand bg-white p-8 text-center">
        <p className="text-sm text-navy-soft">Opening the memorandum…</p>
      </div>
    )
  }

  if (load.status === "failed") {
    return (
      <div className="rounded-xl border border-sand bg-white p-8 max-w-xl mx-auto text-center">
        <h2 className="font-semibold text-navy">This link didn&apos;t open</h2>
        <p className="text-sm text-navy-soft mt-2 leading-relaxed">
          {FAILURE_MESSAGES[load.reason]}
        </p>
        <Link
          href="/memorandum"
          className="inline-block mt-5 bg-coral hover:bg-coral-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          Start a memorandum of sale
        </Link>
      </div>
    )
  }

  // Already complete when it arrived: the seller opening the buyer's return
  // link, or either party revisiting their own copy.
  if (memorandumStage(load.memorandum) === "complete") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-sand bg-white p-5">
          <h2 className="font-semibold text-navy">Both parties have confirmed</h2>
          <p className="text-sm text-navy-soft mt-1 mb-4 leading-relaxed">
            Download the memorandum and send it to your conveyancer. The buyer&apos;s conveyancer
            will want a copy too.
          </p>
          <DownloadPdfButton memorandum={load.memorandum} label="Download the memorandum" />
        </div>
        <MemorandumPreview memorandum={load.memorandum} />
      </div>
    )
  }

  if (buyerAck && working) {
    return (
      <div className="flex flex-col gap-6">
        <ShareLinkPanel
          memorandum={working}
          heading="Confirmed — send it back to the seller"
          intro="You've agreed the terms. Two things left."
          recipientAction="Send this link back to the seller so they have the completed memorandum too. Both of you should then forward the PDF to your own conveyancer."
        />
        <MemorandumPreview memorandum={working} />
      </div>
    )
  }

  if (!draft) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-sand bg-cream p-5">
        <h2 className="font-semibold text-navy">
          {load.memorandum.seller.name} has sent you a memorandum of sale
        </h2>
        <p className="text-sm text-navy-soft mt-1 leading-relaxed">
          Check the terms below, fill in your own details, and confirm. The seller&apos;s terms
          are shown as they set them — if anything looks wrong, speak to them before confirming
          rather than changing it here.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-1/2 flex flex-col gap-8">
          <MemorandumForm draft={draft} onChange={setDraft} role="buyer" />

          <AcknowledgementPanel
            partyName={draft.buyer.name}
            role="buyer"
            disabled={working === null}
            disabledReason={
              working === null ? "Add your name to confirm." : undefined
            }
            onAcknowledge={(typedName) =>
              setBuyerAck({ typedName, at: new Date().toISOString() })
            }
          />
        </div>

        <div className="w-full lg:w-1/2 lg:sticky lg:top-6">
          <MemorandumPreview memorandum={working ?? load.memorandum} />
        </div>
      </div>
    </div>
  )
}
