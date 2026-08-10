# Offline.homes — Rebrand & Go-Live Plan

**Goal:** rebrand the app (currently "LetterDrop" / `off-market-app`) to **Offline.homes**, matching the logo and branding designed in Canva, and get it live at **https://offline.homes** today.

---

## 1. Brand foundations (from the logo)

### 1.1 Name & wordmark

- Product name: **Offline.homes** — always written with the capital O and the dot, e.g. "Offline.homes", never "Offline Homes" or "offline homes".
- Wordmark: `Offline` in navy, the `.` in coral, `homes` in navy. In code the dot is a styled `<span>` so it renders in the accent colour everywhere the wordmark appears.
- Logo mark: coral house outline containing an open envelope (letter-through-the-door — exactly what the product does). Recreate as an inline SVG so it scales crisply and can be recoloured.

### 1.2 Colour tokens

Sampled from the logo artwork (verify against Canva's colour panel and adjust hex values if the source file differs):

| Token | Hex | Usage |
|---|---|---|
| `--color-cream` | `#FBF3E7` | Page/hero backgrounds (replaces white/indigo-50 gradients) |
| `--color-coral` | `#F4795B` | Primary accent: CTAs, links, the wordmark dot, logo stroke (replaces indigo-600) |
| `--color-coral-dark` | `#E0603F` | Hover/active states (replaces indigo-700) |
| `--color-coral-soft` | `#FDE4D5` | Soft accent fills: badges, step circles (replaces indigo-100) |
| `--color-navy` | `#101A3C` | Headings, wordmark, primary text (replaces slate-900) |
| `--color-navy-soft` | `#4A5370` | Body/secondary text (replaces slate-600) |
| `--color-surface` | `#FFFFFF` | Cards, panels, inputs |
| `--color-border` | `#EADFCE` | Borders on cream; keep slate-200 equivalents on white cards |

Defined once in `src/app/globals.css` via Tailwind v4 `@theme`, giving utilities like `bg-cream`, `text-coral`, `bg-navy`. **No raw hex values in components.** Remove the `prefers-color-scheme: dark` block — the brand is a single warm light theme; a proper dark theme is a later decision.

### 1.3 Typography

The wordmark uses a rounded geometric sans. Closest Google Font (loadable via `next/font/google`, zero layout shift): **Poppins**.

- Headings & wordmark: Poppins 600/700.
- Body: Poppins 400/500 (keep Geist as a fallback only if Poppins feels heavy in running text).
- Wire up in `src/app/layout.tsx` (`Poppins({ subsets: ["latin"], weight: [...] })`) and map to `--font-sans` in `globals.css`.

---

## 2. Assets to produce

| Asset | File | Notes |
|---|---|---|
| Logo mark (house + envelope) | `src/components/logo.tsx` (inline SVG) + `public/logo.svg` | Hand-drawn SVG matching the Canva mark: coral rounded house outline + chimney; the open envelope fills the house body — near-white raised flap, peach base fill, coral edges |
| Full lock-up (mark + wordmark) | `src/components/logo.tsx` (`<Logo withWordmark />`) | Used in nav headers and the landing hero |
| Favicon | `src/app/icon.svg` (replaces `favicon.ico`) | House mark on cream rounded square; Next.js serves `icon.svg` automatically |
| Apple touch icon | `src/app/apple-icon.png` | 180×180 export of the mark |
| OG / social image | `src/app/opengraph-image.png` (or `.tsx` via `next/og`) | Cream background, centred lock-up — this is what shows when the URL is shared |

If the friend can export the original SVG/PNG from Canva (Share → Download → SVG), drop it in and trace exact colours from it; otherwise the hand-drawn SVG from the screenshots is fine for launch.

---

## 3. Codebase changes (file-by-file)

### 3.1 Naming — "LetterDrop" → "Offline.homes"

| File | Change |
|---|---|
| `src/app/layout.tsx` | Title: `Offline.homes — Write to homeowners near you`; add `metadataBase: new URL("https://offline.homes")` + OG/Twitter metadata |
| `src/app/{map,letter,basket,confirm}/page.tsx` + `src/app/m/**/page.tsx` | Page titles: `… — Offline.homes` |
| `src/components/step-nav.tsx`, `src/components/mobile/MobileStepNav.tsx` | Replace text wordmark with `<Logo withWordmark />` |
| `src/app/page.tsx`, `src/app/m/page.tsx` | Header, footer © line, hero copy |
| `src/features/letter/components/LetterPreview.tsx` | "Printed & posted by Offline.homes" |
| `package.json` | `"name": "offline-homes"` |
| `src/lib/campaign-store.ts` | `STORAGE_KEY = "offline-homes-campaign"` (one-time reset of demo state — acceptable pre-launch) |
| `src/lib/geocoding/nominatim.ts` | User-Agent: `offline.homes/1.0` (Nominatim policy prefers a contactable identifier) |
| `README.md`, `CLAUDE.md` | Project name and description |

### 3.2 Restyle — indigo/slate → coral/navy/cream

56 indigo usages across 17 files. Mechanical mapping, applied file by file:

- `indigo-600` → `coral` (buttons, links, prices) · `indigo-700` → `coral-dark` (hover)
- `indigo-100`/`indigo-50` → `coral-soft` / `cream` (badges, step circles, hero gradient)
- `slate-900` → `navy` (headings) · `slate-600`/`slate-500` → `navy-soft`
- Page backgrounds: white → `cream`; cards stay white for contrast
- Map selection colour in `PropertyMap.tsx` (selected-property markers / draw-rectangle fill) → coral
- Check focus rings and the mobile `StickyCTA` too

Files touched: `page.tsx` (desktop + `/m`), `step-nav.tsx`, `MobileStepNav.tsx`, `StickyCTA.tsx`, `BottomSheet.tsx`, all `features/map`, `features/letter`, `features/basket` components, `confirm` pages.

### 3.3 Copy polish (small, high-leverage)

- Hero badge: "Off-market property search" → "Find homes before they're for sale" (or keep — decide at implementation).
- Footer: `© 2026 Offline.homes · Letters posted within 1–2 business days`.
- Letter template content (`friendly-home-mover.ts`) is user-facing but brand-neutral — leave for launch.

---

## 4. Verification gate (before every commit)

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Plus a manual pass of all five desktop routes and the `/m/*` flow with `npm run dev` — checking contrast (coral on cream needs bold/large text; body copy stays navy) and that no stray indigo survives (`grep -r "indigo-" src/`).

---

## 5. Go-live on offline.homes (today)

The repo already has `vercel.json` (`"framework": "nextjs"`) — Vercel is the fastest path, free on Hobby, with automatic SSL for the custom domain.

1. **Merge the rebrand PR to `main`.**
2. **Create the Vercel project:** vercel.com → Add New Project → import `James1Law/offmarketsearch` from GitHub → framework auto-detected (Next.js) → Deploy. No env vars needed for Phase 1 (`NEXT_PUBLIC_MAPTILER_API_KEY` optional for vector tiles; raster fallback works without it).
3. **Add the domain:** Project → Settings → Domains → add `offline.homes` and `www.offline.homes` (redirect www → apex).
4. **DNS at the registrar** (wherever offline.homes was bought — .homes registrars are typically Namecheap/GoDaddy/Porkbun):
   - `A` record, host `@` → `76.76.21.21`
   - `CNAME`, host `www` → `cname.vercel-dns.com`
   - (Or move nameservers to Vercel DNS — simpler long-term, slower to propagate today.)
5. **Verify:** Vercel shows the domain as valid, SSL cert issues automatically (minutes after DNS propagates; .homes TTLs are usually short). Smoke-test https://offline.homes on mobile + desktop, share the URL in a chat to check the OG card.
6. **Post-launch niceties (same day, optional):** enable Vercel Analytics; set `main` production branch protection so future PRs get preview deploys.

**Risk to watch:** the map pages call Overpass/Nominatim from the client — fine for a demo, but public traffic could hit their rate limits. Acceptable for day-one; note for Phase 2 (move behind a route handler with caching, per CLAUDE.md architecture rules).

---

## 6. Execution order & timeline (one working session)

| # | Step | Est. |
|---|---|---|
| 1 | Brand tokens + Poppins in `globals.css` / `layout.tsx` | 30 min |
| 2 | Logo SVG component, favicon, OG image | 45 min |
| 3 | Naming sweep (§3.1) | 20 min |
| 4 | Colour restyle, desktop routes (§3.2) | 45 min |
| 5 | Colour restyle, `/m/*` mobile routes | 30 min |
| 6 | Copy polish + README/CLAUDE.md | 15 min |
| 7 | Verification gate + manual QA | 30 min |
| 8 | Merge → Vercel project → domain + DNS (§5) | 30 min + DNS propagation |

Steps 1–7 are all on this branch, committed feature-by-feature per the workflow rules. Step 8 needs the repo owner (Vercel account + registrar access).

## 7. Explicitly out of scope for today

- Phase 2 features (auth, Stripe, Stannp) — unchanged plan.
- Dark theme, custom-drawn display typeface, brand illustrations.
- Renaming the GitHub repo (`offmarketsearch` → `offline-homes`) — harmless to defer, do it later to avoid breaking the Vercel link mid-launch.
