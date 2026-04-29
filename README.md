# LetterDrop — Off-Market Property Search

Write personal letters to homeowners before their property hits the market.

**Live demo flow:** Draw an area on the map → select houses → compose a letter → review & pay → letters are printed and posted for you.

---

## What it does

UK home movers use LetterDrop to reach homeowners directly. The user draws a rectangle on a map, picks the houses they want to contact, writes a personalised letter using a template, and pays per letter. LetterDrop handles printing and posting via Stannp's direct mail API.

Letters are addressed to "The Homeowner" — no Land Registry lookups, no named personal data. This keeps the service legally straightforward under UK GDPR.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Maps | MapLibre GL JS + OpenStreetMap / Overpass API |
| Database + Auth | Supabase (Phase 2) |
| Payments | Stripe Checkout (Phase 2) |
| Letter dispatch | Stannp API (Phase 2) |
| Validation | Zod |
| Deployment | Vercel |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are needed to run the demo. The map uses free CartoDB raster tiles and address data comes from the OpenStreetMap Overpass API (with a realistic mock fallback if the query times out).

### Optional: upgrade to vector map tiles

Sign up for a free [MapTiler](https://maptiler.com) account and add the key to `.env.local`:

```
NEXT_PUBLIC_MAPTILER_API_KEY=your_key_here
```

---

## Project structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx            # Landing page
    map/                # Step 1 — find addresses
    letter/             # Step 2 — write letter
    basket/             # Step 3 — review & pay
    confirm/            # Order confirmation
  features/
    map/                # MapLibre map, drawing tool, Overpass/Nominatim hooks
    letter/             # Template, editor, preview
    basket/             # Pricing, basket summary
  lib/
    campaign-store.ts   # Cross-page state (localStorage + useSyncExternalStore)
    constants.ts        # Pricing, caps, template IDs
    env.ts              # Zod env validation
    geocoding/          # Nominatim (search) + Overpass (addresses in area)
  types/                # Zod schemas + inferred TypeScript types
supabase/
  migrations/           # Postgres schema + RLS policies (Phase 2)
```

---

## Deployment

### Vercel (recommended)

Import this repo at [vercel.com/new](https://vercel.com/new). No environment variables are required for Phase 1. Vercel auto-detects Next.js.

### Environment variables

Copy `.env.example` to `.env.local` and fill in as you wire up each service:

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Better map tiles (optional) |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + database (Phase 2) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + database (Phase 2) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (Phase 2) |
| `STRIPE_SECRET_KEY` | Payments (Phase 2) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks (Phase 2) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe frontend (Phase 2) |
| `STANNP_API_KEY` | Letter dispatch (Phase 2) |

---

## Roadmap

### Phase 1 — Demo (current)
- [x] Landing page
- [x] MapLibre map with rectangle drawing tool
- [x] Address discovery via OpenStreetMap Overpass API
- [x] Letter template editor + live preview
- [x] Basket with pack pricing
- [x] Mock checkout + confirmation

### Phase 2 — Live
- [ ] Supabase Auth (magic link)
- [ ] Stripe Checkout + webhook
- [ ] Stannp API letter dispatch
- [ ] Order dashboard
- [ ] Terms and acceptable-use policy page

---

## Pricing model

| Option | Price |
|---|---|
| Per letter | £2.50 |
| 5 letters | £14.99 |
| 10 letters | £24.99 |
| 25 letters | £49.99 |

Letters are addressed to "The Homeowner" — no named owner data is ever stored or transmitted.

---

## Development

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check
```

All three must pass before committing. See `CLAUDE.md` for the full development guide.
