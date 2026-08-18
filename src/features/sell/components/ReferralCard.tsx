import type { ReferralPartner } from "@/lib/referrals"

/**
 * A paid introduction. The disclosure sits inside the card, above the fold of
 * the click, so nobody follows the link without knowing what it is.
 */
export function ReferralCard({ partner }: { partner: ReferralPartner }) {
  return (
    <div className="mt-3 rounded-xl border border-sand bg-cream/70 px-4 py-3">
      <p className="text-sm font-semibold text-navy">{partner.name}</p>
      <p className="text-sm text-navy-soft mt-1 leading-relaxed">{partner.offer}</p>
      <a
        href={partner.url}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-coral hover:text-coral-dark hover:underline"
      >
        {partner.cta} →
      </a>
      <p className="text-[11px] text-navy-soft/70 mt-2">{partner.disclosure}</p>
    </div>
  )
}
