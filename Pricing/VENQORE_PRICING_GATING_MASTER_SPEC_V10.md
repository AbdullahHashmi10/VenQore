# VENQORE PRICING, GATING & COMMERCIAL MASTER SPECIFICATION V10

**Status:** Recommended launch architecture — updated with 6 critical fixes from research-backed audit
**Supersedes:** V9
**Purpose:** Public SaaS pricing, free/trial funnel, add-ons, entitlements, AI metering, device/seat protection, AppSumo LTD, regional pricing, future modules, and implementation rules.
**Commercial principle:** Every legitimate business gets the same core operating system. VenQore does not charge more because a business is a café, salon, repair shop, manufacturer, retailer, wholesaler, or service company. Customers pay more only when they consume more scale, capacity, integrations, or enterprise controls.

---

## WHAT CHANGED FROM V9

| # | V9 Problem | V10 Fix |
|:---|:---|:---|
| 1 | $0 → $99 pricing cliff kills self-serve conversion (research shows <1.5% conversion without bridge tier) | Added **Starter at $39/month** bridge tier |
| 2 | 30-day history limit breaks double-entry accounting math | Reframed to **browsing/export restriction only** — ledger math always works |
| 3 | Dual CTA (Free + Trial) cannibalizes paid trial conversion | Replaced with **Reverse Trial** model (single CTA) |
| 4 | "2 lifetime AI rebuilds" creates support bombs | Changed to **1 rebuild per quarter**, rolling, no rollover |
| 5 | No free accountant seat kills CPA referral channel | Added free read-only **External Accountant role** |
| 6 | No expansion ladder — $99 churn is 5-7%/month with no upsell path | Bridge tier creates natural Starter → Core → Scale expansion |

---

## 1. Executive decision

### Recommended public model

**Public fixed plans:**

1. **Solo — Free forever**: acquisition lane for genuine one-person micro-businesses, evaluation users, and post-trial retention.
2. **Starter — $39/month**: the bridge tier for small operators who outgrow Solo but are not ready for the full platform. The solo service provider's natural home.
3. **Core — $99/month**: the default paid plan and the commercial heart of VenQore. The full universal business operating system.
4. **Scale — $399/month**: a scale bundle for established multi-location businesses; not an industry tier.
5. **Enterprise — Custom**: negotiated for large groups, complex deployments, dedicated environments, contractual SLAs, SSO, custom security, or unusual infrastructure.

The public website must show **USD only**. No PKR pricing. No LTD pricing. No lifetime terminology.

### Recommended annual pricing

- Starter: **$390/year** (equivalent to $32.50/month; two months effectively free).
- Core: **$990/year** (equivalent to $82.50/month; two months effectively free).
- Scale: **$3,990/year** (equivalent to $332.50/month).

Annual billing should be the cash-collection lever. Monthly billing should remain the reference price.

### The central architectural decision

Do **not** sell "choose 8 of 46 modules."

Do **not** put manufacturing, service management, traceability, restaurant tools, loyalty, recurring invoices, accounting, or other vertical capabilities behind high-level industry tiers.

Do **not** create separate Café / Retail / Manufacturing / Services plans.

All paid plans are a **universal business operating system**. Vertical functionality is part of the operating system. Scale and capacity are what is monetized.

This is consistent with the observed market direction: Odoo sells all apps under a single per-user plan rather than per-app pricing; ERPNext does not price by user and provides the application as open-source with hosting/implementation economics; Square and Loyverse use free/paid expansion models around store, inventory, staff, history, and advanced functionality; and specialist field-service platforms charge for business capacity rather than requiring every business to buy an unrelated industry suite. [1][2][3][4]

---

## 2. Why the $39 Starter + $99 Core structure

### The pricing cliff problem

ProfitWell/Paddle research shows that adjacent pricing tiers should not exceed a 2x–3x multiplier. $0 → $99 is an infinite multiplier — the maximum possible price shock. Freemium products with a $99 first-paid-tier convert at under 1.5% free-to-paid. Products with a $29–$49 bridge tier convert at 3.5%–5.5%. [21][22][23]

For self-serve SMB software, the "frictionless credit card swipe" threshold is $50/month. At $99/month ($1,188/year), the purchase transitions from discretionary to a formal business expenditure requiring justification. [21]

Every major SaaS platform with a free tier uses a bridge:

| Product | Free | Bridge Tier | Main Tier |
|:---|:---|:---|:---|
| Slack | $0 | $7.25/user/mo | $15/user/mo |
| Notion | $0 | $10/user/mo | $20/user/mo |
| Canva | $0 | $12/mo | $20.83/user/mo |
| Monday.com | $0 | $9/seat/mo | $12/seat/mo |
| HubSpot | $0 | $15–$50/mo | $800+/mo |

HubSpot originally jumped from Free CRM to $800/month Professional. Conversion was abysmal. Adding Starter ($15–$50/month) unlocked massive self-serve conversion. [22]

### The service-business reality

Solo service providers' total SaaS budget is $30–$150/month for all software combined (scheduling + accounting + invoicing + CRM). Their pure operational SaaS allocation is 1%–2.5% of gross revenue. [24]

Current service-business competitor pricing:

| Competitor | Lowest Paid Tier | What They Get |
|:---|:---|:---|
| Jobber Core | $29/mo (annual) | Scheduling, quotes, invoicing, client hub, online booking |
| Booksy | $29.99/mo | Calendar, CRM, reminders, client management |
| Square Appointments Plus | $49/mo | Multi-calendar, SMS reminders, waitlist, POS |
| Housecall Pro Basic | $59/mo (annual) | Scheduling, dispatch, invoicing, online booking, payments |
| Wave Pro | $15.83/mo (annual) | Invoicing, accounting, bank feeds, receipt scanning |

At $99/month with no intermediate option, VenQore would consume 66%–100% of a solo service provider's entire software budget. The $39 Starter tier places VenQore competitively against Jobber ($29) and Booksy ($30) while offering far more functionality (POS + inventory + accounting + services + AI in one system).

### Why $99 Core remains correct

$99 is NOT wrong for VenQore's full platform. It replaces $200–$400/month of stacked subscriptions for a growing business. The Starter tier does not devalue Core — it creates an on-ramp.

$99 Core is close to Lightspeed's $89 retail entry point while including a much wider operational scope. It is materially below field-service products that reach $149–$399 for higher plans. It avoids training customers to think of VenQore as a cheap POS utility. It makes Core + one or two capacity add-ons a $120–$160/month purchase rather than forcing an unnecessary tier jump. [2][5][6][7][8]

### The expansion ladder

The bridge tier solves the churn math. SMB churn at the $99 price point is 5.0%–7.0% monthly (46%–60% annualized). Without an expansion ladder, you must acquire 30+ new customers/month just to maintain flat MRR at 50 customers. [25][26]

With the bridge tier:

1. Starter users upgrade to Core as they grow
2. Core users add locations, seats, channels
3. Scale absorbs multi-location operators

Net Revenue Retention (NRR) can exceed 100% because of the natural Starter → Core → Scale upsell path.

### The business math

At $39/month (Starter) + $99/month (Core) blended:

- 30 Starter + 20 Core = $1,170 + $1,980 = **$3,150 MRR** from 50 customers
- 50 Starter + 30 Core = $1,950 + $2,970 = **$4,920 MRR** from 80 customers
- 80 Starter + 50 Core + 5 Scale = $3,120 + $4,950 + $1,995 = **$10,065 MRR** from 135 customers

