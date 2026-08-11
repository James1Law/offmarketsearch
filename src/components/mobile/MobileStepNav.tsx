"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

const STEPS = [
  { href: "/m/map", label: "Pick" },
  { href: "/m/refine", label: "Refine" },
  { href: "/m/letter", label: "Write" },
  { href: "/m/basket", label: "Pay" },
]

export function MobileStepNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.href))
  const currentLabel = currentIndex >= 0 ? STEPS[currentIndex]?.label : null

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-sand">
      <div className="px-4 h-12 flex items-center justify-between">
        <Link href="/m">
          <Logo markClassName="w-5 h-5" textClassName="text-sm" />
        </Link>
        {currentIndex >= 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-soft">
              Step {currentIndex + 1} of {STEPS.length} · {currentLabel}
            </span>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <span
                  key={s.href}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                    i < currentIndex
                      ? "bg-coral-soft"
                      : i === currentIndex
                        ? "bg-coral"
                        : "bg-sand"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
