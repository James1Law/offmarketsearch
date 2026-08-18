import { z } from "zod"
import { BuyerPositionSchema, FundingTypeSchema } from "./index"
import type { BuyerPosition, FundingType } from "./index"

// ---------------------------------------------------------------------------
// Memorandum of sale.
//
// This document is full of named individuals, which CLAUDE.md's GDPR rule
// permits precisely because every value here is typed in by the parties
// themselves — see "GDPR — Mode A only, for letters". Nothing is sourced about
// a third party, and the completed document travels in a URL fragment, so it
// never reaches our server.
//
// Every object is .strict(): the payload arrives from a URL fragment, which
// anyone can craft, so an unexpected key is a rejection rather than something
// that flows through untouched.
// ---------------------------------------------------------------------------

/**
 * Caps keep a single field from being absurd. They do NOT bound the length of
 * the share link — ordinary prose compresses about 2:1 but pathological input
 * does not, so the real guard is the length check at generate time in
 * `share-link.ts`. See docs/PLAN_MEMORANDUM_OF_SALE.md §2.
 */
export const MEMORANDUM_LIMITS = {
  PROPERTY_ADDRESS: 200,
  POSTCODE: 10,
  PARTY_NAME: 120,
  EMAIL: 100,
  PHONE: 30,
  PARTY_ADDRESS: 300,
  CONVEYANCER_FIRM: 120,
  CONVEYANCER_CONTACT: 100,
  INCLUSIONS: 500,
  EXCLUSIONS: 300,
  EXTRAS: 300,
  NOTES: 600,
  TYPED_NAME: 120,
  /** £100m. Above this, someone has mistyped rather than sold a mansion. */
  MAX_PRICE_GBP: 100_000_000,
} as const

/** Trimmed, and blank becomes undefined so optional fields stay out of the URL. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional()

const requiredText = (max: number) => z.string().trim().min(1).max(max)

export const PartySchema = z
  .object({
    name: requiredText(MEMORANDUM_LIMITS.PARTY_NAME),
    email: optionalText(MEMORANDUM_LIMITS.EMAIL),
    phone: optionalText(MEMORANDUM_LIMITS.PHONE),
    address: optionalText(MEMORANDUM_LIMITS.PARTY_ADDRESS),
  })
  .strict()

export type Party = z.infer<typeof PartySchema>

/**
 * Every field optional: "not yet instructed" is the normal state when a
 * memorandum is drawn up, and the document should say so rather than look
 * half-finished.
 */
export const ConveyancerSchema = z
  .object({
    firm: optionalText(MEMORANDUM_LIMITS.CONVEYANCER_FIRM),
    contact: optionalText(MEMORANDUM_LIMITS.CONVEYANCER_CONTACT),
    email: optionalText(MEMORANDUM_LIMITS.EMAIL),
    phone: optionalText(MEMORANDUM_LIMITS.PHONE),
  })
  .strict()

export type Conveyancer = z.infer<typeof ConveyancerSchema>

/**
 * Deliberately not called a signature. It is a typed name against a
 * declaration, with the time the signer's own device reported — which is what
 * we can honestly offer without a server. See the plan's §3.
 */
export const AcknowledgementSchema = z
  .object({
    typedName: requiredText(MEMORANDUM_LIMITS.TYPED_NAME),
    at: z.string().datetime(),
  })
  .strict()

export type Acknowledgement = z.infer<typeof AcknowledgementSchema>

/** What the seller is doing next, which is what holds a chain up. */
export const SELLER_CHAIN_POSITIONS = [
  "no-onward-purchase",
  "found-a-property",
  "looking",
  "moving-to-rental",
] as const

export const SellerChainPositionSchema = z.enum(SELLER_CHAIN_POSITIONS)
export type SellerChainPosition = z.infer<typeof SellerChainPositionSchema>

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .optional()

export const MemorandumSchema = z
  .object({
    /** Bumped only on a breaking payload change; the codec refuses anything else. */
    version: z.literal(1),

    propertyAddress: requiredText(MEMORANDUM_LIMITS.PROPERTY_ADDRESS),
    postcode: optionalText(MEMORANDUM_LIMITS.POSTCODE),
    /** Whole pounds. Pence would lengthen every share link for no benefit. */
    priceGbp: z.number().int().positive().max(MEMORANDUM_LIMITS.MAX_PRICE_GBP),

    seller: PartySchema,
    buyer: PartySchema,
    sellerConveyancer: ConveyancerSchema,
    buyerConveyancer: ConveyancerSchema,

    inclusions: optionalText(MEMORANDUM_LIMITS.INCLUSIONS),
    exclusions: optionalText(MEMORANDUM_LIMITS.EXCLUSIONS),
    extras: optionalText(MEMORANDUM_LIMITS.EXTRAS),

    sellerChain: SellerChainPositionSchema.optional(),
    buyerPosition: BuyerPositionSchema.optional(),
    funding: FundingTypeSchema.optional(),
    depositGbp: z.number().int().nonnegative().max(MEMORANDUM_LIMITS.MAX_PRICE_GBP).optional(),

    targetExchange: isoDate,
    targetCompletion: isoDate,
    notes: optionalText(MEMORANDUM_LIMITS.NOTES),

    sellerAcknowledgement: AcknowledgementSchema.optional(),
    buyerAcknowledgement: AcknowledgementSchema.optional(),
  })
  .strict()
  // The seller owns the property, so they set the terms before the buyer can
  // agree to them. A payload with only a buyer acknowledgement did not come
  // from this app.
  .refine((m) => !(m.buyerAcknowledgement && !m.sellerAcknowledgement), {
    message: "A buyer cannot acknowledge terms the seller has not set",
    path: ["buyerAcknowledgement"],
  })