The blended ARPU with a natural upsell path is more sustainable than pure $99 pricing with high churn.

---

## 3. Public plan architecture

### 3.1 Solo — $0/month

**Purpose:** acquisition, product discovery, tiny operators, and post-trial retention.

**Included**

- 1 full back-office seat
- 1 registered POS register
- 1 location
- unlimited cashier/till PINs within the registered register
- 500 catalog items total (products + service offerings)
- 100 completed customer transactions/month
- 20 completed service jobs/appointments/month
- 30-day detailed history browsing and export window (see Section 10 for accounting scope)
- all core business modules available at functional level
- accounting and standard reporting available — cumulative balances always fully accurate
- POS, inventory, purchases, expenses, sales orders, invoicing, customer/supplier records, service catalog, production/BOM access, restaurant workflows, etc. available so the customer can experience the product
- 10 document scans/month
- 100 AI credits/month
- B2B Handshake: up to 3 active connections
- no Google Drive automated backup
- no API/webhooks
- no multi-location
- no custom roles/audit controls
- no human support
- no External Accountant seat
- help centre + Vena/self-service guidance only

**Important:** Solo is not a collection of randomly disabled modules. It is a capacity-limited version of the same operating system.

### 3.2 Starter — $39/month

**Purpose:** bridge tier for small operators, solo service providers, tiny retailers, and any business that has outgrown Solo but is not ready for the full Core platform. This is the natural paid entry point and the self-serve conversion engine.

**Starter capacity**

- 1 location
- 1 full back-office seat
- 1 registered POS register
- unlimited till/cashier PINs
- 2,000 catalog items
- unlimited transactions
- unlimited service jobs/appointments
- 90-day detailed history browsing and export window (see Section 10 for accounting scope)
- 250 AI credits/month
- 1 included structural AI rebuild session per quarter (no rollover)
- 3 trusted devices per full seat; one active back-office session at a time per seat
- 1 free External Accountant seat (read-only)

**Starter functionality**

- the complete universal ERP/POS core
- full services workflows (scheduling, dispatch, job management, tool tracking)
- manufacturing/recipes/BOM/work orders
- accounting/double-entry ledger
- standard reports
- stock takes, purchasing, suppliers, customers, returns, expenses
- restaurant/table workflows
- barcode/POS/offline operation
- batch/expiry/serial operational capability
- recurring invoices and reminders
- conversational dashboard / Vena
- SmartCapture
- AI onboarding/build experience
- email support (target response within 2 business days)

**Starter does not include**

- Google Drive automated backup sync (Core+)
- B2B Handshake network (Core+)
- B2C merchant listing/storefront (Core+)
- growth signals / owner's pulse (Core+)
- second POS register without add-on (Core includes 2)
- API/webhooks (add-on or Scale)
- white-label (add-on or Scale)
- advanced audit/security/role controls (add-on or Scale)
- consolidated multi-entity reporting (Scale/Enterprise)
- priority support (Scale/Enterprise)

### 3.3 Core — $99/month

**Purpose:** default plan for the overwhelming majority of paying SMB customers. The full universal business operating system.

**Core capacity**

- 1 location
- 1 full back-office seat
- 2 registered POS registers
- unlimited till/cashier PINs
- 10,000 catalog items
- unlimited transactions
- unlimited service jobs/appointments
- unlimited visible history for active subscription period and retained account data
- 1,000 AI credits/month
- 1 included structural AI rebuild session per quarter (no rollover)
- 3 trusted devices per full seat; one active back-office session at a time per seat
- 1 free External Accountant seat (read-only)

**Core functionality**

Everything in Starter, plus:

- Google Drive automated backup sync
- B2B Handshake network
- B2C merchant listing/storefront foundation where the network product is live
- growth signals / owner's pulse
- 2 registered POS registers (vs. 1 on Starter)
- 10,000 catalog items (vs. 2,000 on Starter)
- 1,000 AI credits/month (vs. 250 on Starter)
- unlimited visible history (vs. 90 days on Starter)

**Core does not include scale-only infrastructure controls**

- second physical location without the location add-on
- API/webhooks without API add-on
- white-label without white-label add-on
- enterprise-level audit/security/role controls without the relevant add-on
- consolidated multi-entity reporting without Scale/Enterprise

This distinction protects the commercial model without violating the universal-core promise.

### 3.4 Scale — $399/month

**Purpose:** established businesses that would otherwise assemble a large collection of add-ons.

- 10 locations
- 10 full seats
- 20 registers
- unlimited till/cashier PINs
- 250,000 catalog items
- unlimited transactions
- unlimited service jobs
- 10,000 AI credits/month
- structural AI rebuilds governed by fair-use/credit economics and abuse controls
- Google Drive backup sync
- all standard channels included within the published channel bundle
- API/webhooks
- custom roles
- advanced audit/security activity log
- consolidated multi-entity reporting
- priority support
- implementation/setup session
- 3 free External Accountant seats (read-only)

Scale is an economic shortcut, not a feature prison. A customer should choose it because the total cost of many capacity add-ons approaches $399, not because their industry is "premium."

### 3.5 Enterprise — Custom

Enterprise is for:

- >10 locations
- complex legal-entity structures
- SSO/SAML requirements
- dedicated infrastructure/region
- custom retention/security requirements
- custom integration work
- private network / enterprise API requirements
- contractual SLA and named success ownership
- major migrations
- large chains, distributors, franchise groups, regulated environments

Start Enterprise pricing at **$800/month** and quote upward based on capacity and complexity. Do not publish a fake "starting price" if it will be routinely exceeded.

---

## 4. The add-on system

Add-ons are allowed to monetize **scale and optional infrastructure**, not the customer's identity or trade.

### Recommended public add-ons

| Add-on | Price | Rule |
|---|---:|---|
| Extra location | **$39/mo** | Starter and above; activates multi-location once purchased |
| Extra full seat | **$15/mo** | Starter and above; back-office access only |
| Extra register | **$20/mo** | Starter and above |
| +50,000 catalog items | **$25/mo** | Starter and above |
| Channel Sync — each channel | **$19/mo** | WooCommerce, Shopify, Amazon, eBay, TikTok as individually metered channels where supported |
| API + webhooks | **$29/mo** | Starter and above |
| White-label / branded client experience | **$49/mo** | Core and above; exact capabilities defined in product scope |
| Advanced audit + custom roles | **$39/mo** | Starter and above |
| AI credit top-up | **$10 / 1,000 credits** | Manual purchase; never automatic overage |
| AI rebuild pack | **$10 / 5 rebuild sessions** | Manual purchase |
| Setup & migration | **$249 one-time** | Standard migration/setup |
| Complex migration | **from $599** | Quoted |

### Crucial add-on rule

An add-on **may unlock a capability** when that capability is an optional scale/infrastructure capability.

Examples:

- Starter has one location. Buying Extra Location unlocks location #2 and therefore enables multi-location operation. **This is allowed.**
- Starter does not have API. Buying API + Webhooks unlocks it. **This is allowed.**
- Starter already has BOM/manufacturing. There is no Production Pack. **Correct.**
- Starter already has service management. There is no "Service Pack." **Correct.**
- Starter already has restaurant/table workflows. There is no "Restaurant Pack." **Correct.**

