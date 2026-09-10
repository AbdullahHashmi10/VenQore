# VenQore — Pricing V4 (Price Reset)

**Written 2026-09-08 · supersedes the pricing sections of `VENQORE_PRICING_AND_STRATEGY.md` (V3, 4 Aug)**
**Scope: international / USD ladder only. The PKR ladder is unchanged.**
Companion: the full reasoning, market table and support model live in the pricing brief artifact.

---

## 1. The decision

The $18 entry price was anchored on the Pakistani market and never re-derived when the target
became 100 non-Pakistani paying customers. Corrected ladder — **plan names unchanged**:

| | Counter | Starter | Growth | Scale | Custom |
|---|---|---|---|---|---|
| **Monthly** | **Free** | **$49** | **$129** | **$299** | from $600 |
| **Annual** (10 for 12) | — | $490 | $1,290 | $2,990 | contract |
| Locations | 1 | 1 | 3 | 10 | unlimited |
| Team seats | 1 | 3 | 10 | 25 | unlimited |
| Till logins | 1 | unlimited | unlimited | unlimited | unlimited |
| Transactions | unlimited | unlimited | unlimited | unlimited | unlimited |
| History kept | 60 days | forever | forever | forever | forever |
| Products (abuse guard only) | 300 | 10,000 | 50,000 | 250,000 | unlimited |
| AI credits / month | 50 | 1,000 | 3,000 | 7,000 | negotiated |
| POS, stock, receipts, offline | Y | Y | Y | Y | Y |
| AI onboarding build | Y | Y | Y | Y | Y |
| Ledger, receivables, payables | — | Y | Y | Y | Y |
| Purchases, expenses, accounting | — | Y | Y | Y | Y |
| Reports | 3 | all 43 | all 43 | all 43 | all 43 |
| Multi-branch, transfers, BOM | — | — | Y | Y | Y |
| AI rebuilds the system | — | — | Y | Y | Y |
| Growth signals, loyalty | — | — | Y | Y | Y |
| API, white-label, audit trail | — | — | — | Y | Y |
| Channel sync | — | $19 each | $19 each | included | included |
| Support | help centre + Vena | email, 2 business days | 1 business day + setup call | named contact, 4 business hours | contracted SLA |

Blended ARPU moves from **$37.95 to $107.10** at a realistic mix. Same 100 customers = **$10,710/mo, not $3,795**.
$4,000/mo net needs **40 customers instead of 241**.

### Upgrade fences — one sentence each
- **Counter → Starter:** you need to know who owes you money, or want to see past 60 days.
- **Starter → Growth:** a second location, or you want AI to change the system itself.
- **Growth → Scale:** API, white-label, channels included, or a 4-hour response.
- **Scale → Custom:** 10+ locations, SSO, own region/instance, signed contract.

---

## 2. Add-ons

| Add-on | Price | Was | Note |
|---|---|---|---|
| Extra location | $25/mo | $10 | Roughly half a Starter plan |
| Extra team seat | $9/mo | $5 | Till logins stay free and unlimited |
| Channel sync (Woo/Amazon/eBay/TikTok) | $19/mo each | $10 | Included on Scale+ |
| AI credit top-up | $9 / 1,000 | $2 / 200 pages | One-time, repeatable, never auto-billed |
| BYOK unlock | $19 once | $19 | Paid plans only. Turns metering off |
| Setup & migration | $199 once | new | Import, COA, tax, 2 sessions. Offer at checkout |
| Complex data migration | from $499 | new | Quoted |

---

## 3. Metering policy

1. **Never meter transactions on a paid plan.** The meter would land at the till, with a queue waiting.
2. **Meter breadth:** locations and team seats. Every buyer already understands per-location pricing.
3. **Meter depth:** ledger/purchases/accounting = the Counter→Starter wall. Multi-branch/BOM = Growth.
   API/white-label = Scale. Most price discrimination lives here.
4. **Meter AI credits** — the only genuine variable cost.
5. **Meter history on the free plan only** (60 days). Never block the till.
6. **SKU caps are abuse guards, not price levers.** Set so no legitimate business hits them.
7. **Fair use, published in plain words:** above 100,000 transactions/month, 20 GB attachments,
   or sustained API load, the answer is a Custom conversation — never an automatic charge.
