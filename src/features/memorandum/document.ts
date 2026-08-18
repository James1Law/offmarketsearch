import type {
  Acknowledgement,
  Conveyancer,
  Memorandum,
  Party,
  SellerChainPosition,
} from "@/types/memorandum"
import type { BuyerPosition, FundingType } from "@/types"

// ---------------------------------------------------------------------------
// The document.
//
// A pure render into a structure that both the on-screen preview and the PDF
// consume, so the two cannot drift apart — what someone signs is what they
// download.
// ---------------------------------------------------------------------------

export type MemorandumStage = "drafting" | "awaiting-buyer" | "complete"

/**
 * Derived from the payload rather than stored alongside it, so the stage can
 * never disagree with the data it describes.
 */
export function memorandumStage(m: Memorandum): MemorandumStage {
  if (!m.sellerAcknowledgement) return "drafting"
  return m.buyerAcknowledgement ? "complete" : "awaiting-buyer"
}

const SELLER_CHAIN_LABELS: Record<SellerChainPosition, string> = {
  "no-onward-purchase": "No onward purchase",
  "found-a-property": "Found a property to buy",
  looking: "Looking for a property to buy",
  "moving-to-rental": "Moving into rented accommodation",
}

const BUYER_POSITION_LABELS: Record<BuyerPosition, string> = {
  "nothing-to-sell": "Nothing to sell",
  sstc: "Own property sold, subject to contract",
  "on-market": "Own property on the market",
  "not-on-market-yet": "Own property not yet on the market",
}

const FUNDING_LABELS: Record<FundingType, string> = {
  cash: "Cash purchase",
  mortgage: "Mortgage",
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

/**
 * Fixed to Europe/London rather than the reader's locale: this is a UK
 * document, and a completion date that shifts by a day depending on who opens
 * it would be worse than useless.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
})

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
})

export function formatDocumentDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date)
}

export interface DocumentRow {
  label: string
  value: string
}

export interface DocumentSection {
  heading: string
  rows: DocumentRow[]
}

export interface RenderedAcknowledgement {
  role: "Seller" | "Buyer"
  /** Will's wording, with the acknowledging party's typed name in it. */
  sentence: string
  typedName: string
  /** e.g. "10:23 on 18 August 2026" */
  when: string
}

export interface RenderedMemorandum {
  title: string
  /** Always present. This document is never binding, so it never claims to be. */
  subjectToContract: string
  sections: DocumentSection[]
  acknowledgements: RenderedAcknowledgement[]
  /** Shown when one side has not acknowledged yet. */
  pendingNote: string | null
  disclaimer: string[]
}

export const SUBJECT_TO_CONTRACT = "Subject to contract"

export const NOT_INSTRUCTED = "Not yet instructed"

export const DISCLAIMER_LINES: readonly string[] = [
  "This memorandum of sale records what the parties named above have said they have agreed. It is not a legally binding agreement, and neither party is committed to the sale until contracts are formally exchanged.",
  "Either party may still withdraw, and the terms may change. Nothing here replaces advice from a conveyancer or solicitor.",
  "Prepared for a private sale in England and Wales. The process differs in Scotland, where offers are made through solicitors and become binding on conclusion of missives.",
  "Offline.homes provides this document as a free template. We are not a party to the sale, we do not verify the details entered, and the acknowledgements below are typed declarations rather than witnessed signatures.",
]

function partyRows(party: Party): DocumentRow[] {
  const rows: DocumentRow[] = [{ label: "Name", value: party.name }]
  if (party.address) rows.push({ label: "Address", value: party.address })
  if (party.email) rows.push({ label: "Email", value: party.email })
  if (party.phone) rows.push({ label: "Phone", value: party.phone })
  return rows
}