This directly fixes the earlier broken rule that an add-on could only sell more of an already-available capability. For VenQore, there are two classes of add-ons:

1. **capacity add-ons** — extra quantity of a capability already included;
2. **scale/infrastructure unlocks** — capabilities whose value is intrinsically tied to business complexity.

Vertical workflow packs should not exist.

---

## 5. Why not "pick 8 of 46 modules"

Do not meter module count.

A module quota creates three problems:

1. **It contradicts the AI-builder promise.** If AI decides a business needs BOM, loyalty, batch tracking, recurring invoices, or field service and then says the plan cannot include it, the core product promise collapses.
2. **It creates support ambiguity.** Users will ask whether reports, POS returns, stock transfer, customer ledger, BOM, and every sub-feature count as one module or several.
3. **It taxes small specialists.** A one-person café may genuinely need BOM. A one-person phone repair business may genuinely need IMEI/serial workflows. Their use case does not become "enterprise" because that particular capability is important.

The stronger pattern is capability-by-scale. Odoo explicitly moved away from per-app pricing; Zoho One sells a broad business suite; ERPNext is not module-metered; Square and Loyverse monetise expansion around stores, advanced inventory, staff, history and higher capability rather than charging each micro-business an arbitrary vertical tax. [1][2][3][9]

---

## 6. Service-business economics: resolving the "free forever" problem

The concern is real but the proposed solution must not be an industry surcharge.

A solo service provider can have:

- few or zero SKUs,
- a small service catalogue,
- one user,
- one location,
- and still operate indefinitely.

Therefore the Free plan needs a **universal capacity floor that also catches service volume**.

Recommended Solo limits:

- 500 catalog items total
- 100 completed customer transactions/month
- 20 completed service jobs/appointments/month
- 30-day detailed history browsing/export window
- 10 document scans/month

The limit is based on business activity, not "service business tax." The same free account rules apply to a retailer, café, salon, repairer, tutor, mechanic, consultant, or small manufacturer.

### The Starter tier as the service-business solution

A solo service provider who outgrows the 20 jobs/month Solo cap naturally moves to Starter ($39/month) — which is competitive with Jobber Core ($29/mo) and Booksy ($30/mo) while offering POS, inventory, accounting, manufacturing, and AI in one system. This is a compelling value proposition without requiring the full $99 Core commitment.

### Important operational policy

The paid product must never stop a paying customer from operating a live POS transaction because an entitlement meter has been exhausted.

Free-plan limits may be hard because the free plan is the acquisition tier. Paid-plan scale meters should be handled through upgrade/add-on flows wherever possible, not by turning off the customer's ability to sell.

---

## 7. Acquisition funnel: the Reverse Trial

### V10 change: Replace the dual-CTA model with the Reverse Trial.

**Why the dual CTA was removed:**

Unbounce analyzed 74+ million landing page visits. Single-CTA pages converted at 13.5%. Pages with 2–4 CTAs dropped to 10.5%–11.9% — a 12%–22% relative conversion drop. [27]

When visitors see "Start 14-Day Free Trial (Card Required)" next to "Solo — Free Forever," the cognitive friction causes 80%–90% of traffic to click the free option, undermining the card-upfront strategy. [27][28]

### The Reverse Trial model

**Single hero CTA: "Get Started Free"** — no card required.

**What happens:**

1. **Day 0:** User signs up with no card. Full Core access begins automatically for 14 days.
2. **Day 1:** Onboarding completion prompt.
3. **Day 3:** Show first business value achieved.
4. **Day 7:** Show AI-built configuration and operational usage summary.
5. **Day 10:** Notify that the Core trial ends in 4 days. Prompt to add card.
6. **Day 12:** Remind again and explain the exact renewal price (Starter $39/mo or Core $99/mo).
7. **Day 14:** If card added → charge and convert to chosen plan. If no card → seamless downgrade to Solo.

**After downgrade to Solo:**

- All data preserved
- Account fully recoverable
- Upgrade to Starter or Core available at any time
- Lead nurturing sequence continues (research shows ~50% of ultimate conversions happen AFTER formal trial expiry when nurturing workflows are in place) [10][11]

### Why this is better than V9's dual-CTA approach

ChartMogul, Elena Verna, and Kyle Poyar report reverse trials deliver a 10%–40% lift in paid conversion compared to traditional freemium, while preserving top-of-funnel acquisition volume. [10][28]

End-to-end throughput per 1,000 website visitors:

| Model | Signups | Conversion Rate | Paying Customers |
|:---|:---|:---|:---|
| Card-required trial only | ~20 | 40%–48% | 8–10 |
| No-card trial only | ~100 | 10%–18% | 10–18 |
| Reverse Trial (recommended) | ~100 | 12%–18% | 12–18 |

The Reverse Trial captures the high signup volume of opt-in with the higher conversion quality of motivated buyers who actively choose to add a card.

### Conversion targets

At Day 14, offer two conversion paths:

- **"Continue with Core — $99/month"** (primary button)
- **"Continue with Starter — $39/month"** (secondary option)

This captures users who experienced Core but want to start with a lower commitment. Without the Starter option, they would fall to Solo (free) and may never convert.

### Do not say

"Card required because we want serious users."

### Say

"Start free. Experience the full platform for 14 days. Choose your plan when you're ready."

---

## 8. AI pricing and margin protection

AI must be treated as a **metered utility inside the product**, not as a separate vertical plan.

### Public AI model

Solo includes **100 AI credits/month + 10 document scans/month**.

Starter includes **250 AI credits/month + 50 document scans/month**.

Core includes **1,000 AI credits/month + unlimited scans**.

Scale includes **10,000 AI credits/month + unlimited scans**.

Credits do not roll over.

### AI structural rebuild sessions

**V10 change: 1 rebuild per quarter, rolling, no rollover.**

- Solo: no included rebuilds
- Starter: 1 rebuild per quarter
- Core: 1 rebuild per quarter
- Scale: governed by fair-use/credit economics

Additional rebuild sessions available via the **$10/5 rebuild pack** (manual purchase).

**Why this changed from V9's "2 lifetime rebuilds":**

AI rebuilds are non-deterministic. If rebuild #1 misinterprets a prompt or fails midway, the user has burned 50% of a permanent lifetime allowance. This creates angry support tickets demanding quota resets. A quarterly cadence removes the "permanent counter" psychology while still protecting margin.

### Suggested internal action weights

| AI action | Credits |
|---|---:|
| Text/document page scan | 1 |
| Handwritten page scan | 2 |
| Simple Vena question | 1 |
| Product description / small text generation | 2 |
| AI system modification | 10 |
| Major AI system rebuild session | 10+ or separately metered |
| Growth signal analysis | 20 |

The exact weights should be controlled by configuration so model prices can change without changing the commercial contract.

### AI safety rules

- Never advertise "unlimited AI."
- Warn at 70%, 85%, and 100% consumption.
- At exhaustion, stop AI actions only; do not disable the ERP/POS.
- Offer manual top-up.
- Offer BYOK.
- Never auto-charge an unexpected overage.

### BYOK

**BYOK should be free on paid plans.**

The customer pays the third-party model provider directly. VenQore may still meter platform-level non-model costs, but it should not charge a pointless "permission fee" merely for letting the customer pay their own AI provider.

This is commercially useful because AppSumo's own guidance for AI products now explicitly discusses credits, annual refreshes and BYOK as sustainable lifetime-deal structures. [12]

