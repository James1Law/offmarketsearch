# Plan — Map honesty, map usability, /sell page, Memorandum of Sale

Status: **agreed, in progress**
Date: 2026-08-17
Source: Will's voice notes (14, 16, 17 Aug), WhatsApp thread, and his 12-step "sell without an agent" guide.

---

## 0. What the data actually is

Three separate routes put addresses on the map. They do not behave the same way, and the
difference is the origin of most of the confusion in the WhatsApp thread.

| Route | Source | When it finds nothing |
|---|---|---|
| Pan/zoom to ≥16 | OpenStreetMap via Overpass | returns an empty list |
| Draw an area | OpenStreetMap via Overpass | **fabricates 8 addresses** |
| "Try demo addresses" | Chimnie sandbox endpoint (keyless) | throws, button re-enables |

**Drawing an area can invent addresses.** `overpass.ts:39` falls back to
`fallbackPolygonAddresses` whenever `runAddressQuery` returns `null` — which happens on a
timeout, on an HTTP error, **and when the query simply matched nothing** (`overpass.ts:87`).
The fallback emits eight fictional addresses on Maple Avenue, Oak Street, Church Lane, High
Street and Victoria Road with `SW1A` postcodes, positioned inside the drawn shape so they
look entirely plausible on the map (`overpass.ts:100-137`).

Puddletown is a Dorset village, and OSM `addr:housenumber` coverage in rural England is
patchy. A lasso there returning zero real addresses is the expected case, not an edge case.
Will drew an area, got eight invented London addresses, and correctly concluded the data was
fake. **This is the single most damaging behaviour in the app** and Workstream A0 removes it.

**Chimnie has nothing to do with finding addresses.** Its job is `/refine` enrichment —
property type, bedrooms, floor area, garden, EPC, council tax, estimated value, last sold,
years owned, sale propensity. One lookup per selected address, attempted only when
(`property-enrichment.ts:307-310`):

```ts
return Boolean(env.CHIMNIE_API_KEY) || isSandboxAddress(address)
```

Each real lookup bills 15p — 10p Core plus the deliberately-included Premium `garden` field.

**There is no `CHIMNIE_API_KEY` in production.** The sandbox is being stretched as far as it
goes before committing to paid usage. So today, in the live app, every address except
`CH1 1MN` gets `sampleEnrichment()` — deterministic fake values seeded off the address id.
That makes two things load-bearing rather than cosmetic:

- the demo path is the *only* route to real Chimnie data, so it has to be easy to reach
- `/refine` must be honest per-row about which values are real, because almost none are

`/refine` does already label this, but the check is `liveCount > 0` (`RefinePageClient.tsx:110`),
so a single real address among thirty labels the whole screen "Property data by Chimnie".

**The "try demo addresses" button was not buried — it is conditionally hidden.**
`MobileMapPageClient.tsx:244` renders it only when `selectedCount === 0`. Will had addresses
restored from `localStorage` the moment the page opened, so the button was gone before he
touched anything. His bug report was precise.

---

## 1. Root causes behind the two map failures

### "All the properties from recent searches came up again"

Two mechanisms, and the second is the one that fires for someone who draws rather than pans.

1. `MapPageClient.tsx:49-55` merges `campaignState.selectedAddresses` — `localStorage`, never
   expires — into the map pins, with no reset control and no signal that a stored session is
   being restored.
2. **The fabricated addresses use hardcoded ids** `mock-0` … `mock-7` (`overpass.ts:129`).
   Every fallback anywhere in the country emits the same eight ids. Draw an area, select
   some, draw somewhere entirely different, and the previous selections match by id and
   reappear pre-ticked. The dataset guarantees the collision.

The merge in (1) is deliberate and correct — selections must survive `/map → /refine → back`
— so clearing on page load would be a regression. The fix is removing the id collision (A0)
and making persistence visible and reversible (A2).

### "She struggled with the draw a map functionality"

The current tool is a freehand lasso (`TerraDrawFreehandMode`, `drawInteraction: "click-drag"`).
Drag is the map's own pan gesture everywhere else, so the interaction fights muscle memory —
acutely so on touch.

Commit `08360f8` already moved *tap-vertex polygon → freehand lasso*. This is the second
attempt at the same problem, so the fix is not "choose a better single mode" but "make the
default impossible to get wrong, and offer a choice".

---

## 2. Workstreams and sequencing

| # | Workstream | Backend needed | Order |
|---|---|---|---|
| A0 | Stop fabricating addresses | No | **First** |
| A1 | Honest provenance + demo access | No | With A0 |
| A2 | Session visible and clearable | No | Then |
| A3 | Radius-circle area selection | No | Then |
| B | `/sell` guide page | No | Independent |
| C1 | Memorandum of Sale, link handoff | No | After A + B |
| C2 | Memorandum of Sale, email round-trip | **Yes** | Phase 2 |
| D | Phase 2 infrastructure | **Yes** | Later |

