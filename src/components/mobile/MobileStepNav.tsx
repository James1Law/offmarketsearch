"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const STEPS = [
  { href: "/m/map", label: "Pick" },
  { href: "/m/letter", label: "Write" },
  { href: "/m/basket", label: "Pay" },
]

export function MobileStepNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.href))
  const currentLabel = currentIndex >= 0 ? STEPS[currentIndex]?.label : null

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-4 h-12 flex items-center justify-between">
        <Link href="/m" className="font-semibold text-slate-900 text-sm tracking-tight">
          LetterDrop
        </Link>
        {currentIndex >= 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Step {currentIndex + 1} of {STEPS.length} · {currentLabel}
            </span>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <span
                  key={s.href}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                    i < currentIndex
                      ? "bg-indigo-300"
                      : i === currentIndex
                        ? "bg-indigo-600"
                        : "bg-slate-200"
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
