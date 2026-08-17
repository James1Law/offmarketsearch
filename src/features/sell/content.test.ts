import { describe, it, expect } from "vitest"
import { SELL_STEPS } from "./content"
import { REFERRAL_PARTNERS, REFERRAL_DISCLOSURE, partnersForStep } from "@/lib/referrals"

describe("sell guide steps", () => {
  it("runs 1 to 12 in order with no gaps", () => {
    expect(SELL_STEPS.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it("gives every step a title and at least one paragraph", () => {
    for (const step of SELL_STEPS) {
      expect(step.title.trim()).not.toBe("")
      expect(step.body.length).toBeGreaterThan(0)
      expect(step.body.every((p) => p.trim() !== "")).toBe(true)
    }
  })
})

// These are paid introductions on a page aimed at people making the largest
// transaction of their lives. The disclosure is a CAP Code requirement, so it
// is enforced here rather than left to whoever edits the registry next.
describe("referral partners", () => {
  it("discloses the commercial relationship for every partner", () => {
    for (const partner of REFERRAL_PARTNERS) {
      expect(partner.disclosure.trim()).not.toBe("")
      expect(partner.disclosure.toLowerCase()).toMatch(/fee|paid|commission/)
    }
  })

  it("carries a page-level disclosure as well as per-partner ones", () => {
    expect(REFERRAL_DISCLOSURE.toLowerCase()).toMatch(/paid referral|fee/)
  })

  it("points every partner at an https destination", () => {
    for (const partner of REFERRAL_PARTNERS) {
      expect(partner.url.startsWith("https://")).toBe(true)
    }
  })

  it("attaches every partner to a real step in the guide", () => {
    const stepNumbers = new Set(SELL_STEPS.map((s) => s.number))
    for (const partner of REFERRAL_PARTNERS) {
      expect(stepNumbers.has(partner.stepNumber)).toBe(true)
    }
  })

  it("uses unique partner ids", () => {
    const ids = REFERRAL_PARTNERS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("finds the valuation partner on the valuation step", () => {
    expect(partnersForStep(2).map((p) => p.id)).toEqual(["eserve-valuation"])
    expect(partnersForStep(1)).toEqual([])
  })
})