function conveyancerRows(conveyancer: Conveyancer): DocumentRow[] {
  const { firm, contact, email, phone } = conveyancer
  // Saying so plainly beats an empty block: at memorandum stage, not having
  // instructed anyone yet is normal rather than an omission.
  if (!firm && !contact && !email && !phone) {
    return [{ label: "Firm", value: NOT_INSTRUCTED }]
  }
  const rows: DocumentRow[] = []
  if (firm) rows.push({ label: "Firm", value: firm })
  if (contact) rows.push({ label: "Contact", value: contact })
  if (email) rows.push({ label: "Email", value: email })
  if (phone) rows.push({ label: "Phone", value: phone })
  return rows
}

function renderAcknowledgement(
  role: "Seller" | "Buyer",
  ack: Acknowledgement,
): RenderedAcknowledgement {
  const at = new Date(ack.at)
  const when = Number.isNaN(at.getTime())
    ? ack.at
    : `${TIME_FORMAT.format(at)} on ${DATE_FORMAT.format(at)}`

  return {
    role,
    sentence: `I, ${ack.typedName}, agree to the terms of the sale as outlined within this document.`,
    typedName: ack.typedName,
    when,
  }
}

export function renderMemorandum(m: Memorandum): RenderedMemorandum {
  const propertyRows: DocumentRow[] = [{ label: "Address", value: m.propertyAddress }]
  if (m.postcode) propertyRows.push({ label: "Postcode", value: m.postcode })
  propertyRows.push({ label: "Agreed price", value: GBP.format(m.priceGbp) })

  const termsRows: DocumentRow[] = []
  if (m.inclusions) termsRows.push({ label: "Included in the sale", value: m.inclusions })
  if (m.exclusions) termsRows.push({ label: "Excluded from the sale", value: m.exclusions })
  if (m.extras) termsRows.push({ label: "Additional contents included", value: m.extras })
  if (m.notes) termsRows.push({ label: "Other terms", value: m.notes })

  const chainRows: DocumentRow[] = []
  if (m.sellerChain) {
    chainRows.push({ label: "Seller's position", value: SELLER_CHAIN_LABELS[m.sellerChain] })
  }
  if (m.buyerPosition) {
    chainRows.push({ label: "Buyer's position", value: BUYER_POSITION_LABELS[m.buyerPosition] })
  }
  if (m.funding) chainRows.push({ label: "Buyer's funding", value: FUNDING_LABELS[m.funding] })
  if (m.depositGbp !== undefined) {
    chainRows.push({ label: "Deposit", value: GBP.format(m.depositGbp) })
  }
  if (m.targetExchange) {
    chainRows.push({ label: "Target exchange", value: formatDocumentDate(m.targetExchange) })
  }
  if (m.targetCompletion) {
    chainRows.push({ label: "Target completion", value: formatDocumentDate(m.targetCompletion) })
  }

  const sections: DocumentSection[] = [
    { heading: "Property", rows: propertyRows },
    { heading: "Seller", rows: partyRows(m.seller) },
    { heading: "Buyer", rows: partyRows(m.buyer) },
    { heading: "Seller's conveyancer", rows: conveyancerRows(m.sellerConveyancer) },
    { heading: "Buyer's conveyancer", rows: conveyancerRows(m.buyerConveyancer) },
  ]
  if (termsRows.length > 0) sections.push({ heading: "Terms of the sale", rows: termsRows })
  if (chainRows.length > 0) sections.push({ heading: "Position and timing", rows: chainRows })

  const acknowledgements: RenderedAcknowledgement[] = []
  if (m.sellerAcknowledgement) {
    acknowledgements.push(renderAcknowledgement("Seller", m.sellerAcknowledgement))
  }
  if (m.buyerAcknowledgement) {
    acknowledgements.push(renderAcknowledgement("Buyer", m.buyerAcknowledgement))
  }

  const stage = memorandumStage(m)
  const pendingNote =
    stage === "awaiting-buyer"
      ? "The buyer has not yet acknowledged these terms."
      : stage === "drafting"
        ? "Neither party has acknowledged these terms yet."
        : null

  return {
    title: "Memorandum of Sale",
    subjectToContract: SUBJECT_TO_CONTRACT,
    sections,
    acknowledgements,
    pendingNote,
    disclaimer: [...DISCLAIMER_LINES],
  }
}