export type Memorandum = z.infer<typeof MemorandumSchema>

// ---------------------------------------------------------------------------
// Draft
//
// A half-filled form is not a memorandum, so it does not get to wear the type.
// The draft holds what the inputs actually produce — strings throughout,
// including the price — and converting it is a validated boundary rather than a
// cast. That way an incomplete document cannot reach the share link or the PDF.
// ---------------------------------------------------------------------------

export interface PartyDraft {
  name: string
  email: string
  phone: string
  address: string
}

export interface ConveyancerDraft {
  firm: string
  contact: string
  email: string
  phone: string
}

export interface MemorandumDraft {
  propertyAddress: string
  postcode: string
  price: string
  seller: PartyDraft
  buyer: PartyDraft
  sellerConveyancer: ConveyancerDraft
  buyerConveyancer: ConveyancerDraft
  inclusions: string
  exclusions: string
  extras: string
  sellerChain: SellerChainPosition | ""
  buyerPosition: BuyerPosition | ""
  funding: FundingType | ""
  deposit: string
  targetExchange: string
  targetCompletion: string
  notes: string
}

const emptyParty = (): PartyDraft => ({ name: "", email: "", phone: "", address: "" })
const emptyConveyancer = (): ConveyancerDraft => ({ firm: "", contact: "", email: "", phone: "" })

export function emptyDraft(): MemorandumDraft {
  return {
    propertyAddress: "",
    postcode: "",
    price: "",
    seller: emptyParty(),
    buyer: emptyParty(),
    sellerConveyancer: emptyConveyancer(),
    buyerConveyancer: emptyConveyancer(),
    inclusions: "",
    exclusions: "",
    extras: "",
    sellerChain: "",
    buyerPosition: "",
    funding: "",
    deposit: "",
    targetExchange: "",
    targetCompletion: "",
    notes: "",
  }
}

/** Accepts "485,000", "£485000" and "485000" alike; anything else is NaN. */
export function parsePrice(input: string): number {
  const cleaned = input.replace(/[£,\s]/g, "")
  if (cleaned === "" || !/^\d+$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

/** Re-opens a received memorandum as an editable draft, for the buyer's side. */
export function draftFromMemorandum(m: Memorandum): MemorandumDraft {
  return {
    propertyAddress: m.propertyAddress,
    postcode: m.postcode ?? "",
    price: String(m.priceGbp),
    seller: {
      name: m.seller.name,
      email: m.seller.email ?? "",
      phone: m.seller.phone ?? "",
      address: m.seller.address ?? "",
    },
    buyer: {
      name: m.buyer.name,
      email: m.buyer.email ?? "",
      phone: m.buyer.phone ?? "",
      address: m.buyer.address ?? "",
    },
    sellerConveyancer: {
      firm: m.sellerConveyancer.firm ?? "",
      contact: m.sellerConveyancer.contact ?? "",
      email: m.sellerConveyancer.email ?? "",
      phone: m.sellerConveyancer.phone ?? "",
    },
    buyerConveyancer: {
      firm: m.buyerConveyancer.firm ?? "",
      contact: m.buyerConveyancer.contact ?? "",
      email: m.buyerConveyancer.email ?? "",
      phone: m.buyerConveyancer.phone ?? "",
    },
    inclusions: m.inclusions ?? "",
    exclusions: m.exclusions ?? "",
    extras: m.extras ?? "",
    sellerChain: m.sellerChain ?? "",
    buyerPosition: m.buyerPosition ?? "",
    funding: m.funding ?? "",
    deposit: m.depositGbp === undefined ? "" : String(m.depositGbp),
    targetExchange: m.targetExchange ?? "",
    targetCompletion: m.targetCompletion ?? "",
    notes: m.notes ?? "",
  }
}

interface DraftAcknowledgements {
  seller?: Acknowledgement | undefined
  buyer?: Acknowledgement | undefined
}

/**
 * The one way a draft becomes a memorandum. Returns Zod's result rather than
 * throwing, so the form can show which field is wrong.
 */
export function memorandumFromDraft(
  draft: MemorandumDraft,
  acks: DraftAcknowledgements = {},
): ReturnType<typeof MemorandumSchema.safeParse> {
  const price = parsePrice(draft.price)
  const deposit = draft.deposit.trim() === "" ? undefined : parsePrice(draft.deposit)

  return MemorandumSchema.safeParse({
    version: 1,
    propertyAddress: draft.propertyAddress,
    postcode: draft.postcode,
    priceGbp: Number.isNaN(price) ? undefined : price,
    seller: draft.seller,
    buyer: draft.buyer,
    sellerConveyancer: draft.sellerConveyancer,
    buyerConveyancer: draft.buyerConveyancer,
    inclusions: draft.inclusions,
    exclusions: draft.exclusions,
    extras: draft.extras,
    sellerChain: draft.sellerChain === "" ? undefined : draft.sellerChain,
    buyerPosition: draft.buyerPosition === "" ? undefined : draft.buyerPosition,
    funding: draft.funding === "" ? undefined : draft.funding,
    depositGbp: deposit !== undefined && Number.isNaN(deposit) ? undefined : deposit,
    targetExchange: draft.targetExchange === "" ? undefined : draft.targetExchange,
    targetCompletion: draft.targetCompletion === "" ? undefined : draft.targetCompletion,
    notes: draft.notes,
    sellerAcknowledgement: acks.seller,
    buyerAcknowledgement: acks.buyer,
  })
}
