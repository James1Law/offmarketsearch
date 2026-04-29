"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const STEPS = [
  { href: "/map", label: "1. Find houses" },
  { href: "/letter", label: "2. Write letter" },
  { href: "/basket", label: "3. Review & pay" },
]

export function StepNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.href))

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-900 tracking-tight">
          LetterDrop
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {STEPS.map((step, i) => {
            const isPast = currentIndex > i
            const isCurrent = currentIndex === i
            return (
              <span key={step.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300 px-1">›</span>}
                <span
                  className={
                    isCurrent
                      ? "font-semibold text-indigo-600"
                      : isPast
                        ? "text-slate-500"
                        : "text-slate-400"
                  }
                >
                  {step.label}
                </span>
              </span>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
