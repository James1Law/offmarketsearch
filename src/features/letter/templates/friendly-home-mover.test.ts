import { describe, it, expect } from "vitest"
import { renderLetter, describeCriteria } from "./friendly-home-mover"
import { DEFAULT_FILTERS } from "@/features/refine/filters"
import type { LetterContent } from "@/types"

const BASE_CONTENT: LetterContent = {
  templateId: "friendly-home-mover",
  senderName: "James Law",
  senderAddress: "2 Chamberlaine Rd, Weymouth, DT4 9EX",
}

describe("renderLetter contact wording", () => {
  it("points to the letterhead when contact details are provided", () => {
    const letter = renderLetter(
      { ...BASE_CONTENT, senderPhone: "07700 900123", senderEmail: "james@example.com" },
      null,
      null,
    )
    const body = letter.paragraphs.join(" ")
    expect(body).toContain("through any of the means provided at the top of this letter")
    // The body must not repeat the raw details — they live in the letterhead.
    expect(body).not.toContain("07700 900123")
    expect(body).not.toContain("james@example.com")
    expect(letter.senderLines).toContain("07700 900123")
    expect(letter.senderLines).toContain("james@example.com")
  })

  it("falls back to reply-by-post when no contact details are given", () => {
    const letter = renderLetter(BASE_CONTENT, null, null)
    const body = letter.paragraphs.join(" ")
    expect(body).toContain("replying to this letter at the address above")
    expect(body).not.toContain("at the top of this letter")
  })
})

describe("describeCriteria", () => {
  it("returns null for default filters", () => {
    expect(describeCriteria(null)).toBeNull()
    expect(describeCriteria(DEFAULT_FILTERS)).toBeNull()
  })

  it("describes types, size and features", () => {
    expect(
      describeCriteria({
        ...DEFAULT_FILTERS,
        propertyTypes: ["detached", "semi-detached"],
        minBedrooms: 3,
        mustHaveParking: true,
      }),
    ).toBe("a detached or semi-detached property with 3+ bedrooms and off-street parking")
  })

  it("does not leak ownership-length targeting into the letter", () => {
    const phrase = describeCriteria({ ...DEFAULT_FILTERS, minYearsOwned: 15 })
    expect(phrase).toBeNull()
  })
})
