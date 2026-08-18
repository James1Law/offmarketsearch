import { SELL_SECTIONS } from "../content"
import { partnersForStep } from "@/lib/referrals"
import { ReferralCard } from "./ReferralCard"

export function SellSteps() {
  return (
    <>
      {SELL_SECTIONS.map((section) => (
        <section key={section.id} className="mt-10 first:mt-0">
          {section.heading && (
            <h2 className="text-xl font-bold text-navy mb-6 pb-2 border-b border-sand">
              {section.heading}
            </h2>
          )}
          <ol className="flex flex-col gap-7">
            {section.steps.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span
                  aria-hidden
                  className="shrink-0 w-9 h-9 rounded-full bg-coral-soft text-coral-dark font-bold flex items-center justify-center"
                >
                  {step.number}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-navy leading-snug">{step.title}</h3>
                  {step.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-navy-soft mt-1.5 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {partnersForStep(step.number).map((partner) => (
                    <ReferralCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  )
}
