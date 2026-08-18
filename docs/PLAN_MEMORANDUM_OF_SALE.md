# Plan — Memorandum of Sale builder (C1, no backend)

Status: **proposed, awaiting confirmation**
Date: 2026-08-18
Source: Will's voice note (16 Aug), the WhatsApp thread, and C1 in `docs/PLAN_MAP_SELL_MOS.md`.

---

## 1. What we are building

A free tool that lets a private seller and buyer fill out a memorandum of sale together and
each walk away with a PDF to forward to their conveyancers. No account, no database, no email
from us.

Will's design constraints, which the build follows rather than reinterprets:

- **No signature upload.** Nobody has a correctly-scaled, transparent-background signature on
  their phone, and those who do will produce something that looks poor.
- **Typed name + tick + timestamp** as the acknowledgement:
  *"I, William Boltwood, agree to the terms of the sale as outlined in this document."* —
  followed by the typed name and a timestamp.
- **The seller goes first.** They own the property, so they dictate what is included: fixtures,
  fittings, exclusions ("all fixtures and fittings except the living room chandelier"), and
  additional contents ("washing machine and tumble dryer").
- **The buyer receives it pre-filled** and completes their own side.
- **Same interaction model as `/letter`** — a form beside a live preview. Nothing new to learn.

It also has to work for private buyers and sellers who never touched the letter service, which
is Will's SEO argument, so it stands alone at its own route.

**In scope:** the two-party fill, the acknowledgements, the document, the PDF, the share link.
**Out of scope (this is C2):** us emailing anybody, including conveyancers. See §10.

---

## 2. The share link, with real numbers

The handoff is a link the seller sends however they like — WhatsApp, email, text. The document
data travels **in the URL fragment**, after the `#`.

That choice is the whole privacy story: a fragment is never included in the HTTP request, so
the sale price, both parties' names and their conveyancers' details never reach our server,
our logs, or any CDN in between. For a document full of named individuals this is a real
property, not a convenience.

Encoding: `JSON` → `gzip` via the native `CompressionStream` → `base64url`, behind a `v1.`
version prefix so a future format change is detected rather than crashing.

I measured this before designing around it, because the whole approach fails if the links are
too long to survive being pasted into WhatsApp:

| Case | JSON | gzipped | full URL |
|---|---|---|---|
| Realistic well-filled memorandum | 1,484 B | 792 B | **1,100 chars** |
| Every field at cap, ordinary prose | 4,567 B | 514 B | **730 chars** |
| Every field at cap, incompressible text | 5,075 B | 3,750 B | **5,044 chars** |

Two conclusions:

1. **Compression is load-bearing, not polish.** Uncompressed, the realistic case is 2,023
   chars — right on the practical ceiling for messaging apps. Gzipped it is 1,100, with
   headroom. So there is no uncompressed fallback: `CompressionStream` has been in every
   major browser since Safari 16.4 (March 2023), and anything that can run this app has it.
   If it is genuinely missing we say so and offer the PDF instead, rather than silently
   emitting a 2,000-character link that may arrive mangled.
2. **Field caps alone cannot bound the link length.** Ordinary prose compresses about 2:1;
   pathological input does not compress at all, and at cap it reaches ~5,000 chars. So the
   caps are for sanity, and the actual guard is a **length check at generate time**: if the
   link exceeds a comfortable threshold, tell the user which free-text field to shorten
   instead of handing them a link that will break in transit.

A unit test asserts the realistic budget, using varied rather than repeated text so it cannot
flatter itself. That test is what stops someone adding a field in six months and quietly
breaking the sharing.

---

## 3. The honest limitation

**The link is not tamper-proof, and the UI must not imply that it is.**

There is no server, so there is no secret, so there is no integrity guarantee available. A
hash inside the payload proves nothing — anyone editing the data recomputes it. The buyer
could edit the seller's terms in the fragment before opening it.

This is acceptable, because a memorandum of sale is not a legally binding document. Will made
exactly this point: the acknowledgement "kind of acts as a little bit of security for both
sides", standing in for the estate agent's letterhead. What matters is that we do not overstate
it. So:

- No padlocks, no "verified", no "securely signed". The word "signature" is avoided; it is an
  acknowledgement, which is what it is.
- The document states that it records what the parties entered, is subject to contract, and is
  not legally binding.
- The timestamp is the signer's own device clock. It is presented as what they recorded, not as
  a certified time.

**One mitigation genuinely works with no infrastructure, and it shapes the flow:** the seller
downloads their own copy at the moment they acknowledge, *before* sending the link. They then
hold their own record of the terms they sent, so a returned document that differs is visible.
That is why "download your copy" sits in the seller's flow at step 3 rather than being an
afterthought at the end.

---

## 4. Flow and routes

Three stages, derived from the payload rather than stored as a separate field — so the stage
can never disagree with the data:

| Stage | Condition | What the user sees |
|---|---|---|
| `drafting` | no acknowledgements | Seller fills the form |
| `awaiting-buyer` | seller acknowledged only | Buyer sees seller's terms read-only, fills their part |
| `complete` | both acknowledged | Read-only document, PDF download |

A buyer acknowledgement without a seller acknowledgement is rejected as impossible: Will was
explicit that the seller dictates terms first, so that ordering is enforced in the schema, not
just in the UI.

