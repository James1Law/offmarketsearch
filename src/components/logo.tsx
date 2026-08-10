import Image from "next/image"

/**
 * House-with-open-envelope brand mark — the original Canva artwork
 * (public/brand/mark.png, 668px, transparent background).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      width={128}
      height={128}
      className={className}
      priority
    />
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
