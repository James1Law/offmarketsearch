import { useId } from "react"

const CORAL = "#f4795b"
const FLAP_FILL = "#fbf1ea"
const ENVELOPE_TOP = "#fbdfb6"
const ENVELOPE_BOTTOM = "#f8c68b"

/** House-with-open-envelope brand mark. Scales via the width/height you set on it. */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ENVELOPE_TOP} />
          <stop offset="1" stopColor={ENVELOPE_BOTTOM} />
        </linearGradient>
      </defs>
      {/* chimney */}
      <rect x="44.5" y="7" width="9" height="14" rx="2" fill={CORAL} />
      {/* house shell */}
      <path
        d="M32 5.5 6.5 26.5V52a5.5 5.5 0 0 0 5.5 5.5h40a5.5 5.5 0 0 0 5.5-5.5V26.5Z"
        fill={FLAP_FILL}
        stroke={CORAL}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      {/* envelope body */}
      <rect
        x="13.5"
        y="33"
        width="37"
        height="20"
        rx="3"
        fill={`url(#${gradientId})`}
        stroke={CORAL}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* open flap — full-width rounded diamond, tip dipping into the envelope */}
      <path
        d="M32 16 53 34 32 52 11 34Z"
        fill={FLAP_FILL}
        stroke={CORAL}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Full lock-up: mark + "Offline.homes" wordmark with the coral dot. */
export function Logo({ markClassName = "w-7 h-7", textClassName = "text-lg" }: { markClassName?: string; textClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={markClassName} />
      <span className={`font-semibold tracking-tight text-navy leading-none ${textClassName}`}>
        Offline<span className="text-coral">.</span>homes
      </span>
    </span>
  )
}
