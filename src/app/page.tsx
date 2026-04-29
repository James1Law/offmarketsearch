import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-slate-900 tracking-tight">LetterDrop</span>
          <Link href="/map" className="text-sm text-indigo-600 font-medium hover:underline">
            Get started →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-indigo-50 to-white">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
          Off-market property search
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 max-w-2xl leading-tight">
          Write to homeowners before their house hits the market
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mb-8">
          Draw an area on the map, pick the houses you love, and we&apos;ll post a personal letter
          to each one for £2.50. No estate agent, no waiting list.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-lg text-base transition-colors"
        >
          Find houses near me →
        </Link>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-600 mb-8">
            Pay only for the letters you send. No subscription, no hidden fees.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {PRICING_DISPLAY.map((p) => (
              <div
                key={p.label}
                className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-indigo-600 mb-0.5">{p.price}</div>
                <div className="text-sm text-slate-500">{p.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-6">
            Letters addressed to &ldquo;The Homeowner&rdquo; — no personal data required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} LetterDrop · Letters posted within 1–2 business days
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