All of this lands on `claude/home-sale-without-agent-cc5fl1` as a commit series on PR #14,
rather than separate PRs, per the branch constraint on this project.

---

## A0. Stop fabricating addresses *(first — it is actively misleading)*

- Delete `fallbackPolygonAddresses` and `mockAddresses` from `src/lib/geocoding/overpass.ts`.
  `fetchAddressesInPolygon` returns `[]` on no-match, matching the bbox path.
- Distinguish "haven't searched yet" from "searched and found nothing" in
  `useOverpassAddresses` — currently indistinguishable, both being an empty array.
- Honest empty state: *"No addresses found in that area. OpenStreetMap coverage can be patchy
  in rural areas — try a wider area, or load the demo addresses."*
- Tests with a mocked `fetch` covering: no match → empty, HTTP error → empty, timeout →
  empty. The point of the test is that no code path can invent an address.

A paying customer is about to spend £2.50 a letter. Sending one to "3 Maple Avenue, SW1A 1AA"
because Overpass was quiet is the worst failure this product can have.

## A1. Honest provenance and reachable demo

- Per-row `source` labelling on `/refine`. `EnrichmentResult.source` is already
  `"chimnie" | "sample"`, so the data is there — only the presentation is all-or-nothing.
- Make "Try demo addresses" visible regardless of `selectedCount` on both clients.
- Add `CHIMNIE_API_KEY` to `.env.example`, which currently omits it entirely.

## A2. Make the saved campaign visible and clearable

- Add `lastUpdatedAt: number` to `CampaignState`, stamped on every `setState`. Tolerate its
  absence so sessions saved before this field still load.
- `CAMPAIGN_STALE_MS` (24h) in `src/lib/constants.ts`.
- Always-visible **"Your list (n) · Clear"** chip on the map, with a confirm step.
- On arrival with a *stale* stored campaign, prompt: *"You have 12 addresses saved from a
  previous search. Continue, or start fresh?"* Never restore silently.

## A3. Radius circle as the default area selector *(decided)*

Tap a point, then size the circle with a slider. No drag gesture, so it never competes with
map panning, and it matches how people describe a search ("homes near the school").

- New pure module `src/lib/geo/circle.ts`:
  `circleToPolygonRing(center, radiusMetres, steps): PolygonRing` — a 64-gon approximation,
  unit-tested.
- The ring feeds the **existing** `fetchAddressesInPolygon` path unchanged. No new fetching code.
- New `AreaSelectControl.tsx`: mode switcher (Circle / Lasso), radius slider, explicit
  **"Find homes here"** button. Nothing fires until the user confirms, so dragging the slider
  costs no Overpass calls.
- `PropertyMap.tsx` gains a `mode` prop and renders the circle as a GeoJSON source + layer
  with a centre marker. Tapping again moves the centre.
- Radius: default 250m, min 100m, max 1000m. The max guards Overpass load and pairs with the
  existing `MAX_ADDRESSES_PER_DRAW` cap of 50.
- Lasso retained behind the switcher for irregular areas.
- One-time coach mark on the area control, flagged in `localStorage`.

**Files touched across A:** `lib/geocoding/overpass.ts`, `lib/campaign-store.ts`,
`lib/constants.ts`, new `lib/geo/circle.ts`, `features/map/hooks/useOverpassAddresses.ts`,
`features/map/components/*`, `features/refine/components/*`, `.env.example`.

---

## B. `/sell` — the guide page

Will's 12-step guide, server-rendered, SEO-targeted, with referral partners embedded in the
steps where they are genuinely useful.

- `src/app/sell/page.tsx` — Server Component, full metadata plus `HowTo` JSON-LD, since
  organic search is the point of the page.
- `src/features/sell/content.ts` — the 12 steps as typed data, so Will's copy lives in one
  editable place rather than scattered through JSX.
- `src/lib/referrals.ts` — typed registry: display name, destination, the step it attaches
  to, and its disclosure line. All outbound links get `rel="sponsored nofollow"`.
  - Step 2 (independent valuation) → eServe Chartered Surveyors, £100/referral
  - Step 3 (EPC) → provider TBC
  - Step 6 (instruct a conveyancer) → Open Door Conveyancing, £200/converted case
- Free **memorandum of sale template** as the lead magnet, linking to C1 once built.
- **Referral disclosure** built in from day one: a short, plain "how we make money"
  statement. UK CAP rules require affiliate relationships to be obvious, and this page's
  credibility rests on being straight with people.
- Link `/sell` from the landing nav and footer. The letter template already points there —
  `friendly-home-mover.ts:99` closes every letter with *"just visit us at Offline.homes/sell"*,
  which currently 404s.

