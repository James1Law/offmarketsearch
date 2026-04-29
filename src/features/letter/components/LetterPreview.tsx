"use client"

import type { LetterContent } from "@/types"
import { renderTemplate } from "../templates/friendly-home-mover"

interface LetterPreviewProps {
  content: LetterContent
  recipientAddress: string
}

export function LetterPreview({ content, recipientAddress }: LetterPreviewProps) {
  const text = renderTemplate(content)

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Letter-paper header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Letter preview
        </span>
        <span className="text-xs text-slate-400">A5 · Printed & posted by LetterDrop</span>
      </div>

      {/* Letter body */}
      <div
        className="px-8 py-6 font-serif text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[420px]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {content.senderName || content.senderAddress || content.personalMessage
          ? text
          : <span className="text-slate-400 not-italic" style={{ fontFamily: "inherit" }}>
              Fill in your details on the left to preview your letter.
            </span>
        }
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 text-xs text-slate-400">
        Addressed to: <span className="font-medium text-slate-600">{recipientAddress || "The Homeowner"}</span>
      </div>
    </div>
  )
}
