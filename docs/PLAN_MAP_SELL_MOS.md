# Plan — Map usability, /sell page, Memorandum of Sale

Status: **agreed, not yet implemented**
Date: 2026-08-17
Source: Will's voice notes (14, 16, 17 Aug), WhatsApp thread, and his 12-step "sell without an agent" guide.

---

## 0. Two corrections to the record

**The addresses on the map are real.** `src/lib/geocoding/overpass.ts` pulls live
OpenStreetMap addresses for the drawn area or viewport. What is sample data is the
**enrichment** shown on `/refine` (property type, size, attributes, years owned): that
falls back to deterministic sample values unless `CHIMNIE_API_KEY` is set, with `CH1 1MN`
being the only real postcode available keyless. The distinction is currently not obvious
in the UI, which is how the confusion started — see A4.

**The "try demo addresses" feature did not disappear.** It is still present on both
desktop (`MapPageClient.tsx:190`) and mobile (`MobileMapPageClient.tsx:250`). On mobile it
sits at the bottom of the bottom sheet, below the fold, which is effectively invisible.

**`Offline.homes/sell` is already promised to homeowners and currently 404s.**
`src/features/letter/templates/friendly-home-mover.ts:99` closes every letter with
*"just visit us at Offline.homes/sell."* Not urgent while Stannp dispatch is unbuilt, but
the page is a commitment the product has already made, not a nice-to-have.

---

## 1. Root causes behind the two map failures

Will's sister hit two problems in Puddletown. Both have identifiable causes in the code.

### "All the properties from recent searches came up again"

`MapPageClient.tsx:49-55` builds the map pins by merging the Overpass results for the
current area with `campaignState.selectedAddresses` — which lives in `localStorage` and
never expires:

```ts
const pinAddresses = useMemo(() => {
  const byId = new Map(addresses.map((a) => [a.id, a]))
  for (const a of campaignState.selectedAddresses) {
    if (!byId.has(a.id)) byId.set(a.id, a)
  }
  return [...byId.values()]
}, [addresses, campaignState.selectedAddresses])
```

There is no reset control, no expiry, and no signal that a stored session is being
restored. She picked up a phone carrying someone else's in-progress campaign.

The merge itself is deliberate and correct — it keeps selections visible when you pan away.
And selections must survive `/map → /refine → back`, so **clearing on page load would be a
regression, not a fix**. The correct fix is to make persistence *visible and reversible*.

### "She struggled with the draw a map functionality"

The current tool is a freehand lasso (`TerraDrawFreehandMode`, `drawInteraction:
"click-drag"`). Drag is the map's own pan gesture everywhere else in the world, so the
interaction fights muscle memory — acutely so on touch.

Worth recording: commit `08360f8` already moved *tap-vertex polygon → freehand lasso*.
This is the second attempt at the same problem, so the fix is not "choose a better single
mode" but "make the default impossible to get wrong, and offer a choice".

---

## 2. Workstreams and sequencing

| # | Workstream | Backend needed | Runs |
|---|---|---|---|
| A | Map usability | No | Now, parallel with B |
| B | `/sell` guide page | No | Now, parallel with A |
| C1 | Memorandum of Sale, link handoff | No | After A + B |
| C2 | Memorandum of Sale, email round-trip | **Yes** | Phase 2 |
| D | Phase 2 infrastructure | **Yes** | Later |

A and B share no files, so they ship as two independent PRs.

---

## A. Map usability

### A1 — Make the stored session visible and reversible

- Add `lastUpdatedAt: number` to `CampaignState` in `src/lib/campaign-store.ts`, stamped on
  every `setState`. Handle absence gracefully so sessions saved before this field still load.
- Add `CAMPAIGN_STALE_MS` (24h) to `src/lib/constants.ts`.
- On arrival at `/map`, if a stored campaign exists **and** is stale, show a resume prompt:
  *"You have 12 addresses saved from a previous search. Continue, or start fresh?"* Do not
  restore silently.
- Add an always-visible **"Your list (n) · Clear"** chip on the map, wired to
  `campaignStore.clear()` with a confirm step.

### A2 — Radius circle as the default area selector *(decided)*

