import Link from "next/link"
import { LogoMark } from "@/components/logo"

export const metadata = { title: "Offline.homes — Write to homeowners near you" }

const HOW_STEPS = [
  {
    number: "1",
    title: "Pick houses on the map",
    description: "Draw a box around your area. We'll show every address inside it.",
  },
  {
    number: "2",
    title: "Write your letter",
    description: "Use our friendly template — we handle the formatting.",
  },
  {
    number: "3",
    title: "We post it for you",
    description: "Pay securely and we'll print and post a real letter to each home.",
  },
]

const PRICING_DISPLAY = [
  { label: "per letter", price: "£2.50" },
  { label: "5 letters", price: "£14.99" },
  { label: "10 letters", price: "£24.99" },
  { label: "25 letters", price: "£49.99" },
]

export default function MobileHomePage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="px-5 pt-10 pb-12 text-center bg-cream">
        <LogoMark className="w-12 h-12 mx-auto mb-4" />
        <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-coral-soft text-coral-dark text-[10px] font-semibold uppercase tracking-wider">
          Find homes before they&apos;re for sale
        </span>
        <h1 className="text-2xl font-bold text-navy mb-3 leading-tight">
          Write to homeowners before their house hits the market
        </h1>
        <p className="text-sm text-navy-soft mb-7">
          Draw an area on the map, pick the houses you love, and we&apos;ll post a personal letter to
          each one for £2.50.
        </p>
        <Link
          href="/m/map"
          className="inline-flex items-center justify-center w-full bg-coral active:bg-coral-dark text-white font-semibold py-3.5 rounded-xl text-base"
        >
          Find houses near me →
        </Link>
      </section>

      {/* How it works */}
      <section className="px-5 py-10 bg-white">
        <h2 className="text-base font-bold text-navy mb-5">How it works</h2>
        <ol className="flex flex-col gap-4">
          {HOW_STEPS.map((step) => (
            <li key={step.number} className="flex items-start gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-coral-soft text-coral-dark text-sm font-bold flex items-center justify-center">
                {step.number}
              </span>
              <div>
                <div className="text-sm font-semibold text-navy">{step.title}</div>
                <div className="text-sm text-navy-soft mt-0.5">{step.description}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section className="px-5 py-10 bg-cream border-t border-sand">
        <h2 className="text-base font-bold text-navy mb-1">Simple pricing</h2>
        <p className="text-sm text-navy-soft mb-5">Pay only for the letters you send.</p>
        <div className="grid grid-cols-2 gap-3">
          {PRICING_DISPLAY.map((p) => (
            <div
              key={p.label}
              className="bg-white border border-sand rounded-xl px-4 py-3 text-center"
            >
              <div className="text-lg font-bold text-coral">{p.price}</div>
              <div className="text-xs text-navy-soft">{p.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-navy-soft/70 mt-4 text-center">
          Letters addressed to &ldquo;The Homeowner&rdquo; — no personal data required.
        </p>
      </section>

      <footer className="px-5 py-6 text-center text-xs text-navy-soft/70 border-t border-sand bg-cream">
        © {new Date().getFullYear()} Offline.homes · Posted within 1–2 business days
      </footer>
    </div>
  )
}