### Why the $10 / 1,000 top-up is sensible

The actual economic value comes from controlling the internal credit-to-cost mapping rather than treating one "credit" as one literal model token. The code should budget the worst-case model cost per action class and revise weights when model economics change.

Do not hard-code a claim such as "every credit costs half a cent." That is an internal budgeting assumption, not a stable market fact.

---

## 9. Device, seat, password-sharing, and accountant access controls

### Full seats

A full seat is a back-office identity with access to accounting, purchasing, reports, settings, pricing, cost information, and administrative capabilities.

Included:

- Solo: 1
- Starter: 1
- Core: 1
- Scale: 10
- Enterprise: custom

Extra full seat: **$15/month**.

### External Accountant seats (V10 addition)

**V10 change: Free read-only External Accountant role on paid plans.**

An External Accountant seat is a restricted identity for CPAs, bookkeepers, or fractional CFOs who need to review financial data without consuming a billable seat.

Included:

- Solo: 0
- Starter: 1 free
- Core: 1 free
- Scale: 3 free
- Enterprise: custom

**Why this was added:**

QuickBooks Online provides 2 free accountant seats. Xero provides unlimited free Adviser seats. FreshBooks provides up to 10 free accountant seats. CPAs manage 20–100 SMB clients and are the single most powerful referral channel for business software. If VenQore forces the business owner to share credentials or buy a $15 seat for their accountant, the CPA will advise switching to QuickBooks or Xero. [29][30][31]

**External Accountant permissions:**

- View financial reports, trial balance, P&L, balance sheet
- View journal entries and transaction history
- Export reports
- **Cannot** edit transactions, change settings, process sales, access POS, modify pricing, or access admin controls
- Requires separate login credentials (not shared owner login)
- Does not count against the full seat limit

### Till logins

Cashier/till identities are **not paid seats**.

They should be free and unlimited within the allowed registers.

This is commercially and operationally important because charging cashiers encourages credential sharing and destroys cashier-level accountability.

### Device protection

Use first-party signed device/session tokens.

For each full seat:

- one active back-office session at a time;
- up to three trusted devices on Solo, Starter, and Core;
- up to five on Scale;
- owner can revoke a device;
- when a new session signs in, the old session receives a clear eviction notice;
- never use GPS tracking, GPU fingerprinting, font fingerprinting, canvas fingerprinting, or invasive location surveillance.

### Registers

Registered physical POS devices are metered separately.

- Solo: 1
- Starter: 1
- Core: 2
- Scale: 20
- Extra register: $20/month

Register limits are checked when a register is **registered**, not on each sale.

**Never prevent a cashier from completing a sale merely because a billing meter expired.**

---

## 10. History, accounting scope, and downgrade behavior

Never delete business records to enforce pricing.

### V10 change: Accounting balances are always fully accurate.

**Critical accounting rule:**

The 30-day (Solo) and 90-day (Starter) history limits apply to **detailed transaction browsing and export only**. They do NOT affect the accounting engine.

Specifically:

**Always fully calculated regardless of plan:**

- Cumulative general ledger balances (all accounts)
- Balance sheet (Assets = Liabilities + Equity)
- Retained earnings
- Opening cash and bank balances
- Accounts Receivable and Accounts Payable totals and aging summaries
- Fixed asset depreciation schedules and book values
- Trial balance
- Current-period P&L (within the visible history window)
- Tax liability totals

**Restricted on Solo (30 days) and Starter (90 days):**

- Viewing individual transaction line items older than the history window
- Drilling into historical journal entry details
- Generating detailed historical reports (e.g., "P&L for Q1" when Q1 is outside the window)
- Exporting historical transaction data
- Viewing historical invoice/receipt PDFs

**Why this matters:**

No reputable accounting software has ever limited history to 30 days. The balance sheet equation depends on cumulative retained earnings from day one. If cumulative balances break, the accounting module is useless. Wave, ZipBooks, Akaunting, and Manager.io all provide unlimited history on their free tiers — they gate automation (bank feeds, OCR, multi-user) instead. [32][33][34][35]

Tax law requires 3–7 years of records (IRS 26 U.S.C. § 6001), 6 years (HMRC), or 5–10 years (EU). Any accounting tool that purges or hides cumulative data after 30 days is legally non-compliant.

### Downgrade behavior

When a free or Starter account has limited detailed history:

- older records remain in storage;
- older individual transactions become archived/read-only from the current plan;
- cumulative accounting balances always remain fully accurate and visible;
- an upgrade immediately restores full detailed access;
- the UI states exactly what is archived;
- exports of historical data are governed by plan rules.

Example banner (Solo):

> Your accounting balances are fully accurate. Detailed transaction history before [date] is available on Starter ($39/mo) or Core ($99/mo). Your older records are preserved and will reopen automatically when you upgrade.

Example banner (Starter):

> Your accounting balances are fully accurate. Detailed transaction history before [date] is available on Core ($99/mo). Your older records are preserved and will reopen automatically when you upgrade.

This is a commercial control, not data destruction.

---

## 11. AppSumo / LTD architecture

### Critical correction

Do **not** assume that AppSumo universally keeps 30%, 70%, or any other fixed percentage across every future deal. Current AppSumo Partner Terms state that revenue share and other fees are governed by the applicable Promotion Agreement. The exact commercial split must be confirmed in the agreement offered for VenQore. [13]

Therefore, model the LTD using the **worst-case confirmed net payout in your actual agreement**, not a generic internet percentage.

### Public website

Never display:

- LTD
- lifetime
- AppSumo prices
- marketplace pricing
- "buy once" language

The website displays only the recurring commercial SaaS model.

### AppSumo marketplace

AppSumo's current Partner Listing & Updates Policy requires self-listed products to be offered at a "lower than anywhere" price, requires at least 120 days of listing presence, provides a 60-day customer refund window for refundable products, requires lifetime updates/support for an LTD, and requires previous purchasers to be grandfathered when deal terms change. Self-listed marketplace offers are designed to be evergreen rather than short-lived campaigns. [14]

This makes a hidden, flexible LTD strategy possible, but it must be designed **before launch**, not improvised after sales begin.

### Recommended LTD tiers

#### LTD Tier 1 — $199 one-time

Maps to **Starter capacity**.

- 1 location
- 1 full seat
- 1 register
- unlimited till logins
- 5,000 catalog items
- unlimited sales transactions
- unlimited service jobs subject to fair-use/abuse controls
- all operational modules (same as Starter/Core — universal)
- 1 free External Accountant seat
- no API
- no white-label
- no advanced audit/role controls
- 1,200 AI credits/year (100/month equivalent)
- 1 AI structural rebuild session per quarter
- help centre + Vena support

#### LTD Tier 2 — $399 one-time

Maps to **Core capacity**.

- 2 locations
- 2 full seats
- 4 registers
- unlimited till logins
- 25,000 catalog items
- unlimited transactions
- all operational modules (universal)
- 2 free External Accountant seats
- 6,000 AI credits/year (500/month equivalent)
- 1 AI structural rebuild session per quarter
- API may be sold as a recurring add-on
- advanced roles/audit not included
- standard support

#### LTD Tier 3 — $699 one-time

Maps to **Scale-lite capacity**.

