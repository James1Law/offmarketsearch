import Link from "next/link"

export const metadata = { title: "Letters sent! — LetterDrop" }

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

export default function MobileConfirmPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-50 px-4 py-8 gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 text-xl flex items-center justify-center mx-auto mb-3">
          ✓
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Your letters are on their way!</h1>
        <p className="text-slate-600 text-sm">
          In a real order, your letters would now be printed and posted. This is a demo — no
          payment was taken and no letters were sent.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">What happens next</h2>
        <div className="flex flex-col gap-2.5">
          {NEXT_STEPS.map((step) => (
            <div
              key={step.title}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                {step.icon}
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href="/m/map"
          className="w-full text-center py-3 rounded-xl font-semibold text-sm bg-indigo-600 active:bg-indigo-700 text-white"
        >
          Send letters to another area
        </Link>
        <Link
          href="/m"
          className="w-full text-center py-3 rounded-xl font-semibold text-sm border border-slate-300 active:bg-slate-50 text-slate-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
