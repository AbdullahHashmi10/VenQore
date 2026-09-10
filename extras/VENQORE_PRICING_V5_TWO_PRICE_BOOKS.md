# VenQore — Pricing V5 (Two Price Books)

**Written 2026-09-08 · supersedes `VENQORE_PRICING_V4_RESET.md` (same day) and the pricing sections of V3**
**Everything re-researched. Scope: public international ladder + marketplace-only LTD ladder.**

---

## 0. What changed from V4

1. Typeless is **$149/mo**, not $49 — the $18 anchor was even further off than stated.
2. **No free tier at launch.** Cash need overrides the freemium plan. Free returns in month 6.
3. **Card required on the trial.** Data below.
4. **Two price books**, never shown together: public site = subscriptions only; marketplaces = LTD only.
5. **No PKR pricing on any public page.** No Pakistan section, no CNIC upload.

---

## 1. Price book ONE — public website (subscriptions only)

Three tiers + Custom. Annual = 10 months for 12. **No LTD, no lifetime language, anywhere on the site.**

| | Starter | Growth | Scale | Custom |
|---|---|---|---|---|
| **Monthly** | **$49** | **$129** | **$299** | from $600 |
| **Annual** | $490 | $1,290 | $2,990 | contract |
| Locations | 1 | 3 | 10 | unlimited |
| Team seats | 3 | 10 | 25 | unlimited |
| Till logins | unlimited | unlimited | unlimited | unlimited |
| Transactions | unlimited | unlimited | unlimited | unlimited |
| Products (abuse guard) | 10,000 | 50,000 | 250,000 | unlimited |
| AI credits / month | 1,000 | 3,000 | 7,000 | negotiated |
| POS, stock, offline, receipts | Y | Y | Y | Y |
| Ledger, receivables, payables | Y | Y | Y | Y |
| Purchases, expenses, accounting | Y | Y | Y | Y |
| All 43 reports | Y | Y | Y | Y |
| Multi-branch, transfers, BOM | — | Y | Y | Y |
| AI rebuilds the system | — | Y | Y | Y |
| Growth signals, loyalty | — | Y | Y | Y |
| API, white-label, audit trail | — | — | Y | Y |
| Channel sync | $19 each | $19 each | included | included |
| Support | email, 2 days | 1 day + setup call | named, 4 hours | SLA |

**Growth is the recommended tier on the page.** Three tiers matches every serious competitor
(Square, Lightspeed, Odoo, Katana, Glide all publish three).

### Add-ons (all tiers)
| Add-on | Price |
|---|---|
| Extra location | $25/mo |
| Extra team seat | $9/mo |
| Channel sync | $19/mo each |
| AI credit top-up | $9 / 1,000 |
| BYOK unlock | $19 once |
| Setup & migration | $199 once |
| Complex migration | from $499 |

---

## 2. The trial — CARD REQUIRED

**Decision: take the card.** Benchmarks:

| | Converts | Volume |
|---|---|---|
| Card required (opt-out) | 35–55%, median 44% (another dataset: 48.8%) | baseline |
| No card (opt-in) | 8–22%, median 14% (another dataset: 18.2%) | 30–50% higher |

Net effect on identical traffic (1,500 visitors/mo): **34 paying vs 18 paying, and 42 non-buyers in
the funnel instead of 110.** ~1.9x the customers, ~2.6x fewer tyre-kickers.

**Implementation rules:**
- 14 days, charged day 15, charge date stated on the signup form AND in the welcome email.
- Day-11 reminder email ("your trial ends in 3 days"). Non-negotiable — this is what keeps refunds near zero.
- One-click cancel. 30-day money-back guarantee, no questions.
- **Activation is the real lever:** activated trials convert 35–65%, unactivated 2–8%.
  VenQore activation = products imported + one real sale rung + one document scanned, in session one.
- Most decisions happen within 72 hours, not on day 14. Onboarding converts, not trial length.

---

## 3. Price book TWO — marketplaces only (LTD)

