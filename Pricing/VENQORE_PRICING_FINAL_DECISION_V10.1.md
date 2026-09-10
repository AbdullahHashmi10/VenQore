# VenQore — Final Pricing Decision (V10.1)

**8 Sep 2026. Overrides V10 and every earlier pricing document. Build this.**

The research overturned both V10's structure and my own previous recommendation. What follows is what
the category actually does, verified on vendor pricing pages, not what either of us reasoned toward.

---

## What the evidence forced

**1. Nobody in this category fences tiers on locations. They use locations as a MULTIPLIER.**
Square for Restaurants: $30 and $149 **per location**. Shopify POS Pro: **"+$89/mo for each POS Pro
location."** My earlier "second tier = 3 locations" was wrong-shaped — it leaves a single-location
business, which is most of the market, with no upgrade path at all.

**2. Nobody in POS, field service or accounting fences on SKU or record count.** Searched specifically
for it; no mainstream vendor does. Capacity in this category is an **add-on quantity, not a tier wall**.
V10's 2,500-vs-10,000-product fence has no precedent in the category.

**3. The actual tier 1 → tier 2 fence, everywhere, is SEATS plus governance features:**

| Vendor | Tier 1 → Tier 2 | The fence |
|---|---|---|
| Housecall Pro | $59 → $149 | **1 user → 5 users** + routing, GPS, QBO sync |
| QuickBooks Online | $38 → $85 | **1 user → 3 users** + bill management, multi-currency |
| Shopify POS | $39 → $105 | limited staff → **unlimited POS logins** |
| Jobber | $29 → $99 | 1 user both; automation and payment features |
| Lightspeed Retail | $89 → $149 | 1 register both; management tooling. Locations are add-ons |
| Vagaro | from $30 | **bookable staff count** |

**4. A hard capacity wall in an operational product is an outage, not an upsell.** Airtable at the
record limit: *"you will no longer be able to add new records."* In VenQore that means a shop cannot
receive stock. HubSpot had to ship max-contact caps after silent threshold upgrades billed customers
before anyone noticed. Stripe's own guidance: a metric must be **"legible before signup"**.

**5. Do not gate backup.** QuickBooks does restrict Online Backup to Advanced, so it is not unheard of —
but it is the one item in accounting-adjacent software with a live, published fairness objection, and
you are the unknown vendor asking someone to move their books.

**Honest limit:** no study compares churn between self-assessable and non-self-assessable limits. The
"value metric must be knowable in advance" rule is strong practitioner consensus (Stripe, a16z), not
proven. I am following consensus plus the observed behaviour of every comparable vendor.

---

## The ladder

| | Solo | Standard | Team | Scale | Custom |
|---|---|---|---|---|---|
| **Monthly** | **Free** | **$49** | **$99** | **$299** | from $800 |
| **Annual** | — | $490 | $990 | $2,990 | contract |
| **Full seats (back office)** | 1 | **1** | **5** | **25** | unlimited |
| Till logins (cashier PIN) | 2 | unlimited | unlimited | unlimited | unlimited |
| Locations included | 1 | 1 | 1 | 1 | negotiated |
| **Each extra location** | — | **+$45/mo** | **+$45/mo** | **+$45/mo** | negotiated |
| Registers per location | 1 | 2 | 6 | 20 | unlimited |
| Sales transactions | 100/mo | unlimited | unlimited | unlimited | unlimited |
| Service jobs | 20/mo | unlimited | unlimited | unlimited | unlimited |
| Products / services | 500 hard | 5,000 soft | 50,000 soft | 500,000 soft | unlimited |
| Detailed history | 30 days | full | full | full | full |
| AI credits / month | 100 | 500 | 2,000 | 10,000 | negotiated |
| AI structural rebuilds | — | 1 / 90 days | 1 / 90 days | 1 / month | negotiated |
| **All 45 modules** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Google Drive backup** | — | ✓ | ✓ | ✓ | ✓ |
| Free accountant seat | — | ✓ | ✓ | ✓ | ✓ |
| Multi-branch + transfers | — | with 2nd location | with 2nd location | ✓ | ✓ |
| API + webhooks | — | $29 add-on | ✓ | ✓ | ✓ |
| Audit trail, custom roles | — | $39 add-on | ✓ | ✓ | ✓ |
| White-label | — | — | — | ✓ | ✓ |
| Channel sync | — | $19 each | $19 each | 2 included | included |
| Support | Vena only | email, 2 days | 1 business day | 4 business hours, named | SLA |

**"Soft" means soft.** Above the product limit: warn at 80%, warn again at 100%, keep working. Never
block receiving stock or ringing a sale on a paid plan. The number exists to prompt a conversation,
not to stop trade.

**Add-ons, any paid plan:** extra location $45 · extra full seat $15 · extra register $20 ·
channel sync $19 each · API + webhooks $29 · white-label $49 · audit + roles $39 ·
1,000 AI credits $10 · 5 AI rebuilds $10 · setup & migration $249.

### How it prices real businesses

| Business | Price | Nearest alternative |
|---|---|---|
| Solo barber or consultant | **$49** | Booksy $29.99, Vagaro $30 — neither does POS, stock or accounts |
| One shop, one owner | **$49** | Lightspeed $89, does less |
| 5-chair salon | **$99** | Vagaro $30 + 4 × $10 = $70, no accounting or stock |
| 3-branch retailer, 8 staff | **$189** ($99 + 2 × $45) | Lightspeed 3 × $149 = $447 |
| 10-branch chain, 25 staff | **$704** ($299 + 9 × $45) | Lightspeed 10 × $289 = $2,890 |

