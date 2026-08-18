import { describe, it, expect } from "vitest"
import {
  MemorandumSchema,
  MEMORANDUM_LIMITS,
  emptyDraft,
  memorandumFromDraft,
  draftFromMemorandum,
  parsePrice,
  type MemorandumDraft,
} from "./memorandum"

const ACK = { typedName: "William Boltwood", at: "2026-08-18T09:23:41.000Z" }

function filledDraft(): MemorandumDraft {
  return {
    ...emptyDraft(),
    propertyAddress: "14 Athelstan Road, Puddletown, Dorchester",
    postcode: "DT2 8SL",
    price: "485000",
    seller: { name: "William Boltwood", email: "will@example.co.uk", phone: "07700 900123", address: "" },
    buyer: { name: "James Law", email: "", phone: "", address: "" },
  }
}

describe("memorandumFromDraft", () => {
  it("accepts the minimum a memorandum needs", () => {
    const result = memorandumFromDraft(filledDraft())
    expect(result.success).toBe(true)
  })

  it.each([
    ["property address", { propertyAddress: "" }],
    ["a price", { price: "" }],
    ["a seller name", { seller: { name: "", email: "", phone: "", address: "" } }],
    ["a buyer name", { buyer: { name: "", email: "", phone: "", address: "" } }],
  ])("refuses a document with no %s", (_label, patch) => {
    const result = memorandumFromDraft({ ...filledDraft(), ...patch } as MemorandumDraft)
    expect(result.success).toBe(false)
  })

  it("drops blank optional fields rather than storing empty strings", () => {
    const result = memorandumFromDraft(filledDraft())
    if (!result.success) throw new Error("expected success")
    expect(result.data.notes).toBeUndefined()
    expect(result.data.buyer.email).toBeUndefined()
    expect(result.data.sellerConveyancer.firm).toBeUndefined()
  })

  it("keeps a conveyancer that has been instructed", () => {
    const draft = filledDraft()
    draft.sellerConveyancer = { firm: "Open Door Legal", contact: "Priya Raman", email: "", phone: "" }
    const result = memorandumFromDraft(draft)
    if (!result.success) throw new Error("expected success")
    expect(result.data.sellerConveyancer.firm).toBe("Open Door Legal")
    expect(result.data.sellerConveyancer.email).toBeUndefined()
  })

  it("rejects a price that is not a number", () => {
    expect(memorandumFromDraft({ ...filledDraft(), price: "about half a million" }).success).toBe(false)
  })

  it("rejects a price above the sanity ceiling", () => {
    const over = String(MEMORANDUM_LIMITS.MAX_PRICE_GBP + 1)
    expect(memorandumFromDraft({ ...filledDraft(), price: over }).success).toBe(false)
  })
})

describe("parsePrice", () => {
  it.each([
    ["485000", 485000],
    ["£485000", 485000],
    ["485,000", 485000],
    ["£485,000", 485000],
    [" 485000 ", 485000],
  ])("reads %s as %i", (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })

  it.each([[""], ["abc"], ["485.50"], ["-485000"]])("rejects %s", (input) => {
    expect(parsePrice(input)).toBeNaN()
  })
})

describe("field caps", () => {
  it("accepts text at the cap and refuses one character more", () => {
    const atCap = "x".repeat(MEMORANDUM_LIMITS.INCLUSIONS)
    expect(memorandumFromDraft({ ...filledDraft(), inclusions: atCap }).success).toBe(true)
    expect(memorandumFromDraft({ ...filledDraft(), inclusions: atCap + "x" }).success).toBe(false)
  })

  it("caps the property address", () => {
    const over = "x".repeat(MEMORANDUM_LIMITS.PROPERTY_ADDRESS + 1)
    expect(memorandumFromDraft({ ...filledDraft(), propertyAddress: over }).success).toBe(false)
  })
})

// The payload arrives from a URL fragment, so it is attacker-controlled.
describe("hostile payloads", () => {
  it("rejects an unknown key rather than letting it through", () => {
    const valid = memorandumFromDraft(filledDraft())
    if (!valid.success) throw new Error("expected success")
    const tampered = { ...valid.data, injectedField: "surprise" }
    expect(MemorandumSchema.safeParse(tampered).success).toBe(false)
  })

  it("rejects a version it does not understand", () => {
    const valid = memorandumFromDraft(filledDraft())
    if (!valid.success) throw new Error("expected success")
    expect(MemorandumSchema.safeParse({ ...valid.data, version: 2 }).success).toBe(false)
  })

  // The seller owns the property, so they set terms before the buyer agrees to
  // them. A payload with only a buyer acknowledgement did not come from here.
  it("refuses a buyer acknowledgement with no seller acknowledgement", () => {
    const result = memorandumFromDraft(filledDraft(), { buyer: ACK })
    expect(result.success).toBe(false)
  })

  it("accepts a seller acknowledgement alone", () => {
    expect(memorandumFromDraft(filledDraft(), { seller: ACK }).success).toBe(true)
  })

  it("accepts both acknowledgements", () => {
    const result = memorandumFromDraft(filledDraft(), {
      seller: ACK,
      buyer: { typedName: "James Law", at: "2026-08-18T14:02:11.000Z" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects an acknowledgement with no typed name", () => {
    const result = memorandumFromDraft(filledDraft(), {
      seller: { typedName: "", at: "2026-08-18T09:23:41.000Z" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects an acknowledgement timestamp that is not a date", () => {
    const result = memorandumFromDraft(filledDraft(), {
      seller: { typedName: "William Boltwood", at: "yesterday" },
    })
    expect(result.success).toBe(false)
  })
})

describe("draftFromMemorandum", () => {
  it("round-trips a filled memorandum back through the form", () => {
    const draft = filledDraft()
    draft.inclusions = "All fixtures and fittings except the living room chandelier."
    draft.sellerChain = "found-a-property"
    draft.funding = "mortgage"

    const parsed = memorandumFromDraft(draft, { seller: ACK })
    if (!parsed.success) throw new Error("expected success")
    const reopened = memorandumFromDraft(draftFromMemorandum(parsed.data), { seller: ACK })

    if (!reopened.success) throw new Error("expected success")
    expect(reopened.data).toEqual(parsed.data)
  })

  it("turns absent optionals back into empty inputs, not the string undefined", () => {
    const parsed = memorandumFromDraft(filledDraft())
    if (!parsed.success) throw new Error("expected success")
    const draft = draftFromMemorandum(parsed.data)
    expect(draft.notes).toBe("")
    expect(draft.deposit).toBe("")
    expect(draft.sellerChain).toBe("")
  })
})
