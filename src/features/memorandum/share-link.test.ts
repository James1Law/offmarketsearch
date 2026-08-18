import { describe, it, expect } from "vitest"
import {
  encodeMemorandum,
  decodeMemorandum,
  buildShareLink,
  canBuildShareLink,
  SHARE_LINK_COMFORTABLE_CHARS,
} from "./share-link"
import { memorandumFromDraft, emptyDraft, MEMORANDUM_LIMITS } from "@/types/memorandum"
import type { Memorandum, MemorandumDraft } from "@/types/memorandum"

const ORIGIN = "https://offline.homes"

function build(overrides: Partial<MemorandumDraft> = {}): Memorandum {
  const result = memorandumFromDraft(
    {
      ...emptyDraft(),
      propertyAddress: "14 Athelstan Road, Puddletown, Dorchester",
      postcode: "DT2 8SL",
      price: "485000",
      seller: { name: "William Boltwood", email: "will@example.co.uk", phone: "", address: "" },
      buyer: { name: "James Law", email: "", phone: "", address: "" },
      ...overrides,
    },
    { seller: { typedName: "William Boltwood", at: "2026-08-18T09:23:41.000Z" } },
  )
  if (!result.success) throw new Error("fixture is not a valid memorandum")
  return result.data
}

describe("share link round-trip", () => {
  it("returns exactly what went in", async () => {
    const original = build()
    const decoded = await decodeMemorandum(await encodeMemorandum(original))

    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(decoded.memorandum).toEqual(original)
  })

  it("survives accented names, quotes, newlines and emoji", async () => {
    const original = build({
      seller: { name: "Siân O'Brien-Müller", email: "", phone: "", address: "" },
      notes: 'Line one\nLine two — "quoted", 50% of £480,000 … 🏡',
    })
    const decoded = await decodeMemorandum(await encodeMemorandum(original))

    if (!decoded.ok) throw new Error("expected a decode")
    expect(decoded.memorandum.seller.name).toBe("Siân O'Brien-Müller")
    expect(decoded.memorandum.notes).toBe(original.notes)
  })

  it("accepts the fragment with or without its leading hash", async () => {
    const fragment = await encodeMemorandum(build())
    const withHash = await decodeMemorandum("#" + fragment)
    const without = await decodeMemorandum(fragment)

    expect(withHash.ok).toBe(true)
    expect(without.ok).toBe(true)
  })

  it("produces a link on the confirm route", async () => {
    const link = await buildShareLink(build(), ORIGIN)
    expect(link.url.startsWith("https://offline.homes/memorandum/confirm#v1.")).toBe(true)
  })

  it("is available in this environment", () => {
    expect(canBuildShareLink()).toBe(true)
  })
})

// The fragment is attacker-controlled and often arrives mangled by a messaging
// app, so every failure has to be a named reason rather than a thrown error.
describe("rejecting broken and hostile fragments", () => {
  it.each([
    ["an empty fragment", "", "empty"],
    ["only a hash", "#", "empty"],
    ["no version prefix", "eyJmb28iOiJiYXIifQ", "unknown-version"],
    ["a future version", "v2.eyJmb28iOiJiYXIifQ", "unknown-version"],
    ["a prefix with nothing after it", "v1.", "malformed"],
    ["characters outside base64url", "v1.not base64!!", "malformed"],
    ["base64 that is not gzip", "v1.aGVsbG8gd29ybGQ", "malformed"],
  ])("reports %s as %s", async (_label, fragment, reason) => {
    const result = await decodeMemorandum(fragment)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe(reason)
  })

  it("reports a truncated link rather than throwing", async () => {
    const fragment = await encodeMemorandum(build())
    const result = await decodeMemorandum(fragment.slice(0, fragment.length - 20))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("malformed")
  })

  it("refuses a payload too large to be a memorandum, before inflating it", async () => {
    // 100k base64url characters decode to ~75KB, past the ceiling. The point is
    // that this is refused without ever being handed to the decompressor.
    const result = await decodeMemorandum("v1." + "A".repeat(100_000))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("too-large")
  })

  it("refuses valid gzip that is not a memorandum", async () => {
    const json = new TextEncoder().encode(JSON.stringify({ hello: "world" }))
    const cs = new CompressionStream("gzip")
    const writer = cs.writable.getWriter()
    void writer.write(json)
    void writer.close()
    const chunks: Uint8Array[] = []
    const reader = cs.readable.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const bytes = Buffer.concat(chunks.map((c) => Buffer.from(c)))
    const fragment = "v1." + bytes.toString("base64url")

    const result = await decodeMemorandum(fragment)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("not-a-memorandum")
  })
})

