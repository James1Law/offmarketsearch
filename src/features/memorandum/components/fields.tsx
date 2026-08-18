"use client"

import type { ReactNode } from "react"

// `| undefined` on the optional props because exactOptionalPropertyTypes is on:
// callers pass `hint={condition ? "..." : undefined}`, which is otherwise an error.
interface BaseProps {
  label: string
  hint?: string | undefined
  /** Rendered as plain text instead of an input — the other party's to set. */
  readOnly?: boolean | undefined
}

interface TextFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  type?: "text" | "email" | "tel" | "date"
  placeholder?: string | undefined
  required?: boolean | undefined
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string | undefined
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-navy">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-navy-soft/80 leading-snug">{hint}</span>}
    </label>
  )
}

const inputClass =
  "w-full text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral disabled:bg-cream disabled:text-navy-soft"

/** Read-only fields render as text so they cannot be tabbed into or mistaken for editable. */
function ReadOnlyValue({ value }: { value: string }) {
  return (
    <span className="text-sm text-navy-soft bg-cream border border-sand rounded-lg px-3 py-2 min-h-[2.375rem] whitespace-pre-wrap break-words">
      {value || "—"}
    </span>
  )
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  maxLength,
  type = "text",
  placeholder,
  required,
  readOnly,
}: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      {readOnly ? (
        <ReadOnlyValue value={value} />
      ) : (
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder ?? ""}
          required={required ?? false}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </FieldShell>
  )
}

interface TextAreaFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  rows?: number | undefined
  placeholder?: string | undefined
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  maxLength,
  rows = 3,
  placeholder,
  readOnly,
}: TextAreaFieldProps) {
  const remaining = maxLength - value.length
  return (
    <FieldShell label={label} hint={hint}>
      {readOnly ? (
        <ReadOnlyValue value={value} />
      ) : (
        <>
          <textarea
            value={value}
            maxLength={maxLength}
            rows={rows}
            placeholder={placeholder ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {/* Only once it matters — a counter on an empty box is noise. */}
          {remaining < maxLength * 0.2 && (
            <span className="text-[11px] text-navy-soft/70">{remaining} characters left</span>
          )}
        </>
      )}
    </FieldShell>
  )
}

interface SelectFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  placeholder: string
}

export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder,
  readOnly,
}: SelectFieldProps) {
  if (readOnly) {
    const selected = options.find((o) => o.value === value)
    return (
      <FieldShell label={label} hint={hint}>
        <ReadOnlyValue value={selected?.label ?? ""} />
      </FieldShell>
    )
  }
  return (
    <FieldShell label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export function FieldGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-navy mb-1">{heading}</legend>
      {children}
    </fieldset>
  )
}
