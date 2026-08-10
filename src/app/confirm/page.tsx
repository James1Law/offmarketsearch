import Link from "next/link"
import { StepNav } from "@/components/step-nav"

export const metadata = { title: "Letters sent! — Offline.homes" }

const NEXT_STEPS = [
  {
    icon: "1",
    title: "We print your letter",
    description: "Your letter is formatted and printed on quality paper within 1 business day.",
  },
  {
    icon: "2",
    title: "Addressed & posted",
    description:
      'Each copy is addressed to "The Homeowner" and posted via Royal Mail First Class.',
  },
  {
    icon: "3",
    title: "Homeowners receive it",
    description:
      "Most letters arrive within 1–3 working days. Responses come directly to the address you gave.",
  },
]

export default function ConfirmPage() {
  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <StepNav />
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-12">
        <div className="max-w-xl w-full flex flex-col gap-8">
          {/* Success card */}
          <div className="bg-white border border-sand rounded-2xl px-6 py-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 text-2xl flex items-center justify-center mx-auto mb-4">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Your letters are on their way!</h1>
            <p className="text-navy-soft text-sm">
              In a real order, your letters would now be printed and posted. This is a demo — no
              payment was taken and no letters were sent.
            </p>
          </div>

          {/* What happens next */}
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">What happens next</h2>
            <div className="flex flex-col gap-3">
              {NEXT_STEPS.map((step) => (
                <div
                  key={step.title}
                  className="bg-white border border-sand rounded-xl px-4 py-4 flex items-start gap-4"
                >
                  <span className="w-7 h-7 rounded-full bg-coral-soft text-coral-dark text-xs font-bold flex items-center justify-center shrink-0">{step.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-navy">{step.title}</div>
                    <div className="text-sm text-navy-soft mt-0.5">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link
              href="/map"
              className="w-full text-center py-2.5 rounded-lg font-semibold text-sm bg-coral hover:bg-coral-dark text-white transition-colors"
            >
              Send letters to another area
            </Link>
            <Link
              href="/"
              className="w-full text-center py-2.5 rounded-lg font-semibold text-sm border border-sand hover:bg-cream text-navy transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
