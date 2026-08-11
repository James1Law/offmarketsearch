"use client"

import { useState, useEffect } from "react"
import type { LetterContent } from "@/types"
import { LIMITS, TEMPLATE_IDS } from "@/lib/constants"
import { FIELD_LABELS, FIELD_HINTS, FIELD_PLACEHOLDERS } from "../templates/friendly-home-mover"

interface LetterEditorProps {
  initial: LetterContent | null
  onChange: (content: LetterContent) => void
}

const EMPTY: LetterContent = {
  templateId: TEMPLATE_IDS.FRIENDLY_HOME_MOVER,
  senderName: "",
  senderAddress: "",
  senderPhone: "",
  senderEmail: "",
  personalMessage: "",
}

type FieldKey = keyof Omit<LetterContent, "templateId">

interface FieldConfig {
  field: FieldKey
  maxLen: number
  kind: "input" | "textarea"
  inputType?: "text" | "tel" | "email"
  rows?: number
}

const FIELDS: FieldConfig[] = [
  { field: "senderName", maxLen: LIMITS.MAX_SENDER_NAME_CHARS, kind: "input" },
  { field: "senderAddress", maxLen: LIMITS.MAX_SENDER_ADDRESS_CHARS, kind: "textarea", rows: 3 },
  { field: "senderPhone", maxLen: LIMITS.MAX_SENDER_PHONE_CHARS, kind: "input", inputType: "tel" },
  {
    field: "senderEmail",
    maxLen: LIMITS.MAX_SENDER_EMAIL_CHARS,
    kind: "input",
    inputType: "email",
  },
  {
    field: "personalMessage",
    maxLen: LIMITS.MAX_PERSONAL_MESSAGE_CHARS,
    kind: "textarea",
    rows: 5,
  },
]

export function LetterEditor({ initial, onChange }: LetterEditorProps) {
  const [form, setForm] = useState<LetterContent>(initial ?? EMPTY)

  useEffect(() => {
    onChange(form)
  }, [form, onChange])

  function set(field: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      {FIELDS.map(({ field, maxLen, kind, inputType, rows }) => {
        const value = form[field] ?? ""

        return (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy">{FIELD_LABELS[field]}</label>
            <p className="text-xs text-navy-soft">{FIELD_HINTS[field]}</p>
            {kind === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => set(field, e.target.value)}
                maxLength={maxLen}
                rows={rows}
                className="text-base sm:text-sm border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
                placeholder={FIELD_PLACEHOLDERS[field]}
              />
            ) : (
              <input
                type={inputType ?? "text"}
                value={value}
                onChange={(e) => set(field, e.target.value)}
                maxLength={maxLen}
                className="text-base sm:text-sm border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder={FIELD_PLACEHOLDERS[field]}
              />
            )}
            <span className="text-xs text-navy-soft/70 text-right">
              {value.length}/{maxLen}
            </span>
          </div>
        )
      })}
    </form>
  )
}
