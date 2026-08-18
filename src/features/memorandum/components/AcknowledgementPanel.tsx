"use client"

import { useState } from "react"
import { MEMORANDUM_LIMITS } from "@/types/memorandum"

interface AcknowledgementPanelProps {
  /** The name this party gave earlier, for the soft match check. */
  partyName: string
  role: "seller" | "buyer"
  onAcknowledge: (typedName: string) => void
  disabled: boolean
  disabledReason?: string | undefined
}

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

/**
 * A typed name against a declaration, with a tick and a timestamp — Will's
 * design, and deliberately not called a signature anywhere.
 *
 * The name check is soft on purpose. Requiring an exact match against the party
 * field would reject "Will Boltwood" against "William Boltwood", and middle
 * names and initials would make that wrong more often than right. A mismatch is
 * worth pointing out, not worth blocking on.
 */
export function AcknowledgementPanel({
  partyName,
  role,
  onAcknowledge,
  disabled,
  disabledReason,
}: AcknowledgementPanelProps) {
  const [typedName, setTypedName] = useState("")
  const [agreed, setAgreed] = useState(false)

  const trimmed = typedName.trim()
  const mismatch =
    trimmed !== "" && partyName.trim() !== "" && normalise(trimmed) !== normalise(partyName)
  const ready = trimmed !== "" && agreed && !disabled

  return (
    <section className="rounded-xl border border-sand bg-white p-5">
      <h2 className="font-semibold text-navy">
        {role === "seller" ? "Confirm your terms" : "Confirm you agree"}
      </h2>
      <p className="text-sm text-navy-soft mt-1 leading-relaxed">
        Type your name to record that you agree to the terms above. This is an acknowledgement,
        not a signature — the memorandum is not legally binding, and nothing is committed until
        contracts are exchanged.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy">Your full name</span>
          <input
            type="text"
            value={typedName}
            maxLength={MEMORANDUM_LIMITS.TYPED_NAME}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={partyName || "Your name"}
            className="w-full text-sm border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </label>

        {mismatch && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This does not match the name given above ({partyName}). That is fine if you go by a
            different name — the document will record what you type here.
          </p>
        )}

        {trimmed !== "" && (
          <p className="text-sm text-navy bg-cream border border-sand rounded-lg px-3 py-2.5 leading-relaxed">
            I, <span className="font-semibold">{trimmed}</span>, agree to the terms of the sale as
            outlined within this document.
          </p>
        )}

        <label className="flex items-start gap-2.5 text-sm text-navy cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-coral shrink-0"
          />
          <span>I agree to the terms set out in this memorandum of sale.</span>
        </label>

        {disabled && disabledReason && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {disabledReason}
          </p>
        )}

        <button
          onClick={() => onAcknowledge(trimmed)}
          disabled={!ready}
          className="w-full sm:w-auto self-start bg-coral hover:bg-coral-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {role === "seller" ? "Confirm and continue" : "Confirm and finish"}
        </button>
      </div>
    </section>
  )
}
