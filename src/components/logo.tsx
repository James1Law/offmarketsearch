import { useId } from "react"

/**
 * House-with-open-envelope brand mark, drawn to match the original artwork:
 * overhanging round-capped roof, rounded diamond flap fused into the roof,
 * strokeless gradient envelope with translucent fold overlays.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  const coral = `url(#${id}-coral)`
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-coral`} gradientUnits="userSpaceOnUse" x1="25" y1="5" x2="80" y2="100">
          <stop offset="0" stopColor="#f68d6d" />
          <stop offset="1" stopColor="#ee6644" />
        </linearGradient>
        <linearGradient id={`${id}-env`} gradientUnits="userSpaceOnUse" x1="50" y1="48" x2="50" y2="91">
          <stop offset="0" stopColor="#fcdfb2" />
          <stop offset="1" stopColor="#f5bd80" />
        </linearGradient>
      </defs>
      {/* chimney */}
      <rect x="72" y="12" width="10" height="32" rx="3" fill={coral} />
      {/* house body: walls + rounded base, open at the top (tucks under the roof) */}
      <path
        d="M14.5 44V82a9.5 9.5 0 0 0 9.5 9.5h52a9.5 9.5 0 0 0 9.5-9.5V44"
        fill="#faf2ed"
        stroke={coral}
        strokeWidth="9.5"
      />
      {/* envelope: strokeless, bounded by walls/base/flap */}
      <rect x="15" y="48" width="70" height="43" rx="7" fill={`url(#${id}-env)`} />
      {/* translucent fold overlays */}
      <path d="M15 48 50 86 15 86Z" fill="#ffffff" opacity="0.22" />
      <path d="M85 48 50 86 85 86Z" fill="#ffffff" opacity="0.12" />
      {/* open flap: rounded diamond, top corner fused into the roof band */}
      <path
        d="M55.66 21.66 78.34 44.34Q84 50 78.34 55.66L55.66 78.34Q50 84 44.34 78.34L21.66 55.66Q16 50 21.66 44.34L44.34 21.66Q50 16 55.66 21.66Z"
        fill="#faf2ed"
        stroke={coral}
        strokeWidth="8.5"
      />
      {/* overhanging roof with rounded end caps */}
      <path
        d="M8 51 50 9l42 42"
        stroke={coral}
        strokeWidth="11"
        strokeLinecap="round"
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
