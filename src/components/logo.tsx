import { useId } from "react"

/**
 * House-with-open-envelope brand mark, matching the original artwork:
 * heavy overhanging round-capped roof, wide rounded diamond flap fused into
 * the roof/walls, layered translucent envelope flaps, warm coral gradient.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  const coral = `url(#${id}-coral)`
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-coral`} gradientUnits="userSpaceOnUse" x1="20" y1="4" x2="85" y2="100">
          <stop offset="0" stopColor="#f79a76" />
          <stop offset="0.5" stopColor="#f37a58" />
          <stop offset="1" stopColor="#ec6240" />
        </linearGradient>
        <linearGradient id={`${id}-env`} gradientUnits="userSpaceOnUse" x1="50" y1="46" x2="50" y2="90">
          <stop offset="0" stopColor="#fde3b8" />
          <stop offset="0.55" stopColor="#f9cf9a" />
          <stop offset="1" stopColor="#f6be82" />
        </linearGradient>
      </defs>
      {/* chimney — wide, tall, distinct */}
      <rect x="70" y="6" width="12" height="34" rx="3" fill={coral} />
      {/* house body: walls + rounded base, open at the top (tucks under the roof) */}
      <path
        d="M10.5 42V79a10.5 10.5 0 0 0 10.5 10.5h58A10.5 10.5 0 0 0 89.5 79V42"
        fill="#faf2ed"
        stroke={coral}
        strokeWidth="10"
      />
      {/* envelope: strokeless, bounded by walls/base/flap */}
      <rect x="11" y="46" width="78" height="44" rx="8" fill={`url(#${id}-env)`} />
      {/* layered translucent flaps: left, right, then bottom V */}
      <path d="M11 46 50 88 11 88Z" fill="#ffffff" opacity="0.26" />
      <path d="M89 46 50 88 89 88Z" fill="#ffffff" opacity="0.14" />
      <path d="M11 90 50 62 89 90Z" fill="#ffffff" opacity="0.18" />
      {/* open flap: wide rounded diamond fused into roof band and walls */}
      <path
        d="M59.32 24.07 77.68 41.93Q87 51 77.68 60.07L59.32 77.93Q50 87 40.68 77.93L22.32 60.07Q13 51 22.32 41.93L40.68 24.07Q50 15 59.32 24.07Z"
        fill="#faf2ed"
        stroke={coral}
        strokeWidth="10"
      />
      {/* heavy overhanging roof with rounded end caps */}
      <path
        d="M7 47 50 8l43 39"
        stroke={coral}
        strokeWidth="12.5"
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
