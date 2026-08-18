import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { MemorandumBuilder } from "@/features/memorandum/components/MemorandumBuilder"

const TITLE = "Free memorandum of sale template"
const DESCRIPTION =
  "Fill out a memorandum of sale with your buyer and send it to your conveyancers. Free, no account needed, and nothing is stored on our servers."

export const metadata: Metadata = {
  title: `${TITLE} — Offline.homes`,
  description: DESCRIPTION,
  alternates: { canonical: "/memorandum" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
}

/**
 * One responsive page rather than a desktop/mobile pair. The rest of the app
 * splits at /m/*, but this is a long form, and two copies of a long form is
 * where bugs breed — see docs/PLAN_MEMORANDUM_OF_SALE.md §9.
 */
export default function MemorandumPage() {
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

      <main className="flex-1">
        <section className="border-b border-sand px-4 py-10 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-coral-soft text-coral-dark text-xs font-semibold uppercase tracking-wider">
              Free · No account needed
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-3 leading-tight">
              Memorandum of sale
            </h1>
            <p className="text-lg text-navy-soft leading-relaxed">
              The short document that records what you and your buyer have agreed. Fill it in,
              send it to your buyer to confirm, then pass the finished copy to both conveyancers.
            </p>
            <p className="text-xs text-navy-soft/80 mt-4 leading-relaxed">
              Everything you type stays in your browser and travels inside the link you share.
              Nothing is stored on our servers.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <MemorandumBuilder />
        </div>
      </main>

      <footer className="border-t border-sand py-6 px-4 text-center text-sm text-navy-soft/70">
        © {new Date().getFullYear()} Offline.homes ·{" "}
        <Link href="/sell" className="hover:underline">
          Selling without an agent
        </Link>
      </footer>
    </div>
  )
}
