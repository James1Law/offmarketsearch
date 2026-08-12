"use client"

import type { LetterContent, RefineFilters, SelectedAddress } from "@/types"
import { renderLetter } from "../templates/friendly-home-mover"

interface LetterPreviewProps {
  content: LetterContent
  recipient: SelectedAddress | null
  refineFilters: RefineFilters | null
}

const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" }

export function LetterPreview({ content, recipient, refineFilters }: LetterPreviewProps) {
  const letter = renderLetter(content, recipient, refineFilters)

  const hasAnyInput =
    content.senderName ||
    content.senderAddress ||
    content.senderPhone ||
    content.senderEmail ||
    content.motivation ||
    content.position ||
    content.funding ||
    content.timescale

  return (
    <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
      {/* Letter-paper header */}
      <div className="bg-cream border-b border-sand px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-navy-soft uppercase tracking-wider">
          Letter preview
        </span>
        <span className="text-xs text-navy-soft/70">A5 · Printed & posted by Offline.homes</span>
      </div>

      {/* Letter body */}
      {hasAnyInput ? (
        <div className="px-6 sm:px-8 py-6 text-sm text-slate-800 leading-relaxed" style={SERIF}>
          {/* Sender address, contact details and date — top right */}
          <div className="flex justify-end">
            <div className="text-right">
              {letter.senderLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <div className="mt-3">{letter.dateLine}</div>
            </div>
          </div>

          {/* Recipient address — left, below the sender block */}
          <div className="mt-5">
            {letter.recipientLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          <p className="mt-5">{letter.salutation}</p>

          {letter.paragraphs.map((para, i) => (
            <p key={i} className="mt-4">
              {para}
            </p>
          ))}

          <p className="mt-4">{letter.signOff}</p>
          <p className="mt-5">{letter.signature}</p>

          {/* Offline.homes outro + small print */}
          <div className="mt-8 pt-4 border-t border-sand font-sans">
            <p className="text-xs text-navy-soft">{letter.outro}</p>
            <p className="text-[10px] text-navy-soft/70 mt-2">{letter.disclaimer}</p>
          </div>
        </div>
      ) : (
        <div className="px-8 py-6 text-sm min-h-[420px]" style={SERIF}>
          <span className="text-navy-soft/70">
            Fill in your details on the left to preview your letter.
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="bg-cream border-t border-sand px-6 py-2 text-xs text-navy-soft/70">
        Addressed to:{" "}
        <span className="font-medium text-navy-soft">
          {recipient?.displayAddress ?? "The Homeowner"}
        </span>
      </div>
    </div>
  )
}
