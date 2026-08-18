# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read first:** See `AGENTS.md` for Next.js version-specific rules. Read the bundled docs at `node_modules/next/dist/docs/` before writing any Next.js code.

## Project overview

**Offline.homes** (offline.homes) — B2C Next.js web app for off-market property letters. UK home movers draw a map area, select specific addresses, compose a templated letter, pay via Stripe, and the app posts physical letters via the Stannp API. The business plan is in `business-plan.md`.

---

## Agentic workflow — follow this on every task

1. **Plan first.** Before writing any code, write a short plan (what files you'll create/modify, in what order, why). Get confirmation before proceeding.
2. **One feature at a time.** Complete → verify → commit before starting the next.
3. **Read before write.** Always read the files you'll modify before editing them.
4. **Verify after every meaningful change.** Run the verification gate (see below) after each feature, not at the end.
5. **Self-reflect on diffs.** After generating a non-trivial block of code, re-read it and identify potential edge cases or bugs before moving on.
6. **Never leave broken state.** If verification fails, fix it before touching anything else.

---

## Verification gate — must pass before any commit

```bash
npx tsc --noEmit          # zero type errors
npm run lint              # zero ESLint errors
npm run build             # successful production build
```

---

## Stack (locked choices — do not substitute without asking)

| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase (Postgres + Supabase Auth) |
| Maps | MapLibre GL JS + OS Places API |
| Payments | Stripe (Checkout Sessions) |
| Direct mail | Stannp API (abstracted — see below) |
| PDF generation | `@react-pdf/renderer` |
| Validation | Zod (everywhere — env vars, API inputs, external responses) |
| Testing | Vitest + React Testing Library + Playwright (E2E) |
| Error tracking | Sentry |

---

## Directory structure

```
src/
  app/                    # Next.js App Router pages and layouts
  components/             # Shared UI components (pure, no data fetching)
  features/               # Feature-scoped modules (map/, letter/, basket/, orders/)
    [feature]/
      components/         # Feature-specific UI
      hooks/              # Feature-specific hooks
      actions.ts          # Next.js Server Actions for this feature
      queries.ts          # Supabase read queries
      mutations.ts        # Supabase write queries
  lib/
    mail-provider.ts      # Abstract MailProvider interface + StannpProvider impl
    stripe.ts             # Stripe client singleton + helpers
    supabase/             # Supabase server/client/middleware helpers
    campaign-store.ts     # Client-side campaign state (useSyncExternalStore + localStorage)
    constants.ts          # Pricing, caps, template IDs — never inline these
    env.ts                # Zod env validation — import env from here, never process.env directly
  types/                  # Shared Zod schemas and inferred TS types
supabase/
  migrations/             # ALL schema changes live here — never edit schema directly
  seed.sql
```

---

## Architecture rules

- **No business logic in route handlers or page components.** Routes call Server Actions; Server Actions call feature-level functions; those call `lib/`.
- **No `"use client"` unless the component genuinely needs browser APIs or interactivity.** Default to Server Components.
- **Validate at every boundary with Zod.** All incoming HTTP request bodies, all external API responses (Stannp, OS Places), all environment variables at startup.
- **Types first.** Define Zod schemas in `types/` before implementing the feature. Infer TypeScript types from Zod schemas — never write duplicate manual declarations.

---

## TypeScript — strict settings required

`tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## Database rules

- **All schema changes via Supabase migrations only.** Generate with `supabase migration new <name>`.
- **Every table must have RLS enabled and at least one policy.** Default deny.
- **Table naming:** `snake_case`, plural nouns.
- **Always use `created_at` and `updated_at` timestamps** with `DEFAULT now()`.

---

## External integrations

### Stripe
- Use Checkout Sessions for the MVP.
- Verify webhook signatures on every event.
- Make webhook handlers **idempotent**: check order state before applying transitions.

### Stannp
- All Stannp calls go through `lib/mail-provider.ts` via the `MailProvider` interface.
- Dispatch letters only after Stripe webhook confirms `checkout.session.completed`.

### OS Places API
- Validate every address object with a Zod schema before storing or displaying.
- Cache autocomplete results in session storage — do not call the API on every keystroke.

### PDF / letters
- Render letters using a whitelist of interpolation variables only (e.g. `{{street_address}}`).
- Sanitise all user-supplied text before interpolation.

---

## Environment variables

Import `env` from `lib/env.ts` everywhere. Never access `process.env` directly in feature code.

---

## MVP scope

**In scope:** map-based property picker, address resolution, letter templates, letter preview, basket + pricing, Stripe checkout, Stannp dispatch, order dashboard, terms/AUP page.

**Out of scope — do not implement:**
- Land Registry owner lookup / named owner addressing (Mode B)
- Auto-followups, investor analytics, mobile app

---

## Brand

Name is always written **Offline.homes** (capital O, with the dot; the dot renders coral in UI — use the `Logo` component in `src/components/logo.tsx`). Colours and font (Poppins) are defined as Tailwind `@theme` tokens in `src/app/globals.css` (`coral`, `coral-dark`, `coral-soft`, `navy`, `navy-soft`, `cream`, `sand`) — use the tokens, never raw hex or indigo/slate palette classes. Full brand spec: `docs/REBRAND_PLAN.md`.

## Critical constraints

### GDPR — Mode A only, for letters
Letters must be addressed to "The Homeowner" or "The Occupier". Never acquire, store or transmit
a homeowner's name for the purpose of addressing a letter. This blocks Mode B — buying Land
Registry or similar owner data to write to strangers by name — and it is absolute.

The rule is about **people we contact without their knowledge**. It does not prohibit a user
entering their own details, or the details of someone they are already dealing with, into a
document they are creating themselves. The memorandum of sale is the case in point: a seller
and a buyer who have already met fill in their own names, their conveyancers and their terms.
The distinction is consent and origin, not whether a name appears.

Where a feature handles named parties on that basis:
- Only ever data the user typed themselves, never data we sourced about a third party.
- Prefer designs that keep it off our servers entirely — the memorandum travels in a URL
  fragment, which is never sent in the HTTP request, so we never receive or log it.
- If a future feature does need to store it, that is the point at which a privacy notice, a
  retention policy and RLS become prerequisites rather than follow-ups.

### Pricing floor
Minimum £2.50/letter. Packs: 5 for £14.99, 10 for £24.99, 25 for £49.99. All prices live in `lib/constants.ts`.

### Volume caps
Max 50 letters/campaign enforced server-side and in UI. Defined in `lib/constants.ts`.

---

## Dev commands

```bash
npm run dev          # start dev server (Next.js 16 + Turbopack)
npm run build        # production build
npm run lint         # ESLint (zero warnings/errors required)
npx tsc --noEmit     # type check (zero errors required)
supabase start       # local Supabase stack
supabase migration new <name>   # create a new migration
```

## Current app structure (Phase 1 — demo, no auth/payments yet)

- `/` — landing page
- `/map` — MapLibre map with satellite toggle; addresses load for the viewport past zoom 16 (tap dots to select) or via a Terra Draw freehand lasso (drag to outline, release to finish); Overpass/Nominatim address fetch, address list
- `/refine` — filter selected addresses by property type, size, attributes, years owned. Real data via the Chimnie Data API (`lib/property-enrichment.ts`; set `CHIMNIE_API_KEY`), with the free sandbox postcode CH1 1MN demoable keyless ("Try demo addresses" on the map page) and a deterministic sample-data fallback otherwise. Never call Chimnie with a blank `fields` param. Lookups deliberately include one Premium-tier field (garden), billing 15p each — any other tier increase must be a deliberate decision (enforced by the tier allowlist test).
- `/letter` — template editor + HTML letter preview
- `/basket` — address list, pricing, mock checkout CTA
- `/confirm` — order confirmation (mock)

State flows through `lib/campaign-store.ts` (localStorage-backed `useSyncExternalStore`).
Map tiles default to CartoDB Voyager raster (no key). Set `NEXT_PUBLIC_MAPTILER_API_KEY` for vector tiles.

## Phase 2 checklist (not yet built)
- Supabase Auth (magic link)
- Stripe Checkout Session + webhook
- Stannp dispatch via `lib/mail-provider.ts`
- Order dashboard
- Terms page