// The whole no-backend design assumes these links survive being pasted into
// WhatsApp. If a future field pushes a realistic document over budget, this is
// where it should be noticed.
describe("size budget", () => {
  /** Varied text, so the measurement cannot flatter itself through repetition. */
  function realistic(): Memorandum {
    return build({
      propertyAddress: "14 Athelstan Road, Puddletown, Dorchester, Dorset",
      seller: {
        name: "William Boltwood and Sarah Boltwood",
        email: "will.boltwood@example.co.uk",
        phone: "07700 900123",
        address: "14 Athelstan Road, Puddletown, Dorchester, Dorset DT2 8SL",
      },
      buyer: {
        name: "James Law",
        email: "james.law@example.com",
        phone: "07700 900456",
        address: "3 Kennington Road, Oxford OX1 5NY",
      },
      sellerConveyancer: {
        firm: "Open Door Legal",
        contact: "Priya Raman",
        email: "priya.raman@opendoorlegal.example",
        phone: "01305 123456",
      },
      buyerConveyancer: {
        firm: "Thornton Jones Solicitors",
        contact: "Michael Osei",
        email: "m.osei@thorntonjones.example",
        phone: "01865 987654",
      },
      inclusions:
        "All fixtures and fittings, carpets, curtains and blinds, integrated oven, hob and extractor, garden shed and greenhouse.",
      exclusions:
        "The chandelier in the living room and the wall-mounted TV bracket in the main bedroom.",
      extras: "Washing machine, tumble dryer and the ride-on mower, at no additional cost.",
      sellerChain: "found-a-property",
      buyerPosition: "nothing-to-sell",
      funding: "mortgage",
      deposit: "48500",
      targetExchange: "2026-09-19",
      targetCompletion: "2026-10-17",
      notes:
        "Sale agreed subject to a satisfactory HomeBuyer survey. Seller will leave the loft insulation certificates and FENSA paperwork with the conveyancer.",
    })
  }

  it("keeps a well-filled memorandum comfortably shareable", async () => {
    const link = await buildShareLink(realistic(), ORIGIN)

    expect(link.tooLong).toBe(false)
    expect(link.length).toBeLessThan(SHARE_LINK_COMFORTABLE_CHARS)
  })

  it("still round-trips at that size", async () => {
    const original = realistic()
    const decoded = await decodeMemorandum(await encodeMemorandum(original))

    if (!decoded.ok) throw new Error("expected a decode")
    expect(decoded.memorandum).toEqual(original)
  })

  // Field caps alone cannot bound the link, so the flag has to fire on the
  // input that defeats compression.
  it("flags a link that messaging apps would mangle", async () => {
    // Genuinely high-entropy text is harder to produce than it looks, and two
    // traps caught this test out: `(i * k) % 90` repeats every 90 characters,
    // and a plain LCG overflows MAX_SAFE_INTEGER so its sequence degenerates.
    // This uses the same mulberry32 approach as lib/property-enrichment.ts.
    // Each field also needs its own seed — sharing one makes the shorter fields
    // prefixes of the longer, and gzip collapses that straight away.
    const incompressible = (n: number, seed: number) => {
      let state = seed
      let out = ""
      for (let i = 0; i < n; i++) {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        out += String.fromCharCode(33 + (((t ^ (t >>> 14)) >>> 0) % 90))
      }
      return out
    }

    const link = await buildShareLink(
      build({
        inclusions: incompressible(MEMORANDUM_LIMITS.INCLUSIONS, 1),
        exclusions: incompressible(MEMORANDUM_LIMITS.EXCLUSIONS, 2),
        extras: incompressible(MEMORANDUM_LIMITS.EXTRAS, 3),
        notes: incompressible(MEMORANDUM_LIMITS.NOTES, 4),
      }),
      ORIGIN,
    )

    expect(link.tooLong).toBe(true)
  })
})