Tap a point, then size the circle with a slider. No drag gesture, so it never competes with
map panning, and it matches how people describe a search ("homes near the school").

- New pure module `src/lib/geo/circle.ts` exporting
  `circleToPolygonRing(center: [number, number], radiusMetres: number, steps: number): PolygonRing`
  — a 64-gon approximation, unit-tested with Vitest.
- The resulting ring feeds the **existing** `fetchAddressesInPolygon` path unchanged. No new
  data-fetching code.
- New `AreaSelectControl.tsx`: mode switcher (Circle / Lasso), radius slider, and an explicit
  **"Find homes here"** button. Nothing fires until the user confirms, so no Overpass calls
  while dragging the slider.
- `PropertyMap.tsx` gains a `mode` prop and renders the circle as a GeoJSON source + layer
  with a centre marker. Tapping again moves the centre.
- Radius constants in `src/lib/constants.ts`: default 250m, min 100m, max 1000m. The max is a
  deliberate guard on Overpass load and pairs with the existing
  `MAP_DEFAULTS.MAX_ADDRESSES_PER_DRAW` cap of 50.
- Freehand lasso is retained behind the switcher for irregular areas.

### A3 — First-run guidance

One-time coach mark on the area control, flagged in `localStorage`. Persistent inline
instruction text while a mode is active (the current hint only appears mid-draw).

### A4 — Honesty and discoverability fixes

- `/refine`: state plainly which fields are live Chimnie data and which are sample values.
  `DataAttribution.tsx` is the natural home.
- Mobile: lift "Try demo addresses" out of the bottom of the sheet to somewhere visible.

**Files touched:** `lib/campaign-store.ts`, `lib/constants.ts`, new `lib/geo/circle.ts`,
`features/map/components/{PropertyMap,MapPageClient,MobileMapPageClient}.tsx`, new
`features/map/components/AreaSelectControl.tsx`, `features/refine/components/DataAttribution.tsx`.

---

## B. `/sell` — the guide page

Will's 12-step guide, server-rendered, SEO-targeted, with referral partners embedded in the
steps where they are genuinely useful.

- `src/app/sell/page.tsx` — Server Component. Full metadata plus `HowTo` JSON-LD structured
  data, since organic search is the point of this page.
- `src/features/sell/content.ts` — the 12 steps as typed data, so Will's copy lives in one
  editable place rather than scattered through JSX.
- `src/lib/referrals.ts` — typed registry of referral partners: display name, destination,
  which step it attaches to, and its disclosure line. All outbound links get
  `rel="sponsored nofollow"` and `target="_blank"`.
  - Step 2 (independent valuation) → eServe Chartered Surveyors, £100/referral
  - Step 3 (EPC) → provider TBC
  - Step 6 (instruct a conveyancer) → Open Door Conveyancing, £200/converted case
- Free **memorandum of sale template** as the lead magnet, linking through to C1 once built.
- **Referral disclosure** is built in from day one, not retrofitted: a short, plain "how we
  make money" statement. UK CAP rules require affiliate relationships to be obvious to the
  reader, and this page's whole credibility rests on being straight with people.
- Link `/sell` from the landing page nav and footer. The letter template already points there.

**Deferred to D:** the instant-quote engine Will described. Capturing "here are my details,
quote me" means storing a named third party's contact data — that needs a database, a
privacy policy and a consent record. Plain referral links carry most of the value now with
none of that weight.

---

## C. Memorandum of Sale

Will's design instincts here are right and the build follows them:

- **No signature upload.** Realistically nobody has a correctly-scaled, transparent-background
  signature image on their phone, and the ones who do will produce something that looks poor.
- **Typed name + tick + timestamp** as the acknowledgement:
  *"I, William Boltwood, agree to the terms of the sale as outlined in this document — 10:23, 16 August 2026."*