8. **Downgrades:** V3 policy stands unchanged (nothing deleted, read-only + banner, blocked while
   receivables/payables are open, 30-day grace).

---

## 4. AI credits — one unit for everything

Priced against a **$0.005 internal cost ceiling per credit** (survives the October model migration).

| Action | Credits |
|---|---|
| Scan printed page | 1 |
| Scan handwritten page | 2 |
| Vena question | 1 |
| Product description | 2 |
| AI changes the system (module/field/card/workflow) | 10 |
| Growth signal run | 20 |

Worst-case COGS if every credit is burned: **$5.00 / $15.00 / $35.00** on Starter / Growth / Scale
= 10–12% of plan price. Free's 50 credits cost $0.25.

Rules (unchanged from V3, do not soften): hard stop at cap, never auto-bill overage, warn at 80%
with both routes out, no rollover, the word "unlimited" never appears near AI.

**The build AI is free on every plan including Counter** — it is the positioning and the first-30-seconds
magic. What is metered is the ongoing work: scanning, answering, rebuilding, analysing.

---

## 5. Lemon Squeezy catalogue to create

Single cart per checkout so the $0.50 fixed fee is charged once (task P0-6 still applies).

**Subscriptions — monthly + annual variants**
- VenQore Starter — $49 / $490
- VenQore Growth — $129 / $1,290
- VenQore Scale — $299 / $2,990
- (Counter is free — no product needed)

**Quantity-based subscription add-ons**
- Extra location — $25/mo
- Extra team seat — $9/mo
- Channel sync — $19/mo each

**One-time**
- BYOK unlock — $19
- AI credits, 1,000 — $9
- Setup & migration — $199

**Retire / hide:** all $18/$36/$63/$129 plan variants, the old AI Spark/Shop/Pro/Max tiers
(replaced by included credits + top-ups), the $10 location and $5 seat add-ons, any $19/$39/$79 legacy variants.

---

## 6. Support system (must exist before launch)

- 25–30 help articles: setup, import, POS basics, plan limits, top-10 errors. Deflects 40–60%.
- Vena answering from those articles, 24/7. AI-resolved contact ≈ $0.90 vs $18–35 human SaaS ticket.
- In-app first-session checklist. Status page. Known-issues page updated daily in launch week.
- **Target 60–70% deflection before hiring anyone.**
- Weekly metric: **human-handled contacts per paying customer per month.**
- **Hire trigger:** >40 human-handled contacts/month for two consecutive months, or a published
  first-response time missed twice in one month. At the new ladder that lands past ~80 customers
  (~$8k/mo), where a part-time hire is affordable. At $18 it landed at 45 customers and $750/mo.

---

## 7. AppSumo / LTD guardrails

- **Zero managed AI credits on lifetime plans** — bundle the BYOK unlock instead. A one-time payment
  cannot fund a recurring API bill.
- Map codes to **Starter and Growth only**. Never Scale: no API, no white-label, no channel sync, no named support.
- Expect 20–40% of buyers to file a ticket in month one, in public. Deflection stack is not optional.
- **Launch only after the new prices are live** — an LTD is priced against the subscription it replaces.
- LTD stays off the VenQore site entirely (unchanged decision).

---

## 8. Rollout order

1. Grandfather all 3 current accounts for 12 months, in writing, before they see a new price anywhere.
2. Correct the code to the new ladder, then the pricing page from the code (V6 rule: code is source of truth).
3. Rebuild the Lemon Squeezy catalogue (section 5).
4. Founding cohort: first 25 paying customers, 40% off for 12 months, locked, in exchange for a
   testimonial and one 20-minute call. Real deadline, no permanent strike-through pricing.
5. Then AppSumo.

**Country-lock the PKR ladder at billing.** It must never be visible to an international visitor.

---

## 9. Still open (Abdullah's call)

1. Free Counter vs a paid $29 floor. (Recommendation: free.)
2. Whether AppSumo still happens, and when.
3. Managed AI credits vs BYOK-first at the margin.
4. Whether the PKR ladder moves at all — the only requested change is the country lock.
