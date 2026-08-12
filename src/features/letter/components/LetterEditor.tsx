"use client"

import { useState, useEffect } from "react"
import type { LetterContent } from "@/types"
import { LIMITS, TEMPLATE_IDS } from "@/lib/constants"
import {
  FIELD_LABELS,
  FIELD_HINTS,
  FIELD_PLACEHOLDERS,
  POSITION_OPTIONS,
  FUNDING_OPTIONS,
  TIMESCALE_OPTIONS,
  MOTIVATION_OPTIONS,
  type TextFieldKey,
} from "../templates/friendly-home-mover"

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
}

interface TextFieldConfig {
  field: TextFieldKey
  maxLen: number
  kind: "input" | "textarea"
  inputType?: "text" | "tel" | "email"
  rows?: number
}

const TEXT_FIELDS: TextFieldConfig[] = [
  { field: "senderName", maxLen: LIMITS.MAX_SENDER_NAME_CHARS, kind: "input" },
  { field: "senderAddress", maxLen: LIMITS.MAX_SENDER_ADDRESS_CHARS, kind: "textarea", rows: 3 },
  { field: "senderPhone", maxLen: LIMITS.MAX_SENDER_PHONE_CHARS, kind: "input", inputType: "tel" },
  {
    field: "senderEmail",
    maxLen: LIMITS.MAX_SENDER_EMAIL_CHARS,
    kind: "input",
    inputType: "email",
  },
]

type SelectFieldKey = "motivation" | "position" | "funding" | "timescale"

interface SelectFieldConfig {
  field: SelectFieldKey
  label: string
  hint: string
  options: ReadonlyArray<{ value: string; label: string }>
}

const SELECT_FIELDS: SelectFieldConfig[] = [
  {
    field: "motivation",
    label: "Your reason for moving",
    hint: "Why you're looking for a new home",
    options: MOTIVATION_OPTIONS,
  },
  {
    field: "position",
    label: "Your selling position",
    hint: "Where you are with your current home",
    options: POSITION_OPTIONS,
  },
  {
    field: "funding",
    label: "How you're buying",
    hint: "How you'd fund the purchase",
    options: FUNDING_OPTIONS,
  },
  {
    field: "timescale",
    label: "Your timescale",
    hint: "How soon you're hoping to move",
    options: TIMESCALE_OPTIONS,
  },
]

export function LetterEditor({ initial, onChange }: LetterEditorProps) {
  const [form, setForm] = useState<LetterContent>(initial ?? EMPTY)

  useEffect(() => {
    onChange(form)
  }, [form, onChange])

  function setText(field: TextFieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setSelect(field: SelectFieldKey, value: string) {
    setForm((prev) => {
      const next = { ...prev }
      if (value === "") {
        delete next[field]
      } else {
        // Values come from the option lists above, so the cast is safe.
        next[field] = value as never
      }
      return next
    })
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      {TEXT_FIELDS.map(({ field, maxLen, kind, inputType, rows }) => {
        const value = form[field] ?? ""

        return (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy">{FIELD_LABELS[field]}</label>
            <p className="text-xs text-navy-soft">{FIELD_HINTS[field]}</p>
            {kind === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => setText(field, e.target.value)}
                maxLength={maxLen}
                rows={rows}
                className="text-base sm:text-sm border border-sand rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
                placeholder={FIELD_PLACEHOLDERS[field]}
              />
            ) : (
              <input
                type={inputType ?? "text"}
                value={value}
                onChange={(e) => setText(field, e.target.value)}
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

      <div className="border-t border-sand pt-4">
        <h3 className="text-sm font-semibold text-navy">Your situation</h3>
        <p className="text-xs text-navy-soft mt-0.5 mb-4">
          All optional — anything you pick is written into the letter for you
        </p>
        <div className="flex flex-col gap-4">
          {SELECT_FIELDS.map(({ field, label, hint, options }) => (
            <div key={field} className="flex flex-col gap-1">
              <label htmlFor={`letter-${field}`} className="text-sm font-medium text-navy">
                {label}
              </label>
              <p className="text-xs text-navy-soft">{hint}</p>
              <select
                id={`letter-${field}`}
                value={form[field] ?? ""}
                onChange={(e) => setSelect(field, e.target.value)}
                className="text-base sm:text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
              >
                <option value="">Don&apos;t mention</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}