---

## Kept from V10

$49 entry (not $39 — Booksy $29.99 and Jobber $29 are the commodity floor; $39 sits in it, $49 does
not). Solo caps of 100 transactions and 20 service jobs a month. Free accountant seat. AI rebuilds as a
periodic allowance, with failed or rolled-back rebuilds not consuming it. No transaction caps on any
paid plan or any LTD tier. LTD at $199 / $399 / $699. Accounting-safe history gating on Solo — balances,
AR/AP, valuation and retained earnings always calculate correctly; only detail browsing, old reports
and export are locked, and nothing is ever deleted. Soften the ERP anchor to "traditional ERP
implementations can cost tens of thousands a year."

## Changed from V10

Seats, not capacity, separate the tiers. Locations become a per-location multiplier at every tier
rather than a tier fence. SKU limits become soft warnings. Google Drive backup is included on every
paid plan. Third tier is $299 rather than $399, because the location multiplier now carries the
revenue from larger businesses. Trial takes a card — **Solo is the no-card path**, so running both is
redundant, and card-required trials convert at a 44% median against 14% without.

## Still blocking, from the earlier audit

`PlanGate` returns `true` for everybody. The sale path must stop calling
`PlanGate::enforce('transactions_per_month')`. `EnsurePlanFeature` must fail closed. The `test-store`
bypass must move behind the testing environment. The Services module's missing `Employee` model and the
`job_assignments.employee_id` UUID mismatch are launch blockers. See the V7.1 addendum in
`extras/VENQORE_PRICING_GATING_IMPLEMENTATION_SPEC.md`.

## The philosophy

> **Everyone gets the same business operating system. You pay more when you have more people in the
> back office, or more shops — never because of what trade you are in.**

---

# Reconciliation with the second opinion (same day)

Both verdicts now agree on: $49 entry · $99 main plan · $45 per extra location · universal modules with
no vertical gating · Solo caps of 100 transactions / 20 service jobs / 500 catalogue items · accounting-safe
history · free adviser seat · LTD $199/$399/$699 with no transaction caps · AI credits with no rollover
and no surprise overage · and PlanGate as the blocker that outranks all of it.

## Conceded — adopt these

**1. B2B network moves down to Starter.** Basic merchant discovery, stock requests and a limited number
of active connections on the cheapest paid plan; unlimited connections on Core. A network is worth
nothing without density, and gating discovery behind $99 slows the one thing that makes it valuable.

**2. Rename to "Adviser access".** Covers accountant, bookkeeper, fractional CFO and tax professional.
Non-billable role, read-only on P&L, balance sheet, trial balance, ledger, journals, reports and export.
No POS, no settings, no user management.

**3. Do not print "45 modules" on the pricing page.** Group by what the business does:
**Sell · Operate · Build · Serve · Grow · Automate.** The module count stays in the internal spec.

**4. Catalogue rule, stated precisely.** Never disable existing operations. At 100% of included capacity,
everything already in the system keeps selling, syncing and reporting — creating item 5,001 requires the
capacity add-on. A wall in front of *new* capacity is a sale; a wall in front of *existing* trade is an
outage. Catalogue: Solo 500 hard · Starter 5,000 · Core 25,000 · Scale 250,000.

## Held — Core must add seats

The other proposal leaves Core on **one** back-office seat, making the $49 → $99 step registers,
catalogue size, history depth and cloud backup. That is a capacity fence, and it is exactly the shape
no vendor in the category uses: Housecall Pro goes 1 user → 5, QuickBooks 1 → 3, Shopify limited staff →
unlimited logins.

A customer can answer "how many people work in my back office" on signup day. They cannot answer "will I
exceed 10,000 products next year." **Core is 5 full seats.** This is the one point not to trade.

## Held — Scale at $299 with 25 seats, not $399 with 10

Scale exists to be the point where a business stops assembling add-ons. At $399 with 10 seats, a
ten-branch chain with 25 staff buys 15 extra seats and lands near **$1,029**. At $299 with 25 seats it
lands at **$704** and the plan does what its name promises. The $45 location multiplier already collects
revenue from size; Scale does not need to collect it twice. Both figures sit far under Lightspeed's
**$2,890** for ten locations.

## Held — the trial takes a card, and the contradiction must be fixed

The second opinion is right that V10 contains both designs — a no-card reverse trial in one section and
"the trial takes a card" in another. **That cannot ship; resolve it in the file before implementation.**

The call stays the card, for a product reason rather than a benchmark one: **Solo is already the
frictionless path.** Anyone can sign up with no card, describe their business, and watch VenQore build
the system — the entire sales weapon, free, zero friction. A second no-card route to the same moment
adds nothing except a worse conversion rate on the paid funnel, and card-required trials convert at a
44% median against 14% without.

If you later want to test it, the honest experiment is card-required versus no-card **on the paid trial
only**, with Solo unchanged as the control — not replacing one with the other on a hunch.

## External claims — agreed

Do not publish "VenQore does everything Jobber does plus X" or "replaces $400 of software" until
customer data proves it. Safe positioning: *one operating system instead of stitching together separate
POS, inventory, accounting, service and automation tools.*
