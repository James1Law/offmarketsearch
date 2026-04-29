# Off-Market Property Letter Service — Business Plan

**Stage:** Side-project exploration  
**Target user:** UK home movers (B2C, not investors)  
**Core mechanic:** User draws an area / sets criteria → selects specific houses → app posts a templated letter to each → user pays per letter

---

# 1. The honest verdict up front

The idea is real. Sending letters to homeowners is a proven tactic used by estate agents, property investors, and buying agents every day. Searchland and Nimbus both ship this exact feature to professionals via Stannp. There is no equivalent consumer product — that's your gap.

But the side-project version has three hard problems you need to solve on paper before writing a single line of code:

1. You cannot cheaply tell the user who owns the house. Land Registry charges £7 per title. The user probably expects to know the name. You need to decide whether you're:
   - **Unaddressed mail to "The Occupier"** (cheap, GDPR-light, feels spammy)
   - **Addressed mail to the named owner** (expensive, GDPR-heavy, feels personal)

2. Home movers are a one-shot audience. A person moves house roughly every 10–20 years. Lifetime value is one campaign.

3. £1 per letter doesn't work. Stannp charges ~£0.81 for a basic letter via API. After Stripe fees, VAT, and failed-address losses, margins disappear.

**Bottom line:** None of these kill the idea. They define the MVP.

---

# 2. Market & competitor landscape

## Direct comparables (B2B, not B2C)
- **Searchland** — DTV letter sending for property professionals
- **Nimbus Maps** — Stannp integration, token-based
- **NEST Data** — 29M UK home records + direct mail
- **PostGrid / Stannp** — infrastructure providers

## Adjacent consumer tools
- Rightmove / Zoopla / OnTheMarket — listings only
- GetAgent / RelocationUK — no off-market functionality

## Why the gap exists
Professionals pay £200+/month. Consumers won’t.  
Low-volume, one-time buyers create poor unit economics.

## Competitive wedge
Not superior data — **accessibility and emotional positioning**:
> A nervous home mover wants a simple, low-commitment way to try writing to a homeowner without feeling like a property investor.

---

# 3. Legal & GDPR (read this twice)

## Core rule
PECR mostly governs electronic marketing. Physical mail falls under UK GDPR when personal data is processed.

## Mode A — Unaddressed / "The Homeowner"
- Addressed to “The Homeowner” or “The Occupier”
- No named data used
- Lower GDPR burden
- Lower legal risk
- Lower response rate

## Mode B — Named owner
- Requires lawful basis (likely Legitimate Interest)
- Legitimate Interests Assessment required
- Mailing Preference Service checks
- Privacy notice + opt-out
- ICO registration (£40–£60/year)
- Higher legal complexity

## Real risks
- Harassment complaints
- Vulnerable seller targeting
- Fraud / impersonation
- ASA advertising compliance

## Recommended MVP
**Launch Mode A only.**  
Skip Land Registry entirely.

---

# 4. Technical architecture & MVP scope

## MVP features
1. Map-based property picker
2. Address resolution (OS Places API / Royal Mail PAF)
3. Letter templates
4. Letter preview
5. Basket + pricing
6. Stripe checkout
7. Stannp API handoff
8. Dashboard
9. Terms / acceptable-use policy

## Explicitly out of scope
- Land Registry lookup
- Advanced reply tracking
- Auto-followups
- Investor analytics
- Mobile apps

## Suggested stack
- **Frontend:** Next.js + React + Tailwind
- **Maps:** Mapbox / MapLibre + OS Places
- **Backend:** Node / Next API + Supabase/Postgres
- **Auth:** Clerk / Supabase Auth
- **Payments:** Stripe
- **Mail:** Stannp API
- **PDF:** Puppeteer / react-pdf
- **Monitoring:** Sentry

## Estimated build time
**2–3 weekends for prototype**

---

# 5. Unit economics — why £1 doesn’t work

| Line item | Cost |
|----------|------|
| Stannp basic letter | £0.81 |
| Stripe fees | ~£0.22 |
| VAT | ~£0.16 |
| Failed send reserve | ~£0.06 |
| **Direct cost floor** | **~£1.25** |

## Pricing options

### Option 1 — Flat
**£2.50 per letter**

### Option 2 — Campaign packs
- 5 letters: £14.99  
- 10 letters: £24.99  
- 25 letters: £49.99  

### Option 3 — Loss leader
First letter £1, upsell later

### Option 4 — Service tiers
- Bronze: £2.50
- Silver: £5
- Gold: £10

## Reality check
Most users will send **1–3 letters**, not 20+.

---

# 6. Go-to-market

## Best channels
- r/HousingUK
- r/UKPersonalFinance
- Property forums
- Facebook local moving groups
- SEO ("how to write to a homeowner")

## First 90 days
### Weeks 1–4
Build MVP

### Week 5
Soft launch to friends

### Weeks 6–8
SEO blog posts

### Weeks 9–10
Reddit lead magnet

### Weeks 11–12
Property influencer outreach

## Key insight
**SEO likely beats paid ads**

---

# 7. Risks & how to mitigate

| Risk | Severity | Mitigation |
|------|----------|------------|
| GDPR complaints | High | Mode A only, solicitor review |
| Harassing letters | High | Template-only, caps |
| Poor response rates | Medium | Set expectations |
| Stannp outage | Low-Medium | Abstract provider |
| Delivery issues | Medium | 7% reserve |
| Competitor launch | Medium | Move fast |
| Founder burnout | Almost certain | Tiny MVP |

---

# 8. Recommended next steps

1. Validate demand with landing page + £50 ads
2. Speak to solicitor
3. Prototype Stannp immediately
4. Design pricing page first
5. Define strict v1 completion criteria

---

# 9. What I’d do if this were me

- Scope = 4–6 weekends
- Mode A only
- £2.50/letter
- 5-letter minimum
- Year 1 goal = £2–5k
- Potential exit = sell to buying agents / Nimbus / Searchland

---

# Final reality check

> The biggest risk isn't the law or the tech. It's that home movers may not actually pay for this because emotionally, writing a cold letter to a stranger feels awkward.

**Validate demand before building.**