- 5 locations
- 5 full seats
- 10 registers
- unlimited till logins
- 50,000 catalog items
- unlimited transactions
- 18,000 AI credits/year (1,500/month equivalent)
- 1 AI structural rebuild session per quarter
- one channel sync included; additional channels recurring
- API included
- advanced audit/custom roles included
- 3 free External Accountant seats
- priority support within reasonable self-serve/SaaS boundaries

### Why no LTD transaction cap

Do **not** hard-cap sales/invoices/receipts at 1,000/5,000/20,000 per month.

The reason is operational, not ideological:

- transaction limits are discovered during active business operations;
- POS systems are mission-critical at checkout;
- a transaction cap creates a failure mode that can stop a business from selling;
- AppSumo requires lifetime purchasers to be grandfathered when terms change, so an overly conservative published limit becomes a long-term obligation; and
- AppSumo's current AI guidance specifically recommends metered treatment for AI-heavy cost, not indiscriminate metering of the entire product. [12][14]

**Validated by current AppSumo listings:** Vitepos, Selldone, Flowlu, Deskera, and Agiled all offer unlimited transactions on their LTD tiers. They cap seats, locations, registers, storage, and AI instead. [15][16][17][36][37]

**Cap durable resources instead:** locations, full seats, registers, catalog capacity, storage, API entitlement, channel count, and AI credits.

### LTD recurring revenue

Keep these recurring where operationally justified:

- Channel Sync: $19/month/channel
- AI top-ups: $10/1,000 credits
- additional AI rebuild packs: $10/5
- optional API infrastructure where not included
- optional extra seats/locations/registers where supported by the LTD structure
- future third-party provider charges or premium integrations, clearly disclosed in advance

Do not add a surprise "hosting fee" years later.

If a recurring fee is part of the lifetime offer, it must be stated in the deal terms from the beginning.

### Why lifetime pricing cannot be too cheap

A recurring $99 customer who stays for 24 months represents $2,376 of gross subscription revenue before costs.

A lifetime buyer at $199 may stay for years.

Therefore the LTD is **not** a cheap replacement for the subscription. It is an acquisition/capital product with bounded capacity and higher support risk.

Current AppSumo examples show lifetime offers commonly use multiple license tiers, credit refreshes, caps on durable resources, or BYOK rather than unlimited AI. Examples include AIWriteBook, NoCodeBackend, Support Board and other current marketplace offers. [12][15][16][17]

---

## 12. What AppSumo means for the launch strategy

The LTD should be treated as **capital + distribution + feedback**, not as your core revenue engine.

Launch sequence:

1. Launch recurring website pricing first.
2. Fix onboarding, billing, entitlement enforcement, reliability, support documentation, and activation.
3. Acquire the first real paying users directly.
4. Collect product feedback and usage distributions.
5. Apply to AppSumo when the product is polished enough to survive a marketplace spike.
6. Negotiate the actual Promotion Agreement.
7. Launch a deliberately bounded LTD.
8. Keep LTD customers off the main public price page.
9. Use LTD capital for product quality, acquisition, support automation, and branding rather than permanent operating losses.

AppSumo's current policy explicitly says products should be polished and ready at submission, and marketplace customers are entitled to ongoing support according to the deal terms. [14]

---

## 13. The $20,000 AI-native ERP positioning claim

Do not publish:

> "AI-native ERP costs $20,000 per year."

That is too absolute.

Use a qualified value anchor:

> **Some AI-native ERP deployments are quoted at $20,000+ per year, often with implementation and enterprise support. VenQore starts at $39/month.**

A current third-party 2026 estimate for Rillet reports typical AI-native ERP deployments around the $20,000-$35,000 annual range, while Rillet itself does not publish a universal price list and says its pricing is based on features and business complexity. Rillet's public materials also describe white-glove implementations lasting 4–6 weeks. [18][19]

This is a positioning anchor, not a claim that VenQore matches every capability of Rillet or Campfire.

The homepage should emphasize the different target market and the dramatically lower implementation burden.

---

## 14. Pakistan / regional pricing

The public website contains **zero PKR prices**.

The public website may include a discreet:

> Regional pricing inquiry

The regional process should be a **manual commercial quotation**, not an alternate public price table.

Recommended verification signals:

- Pakistani phone number OTP
- business identity/business details sufficient to establish operating location
- manual review

Do not request unnecessary identity documents by default. Use the minimum information needed for eligibility verification and lawful billing.

Regional pricing must never appear alongside international pricing in the same public pricing selector.

---

## 15. Future modules: CRM, marketing, WhatsApp, etc.

The pricing architecture must survive new features.

### Rule

When a future module is added, classify it into one of three commercial classes:

**Class A — Universal core capability**

Needed by a broad range of businesses. Add to all paid plans without a price increase solely because the module is new.

Examples could include CRM fundamentals, additional operational reports, workflow automation, new accounting capabilities, or generic customer management.

**Class B — Scale / infrastructure capability**

Creates real infrastructure or organisational scale.

Examples:

- multi-location
- API/webhooks
- white-label
- SSO
- advanced audit controls
- consolidated multi-entity reporting
- dedicated environments

These belong in add-ons, Scale, or Enterprise.

**Class C — variable-cost usage capability**

Costs rise materially with usage.

Examples:

- AI generation
- messaging/SMS/WhatsApp provider charges
- premium data providers
- marketplace payment/transaction processing
- high-volume external APIs

These use credits, pass-through fees, or recurring usage pricing.

### Important

Never create a new vertical price tier merely because a new module is associated with one industry.

---

## 16. B2B Handshake and B2C network

These should be treated as strategic network products, not as ordinary modules.

### B2B Handshake

The goal is to let VenQore tenants request stock/services/products from other VenQore tenants without rebuilding the same paperwork.

The network can eventually create:

- buyer requests
- seller responses
- automatic purchase order creation
- sales order generation
- pricing/terms handshakes
- shipment/fulfilment state
- settlement records

Keep basic network participation free for merchants while the network is being seeded. Monetize later through transaction services, premium discovery, payments, or enterprise network capabilities only when there is a real value event.

B2B Handshake is available on Core and above (Solo gets 3 connections, Starter does not include it).

### B2C discovery marketplace

Merchant listing can be free to encourage supply density.

Possible future monetization:

- payment processing
- optional promoted placement
- net-new customer discovery fee
- delivery/fulfilment economics
- consumer services

Do not charge merchants a monthly "marketplace access" fee before the marketplace provides meaningful demand.

---

## 17. Lock states

Every entitlement should have exactly one of these states:

1. **Open** — available normally.
2. **Preview-locked** — visible and explorable, but activation requires upgrade/add-on.
3. **Capacity-reached** — capability is available, but the current quantity is exhausted.
4. **AI-meter-exhausted** — only AI actions are paused.
5. **Archived/read-only** — data remains but detailed browsing/export is unavailable in the current plan until upgrade. Cumulative accounting balances remain fully calculated.

There is no "hidden secret lock." Users should understand what they can use, what they have reached, and what unlocks the next step.

### Lock message structure

Every lock message must answer:

- What is locked?
- Why?
- What will it cost?
- What is the nearest upgrade/add-on?
- Will existing data remain safe?

Examples:

> You already have 1 location. Add another for $39/month, or move to Scale for up to 10 locations.

> You've used 90 of your 100 monthly transactions on Solo. Upgrade to Starter ($39/month) for unlimited transactions.

> Your accounting balances are fully accurate. Detailed transaction history before [date] is available on Core ($99/month).

---

