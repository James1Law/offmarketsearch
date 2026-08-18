import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { MemorandumConfirm } from "@/features/memorandum/components/MemorandumConfirm"

export const metadata: Metadata = {
  title: "Confirm a memorandum of sale — Offline.homes",
  description:
    "Review the terms your seller has set, add your details and confirm the memorandum of sale.",
  // The document lives in the URL fragment, so every one of these links is a
  // different private document. None of them belong in an index.
  robots: { index: false, follow: false },
}

export default function ConfirmPage() {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <header className="border-b border-sand bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <Link href="/sell" className="text-sm text-coral font-medium hover:underline">
            Selling guide →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <MemorandumConfirm />
      </main>

      <footer className="border-t border-sand py-6 px-4 text-center text-sm text-navy-soft/70">
        © {new Date().getFullYear()} Offline.homes
      </footer>
    </div>
  )
}
