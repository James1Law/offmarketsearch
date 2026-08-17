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

export interface ReferralPartner {
  id: string
  /** The step in the /sell guide this belongs beside. */
  stepNumber: number
  name: string
  /** What the partner does for the seller, in the seller's terms. */
  offer: string
  cta: string
  url: string
  /** Shown with the link. Must make the commercial relationship obvious. */
  disclosure: string
}

export const REFERRAL_PARTNERS: readonly ReferralPartner[] = [
  {
    id: "eserve-valuation",
    stepNumber: 2,
    name: "eServe Chartered Surveyors",
    offer:
      "An RICS-accredited valuation of your home, so you know what it is worth before you negotiate.",
    cta: "Get a valuation quote",
    // TODO: replace with the tracked eServe referral URL before launch.
    url: "https://www.eserve.co.uk/",
    disclosure: "We're paid a fee if you instruct eServe. It doesn't change what you pay.",
  },
  {
    id: "opendoor-conveyancing",
    stepNumber: 6,
    name: "Open Door Conveyancing",
    offer: "Fixed-fee conveyancing for the legal side of your sale.",
    cta: "Get a conveyancing quote",
    // TODO: replace with the tracked Open Door referral URL before launch.
    url: "https://www.opendoorconveyancing.co.uk/",
    disclosure: "We're paid a fee if your sale completes with Open Door. It doesn't change what you pay.",
  },
] as const

export function partnersForStep(stepNumber: number): ReferralPartner[] {
  return REFERRAL_PARTNERS.filter((p) => p.stepNumber === stepNumber)
}

/** Shown once, near the top, so the reader knows before they read the steps. */
export const REFERRAL_DISCLOSURE =
  "Some links on this page are paid referrals: if you use one of the companies we suggest, we may earn a fee. It never costs you more, we only list services we'd point a friend towards, and you're free to use anyone you like."
