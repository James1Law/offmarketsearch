const CORAL = "#f4795b"
const FLAP_FILL = "#fdf2ec"
const ENVELOPE_FILL = "#fbd9ae"

/** House-with-open-envelope brand mark. Scales via the width/height you set on it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      {/* chimney */}
      <path
        d="M45 9h7v11h-7z"
        fill={CORAL}
      />
      {/* house shell */}
      <path
        d="M32 6.5 6.5 26.5V52a5.5 5.5 0 0 0 5.5 5.5h40a5.5 5.5 0 0 0 5.5-5.5V26.5Z"
        fill={FLAP_FILL}
        stroke={CORAL}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* envelope body */}
      <path d="M14 33h36v19H14Z" fill={ENVELOPE_FILL} stroke={CORAL} strokeWidth="4" strokeLinejoin="round" />
      {/* open flap — raised diamond */}
      <path
        d="M32 13 50 33 32 47 14 33Z"
        fill={FLAP_FILL}
        stroke={CORAL}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* envelope fold lines */}
      <path d="M14 52 30 41.5M50 52 34 41.5" stroke={CORAL} strokeWidth="4" strokeLinecap="round" />
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
