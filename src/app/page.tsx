import Link from "next/link"
import { Logo, LogoMark } from "@/components/logo"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-sand bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />
          <Link href="/map" className="text-sm text-coral font-medium hover:underline">
            Get started →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-cream">
        <LogoMark className="w-16 h-16 mb-6" />
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-coral-soft text-coral-dark text-xs font-semibold uppercase tracking-wider">
          Find homes before they&apos;re for sale
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-5 max-w-2xl leading-tight">
          Write to homeowners before their house hits the market
        </h1>
        <p className="text-lg text-navy-soft max-w-xl mb-8">
          Draw an area on the map, pick the houses you love, and we&apos;ll post a personal letter
          to each one for £2.50. No estate agent, no waiting list.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark text-white font-semibold px-8 py-3.5 rounded-lg text-base transition-colors"
        >
          Find houses near me →
        </Link>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-navy mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-coral-soft text-coral-dark text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-navy mb-2">{step.title}</h3>
                <p className="text-sm text-navy-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-16 px-4 bg-cream border-t border-sand">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy mb-3">Simple, transparent pricing</h2>
          <p className="text-navy-soft mb-8">
            Pay only for the letters you send. No subscription, no hidden fees.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {PRICING_DISPLAY.map((p) => (
              <div
                key={p.label}
                className="bg-white border border-sand rounded-xl px-6 py-4 text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-coral mb-0.5">{p.price}</div>
                <div className="text-sm text-navy-soft">{p.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-navy-soft/70 mt-6">
            Letters addressed to &ldquo;The Homeowner&rdquo; — no personal data required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand py-6 px-4 text-center text-sm text-navy-soft/70 bg-cream">
        © {new Date().getFullYear()} Offline.homes · Letters posted within 1–2 business days
      </footer>
    </div>
  )
}

const HOW_STEPS = [
  {
    number: "1",
    title: "Pick houses on the map",
    description:
      "Draw a box around the street or area you love. We'll show you every address inside it.",
  },
  {
    number: "2",
    title: "Write your letter",
    description:
      "Use our friendly template to explain why you're writing. We handle the formatting.",
  },
  {
    number: "3",
    title: "We post it for you",
    description:
      "Pay securely and we'll print and post a real letter to each house — from £2.50 each.",
  },
]

const PRICING_DISPLAY = [
  { label: "per letter", price: "£2.50" },
  { label: "5 letters", price: "£14.99" },
  { label: "10 letters", price: "£24.99" },
  { label: "25 letters", price: "£49.99" },
]