Routes, both responsive single pages:

- **`/memorandum`** — the builder. Where the seller starts, and where they return via their own
  resume link.
- **`/memorandum/confirm#v1.…`** — the counterparty view. Buyer fills their part; once complete
  the same route renders the finished document read-only.

The handoff is symmetric: buyer acknowledges → downloads the PDF → gets a return link to send
back so the seller also holds the completed version. Both then forward the PDF to their
conveyancers themselves.

`src/proxy.ts` routes mobile traffic by user agent using an explicit path map, which these
routes are not in, so no redirect applies. That is deliberate — see the open question in §9
about whether to follow the `/m/*` duplication pattern at all.

---

## 5. Data model

Zod schemas in `src/types/memorandum.ts`, types inferred from them, per the project rule that
schemas come first and TypeScript types are never hand-written alongside.

- `PartySchema` — name, email, phone, address
- `ConveyancerSchema` — firm, contact name, email, phone. All optional: "not yet instructed" is
  the normal state at memorandum time, and the document should say so rather than look broken.
- `AcknowledgementSchema` — typed name, ISO timestamp
- `MemorandumSchema` — property, price, both parties, both conveyancers, inclusions,
  exclusions, additional contents, both chain positions, funding, deposit, target exchange and
  completion dates, notes, and the two optional acknowledgements

Chain position reuses the existing `POSITION_OPTIONS` vocabulary from the letter template, so
the two features describe a chain the same way rather than inventing a second set of words.

Caps (§2 explains why these are for sanity rather than for bounding the URL): property address
200, postcode 10, party name 120, email 100, phone 30, party address 300, conveyancer firm 120,
contact 100, inclusions 500, exclusions 300, additional contents 300, notes 600, typed name 120.

`.strict()` on the schemas, so an unexpected key in a crafted link is a rejection rather than
something that flows through untouched. Decode also enforces a hard byte ceiling before
inflating, so a hostile link cannot ask us to allocate megabytes.

---

## 6. The document

Rendered by a pure function so it can be unit-tested and so the on-screen preview and the PDF
cannot drift apart.

Required wording, present unconditionally:

- **"Subject to contract"** on the document itself.
- A statement that this is not a legally binding agreement and neither party is committed until
  contracts are exchanged.
- That it applies to **England and Wales**. Scotland's process is different — offers go through
  solicitors and become binding at conclusion of missives — so we say which jurisdiction this
  is for rather than quietly being wrong for Scottish users.

---

## 7. PDF

`@react-pdf/renderer`, the stack's locked choice in `CLAUDE.md`. Not currently installed;
installing it follows the spec rather than substituting for it.

**It must run client-side.** Generating the PDF on the server would post the whole document to
us, destroying the §2 privacy property that the fragment exists to provide. That, not bundle
size, is the deciding argument. It is imported through `next/dynamic` only when someone clicks
download, so the weight never lands on first paint.

---

## 8. Testing

Vitest is configured for `src/**/*.test.ts` in a node environment. React Testing Library and
jsdom are **not** installed, so component tests are not currently possible — see §9.

Everything decision-carrying is therefore a pure function, tested directly:

- **`share-link.test.ts`** — round-trip including unicode, emoji, newlines and quotes;
  rejects garbage, truncated payloads, an unknown version prefix, and oversized input; and
  asserts the realistic size budget with varied text.
- **`memorandum.test.ts`** — required fields, every cap, `.strict()` rejecting unknown keys,
  and that a buyer acknowledgement without a seller one is refused.
- **`stage.test.ts`** — stage derivation for all three states, and the impossible fourth.
- **`document.test.ts`** — inclusions and exclusions phrasing, the acknowledgement sentence
  matching Will's wording, "subject to contract" present in every rendering, and the
  not-instructed-conveyancer case reading properly.

Each commit passes `npx tsc --noEmit`, `npm run lint`, `npm run build` and `npm test`.

---

## 9. Open questions

1. **Component tests.** Adding React Testing Library + jsdom would let the two-party flow be
   tested end to end rather than only its pure parts. That is three new dev dependencies and a
   Vitest config change. Worth doing, but a separate decision.
2. **Mobile route.** The app currently duplicates every page under `/m/*`. For a form-heavy
   page that means maintaining two copies of a long form, which is where bugs breed. One
   responsive page is the better engineering call, and it is what §4 assumes — but it does
   deviate from the established pattern.
3. **The typed-name check.** Whether the acknowledgement name must match the party's own name
   field. A hard match is a meaningful integrity gesture but breaks on middle names and
   initials. Proposal: require non-empty, and note a mismatch without blocking.
4. **Will's copy.** The document has legal-ish framing text that Will may want to word himself.
   Ships with mine, clearly marked.

---

## 10. What C2 adds later

Server-stored deal, magic-link email to the counterparty, and the completed PDF dispatched
automatically to buyer, seller and both conveyancers. That needs Supabase with RLS, a
transactional email provider, a retention policy and a published privacy notice.

C1 is not a throwaway prototype of C2: the schema, the document renderer and the PDF are all
reused, and only the transport changes. What C2 buys is convenience, at the cost of becoming a
data controller for third-party contact details. C1 deliberately avoids that.
