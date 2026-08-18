"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

const STEPS = [
  { href: "/map", label: "1. Find houses" },
  { href: "/refine", label: "2. Refine" },
  { href: "/letter", label: "3. Write letter" },
  { href: "/basket", label: "4. Review & pay" },
]

export function StepNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.href))

  return (
    <header className="border-b border-sand bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <Logo markClassName="w-6 h-6" textClassName="text-base" />
        </Link>
        {/* Narrow viewports get the current step only: the full trail wraps to
            four lines and swamps the header. */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {STEPS.map((step, i) => {
            const isPast = currentIndex > i
            const isCurrent = currentIndex === i
            return (
              <span key={step.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-navy-soft/40 px-1">›</span>}
                <span
                  className={
                    isCurrent
                      ? "font-semibold text-coral"
                      : isPast
                        ? "text-navy-soft"
                        : "text-navy-soft/60"
                  }
                >
                  {step.label}
                </span>
              </span>
            )
          })}
        </nav>
        <span className="md:hidden text-sm font-semibold text-coral truncate">
          {STEPS[currentIndex]?.label}
        </span>
      </div>
    </header>
  )
}
