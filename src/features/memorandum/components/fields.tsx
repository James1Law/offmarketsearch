"use client"

import { useId, type ReactNode } from "react"

// `| undefined` on the optional props because exactOptionalPropertyTypes is on:
// callers pass `hint={condition ? "..." : undefined}`, which is otherwise an error.
interface BaseProps {
  label: string
  hint?: string | undefined
  /** Rendered as plain text instead of an input — the other party's to set. */
  readOnly?: boolean | undefined
}

const inputClass =
  "w-full text-sm border border-sand rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral"

/**
 * The hint is tied to the control with aria-describedby rather than nested
 * inside the <label>. Nesting it makes the hint part of the field's accessible
 * name, so a screen reader announces "Agreed price the price you have both
 * agreed in pounds" as the label — and anything matching on the name has to
 * know the hint too.
 */
function FieldShell({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string | undefined
  children: (describedBy: string | undefined) => ReactNode
}) {
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-navy">
        {label}
      </label>
      {children(hint ? hintId : undefined)}
      {hint && (
        <span id={hintId} className="text-[11px] text-navy-soft/80 leading-snug">
          {hint}
        </span>
      )}
    </div>
  )
}

/** Read-only fields render as text so they cannot be tabbed into or mistaken for editable. */
function ReadOnlyValue({ id, value }: { id: string; value: string }) {
  return (
    <span
      id={id}
      className="text-sm text-navy-soft bg-cream border border-sand rounded-lg px-3 py-2 min-h-[2.375rem] whitespace-pre-wrap break-words"
    >
      {value || "—"}
    </span>
  )
}

interface TextFieldProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  type?: "text" | "email" | "tel" | "date"
  placeholder?: string | undefined
  required?: boolean | undefined
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
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint}>
      {(describedBy) =>
        readOnly ? (
          <ReadOnlyValue id={id} value={value} />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder ?? ""}
            required={required ?? false}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        )
      }
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
  const id = useId()
  const remaining = maxLength - value.length
  return (
    <FieldShell id={id} label={label} hint={hint}>
      {(describedBy) =>
        readOnly ? (
          <ReadOnlyValue id={id} value={value} />
        ) : (
          <>
            <textarea
              id={id}
              value={value}
              maxLength={maxLength}
              rows={rows}
              placeholder={placeholder ?? ""}
              aria-describedby={describedBy}
              onChange={(e) => onChange(e.target.value)}
              className={inputClass}
            />
            {/* Only once it matters — a counter on an empty box is noise. */}
            {remaining < maxLength * 0.2 && (
              <span className="text-[11px] text-navy-soft/70">{remaining} characters left</span>
            )}
          </>
        )
      }
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
  const id = useId()
  const selected = options.find((o) => o.value === value)
  return (
    <FieldShell id={id} label={label} hint={hint}>
      {(describedBy) =>
        readOnly ? (
          <ReadOnlyValue id={id} value={selected?.label ?? ""} />
        ) : (
          <select
            id={id}
            value={value}
            aria-describedby={describedBy}
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
        )
      }
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
