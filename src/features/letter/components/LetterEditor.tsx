"use client"

import { useState, useEffect } from "react"
import type { LetterContent } from "@/types"
import { LIMITS, TEMPLATE_IDS } from "@/lib/constants"
import { FIELD_LABELS, FIELD_HINTS } from "../templates/friendly-home-mover"

interface LetterEditorProps {
  initial: LetterContent | null
  onChange: (content: LetterContent) => void
}

const EMPTY: LetterContent = {
  templateId: TEMPLATE_IDS.FRIENDLY_HOME_MOVER,
  senderName: "",
  senderAddress: "",
  personalMessage: "",
}

export function LetterEditor({ initial, onChange }: LetterEditorProps) {
  const [form, setForm] = useState<LetterContent>(initial ?? EMPTY)

  useEffect(() => {
    onChange(form)
  }, [form, onChange])

  function set(field: keyof Omit<LetterContent, "templateId">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const fields: Array<keyof Omit<LetterContent, "templateId">> = [
    "senderName",
    "senderAddress",
    "personalMessage",
  ]

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      {fields.map((field) => {
        const maxLen =
          field === "senderName"
            ? LIMITS.MAX_SENDER_NAME_CHARS
            : field === "senderAddress"
              ? LIMITS.MAX_SENDER_ADDRESS_CHARS
              : LIMITS.MAX_PERSONAL_MESSAGE_CHARS
        const value = form[field]
        const isTextarea = field === "senderAddress" || field === "personalMessage"

        return (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">{FIELD_LABELS[field]}</label>
            <p className="text-xs text-slate-500">{FIELD_HINTS[field]}</p>
            {isTextarea ? (
              <textarea
                value={value}
                onChange={(e) => set(field, e.target.value)}
                maxLength={maxLen}
                rows={field === "personalMessage" ? 5 : 3}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder={FIELD_HINTS[field]}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => set(field, e.target.value)}
                maxLength={maxLen}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={FIELD_HINTS[field]}
              />
            )}
            <span className="text-xs text-slate-400 text-right">
              {value.length}/{maxLen}
            </span>
          </div>
        )
      })}
    </form>
  )
}