- **Seller completes first.** They own the property, so they dictate what is included —
  fixtures, fittings, exclusions ("all fixtures and fittings except the living room
  chandelier"), and additional contents ("washing machine and tumble dryer").
- **Buyer receives it pre-filled** and completes their own side: their details, their
  conveyancer, chain position.
- The document is marked **"Subject to contract — not a legally binding agreement"**
  throughout. A memorandum of sale is not a legal instrument; the acknowledgement exists to
  give both sides comfort in the absence of an estate agent, which is exactly the gap this
  fills.

### C1 — Link handoff, no backend *(decided: build this first)*

1. Seller fills the form. Reuses the `/letter` editor pattern — same interaction model, more
   fields — so there is nothing new to learn.
2. Live preview alongside, as with the letter preview.
3. Seller acknowledges, then gets a **shareable link with the completed data encoded in the
   URL fragment**, which they send to the buyer however they like — email, WhatsApp, text.
4. Buyer opens the link, sees it pre-filled, adds their side, acknowledges.
5. Both download the finished PDF (`@react-pdf/renderer`, the stack's locked choice) and
   forward it to their conveyancers.

Encoding the payload in the URL **fragment** rather than the query string means the data is
never transmitted to our server at all — the fragment stays client-side by design. For a
document full of names, addresses and sale terms, that is a real privacy property and not
just a convenience.

This ships in days, needs no infrastructure, creates no data-retention obligation, and is
fully usable by private buyers and sellers with no connection to the letter service —
which was Will's SEO point in the thread.

### C2 — The DocuSign-style round-trip *(Phase 2)*

Server-stored deal record, magic-link email to the counterparty, completed PDF dispatched
automatically to buyer, seller and both conveyancers. Requires Supabase with RLS, a
transactional email provider (Resend), a retention policy and a published privacy notice.

This is infrastructure, not a feature. All of the cost, security and data-protection weight
of the memorandum sits in this email round-trip, which is why C1 goes first: it delivers the
page, the lead magnet and most of the user value without any of it. C2 then rides in on the
Supabase work already sitting on the Phase 2 checklist rather than dragging it forward alone.

---

## D. Phase 2 — infrastructure-dependent

- Supabase (auth, deal records, RLS) + Resend → unlocks C2
- Conveyancing instant-quote engine with lead capture (needs consent + privacy policy)
- **Referral attribution tracking** — no way to claim £100 and £200 referral fees without
  evidence of who was introduced and when
- Terms of service and privacy policy pages (currently on the Phase 2 checklist; they stop
  being optional the moment we capture a single lead)

---

## Compliance notes

**`CLAUDE.md` needs amending before C is built.** It currently states, without
qualification: *"GDPR — Mode A only. Letters must be addressed to 'The Homeowner' or 'The
Occupier'. No named owner data stored or transmitted."*

That rule exists to block Mode B — buying Land Registry owner data to address strangers by
name — and it should stay absolute for letters. But a memorandum of sale is by definition
full of named individuals: buyer, seller, and both conveyancers. The difference is consent
and origin: in Mode B we would acquire a stranger's name without their knowledge, whereas in
the memorandum the parties enter their own details into their own document.

The section must be reworded to draw that line explicitly. Left as-is, the next agent to
open this repo will read Workstream C as prohibited and either refuse it or half-build it.

**Referral disclosure** (Workstream B) is a CAP Code requirement, not a stylistic choice.

**Positioning on referrals:** we are introducing consumers to surveyors and conveyancers for
a fee. Copy should read as signposting, never as advice or recommendation.

---

## Verification

Every PR passes the gate in `CLAUDE.md` before commit:

```bash
npx tsc --noEmit    # zero type errors
npm run lint        # zero ESLint errors
npm run build       # successful production build
npm test            # Vitest — new units in lib/geo/circle.ts, lib/referrals.ts
```

Manual check for A: on a phone, cold-load `/map`, place a circle over a village, confirm the
homes found are the ones inside it, navigate to `/refine` and back and confirm the selection
survives, then clear the list and confirm the map returns to empty.

---

## Open questions for Will

1. EPC referral partner for step 3 — is there one, or does that step stay a plain how-to?
2. Final copy for the 12 steps. The build ships with his text as-is and clearly marked
   placeholders wherever wording is still needed.
3. C2 later asks whether the platform emails conveyancers directly. If so, we need their
   addresses from both parties, which is one more reason it belongs behind the Supabase work.
