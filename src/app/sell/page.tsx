import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { SellSteps } from "@/features/sell/components/SellSteps"
import { OnwardMove } from "@/features/sell/components/OnwardMove"
import { SELL_INTRO, SELL_STEPS, SELL_DISCLAIMER } from "@/features/sell/content"
import { REFERRAL_DISCLOSURE } from "@/lib/referrals"

const TITLE = "Selling your home without an estate agent"
const DESCRIPTION =
  "Someone has approached you about buying your home? You don't need an estate agent. A step-by-step guide to agreeing the sale, instructing a conveyancer and completing privately in England and Wales."

export const metadata: Metadata = {
  title: `${TITLE} — Offline.homes`,
  description: DESCRIPTION,
  alternates: { canonical: "/sell" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
  },
}

/**
 * Every letter we post ends by pointing homeowners here
 * (see friendly-home-mover.ts), so this page is part of the product, not
 * marketing around it. It also stands alone for private buyers and sellers who
 * never touched the letter service, which is why it is a plain server-rendered
 * page with structured data rather than an app route.
 */
export default function SellPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <script
        type="application/ld+json"
        // Static, authored above — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildHowToJsonLd()) }}
      />

      <header className="border-b border-sand bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/map" className="text-sm text-coral font-medium hover:underline">
            Find a home →
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-cream border-b border-sand px-4 py-14">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block mb-4 px-3 py-1 rounded-full bg-coral-soft text-coral-dark text-xs font-semibold uppercase tracking-wider">
              {SELL_INTRO.eyebrow}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4 leading-tight">
              {SELL_INTRO.heading}
            </h1>
            <p className="text-lg text-navy-soft leading-relaxed">{SELL_INTRO.standfirst}</p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-xs text-navy-soft/80 bg-cream border border-sand rounded-lg px-4 py-3 mb-10 leading-relaxed">
            {REFERRAL_DISCLOSURE}
          </p>

          <SellSteps />

          <OnwardMove />

          <div className="mt-12 rounded-xl border border-sand bg-cream px-5 py-5">
            <h2 className="font-semibold text-navy">Free memorandum of sale</h2>
            <p className="text-sm text-navy-soft mt-1.5 leading-relaxed">
              Step 5 needs a memorandum of sale — the short document that records what you and
              your buyer have agreed. Fill one out, send it to your buyer to confirm, and both of
              you get a PDF to pass to your conveyancers.
            </p>
            <p className="text-xs text-navy-soft/80 mt-2 leading-relaxed">
              Free, no account needed, and nothing you type is stored on our servers.
            </p>
            <Link
              href="/memorandum"
              className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-coral hover:text-coral-dark hover:underline"
            >
              Create a memorandum of sale →
            </Link>
          </div>

          <p className="text-xs text-navy-soft/70 mt-10 leading-relaxed">{SELL_DISCLAIMER}</p>
        </div>
      </main>

      <footer className="border-t border-sand py-6 px-4 text-center text-sm text-navy-soft/70 bg-cream">
        © {new Date().getFullYear()} Offline.homes ·{" "}
        <Link href="/" className="hover:underline">
          Home
        </Link>
      </footer>
    </div>
  )
}

/**
 * HowTo structured data. Organic search is the point of this page, and the
 * steps are already modelled as data, so the markup stays in step with the copy.
 */
function buildHowToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: TITLE,
    description: DESCRIPTION,
    step: SELL_STEPS.map((step) => ({
      "@type": "HowToStep",
      position: step.number,
      name: step.title,
      text: step.body.join(" "),
    })),
  }
}