**Deferred to D:** the instant-quote engine. Capturing "quote me" details means storing a
named third party's contact data — that needs a database, a privacy policy and a consent
record. Plain referral links carry most of the value with none of that weight.

---

## C. Memorandum of Sale

Will's design instincts here are right and the build follows them:

- **No signature upload.** Realistically nobody has a correctly-scaled,
  transparent-background signature image on their phone, and the ones who do will produce
  something that looks poor.
- **Typed name + tick + timestamp** as the acknowledgement:
  *"I, William Boltwood, agree to the terms of the sale as outlined in this document — 10:23, 16 August 2026."*
- **Seller completes first.** They own the property, so they dictate what is included —
  fixtures, fittings, exclusions ("all fixtures and fittings except the living room
  chandelier"), and additional contents ("washing machine and tumble dryer").
- **Buyer receives it pre-filled** and completes their side: their details, their
  conveyancer, chain position.
- Marked **"Subject to contract — not a legally binding agreement"** throughout. A memorandum
  of sale is not a legal instrument; the acknowledgement exists to give both sides comfort in
  the absence of an estate agent, which is exactly the gap this fills.

### C1 — Link handoff, no backend *(decided: build this first)*

1. Seller fills the form, reusing the `/letter` editor pattern — same interaction model, more
   fields, nothing new to learn.
2. Live preview alongside, as with the letter preview.
3. Seller acknowledges, then gets a **shareable link with the data encoded in the URL
   fragment**, which they send to the buyer however they like.
4. Buyer opens it pre-filled, adds their side, acknowledges.
5. Both download the PDF (`@react-pdf/renderer`, the stack's locked choice) and forward it to
   their conveyancers.

The **fragment** matters: it is never transmitted to our server. For a document full of
names, addresses and sale terms that is a real privacy property, not just a convenience.

### C2 — The DocuSign-style round-trip *(Phase 2)*

Server-stored deal record, magic-link email to the counterparty, completed PDF dispatched to
buyer, seller and both conveyancers. Requires Supabase with RLS, transactional email
(Resend), a retention policy and a published privacy notice.

This is infrastructure, not a feature. All the cost, security and data-protection weight of
the memorandum sits in the email round-trip, which is why C1 goes first: it delivers the page,
the lead magnet and most of the user value without any of it. C2 then rides in on the Supabase
work already on the Phase 2 checklist rather than dragging it forward alone.

---

## D. Phase 2 — infrastructure-dependent

- Supabase (auth, deal records, RLS) + Resend → unlocks C2
- Conveyancing instant-quote engine with lead capture (needs consent + privacy policy)
- **Referral attribution tracking** — no way to claim £100 and £200 referral fees without
  evidence of who was introduced and when
- Terms of service and privacy policy pages (currently on the Phase 2 checklist; they stop
  being optional the moment we capture a single lead)
- A paid `CHIMNIE_API_KEY`, once the sandbox stops being enough

---

## Compliance notes

**`CLAUDE.md` needs amending before C is built.** It currently states, without
qualification: *"GDPR — Mode A only. Letters must be addressed to 'The Homeowner' or 'The
Occupier'. No named owner data stored or transmitted."*

That rule exists to block Mode B — buying Land Registry owner data to address strangers by
name — and it should stay absolute for letters. But a memorandum of sale is by definition
full of named individuals: buyer, seller and both conveyancers. The difference is consent and
origin: in Mode B we would acquire a stranger's name without their knowledge, whereas in the
memorandum the parties enter their own details into their own document.

The section must be reworded to draw that line explicitly. Left as-is, the next agent to open
this repo will read Workstream C as prohibited and either refuse it or half-build it.

**Referral disclosure** (Workstream B) is a CAP Code requirement, not a stylistic choice.

**Positioning on referrals:** we are introducing consumers to surveyors and conveyancers for
a fee. Copy should read as signposting, never as advice or recommendation.

---

## Verification

Every commit passes the gate in `CLAUDE.md`:

```bash
npx tsc --noEmit    # zero type errors
npm run lint        # zero ESLint errors
npm run build       # successful production build
npm test            # Vitest
```

Manual check for A: on a phone, cold-load `/map`, place a circle over a village, confirm the
homes found are genuinely inside it — and that an area with no OSM coverage says so rather
than inventing eight. Navigate to `/refine` and back, confirm the selection survives, then
clear the list and confirm the map returns to empty.

---

## Open questions for Will

1. EPC referral partner for step 3 — is there one, or does that step stay a plain how-to?
2. Final copy for the 12 steps. The build ships his text as-is, with placeholders clearly
   marked wherever wording is still needed.
3. C2 later asks whether the platform emails conveyancers directly. If so we need their
   addresses from both parties, which is one more reason it sits behind the Supabase work.