## 18. Entitlement architecture

The existing codebase already contains the building blocks described in the audited pricing documents:

- `plans`
- `plan_limits`
- `plan_features`
- `tenant_plan_overrides`
- `PlanRepository`
- `Tenant::getLimit()`
- `PlanLimitException`
- `PlanDowngradeService`
- `PlanAiAllowance`
- `AiEntitlementService`
- 74 existing `PlanGate` call sites
- Inertia-shared entitlement data

The current blocker in the audit is that `PlanGate::check()` returns true, `enforce()` is empty, `getLimit()` returns null, and the middleware currently allows requests through. That means pricing cannot be considered live until the entitlement layer is actually enforced. This is a hard implementation blocker, not a cosmetic task. [20]

### Required enforcement layers

**Layer 1 — server authorization**

The server decides whether an operation is allowed.

**Layer 2 — middleware/routes**

Gated route groups must enforce plan capability before work begins.

**Layer 3 — domain/model limits**

Create/update operations must enforce quantity limits centrally so API/import/controller paths cannot bypass them.

**Layer 4 — frontend presentation**

The frontend reads entitlement state to render the correct UI. It never acts as the only security boundary.

---

## 19. Required entitlement keys

Use stable capability and limit keys rather than hard-coding plan names throughout the application.

Examples:

- `locations.max`
- `full_seats.max`
- `registers.max`
- `catalog_items.max`
- `free_transactions.monthly_max`
- `service_jobs.monthly_max`
- `history.visible_days`
- `history.accounting_balances_always_calculated` (boolean, always true)
- `ai.credits.monthly`
- `ai.rebuilds.quarterly`
- `ai.scans.monthly_max`
- `google_drive_sync.enabled`
- `multi_location.enabled`
- `api.enabled`
- `webhooks.enabled`
- `white_label.enabled`
- `custom_roles.enabled`
- `audit_log.enabled`
- `multi_entity_reporting.enabled`
- `channel_sync.max_channels`
- `b2b.handshake.max_active_connections`
- `b2b.handshake.enabled`
- `b2c.storefront.enabled`
- `growth_signals.enabled`
- `external_accountant_seats.max`

Feature keys should represent capabilities. Limit keys should represent quantities.

---

## 20. Add-on precedence rules

Entitlements should be calculated as:

**Base plan capability + active add-ons + tenant overrides + grandfathered LTD entitlements**

with explicit precedence and auditability.

Rules:

1. An active paid add-on cannot reduce a base entitlement.
2. A grandfathered entitlement cannot be silently removed.
3. A downgrade cannot delete business records.
4. Add-ons may be cancelled independently.
5. If an add-on is required for an existing object, existing records remain readable after cancellation.
6. Creation of new objects requiring the cancelled capability is blocked until reactivation/upgrade.
7. Billing and entitlement changes must be idempotent.

---

## 21. Billing UX

### Pricing page

Show:

- Solo — Free
- Starter — $39/month
- Core — $99/month (highlighted as "Most Popular" or "Recommended")
- Scale — $399/month
- Enterprise — Custom

Annual toggle:

- Starter: $390/year
- Core: $990/year
- Scale: $3,990/year

Do not display a wall of 46 modules.

Use three feature families:

1. **Everything your business needs to run**
2. **Scale when your business grows**
3. **Optional integrations and capacity**

### Inside the application

The Billing page should show:

- current plan
- current capacity vs capacity available
- active add-ons
- AI credit usage
- AI rebuild sessions remaining this quarter
- registered devices
- registers
- locations
- seats (full + External Accountant)
- next billing date
- upgrade/downgrade controls
- archived capabilities after downgrade

### Upgrade prompts

Upgrade prompts should occur at the moment of value:

- reaching Solo transaction/job limits
- exceeding Starter history window
- adding location #2
- inviting a second full back-office user
- registering register #2 (Starter) or #3 (Core)
- reaching 80%/90% of AI credits
- enabling API
- enabling white-label
- exceeding catalog item limits

Do not spam users with upgrade banners for ordinary functions already included in their plan.

---

## 22. Support economics

The commercial model assumes that Starter/Core customers receive normal email support and Scale receives faster/priority support.

### Solo

- no human support by default
- help centre
- Vena/self-service assistant
- public documentation

### Starter

- email support
- target response within 2 business days
- onboarding automation

### Core

- email support
- target response within 2 business days
- onboarding automation

### Scale

- priority email
- target response within 1 business day
- setup/implementation assistance

### Enterprise

- named contact
- contractual SLA
- implementation and success management

Do not sell $39 or $99 plans with enterprise-grade human onboarding by default. That recreates the support-per-dollar trap.

---

## 23. Pricing experiments that are allowed after launch

Do not change the public structure every few weeks.

Allowed experiments:

- monthly vs annual emphasis
- Starter or Core price adjustment after meaningful proof
- annual discount percentage
- add-on pricing
- trial length
- trial messaging
- onboarding sequence

Do not simultaneously change:

- pricing
- plan structure
- module allocation
- add-ons
- trial terms
- LTD terms

because that makes performance data impossible to interpret.

### First price review trigger

Review pricing after the earlier of:

- 100 paying customers, or
- statistically useful cohort data showing sustained activation, retention and support economics.

Do not raise pricing merely because a competitor changes theirs.

---

## 24. Financial dashboard VenQore should monitor from day one

The pricing system should produce an internal commercial dashboard containing:

- visitor → signup rate
- trial start rate (reverse trial activation)
- trial → Starter conversion
- trial → Core conversion
- Starter → Core upgrade rate
- Core → Scale upgrade rate
- free → paid conversion (Solo → any paid)
- add-on attach rate
- average revenue per account
- monthly recurring revenue
- annual recurring revenue
- refund rate
- failed payment rate
- logo churn (by plan)
- revenue churn (by plan)
- gross retention
- net revenue retention
- support tickets/customer/month (by plan)
- support minutes/customer/month
- AI cost/customer/month
- storage cost/customer/month
- channel/integration cost/customer/month
- contribution margin/customer
- LTD active ratio
- LTD support tickets per account
- LTD AI consumption
- External Accountant seat usage rate

Do not judge pricing success from signup volume alone.

---

## 25. The commercial metrics that decide whether prices stay

Target directional thresholds rather than fake universal benchmarks:

### Starter

- free → Starter conversion: aim for >3% initially; >5% is strong
- monthly gross churn: target <4%
- Starter → Core upgrade rate: target >15% within 6 months

### Core

- trial → Core: aim for >10% initially; >15% becomes strong enough to scale paid acquisition aggressively
- annual-plan selection: target 25–40%
- add-on attach: target >20%
- monthly gross churn: target <3% once product-market fit begins to appear
- support tickets: trend downward as onboarding improves

### Solo

The target is not maximum conversion.

The target is:

- activation
- word of mouth
- upgrade when capacity is reached (to Starter first, then Core)
- low infrastructure/support burden

A free user who never pays but costs almost nothing can be a good acquisition asset. A free user who consumes significant human support is not.

These are operating targets for VenQore, not claims about industry-wide averages.

---

## 26. Recommended homepage value anchor

Preferred wording:

> **Some AI-native ERP deployments cost $20,000+ a year. VenQore starts at $39/month.**

Subtext:

> Built for independent businesses and growing operators — with accounting, POS, inventory, manufacturing, service workflows, AI, and business automation in one operating system.