**Never on the VenQore website.** A lifetime price next to a $129 subscription kills the subscription.

| | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| **One-time** | **$89** | **$178** | **$267** |
| Equivalent to | Starter | Growth | Growth, bigger |
| Locations | 1 | 2 | 3 |
| Team seats | 3 | 6 | 10 |
| Products | 10,000 | 50,000 | 50,000 |
| **AI credits, refreshed yearly** | 6,000 | 18,000 | 36,000 |
| App + features for life | Y | Y | Y |
| Multi-branch, BOM, AI builder | — | Y | Y |
| Channel sync | — | — | 1 included |
| API, white-label | — | — | — |
| Support | help centre + Vena | email 3 days | email 2 days |

Stackable 1/2/3 codes (reuses existing `store_licenses` stacking logic).
Priced against Starter's 36-month value ($1,764) and Growth's ($4,644).

### How to keep earning from LTD buyers — the ONLY safe mechanism
**DO NOT** charge a mandatory hosting/maintenance fee after year 1. It contradicts "lifetime",
triggers refunds and public review damage on a deal that is still selling.

**DO** use AppSumo's own published structure for AI products:
- Lifetime access to the **app and workflow features**.
- **AI usage on metered credits that refresh annually.**
- **Paid top-ups** ($9/1,000) and paid add-ons (location $25, seat $9, sync $19).
- Nothing is switched off if they never buy an add-on.

### Real cost of an LTD tenant
Infrastructure ≈ **$0.60/tenant/month** = $36 over five years. Tier 1 at the worst revenue share
still covers 3+ years; Tier 3 covers ~10. **Hosting is not the danger — uncapped AI and uncapped
support are, and both are handled above.**

---

## 4. AppSumo plan

| Programme | You keep | Median deal gross | Reaches you | Traffic |
|---|---|---|---|---|
| **Select** | ~30% | $108,000 | $32,400 | AppSumo promotes |
| **Marketplace** | ~70% | $41,000 | $28,700 | You, until 5 reviews at 4–5 stars |

**Take-home is nearly identical — the split is not the decision, traffic is.**
No audience yet → **apply to Select**, Marketplace as fallback.

Reality check: across 771 analysed deals the *average* founder take was **$1,775 on 87 units**.
Plan on the weak column:

| Scenario | Units | Avg price | Gross | To you (Select, after 12% refunds) |
|---|---|---|---|---|
| Weak | 150 | $110 | $16,500 | $4,356 |
| Base | 400 | $130 | $52,000 | $13,728 |
| Strong | 1,000 | $140 | $140,000 | $36,960 |

**Terms to plan around:** 60-day refund window, Net-60 payment from month end, 120-day minimum listing.
→ **AppSumo money is months away, not weeks.** It is capital for marketing/hiring, not income.

### Launch gate — do NOT apply until all are true
1. 25–30 help articles live (setup, import, POS, plan limits, licence redemption, top-10 errors).
2. Vena answering from those articles, tested, with an obvious route to a human.
3. **Licence redemption + code stacking tested end to end** (1, 2, 3 codes; downgrade path).
   Biggest single source of LTD launch-week tickets.
4. Status page + known-issues page, updated daily during launch week.
5. Written refund and review-response routine — who answers, how fast, in what tone.
6. **Rehearse on a smaller marketplace first** (SaaSMantra / PitchGround / DealMirror): fewer units,
   finds the redemption bugs at survivable scale, arrives at AppSumo with reviews in hand.

---

## 5. Cash plan — three horizons

$29/mo does not solve the cash problem: 20 customers at $29 = $580, at $49 = $980. Neither is a living.
$29 costs a permanent low anchor and the least able customers, for $400.

| Horizon | When | What | Expect |
|---|---|---|---|
| **Salary** | weeks 1–8 | Private quotes to Pakistani businesses (own channel, no public page) + paid setup/migration at $199–$499 | cash within weeks |
| **Growth** | months 2–6 | Card-gated ladder, **annual billing pushed hard** | ~$5,200 MRR by month 6 |
| **Capital** | months 3–9 | LTD on marketplaces, rehearsed first | $4k–$14k, Net-60 |

