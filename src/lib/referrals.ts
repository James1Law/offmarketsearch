/**
 * Referral partners surfaced on /sell.
 *
 * Everything here is a paid introduction, so every entry carries its own
 * disclosure and renders with rel="sponsored nofollow". The CAP Code requires
 * a commercial relationship to be obvious to the reader before they click, and
 * this page's usefulness depends on being straight with people who are about to
 * make the largest transaction of their lives.
 *
 * We introduce, we do not advise: copy should signpost, never recommend.
 */

/**
 * Where a partner sits on the page. Most attach to a numbered step in the
 * guide; mortgages and removals belong to the reader's *next* move rather than
 * to the sale, so they sit in a closing block instead.
 */
export type ReferralPlacement = { kind: "step"; step: number } | { kind: "onward-move" }

export interface ReferralPartner {
  id: string
  placement: ReferralPlacement
  name: string
  /** What the partner does for the seller, in the seller's terms. */
  offer: string
  cta: string
  url: string
  /** Shown with the link. Must make the commercial relationship obvious. */
  disclosure: string
  /**
   * False until someone has confirmed both that this is the right company and
   * that the URL is the tracked referral link. Unverified partners never
   * render — sending a homeowner to the wrong solicitor is worse than showing
   * them no solicitor at all.
   */
  verified: boolean
}

export const REFERRAL_PARTNERS: readonly ReferralPartner[] = [
  {
    id: "esurv-valuation",
    placement: { kind: "step", step: 2 },
    name: "e.surv Chartered Surveyors",
    offer:
      "An RICS-regulated valuation of your home, so you know what it's worth before you start negotiating.",
    cta: "Get a valuation quote",
    url: "https://www.esurv.co.uk/",
    disclosure: "We're paid a fee if you book a survey with e.surv. It doesn't change what you pay.",
    verified: true,
  },
  {
    id: "opendoor-conveyancing",
    placement: { kind: "step", step: 6 },
    name: "Open Door Legal",
    offer: "Conveyancing for the legal side of your sale, covering England and Wales.",
    cta: "Get a conveyancing quote",
    // Best match found for "Opendoor" conveyancing, but unconfirmed: a search
    // for the trading name also surfaced an SRA entry for Open Door (Legal
    // Services) Ltd whose licence ceased in 2018, and it could not be checked
    // directly from here. Confirm the firm, its current regulator and the
    // tracked referral URL, then flip verified to true.
    url: "https://opendoorlegal.co.uk/",
    disclosure:
      "We're paid a fee if your sale completes with Open Door. It doesn't change what you pay.",
    verified: false,
  },
  {
    id: "landc-mortgage",
    placement: { kind: "onward-move" },
    name: "L&C Mortgages",
    offer:
      "Fee-free mortgage advice across the market, for the place you're buying next. L&C are paid by the lender, not by you.",
    cta: "Get mortgage advice",
    url: "https://www.landc.co.uk/",
    disclosure:
      "L&C charge you no broker fee — they're paid by the lender. We're paid a fee if you take advice from them.",
    verified: true,
  },
  {
    id: "anyvan-removals",
    placement: { kind: "onward-move" },
    name: "AnyVan",
    offer: "Quotes from local removals firms for moving day, once your completion date is set.",
    cta: "Get removals quotes",
    url: "https://www.anyvan.com/removals/home-removals",
    disclosure:
      "We're paid a fee if you book your move through AnyVan. It doesn't change what you pay.",
    verified: true,
  },
] as const

/** Only verified partners are ever shown. See ReferralPartner.verified. */
export function partnersForStep(step: number): ReferralPartner[] {
  return REFERRAL_PARTNERS.filter(
    (p) => p.verified && p.placement.kind === "step" && p.placement.step === step,
  )
}

export function onwardMovePartners(): ReferralPartner[] {
  return REFERRAL_PARTNERS.filter((p) => p.verified && p.placement.kind === "onward-move")
}

/** Shown once, near the top, so the reader knows before they read the steps. */
export const REFERRAL_DISCLOSURE =
  "Some links on this page are paid referrals: if you use one of the companies we suggest, we may earn a fee. It never costs you more, we only list services we'd point a friend towards, and you're free to use anyone you like."