Do not claim that VenQore is a direct one-for-one replacement for enterprise systems such as Rillet or Campfire. Those products target different segments and often use white-glove implementations. [18][19]

---

## 27. The five major commercial mistakes this specification prevents

### Mistake 1 — Underpricing

Do not return to $18-$29 simply because it makes the signup number look attractive.

### Mistake 2 — Vertical taxation

Do not charge a one-person café more because it needs BOM, or a repair shop more because it needs serial/IMEI. Core capability is universal.

### Mistake 3 — Module-count pricing

Do not sell "10 of 46 modules." The AI-builder positioning makes that incoherent.

### Mistake 4 — LTD operational suicide

Do not publish transaction caps that can stop a business from selling. Use AI/resource/capacity limits instead.

### Mistake 5 — The pricing cliff

Do not jump from $0 to $99 with no bridge. The $39 Starter tier exists specifically to cross the penny gap and capture the 2x–3x conversion improvement that bridge tiers produce.

---

## 28. Final recommended commercial model

### PUBLIC

**Solo — Free**

- 1 seat
- 1 register
- 1 location
- 500 catalog items
- 100 transactions/month
- 20 service jobs/month
- 30-day detailed history (accounting balances always accurate)
- 10 scans/month
- 100 AI credits/month
- all core modules
- no External Accountant seat
- no human support

**Starter — $39/month / $390/year**

- 1 seat
- 1 register
- 1 location
- 2,000 catalog items
- unlimited transactions
- unlimited service jobs
- 90-day detailed history (accounting balances always accurate)
- 50 scans/month
- 250 AI credits/month
- 1 AI rebuild/quarter
- 1 free External Accountant seat
- all core modules
- email support

**Core — $99/month / $990/year**

- 1 seat
- 2 registers
- 1 location
- 10,000 catalog items
- unlimited transactions
- unlimited service jobs
- full history
- unlimited scans
- 1,000 AI credits/month
- 1 AI rebuild/quarter
- Google Drive sync
- B2B/B2C network foundations
- growth signals / owner's pulse
- 1 free External Accountant seat
- all core modules
- email support

**Scale — $399/month / $3,990/year**

- 10 locations
- 10 seats
- 20 registers
- 250,000 catalog items
- unlimited transactions
- 10,000 AI credits/month
- API/webhooks
- channels bundle
- audit/custom roles
- multi-entity reporting
- 3 free External Accountant seats
- priority support

**Enterprise — custom**

- $800+/month starting point
- negotiated infrastructure, security, SLA and implementation

### ADD-ONS

- location $39/mo
- seat $15/mo
- register $20/mo
- 50k catalog items $25/mo
- channel $19/mo/channel
- API/webhooks $29/mo
- white-label $49/mo
- audit/custom roles $39/mo
- AI top-up $10/1k
- rebuild pack $10/5
- setup $249
- complex migration $599+

### LTD / APPSUMO

- Tier 1 $199 (Starter capacity)
- Tier 2 $399 (Core capacity)
- Tier 3 $699 (Scale-lite capacity)
- unlimited transactions
- bounded locations/seats/registers/catalog/AI
- quarterly AI rebuild sessions
- annual AI credit refresh
- free External Accountant seats per tier
- recurring optional integrations/top-ups
- never published on the main website

### ACQUISITION FUNNEL

- Single hero CTA: "Get Started Free" (no card)
- 14-day Reverse Trial with full Core access
- Day 14: choose Starter ($39), Core ($99), or auto-downgrade to Solo
- Solo as permanent fallback and nurture target

---

## 29. Implementation checklist for the coding agent

### Configuration

Update `config/pricing.php` and/or `config/plans.php` to represent:

- `solo = 0`
- `starter = 39`
- `core = 99`
- `scale = 399`
- `enterprise = custom`
- Starter annual = 390
- Core annual = 990
- Scale annual = 3990
- Solo limits listed above
- Starter limits listed above
- Core limits listed above
- Scale limits listed above
- add-on pricing listed above
- LTD tiers separated from public plan slugs
- External Accountant seat limits per plan
- AI rebuild quarterly allowance per plan
- History visible days per plan
- `history.accounting_balances_always_calculated = true` (all plans)

### Database

Confirm entitlement tables support:

- plan capability
- quantity limit
- add-on capability
- add-on quantity
- billing state
- LTD grandfathered state
- source of entitlement
- effective date
- expiry/cancellation date
- External Accountant seat count
- AI rebuild quarterly counter
- AI rebuild quarter start date
- reverse trial state (trial_active, trial_expired, converted, downgraded)

### Enforcement

Implement and test:

- `PlanGate::check()`
- `PlanGate::enforce()`
- `PlanGate::getLimit()`
- `EnsurePlanFeature`
- location observer/service
- full-seat observer/service
- register observer/service
- catalog-item observer/service
- free transaction/service-job meters
- AI allowance service
- AI rebuild quarterly service
- history scope (browsing/export restriction, NOT accounting balance restriction)
- add-on entitlement resolver
- LTD entitlement resolver
- External Accountant seat management
- reverse trial state machine (trial_active → converted | downgraded)

### Frontend

Create a reusable entitlement hook/component, for example:

- `useEntitlement()`
- `EntitlementGate`
- `UpgradePrompt`
- `CapacityMeter`
- `AiCreditMeter`
- `AiRebuildMeter`
- `DeviceManager`
- `ExternalAccountantManager`
- `ReverseTrialBanner`
- `HistoryArchiveBanner`

### Billing

Implement:

- monthly billing
- annual billing
- add-on proration
- cancellation
- downgrade (Core → Starter, Starter → Solo, Core → Solo)
- upgrade (Solo → Starter, Starter → Core, any → Scale)
- payment failure grace period
- grandfathering
- LTD license activation
- LTD quarterly AI rebuild refresh
- LTD annual AI credit refresh
- top-up purchase
- reverse trial 14-day state management
- reverse trial expiry → Solo downgrade automation
- reverse trial → paid conversion flow

### Testing

At minimum, test every gated capability across:

- Solo
- Starter
- Core
- Scale
- Enterprise override
- Starter + each add-on
- Core + each add-on
- LTD Tier 1
- LTD Tier 2
- LTD Tier 3
- Reverse trial active
- Reverse trial expired (should behave as Solo)

Add regression tests proving that:

- free limits cannot be bypassed through API/import
- add-ons unlock exactly what they claim
- downgrades never delete data
- expired AI credits do not disable ERP functions
- a failed payment does not interrupt a live POS sale
- LTD customers retain grandfathered entitlements
- annual AI refresh resets the correct amount
- quarterly AI rebuild counter resets correctly
- one full seat cannot run concurrent back-office sessions beyond the allowed session policy
- External Accountant seats are read-only and cannot access POS/admin
- accounting cumulative balances are always fully calculated regardless of plan
- history browsing restriction does not affect balance sheet, trial balance, or retained earnings

---

## 30. Source notes

[1] Odoo, current pricing: Standard $24.90/user/month with all apps; Custom $49/user/month with all apps and additional platform capabilities. https://www.odoo.com/pricing

[2] Lightspeed Retail, current public pricing: Basic $89/month, Core $149/month, Plus $289/month per location. https://www.lightspeedhq.com/pos/retail/pricing/

[3] Loyverse, current public pricing: free POS/inventory core with add-ons including unlimited sales history $5/month/store, employee management $25/month/store, and advanced inventory $25/month/store. https://loyverse.com/en-us/pricing