**Annual billing is the single biggest cash lever available this week:**
one annual Growth customer = **$1,225 net on day one** vs $122 monthly.
20 of them = **$24,500 in month one**.

**Founding cohort:** first 25 paying customers, **40% off for 12 months, annual only, locked**,
in exchange for a testimonial + one 20-min call. Growth = $774/yr prepaid. 25 of those ≈ **$18,000 cash**.
Real deadline, real end. Never a permanent struck-through price (illegal under UK CMA / EU Omnibus).

---

## 6. Who pays for AI — plain version

Half a cent per AI action (the self-set ceiling that survives model price rises).

| Plan | Credits | Cost if 100% used | You keep | Realistic (≈33% use) |
|---|---|---|---|---|
| Starter $49 | 1,000 | $5 | $44 | ~$1.70 |
| Growth $129 | 3,000 | $15 | $114 | ~$5 |
| Scale $299 | 7,000 | $35 | $264 | ~$12 |

**The AI can never eat more than ~a tenth of what the customer paid, because the allowance is
capped and the cap is derived from the price.**

Ship all three payment routes:
1. **Included credits** — no decision for the customer, best conversion.
2. **Top-ups** — $9/1,000 (costs $5), profitable and nudges the upgrade.
3. **BYOK** — their key, their bill, $19 once to unlock. Zero cost to you.

Rules (do not soften): hard stop at cap, never auto-bill overage, warn at 80% with both exits,
no rollover, the word "unlimited" never appears near AI.

---

## 7. Pakistan — without a PKR page

- **No PKR prices anywhere public.** Confirmed decision.
- **No "Pakistan? Get a custom price" banner.** It tells every international visitor a cheaper price
  exists and they are not being offered it — same anchor damage as a price list.
- **Use:** a plain "Regional pricing enquiry" link in the footer, `noindex`, opening a short form
  (business name, city, WhatsApp number). No prices on it.
- **Do NOT collect CNIC images.** Sensitive personal data, storage/security liability, and it proves
  less than the payment method does.
- **Verify instead:** OTP to a +92 mobile, then require a Pakistani payment method to redeem the quote.
- The discount lives in the **licence record**, issued per customer, with no public trace.

---

## 8. Rollout order

1. Grandfather the 3 existing accounts for 12 months, in writing, before any new price is visible.
2. Set the code to the new ladder, then correct the pricing page from the code (V6 rule stands).
3. Build trial mechanics: card at signup, charge date stated, day-11 email, one-click cancel,
   30-day guarantee, three activation steps instrumented.
4. Rebuild Lemon Squeezy: 3 plans × monthly/annual, 7 add-ons, single cart per checkout.
5. Open the founding 25 (annual only, real closing date).
6. Small-marketplace rehearsal → AppSumo application, section 4 gate complete before either.
7. Free tier in month 6, once help centre + Vena have proven deflection.

---

## 9. Still open

1. Trial length 14 vs 21 days (benchmarks favour 21–30 for card trials; urgency favours 14). Start at 14.
2. Which small marketplace to rehearse on — one week of due diligence on terms and typical unit counts.
3. Whether Scale needs a tier above it before Custom. Revisit after the first 10-location conversation.

---

## 10. Lemon Squeezy catalogue

**Subscriptions (monthly + annual variants):** Starter $49/$490 · Growth $129/$1,290 · Scale $299/$2,990
**Quantity add-ons:** extra location $25/mo · extra seat $9/mo · channel sync $19/mo
**One-time:** BYOK unlock $19 · AI credits 1,000 for $9 · setup & migration $199
**Retire/hide:** every $18/$36/$63/$129 variant, the old AI Spark/Shop/Pro/Max tiers, the $10 location
and $5 seat add-ons, any $19/$39/$79 legacy variants, and anything containing the word "lifetime".
