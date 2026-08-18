import { describe, it, expect } from "vitest"
import {
  renderMemorandum,
  memorandumStage,
  NOT_INSTRUCTED,
  SUBJECT_TO_CONTRACT,
} from "./document"
import { memorandumFromDraft, emptyDraft } from "@/types/memorandum"
import type { Memorandum, MemorandumDraft } from "@/types/memorandum"

const SELLER_ACK = { typedName: "William Boltwood", at: "2026-08-18T09:23:41.000Z" }
const BUYER_ACK = { typedName: "James Law", at: "2026-08-18T14:02:11.000Z" }

function build(
  overrides: Partial<MemorandumDraft> = {},
  acks: { seller?: typeof SELLER_ACK; buyer?: typeof BUYER_ACK } = {},
): Memorandum {
  const result = memorandumFromDraft(
    {
      ...emptyDraft(),
      propertyAddress: "14 Athelstan Road, Puddletown",
      postcode: "DT2 8SL",
      price: "485000",
      seller: { name: "William Boltwood", email: "", phone: "", address: "" },
      buyer: { name: "James Law", email: "", phone: "", address: "" },
      ...overrides,
    },
    acks,
  )
  if (!result.success) throw new Error("fixture is not a valid memorandum")
  return result.data
}

function findRow(doc: ReturnType<typeof renderMemorandum>, heading: string, label: string) {
  return doc.sections.find((s) => s.heading === heading)?.rows.find((r) => r.label === label)
}

describe("memorandumStage", () => {
  it("is drafting before anyone has acknowledged", () => {
    expect(memorandumStage(build())).toBe("drafting")
  })

  it("is awaiting-buyer once the seller has acknowledged", () => {
    expect(memorandumStage(build({}, { seller: SELLER_ACK }))).toBe("awaiting-buyer")
  })

  it("is complete once both have", () => {
    expect(memorandumStage(build({}, { seller: SELLER_ACK, buyer: BUYER_ACK }))).toBe("complete")
  })
})

describe("renderMemorandum", () => {
  it("formats the price as sterling", () => {
    const doc = renderMemorandum(build())
    expect(findRow(doc, "Property", "Agreed price")?.value).toBe("£485,000")
  })

  it("carries the property, both parties and both conveyancers", () => {
    const headings = renderMemorandum(build()).sections.map((s) => s.heading)
    expect(headings).toEqual([
      "Property",
      "Seller",
      "Buyer",
      "Seller's conveyancer",
      "Buyer's conveyancer",
    ])
  })

  it("says a conveyancer is not yet instructed rather than leaving a gap", () => {
    const doc = renderMemorandum(build())
    expect(findRow(doc, "Seller's conveyancer", "Firm")?.value).toBe(NOT_INSTRUCTED)
  })

  it("lists a conveyancer once instructed", () => {
    const doc = renderMemorandum(
      build({
        buyerConveyancer: {
          firm: "Thornton Jones Solicitors",
          contact: "Michael Osei",
          email: "",
          phone: "",
        },
      }),
    )
    expect(findRow(doc, "Buyer's conveyancer", "Firm")?.value).toBe("Thornton Jones Solicitors")
    expect(findRow(doc, "Buyer's conveyancer", "Contact")?.value).toBe("Michael Osei")
    expect(findRow(doc, "Buyer's conveyancer", "Email")).toBeUndefined()
  })

  it("distinguishes what is included, excluded and thrown in", () => {
    const doc = renderMemorandum(
      build({
        inclusions: "All fixtures and fittings.",
        exclusions: "The chandelier in the living room.",
        extras: "Washing machine and tumble dryer.",
      }),
    )
    expect(findRow(doc, "Terms of the sale", "Included in the sale")?.value).toBe(
      "All fixtures and fittings.",
    )
    expect(findRow(doc, "Terms of the sale", "Excluded from the sale")?.value).toBe(
      "The chandelier in the living room.",
    )
    expect(findRow(doc, "Terms of the sale", "Additional contents included")?.value).toBe(
      "Washing machine and tumble dryer.",
    )
  })

  it("omits the terms section entirely when nothing was agreed beyond the price", () => {
    const headings = renderMemorandum(build()).sections.map((s) => s.heading)
    expect(headings).not.toContain("Terms of the sale")
  })

  it("spells out chain positions rather than showing their stored values", () => {
    const doc = renderMemorandum(
      build({ sellerChain: "found-a-property", buyerPosition: "sstc", funding: "mortgage" }),
    )
    expect(findRow(doc, "Position and timing", "Seller's position")?.value).toBe(
      "Found a property to buy",
    )
    expect(findRow(doc, "Position and timing", "Buyer's position")?.value).toBe(
      "Own property sold, subject to contract",
    )
    expect(findRow(doc, "Position and timing", "Buyer's funding")?.value).toBe("Mortgage")
  })

  it("formats target dates for a British reader", () => {
    const doc = renderMemorandum(build({ targetCompletion: "2026-10-17" }))
    expect(findRow(doc, "Position and timing", "Target completion")?.value).toBe("17 October 2026")
  })
})

// The document must never look more binding than it is.
describe("what the document always says", () => {
  it("is marked subject to contract", () => {
    expect(renderMemorandum(build()).subjectToContract).toBe(SUBJECT_TO_CONTRACT)
  })

  it.each([
    ["drafting", {}],
    ["awaiting-buyer", { seller: SELLER_ACK }],
    ["complete", { seller: SELLER_ACK, buyer: BUYER_ACK }],
  ])("states it is not legally binding at the %s stage", (_stage, acks) => {
    const doc = renderMemorandum(build({}, acks))
    expect(doc.disclaimer.join(" ")).toContain("not a legally binding agreement")
  })

  it("names the jurisdiction it applies to, and the one it does not", () => {
    const disclaimer = renderMemorandum(build()).disclaimer.join(" ")
    expect(disclaimer).toContain("England and Wales")
    expect(disclaimer).toContain("Scotland")
  })

  it("does not describe the acknowledgements as signatures", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK, buyer: BUYER_ACK }))
    const everything = [doc.disclaimer.join(" "), ...doc.acknowledgements.map((a) => a.sentence)]
      .join(" ")
      .toLowerCase()
    expect(everything).not.toMatch(/\bsigned\b|\bsignature\b/)
  })
})

describe("acknowledgements", () => {
  it("uses the declaration wording with the signer's own name", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK }))
    expect(doc.acknowledgements[0]?.sentence).toBe(
      "I, William Boltwood, agree to the terms of the sale as outlined within this document.",
    )
  })

  it("records the time and date it was given", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK }))
    // 09:23 UTC in August is 10:23 British Summer Time.
    expect(doc.acknowledgements[0]?.when).toBe("10:23 on 18 August 2026")
  })

  it("lists the seller before the buyer", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK, buyer: BUYER_ACK }))
    expect(doc.acknowledgements.map((a) => a.role)).toEqual(["Seller", "Buyer"])
  })

  it("says who is still outstanding while waiting on the buyer", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK }))
    expect(doc.pendingNote).toBe("The buyer has not yet acknowledged these terms.")
  })

  it("drops the pending note once both have acknowledged", () => {
    const doc = renderMemorandum(build({}, { seller: SELLER_ACK, buyer: BUYER_ACK }))
    expect(doc.pendingNote).toBeNull()
    expect(doc.acknowledgements).toHaveLength(2)
  })
})
