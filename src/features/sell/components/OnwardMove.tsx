import { SELL_ONWARD_MOVE } from "../content"
import { onwardMovePartners } from "@/lib/referrals"
import { ReferralCard } from "./ReferralCard"

export function OnwardMove() {
  const partners = onwardMovePartners()
  if (partners.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-navy mb-1 pb-2 border-b border-sand">
        {SELL_ONWARD_MOVE.heading}
      </h2>
      <p className="text-sm text-navy-soft mt-3">{SELL_ONWARD_MOVE.standfirst}</p>
      <div className="grid sm:grid-cols-2 gap-3 mt-1">
        {partners.map((partner) => (
          <ReferralCard key={partner.id} partner={partner} />
        ))}
      </div>
    </section>
  )
}
