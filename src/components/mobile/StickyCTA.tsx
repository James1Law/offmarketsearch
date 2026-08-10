import type { ReactNode } from "react"

interface StickyCTAProps {
  children: ReactNode
  /** Optional extra content above the main CTA (e.g. a small disclaimer). */
  hint?: ReactNode
}

export function StickyCTA({ children, hint }: StickyCTAProps) {
  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-sand px-4 pt-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {hint && <div className="text-center mb-2">{hint}</div>}
      {children}
    </div>
  )
}