[4] ERPNext/Frappe, current public pricing: ERPNext is open source; managed hosting starts at $5/month on Frappe Cloud, with implementation as a separate cost. https://frappe.io/erpnext/pricing

[5] Jobber current pricing: Core $49/month monthly ($29/month annual); Grow $149/month starting point; current annual pricing varies by commitment. https://www.getjobber.com/pricing/

[6] Housecall Pro current pricing: Basic $79/month monthly or $59/month annual; Essentials $189/month monthly or $149/month annual; MAX $329/month monthly or $299/month annual. https://www.housecallpro.com/pricing/

[7] Square current pricing: Free; Plus $49/location/month; Premium $149/location/month. https://squareup.com/us/en/pricing

[8] Cin7 current pricing: Standard $349/month, Pro $599/month, Advanced $1,199/month. https://www.cin7.com/pricing/

[9] Zoho Books current pricing demonstrates add-on monetization around users, document scans and locations. https://www.zoho.com/us/books/pricing/

[10] ChartMogul, 2026 SaaS Conversion Report: 57% of surveyed products use free trials as primary landing point, 26% freemium, 14 days most common trial length, and card-required trials show higher trial-to-paid conversion but with signup friction. ~50% of ultimate conversions happen after formal trial expiry with nurturing. https://chartmogul.com/reports/saas-conversion-report-2/

[11] ChartMogul, SaaS Conversion Report: good freemium conversion 3%-5%, good free-trial conversion 4%-6%, and higher trial conversion among card-required trials; the report explicitly notes the tradeoff between conversion and signup volume. https://chartmogul.com/reports/saas-conversion-report/

[12] AppSumo, "How lifetime deals work in the new AI era": AI LTDs increasingly use credit bundles, annual refreshes and BYOK because AI creates ongoing variable costs. https://appsumo.com/blog/lifetime-deals-in-ai-era

[13] AppSumo Partner Terms, effective June 15, 2026: partner revenue share is determined by the applicable Promotion Agreement. https://appsumo.com/partner-terms/

[14] AppSumo Partner Listing & Updates Policy: self-listed products must be lower-than-anywhere pricing, listings must remain live at least 120 days, refundable products have a 60-day refund window, LTDs require lifetime updates/support, and existing purchasers are grandfathered when deal terms change. https://appsumo.com/partner-terms/listing-policy/

[15] AppSumo current example: AIWriteBook uses four LTD tiers with recurring monthly AI credits and BYOK, with prices $79/$159/$319/$519. https://appsumo.com/products/aiwritebook/

[16] AppSumo current example: NoCodeBackend uses multiple LTD tiers with database, record, webhook and AI-call capacity limits. https://appsumo.com/products/nocodebackend/

[17] AppSumo current example: Support Board uses multiple LTD tiers with monthly message capacity and explicit third-party AI service costs excluded. https://appsumo.com/products/support-board/

[18] Rillet current 2026 materials: AI-native ERP, complexity/features-based pricing, white-glove implementation, no universal public price. https://www.rillet.com/help-center

[19] ERP Research 2026 estimate for Rillet: buyer-side observed ranges around $20,000-$35,000/year and higher first-year totals when implementation is included; this is a third-party estimate, not Rillet's published price list. https://erpresearch.com/pricing/rillet

[20] VenQore internal pricing audit supplied with this specification: current `PlanGate::check()`/`enforce()`/`getLimit()` are not enforcing entitlements; multiple entitlement tables/services and 74 gate call sites already exist. The implementation blocker must be resolved before pricing is considered operational.

[21] ProfitWell/Paddle: adjacent pricing tiers should not exceed a 2x–3x multiplier. $0 → $99 is an infinite multiplier creating maximum price shock. https://www.paddle.com/resources

[22] OpenView Product Benchmarks Report & Growth Unhinged by Kyle Poyar: freemium products with $99 first-paid-tier convert under 1.5%. Bridge tiers at $29–$49 convert at 3.5%–5.5%. https://openviewpartners.com https://www.growthunhinged.com

[23] First Round Capital — The Penny Gap (Josh Kopelman): the transition from $0 to any monetary cost is a qualitative psychological hurdle. https://firstround.com/review/

[24] Software Advice / Gartner Digital Markets Study: 62% of micro-businesses (1–5 employees) use 2 or fewer paid software tools. 65% cite cost as #1 barrier. Solo operators budget $30–$150/month total for operational SaaS. https://www.softwareadvice.com

[25] ChartMogul SaaS Benchmarks: sub-$100 ARPU monthly logo churn 5.0%–7.0% (46%–60% annualized). https://chartmogul.com/saas-metrics/

[26] Lenny's Newsletter: good SMB monthly churn 2.5%–5.0%; great <1.5%–2.0%. Top SMB SaaS offset churn via expansion revenue for 100%+ NRR. https://www.lennysnewsletter.com/p/what-is-good-retention-issue-29

[27] Unbounce Conversion Benchmark Report (74M+ landing page visits): single CTA 13.5% conversion; 2–4 CTAs 10.5%–11.9%; 5+ CTAs 8.6%. https://unbounce.com/conversion-benchmark-report/

[28] CXL, Elena Verna, Kyle Poyar: reverse trials deliver 10%–40% lift in paid conversion vs. traditional freemium while preserving top-of-funnel volume. https://cxl.com/blog/call-to-action-best-practices/ https://www.growthunhinged.com

[29] QuickBooks Online: 2 free accountant seats (3 on Advanced), does not count against billable user limit. https://quickbooks.intuit.com/learn-support/

[30] Xero: unlimited free Adviser seats, no extra cost. https://www.xero.com/us/advisors/

[31] FreshBooks: up to 10 free accountant seats on Plus and above. https://www.freshbooks.com/pricing

[32] Wave Starter: unlimited transaction history on free tier; gates automated bank feeds. https://www.waveapps.com/pricing

[33] ZipBooks Starter: unlimited history on free tier; gates bank accounts and recurring billing. https://zipbooks.com/pricing/

[34] Akaunting: unlimited history on free/open-source; gates cloud hosting and advanced modules. https://akaunting.com/pricing

[35] Manager.io Desktop: zero usage limits, perpetual history; gates multi-user cloud access. https://www.manager.io/pricing

[36] AppSumo Vitepos: unlimited transactions, caps registers/devices. https://appsumo.com/products/vitepos/

[37] AppSumo Flowlu: unlimited transactions/invoices, caps team users and storage. https://appsumo.com/products/flowlu/

---

## FINAL DECISION

**Do this:**

> **Free Solo + $39 Starter + $99 Core + $399 Scale + Custom Enterprise, with universal core modules, capacity/scale add-ons, free External Accountant seats, and the Reverse Trial acquisition model.**

> **Do not cap transactions on LTDs. Cap durable resources and meter AI quarterly.**

> **Use a single "Get Started Free" CTA with a 14-day Reverse Trial of Core, auto-downgrading to Solo if no card is added.**

> **Keep all LTD pricing off the main website.**

> **Do not create vertical pricing. Do not price by module count. Do not charge cashiers as seats. Do not sell surprise AI overages. Do not break accounting balances on any plan.**

This is the commercial architecture most consistent with VenQore's current positioning as an AI-built business operating system rather than a conventional vertical POS or a collection of industry-specific modules.
