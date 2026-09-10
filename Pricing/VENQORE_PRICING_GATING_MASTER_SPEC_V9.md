# VENQORE PRICING, GATING & COMMERCIAL MASTER SPECIFICATION V9

**Status:** Recommended launch architecture
**Purpose:** Public SaaS pricing, free/trial funnel, add-ons, entitlements, AI metering, device/seat protection, AppSumo LTD, regional pricing, future modules, and implementation rules.
**Commercial principle:** Every legitimate business gets the same core operating system. VenQore does not charge more because a business is a café, salon, repair shop, manufacturer, retailer, wholesaler, or service company. Customers pay more only when they consume more scale, capacity, integrations, or enterprise controls.

---

## 1. Executive decision

### Recommended public model

**Public fixed plans:**

1. **Solo — Free forever**: acquisition lane for genuine one-person micro-businesses and evaluation users.
2. **Core — $99/month**: the default paid plan and the commercial heart of VenQore.
3. **Scale — $399/month**: a scale bundle for established multi-location businesses; not an industry tier.
4. **Enterprise — Custom**: negotiated for large groups, complex deployments, dedicated environments, contractual SLAs, SSO, custom security, or unusual infrastructure.

The public website must show **USD only**. No PKR pricing. No LTD pricing. No lifetime terminology.

### Recommended annual pricing

- Core: **$990/year** (equivalent to $82.50/month; two months effectively free).
- Scale: **$3,990/year** (equivalent to $332.50/month).

Annual billing should be the cash-collection lever. Monthly billing should remain the reference price.

### The central architectural decision

Do **not** sell “choose 8 of 46 modules.”

Do **not** put manufacturing, service management, traceability, restaurant tools, loyalty, recurring invoices, accounting, or other vertical capabilities behind high-level industry tiers.

Do **not** create separate Café / Retail / Manufacturing / Services plans.

The paid Core plan is a **universal business operating system**. Vertical functionality is part of the operating system. Scale is what is monetized.

This is consistent with the observed market direction: Odoo sells all apps under a single per-user plan rather than per-app pricing; ERPNext does not price by user and provides the application as open-source with hosting/implementation economics; Square and Loyverse use free/paid expansion models around store, inventory, staff, history, and advanced functionality; and specialist field-service platforms charge for business capacity rather than requiring every business to buy an unrelated industry suite. [1][2][3][4]

---

## 2. Why $99 is the recommended Core price

### Verdict

**Launch at $99/month, not $18, $29, $49, $69, or $179.**

$69 is not irrational; it is simply less defensible once VenQore's actual scope is considered. $89 is also credible. $99 is preferable because:

- it creates a clear psychological category boundary without becoming enterprise-priced;
- it is close to Lightspeed's $89 retail entry point while including a much wider operational scope;
- it is materially below field-service products that reach $149-$399 for higher plans;
- it leaves room for add-ons while still producing meaningful ARPU from a small customer base;
- it avoids training customers to think of VenQore as a cheap POS utility;
- it makes Core + one or two capacity add-ons a $120-$160/month purchase rather than forcing an unnecessary $179 tier jump.

Current public comparison points include Lightspeed Retail Basic at $89/month, Jobber Core at $49/month and Grow at $149/month on its current pricing page, Housecall Pro Basic at $79/month monthly and $59/month annual, Square Plus at $49/location/month and Premium at $149/location/month, and Cin7 Core starting at $349/month. [2][5][6][7][8]

Odoo is the major low-price counterexample: its Standard plan is $24.90/user/month and includes all apps. That does not make $24.90 the right price for VenQore because Odoo monetizes per user, while VenQore's proposed model intentionally does not charge the owner per cashier and includes POS, inventory, accounting, manufacturing, field service, offline operation, AI, and consumer/B2B expansion capabilities in one business-level subscription. [1]

### What $99 does to the business math

At $18/month:

- 100 customers = $1,800 MRR
- 200 customers = $3,600 MRR
- 500 customers = $9,000 MRR

At $99/month:

- 30 customers = $2,970 MRR
- 50 customers = $4,950 MRR
- 100 customers = $9,900 MRR
- 250 customers = $24,750 MRR

The key objective is **not** to maximize signups. It is to maximize sustainable gross profit per support hour while preserving a credible acquisition funnel.

The existing internal research correctly identified the commercial danger of $18-$29 pricing, but its specific claims such as “1.8 tickets per customer” and “$7.50-$14 per ticket” should **not** be treated as universal empirical constants without a source directly supporting VenQore's customer segment. They are useful scenario assumptions, not facts. The safer conclusion is simply that lower ARPU forces many more accounts, and therefore magnifies support, billing, infrastructure, and churn-management load.

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
- 30 days of visible operational history
- all core business modules available at functional level
- accounting and standard reporting available
- POS, inventory, purchases, expenses, sales orders, invoicing, customer/supplier records, service catalog, production/BOM access, restaurant workflows, etc. available so the customer can experience the product
- 10 document scans/month
- 100 AI credits/month
- B2B Handshake: up to 3 active connections
- no Google Drive automated backup
- no API/webhooks
- no multi-location
- no custom roles/audit controls
- no human support
- help centre + Vena/self-service guidance only

**Important:** Solo is not a collection of randomly disabled modules. It is a capacity-limited version of the same operating system.

### 3.2 Core — $99/month

**Purpose:** default plan for the overwhelming majority of paying SMB customers.

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
- 2 included structural AI rebuild sessions for the lifetime of the account
- 3 trusted devices per full seat; one active back-office session at a time per seat

**Core functionality**

- the complete universal ERP/POS core
- full services workflows
- manufacturing/recipes/BOM/work orders
- multi-level production structures
- accounting/double-entry ledger
- all standard reports
- stock takes, transfers within location, purchasing, suppliers, customers, returns, expenses
- restaurant/table workflows
- barcode/POS/offline operation
- batch/expiry/serial-related operational capability as a core workflow; advanced scale is capacity-driven, not vertical-priced
- recurring invoices and reminders
- growth signals / owner's pulse
- Google Drive automated backup sync
- B2B Handshake network
- B2C merchant listing/storefront foundation where the network product is live
- conversational dashboard / Vena
- SmartCapture
- AI onboarding/build experience

**Core does not include scale-only infrastructure controls**

- second physical location without the location add-on
- API/webhooks without API add-on
- white-label without white-label add-on
- enterprise-level audit/security/role controls without the relevant add-on
- consolidated multi-entity reporting without Scale/Enterprise

This distinction protects the commercial model without violating the universal-core promise.

### 3.3 Scale — $399/month

**Purpose:** established businesses that would otherwise assemble a large collection of add-ons.

- 10 locations
- 10 full seats
- 20 registers
- unlimited till/cashier PINs
- 250,000 catalog items
- unlimited transactions
- unlimited service jobs
- 10,000 AI credits/month
- structural AI rebuilds without a separate practical cap; governed by fair-use/credit economics and abuse controls
- Google Drive backup sync
- all standard channels included within the published channel bundle
- API/webhooks
- custom roles
- advanced audit/security activity log
- consolidated multi-entity reporting
- priority support
- implementation/setup session

Scale is an economic shortcut, not a feature prison. A customer should choose it because the total cost of many capacity add-ons approaches $399, not because their industry is “premium.”

### 3.4 Enterprise — Custom

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

Start Enterprise pricing at **$800/month** and quote upward based on capacity and complexity. Do not publish a fake “starting price” if it will be routinely exceeded.

---

## 4. The add-on system

Add-ons are allowed to monetize **scale and optional infrastructure**, not the customer's identity or trade.

### Recommended public add-ons

| Add-on | Price | Rule |
|---|---:|---|
| Extra location | **$39/mo** | Core only; activates multi-location once purchased |
| Extra full seat | **$15/mo** | Core and above; back-office access only |
| Extra register | **$20/mo** | Core and above |
| +50,000 catalog items | **$25/mo** | Core and above |
| Channel Sync — each channel | **$19/mo** | WooCommerce, Shopify, Amazon, eBay, TikTok as individually metered channels where supported |
| API + webhooks | **$29/mo** | Core and above |
| White-label / branded client experience | **$49/mo** | Core and above; exact capabilities defined in product scope |
| Advanced audit + custom roles | **$39/mo** | Core and above |
| AI credit top-up | **$10 / 1,000 credits** | Manual purchase; never automatic overage |
| AI rebuild pack | **$10 / 5 rebuild sessions** | Manual purchase |
| Setup & migration | **$249 one-time** | Standard migration/setup |
| Complex migration | **from $599** | Quoted |

### Crucial add-on rule

An add-on **may unlock a capability** when that capability is an optional scale/infrastructure capability.

Examples:

- Core has one location. Buying Extra Location unlocks location #2 and therefore enables multi-location operation. **This is allowed.**
- Core does not have API. Buying API + Webhooks unlocks it. **This is allowed.**
- Core already has BOM/manufacturing. There is no Production Pack. **Correct.**
- Core already has service management. There is no “Service Pack.” **Correct.**
- Core already has restaurant/table workflows. There is no “Restaurant Pack.” **Correct.**

This directly fixes the earlier broken rule that an add-on could only sell more of an already-available capability. For VenQore, there are two classes of add-ons:

1. **capacity add-ons** — extra quantity of a capability already included;
2. **scale/infrastructure unlocks** — capabilities whose value is intrinsically tied to business complexity.

Vertical workflow packs should not exist.

---

## 5. Why not “pick 8 of 46 modules”

Do not meter module count.

A module quota creates three problems:

1. **It contradicts the AI-builder promise.** If AI decides a business needs BOM, loyalty, batch tracking, recurring invoices, or field service and then says the plan cannot include it, the core product promise collapses.
2. **It creates support ambiguity.** Users will ask whether reports, POS returns, stock transfer, customer ledger, BOM, and every sub-feature count as one module or several.
3. **It taxes small specialists.** A one-person café may genuinely need BOM. A one-person phone repair business may genuinely need IMEI/serial workflows. Their use case does not become “enterprise” because that particular capability is important.

The stronger pattern is capability-by-scale. Odoo explicitly moved away from per-app pricing; Zoho One sells a broad business suite; ERPNext is not module-metered; Square and Loyverse monetise expansion around stores, advanced inventory, staff, history and higher capability rather than charging each micro-business an arbitrary vertical tax. [1][2][3][9]

---

## 6. Service-business economics: resolving the “free forever” problem

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
- 30-day history
- 10 document scans/month

The limit is based on business activity, not “service business tax.” The same free account rules apply to a retailer, café, salon, repairer, tutor, mechanic, consultant, or small manufacturer.

### Important operational policy

The paid product must never stop a paying customer from operating a live POS transaction because an entitlement meter has been exhausted.

Free-plan limits may be hard because the free plan is the acquisition tier. Paid-plan scale meters should be handled through upgrade/add-on flows wherever possible, not by turning off the customer's ability to sell.

---

## 7. Free vs. trial: use both, but give them different jobs

### Primary acquisition path

**14-day Core trial — card required.**

Give the trial the full Core experience. The objective is activation and value discovery, not merely account creation.

### Secondary acquisition path

**Solo — free forever, no card.**

This is the low-friction path for tiny operators, cautious buyers, and users who are not ready for a paid subscription.

### Why this is the right hybrid

Current 2026 SaaS conversion research shows that 57% of surveyed products use a free trial as the primary landing point, while 26% lead with freemium. The same research reports that card-required trials have much higher trial-to-paid conversion among trial starters, while also warning that the card requirement reduces total signup volume. AI-native SaaS also shows somewhat higher median conversion in the cited dataset. [10][11]

Therefore:

- **Do not make “no-card free trial” the only funnel.**
- **Do not make “card required” the only doorway.**
- Keep **card-required 14-day Core trial** as the main commercial CTA.
- Keep **Solo** as the persistent safety net and secondary CTA.
- After trial expiry, downgrade to Solo rather than deleting the account.

### Trial sequence

Day 0: card required; 14-day Core trial starts.

Day 1: onboarding completion prompt.

Day 3: show first business value achieved.

Day 7: show AI-built configuration and operational usage summary.

Day 10: notify that the trial ends soon.

Day 12: remind again and explain the exact monthly renewal price.

Day 14: charge and convert.

If cancelled or payment fails: downgrade to Solo, preserve data, and keep the account recoverable.

### Do not say

“Card required because we want serious users.”

### Say

“Start the full 14-day Core trial. Your card is used only to continue after the trial; cancel anytime before renewal.”

The goal is trust, not intimidation.

---

## 8. AI pricing and margin protection

AI must be treated as a **metered utility inside the product**, not as a separate vertical plan.

### Public AI model

Core includes **1,000 AI credits/month**.

Solo includes **100 AI credits/month + 10 document scans/month**.

Scale includes **10,000 AI credits/month**.

Credits do not roll over.

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

- Never advertise “unlimited AI.”
- Warn at 70%, 85%, and 100% consumption.
- At exhaustion, stop AI actions only; do not disable the ERP/POS.
- Offer manual top-up.
- Offer BYOK.
- Never auto-charge an unexpected overage.

### BYOK

**BYOK should be free on paid plans.**

The customer pays the third-party model provider directly. VenQore may still meter platform-level non-model costs, but it should not charge a pointless “permission fee” merely for letting the customer pay their own AI provider.

This is commercially useful because AppSumo's own guidance for AI products now explicitly discusses credits, annual refreshes and BYOK as sustainable lifetime-deal structures. [12]

### Why the $10 / 1,000 top-up is sensible

The actual economic value comes from controlling the internal credit-to-cost mapping rather than treating one “credit” as one literal model token. The code should budget the worst-case model cost per action class and revise weights when model economics change.

Do not hard-code a claim such as “every credit costs half a cent.” That is an internal budgeting assumption, not a stable market fact.

---

## 9. Device, seat and password-sharing controls

### Full seats

A full seat is a back-office identity with access to accounting, purchasing, reports, settings, pricing, cost information, and administrative capabilities.

Included:

- Solo: 1
- Core: 1
- Scale: 10
- Enterprise: custom

Extra full seat: **$15/month**.

### Till logins

Cashier/till identities are **not paid seats**.

They should be free and unlimited within the allowed registers.

This is commercially and operationally important because charging cashiers encourages credential sharing and destroys cashier-level accountability.

### Device protection

Use first-party signed device/session tokens.

For each full seat:

- one active back-office session at a time;
- up to three trusted devices on Core;
- up to five on Scale;
- owner can revoke a device;
- when a new session signs in, the old session receives a clear eviction notice;
- never use GPS tracking, GPU fingerprinting, font fingerprinting, canvas fingerprinting, or invasive location surveillance.

### Registers

Registered physical POS devices are metered separately.

- Solo: 1
- Core: 2
- Scale: 20
- Extra register: $20/month

Register limits are checked when a register is **registered**, not on each sale.

**Never prevent a cashier from completing a sale merely because a billing meter expired.**

---

## 10. History and downgrade behavior

Never delete business records to enforce pricing.

When a free account has only 30 days of visible history:

- older records remain in storage;
- older records become archived/read-only from the free account;
- an upgrade immediately restores access;
- the UI states exactly what is archived;
- exports remain governed by plan rules.

Example banner:

> You are viewing the last 30 days. Your older records are preserved and will reopen automatically when you upgrade to Core.

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
- “buy once” language

The website displays only the recurring commercial SaaS model.

### AppSumo marketplace

AppSumo's current Partner Listing & Updates Policy requires self-listed products to be offered at a “lower than anywhere” price, requires at least 120 days of listing presence, provides a 60-day customer refund window for refundable products, requires lifetime updates/support for an LTD, and requires previous purchasers to be grandfathered when deal terms change. Self-listed marketplace offers are designed to be evergreen rather than short-lived campaigns. [14]

This makes a hidden, flexible LTD strategy possible, but it must be designed **before launch**, not improvised after sales begin.

### Recommended LTD tiers

#### LTD Tier 1 — $199 one-time

- 1 location
- 1 full seat
- 1 register
- unlimited till logins
- 5,000 catalog items
- unlimited sales transactions
- unlimited service jobs subject to fair-use/abuse controls
- all Core operational modules
- no API
- no white-label
- no advanced audit/role controls
- 1,200 AI credits/year
- 2 AI structural rebuild sessions on activation
- help centre + Vena support

#### LTD Tier 2 — $399 one-time

- 2 locations
- 2 full seats
- 4 registers
- unlimited till logins
- 25,000 catalog items
- unlimited transactions
- all Core operational modules
- 6,000 AI credits/year
- API may be sold as a recurring add-on
- advanced roles/audit not included
- standard support

#### LTD Tier 3 — $699 one-time

- 5 locations
- 5 full seats
- 10 registers
- unlimited till logins
- 50,000 catalog items
- unlimited transactions
- 18,000 AI credits/year
- one channel sync included; additional channels recurring
- API included
- advanced audit/custom roles included
- priority support within reasonable self-serve/SaaS boundaries

### Why no LTD transaction cap

Do **not** hard-cap sales/invoices/receipts at 1,000/5,000/20,000 per month.

The reason is operational, not ideological:

- transaction limits are discovered during active business operations;
- POS systems are mission-critical at checkout;
- a transaction cap creates a failure mode that can stop a business from selling;
- AppSumo requires lifetime purchasers to be grandfathered when terms change, so an overly conservative published limit becomes a long-term obligation; and
- AppSumo's current AI guidance specifically recommends metered treatment for AI-heavy cost, not indiscriminate metering of the entire product. [12][14]

**Cap durable resources instead:** locations, full seats, registers, catalog capacity, storage, API entitlement, channel count, and AI credits.

### LTD recurring revenue

Keep these recurring where operationally justified:

- Channel Sync: $19/month/channel
- AI top-ups: $10/1,000 credits
- additional AI rebuild packs: $10/5
- optional API infrastructure where not included
- optional extra seats/locations/registers where supported by the LTD structure
- future third-party provider charges or premium integrations, clearly disclosed in advance

Do not add a surprise “hosting fee” years later.

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

> “AI-native ERP costs $20,000 per year.”

That is too absolute.

Use a qualified value anchor:

> **Some AI-native ERP deployments are quoted at $20,000+ per year, often with implementation and enterprise support. VenQore starts at $99/month.**

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

Needed by a broad range of businesses. Add to Core without a price increase solely because the module is new.

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

### B2C discovery marketplace

Merchant listing can be free to encourage supply density.

Possible future monetization:

- payment processing
- optional promoted placement
- net-new customer discovery fee
- delivery/fulfilment economics
- consumer services

Do not charge merchants a monthly “marketplace access” fee before the marketplace provides meaningful demand.

---

## 17. Lock states

Every entitlement should have exactly one of these states:

1. **Open** — available normally.
2. **Preview-locked** — visible and explorable, but activation requires upgrade/add-on.
3. **Capacity-reached** — capability is available, but the current quantity is exhausted.
4. **AI-meter-exhausted** — only AI actions are paused.
5. **Archived/read-only** — data remains but is unavailable in the current plan until upgrade.

There is no “hidden secret lock.” Users should understand what they can use, what they have reached, and what unlocks the next step.

### Lock message structure

Every lock message must answer:

- What is locked?
- Why?
- What will it cost?
- What is the nearest upgrade/add-on?
- Will existing data remain safe?

Example:

> You already have 1 location. Add another for $39/month, or move to Scale for up to 10 locations.

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
- `ai.credits.monthly`
- `ai.rebuilds.included`
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
- Core — $99/month
- Scale — $399/month
- Enterprise — Custom

Annual toggle:

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
- registered devices
- registers
- locations
- seats
- next billing date
- upgrade/downgrade controls
- archived capabilities after downgrade

### Upgrade prompts

Upgrade prompts should occur at the moment of value:

- adding location #2
- inviting a second full back-office user
- registering register #3
- reaching 80%/90% of AI credits
- enabling API
- enabling white-label
- exceeding Free volume

Do not spam users with upgrade banners for ordinary functions already included in their plan.

---

## 22. Support economics

The commercial model assumes that Core customers receive normal email support and Scale receives faster/priority support.

### Solo

- no human support by default
- help centre
- Vena/self-service assistant
- public documentation

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

Do not sell $99 plans with enterprise-grade human onboarding by default. That recreates the support-per-dollar trap.

---

## 23. Pricing experiments that are allowed after launch

Do not change the public structure every few weeks.

Allowed experiments:

- monthly vs annual emphasis
- Core price increase after meaningful proof
- annual discount percentage
- add-on pricing
- trial length
- trial messaging
- trial card requirement by acquisition channel
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
- trial start rate
- card submission rate
- trial activation rate
- trial → paid conversion
- free → paid conversion
- Core → Scale conversion
- add-on attach rate
- average revenue per account
- monthly recurring revenue
- annual recurring revenue
- refund rate
- failed payment rate
- logo churn
- revenue churn
- gross retention
- net revenue retention
- support tickets/customer/month
- support minutes/customer/month
- AI cost/customer/month
- storage cost/customer/month
- channel/integration cost/customer/month
- contribution margin/customer
- LTD active ratio
- LTD support tickets per account
- LTD AI consumption

Do not judge pricing success from signup volume alone.

---

## 25. The commercial metrics that decide whether $99 stays

Target directional thresholds rather than fake universal benchmarks:

### Core

- trial → paid: aim for >10% initially; >15% becomes strong enough to scale paid acquisition aggressively
- annual-plan selection: target 25–40%
- add-on attach: target >20%
- monthly gross churn: target <3% once product-market fit begins to appear
- support tickets: trend downward as onboarding improves

### Solo

The target is not maximum conversion.

The target is:

- activation
- word of mouth
- upgrade when capacity is reached
- low infrastructure/support burden

A free user who never pays but costs almost nothing can be a good acquisition asset. A free user who consumes significant human support is not.

These are operating targets for VenQore, not claims about industry-wide averages.

---

## 26. Recommended homepage value anchor

Preferred wording:

> **Some AI-native ERP deployments cost $20,000+ a year. VenQore starts at $99/month.**

Subtext:

> Built for independent businesses and growing operators — with accounting, POS, inventory, manufacturing, service workflows, AI, and business automation in one operating system.

Do not claim that VenQore is a direct one-for-one replacement for enterprise systems such as Rillet or Campfire. Those products target different segments and often use white-glove implementations. [18][19]

---

## 27. The four major commercial mistakes this specification prevents

### Mistake 1 — Underpricing

Do not return to $18-$29 simply because it makes the signup number look attractive.

### Mistake 2 — Vertical taxation

Do not charge a one-person café more because it needs BOM, or a repair shop more because it needs serial/IMEI. Core capability is universal.

### Mistake 3 — Module-count pricing

Do not sell “10 of 46 modules.” The AI-builder positioning makes that incoherent.

### Mistake 4 — LTD operational suicide

Do not publish transaction caps that can stop a business from selling. Use AI/resource/capacity limits instead.

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
- 30 days history
- 10 scans/month
- 100 AI credits/month
- all core modules
- no human support

**Core — $99/month / $990/year**

- 1 seat
- 2 registers
- 1 location
- 10,000 catalog items
- unlimited transactions
- unlimited service jobs
- full universal ERP/POS
- full vertical workflows
- 1,000 AI credits/month
- Google Drive sync
- B2B/B2C network foundations
- 2 structural AI rebuild sessions lifetime

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

- Tier 1 $199
- Tier 2 $399
- Tier 3 $699
- unlimited transactions
- bounded locations/seats/registers/catalog/AI
- annual AI refresh
- recurring optional integrations/top-ups
- never published on the main website

---

## 29. Implementation checklist for the coding agent

### Configuration

Update `config/pricing.php` and/or `config/plans.php` to represent:

- `solo = 0`
- `core = 99`
- `scale = 399`
- `enterprise = custom`
- Core annual = 990
- Scale annual = 3990
- Solo limits listed above
- Core limits listed above
- Scale limits listed above
- add-on pricing listed above
- LTD tiers separated from public plan slugs

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
- history scope
- add-on entitlement resolver
- LTD entitlement resolver

### Frontend

Create a reusable entitlement hook/component, for example:

- `useEntitlement()`
- `EntitlementGate`
- `UpgradePrompt`
- `CapacityMeter`
- `AiCreditMeter`
- `DeviceManager`

### Billing

Implement:

- monthly billing
- annual billing
- add-on proration
- cancellation
- downgrade
- payment failure grace period
- grandfathering
- LTD license activation
- LTD annual AI refresh
- top-up purchase

### Testing

At minimum, test every gated capability across:

- Solo
- Core
- Scale
- Enterprise override
- Core + each add-on
- LTD Tier 1
- LTD Tier 2
- LTD Tier 3

Add regression tests proving that:

- free limits cannot be bypassed through API/import
- add-ons unlock exactly what they claim
- downgrades never delete data
- expired AI credits do not disable ERP functions
- a failed payment does not interrupt a live POS sale
- LTD customers retain grandfathered entitlements
- annual AI refresh resets the correct amount
- one full seat cannot run concurrent back-office sessions beyond the allowed session policy

---

## 30. Source notes

[1] Odoo, current pricing: Standard $24.90/user/month with all apps; Custom $49/user/month with all apps and additional platform capabilities. https://www.odoo.com/pricing

[2] Lightspeed Retail, current public pricing: Basic $89/month, Core $149/month, Plus $289/month per location. https://www.lightspeedhq.com/pos/retail/pricing/

[3] Loyverse, current public pricing: free POS/inventory core with add-ons including unlimited sales history $5/month/store, employee management $25/month/store, and advanced inventory $25/month/store. https://loyverse.com/en-us/pricing

[4] ERPNext/Frappe, current public pricing: ERPNext is open source; managed hosting starts at $5/month on Frappe Cloud, with implementation as a separate cost. https://frappe.io/erpnext/pricing

[5] Jobber current pricing: Core $49/month monthly; Grow $149/month starting point; current annual pricing varies by commitment. https://www.getjobber.com/pricing/

[6] Housecall Pro current pricing: Basic $79/month monthly or $59/month annually; Essentials $189/month monthly or $149/month annually; MAX $329/month monthly or $299/month annually. https://www.housecallpro.com/pricing/

[7] Square current pricing: Free; Plus $49/location/month; Premium $149/location/month. https://squareup.com/us/en/pricing

[8] Cin7 current pricing: Standard $349/month, Pro $599/month, Advanced $1,199/month. https://www.cin7.com/pricing/

[9] Zoho Books current pricing demonstrates add-on monetization around users, document scans and locations. https://www.zoho.com/us/books/pricing/

[10] ChartMogul, 2026 SaaS Conversion Report: 57% of surveyed products use free trials as primary landing point, 26% freemium, 14 days most common trial length, and card-required trials show higher trial-to-paid conversion but with signup friction. https://chartmogul.com/reports/saas-conversion-report-2/

[11] ChartMogul, SaaS Conversion Report: good freemium conversion 3%-5%, good free-trial conversion 4%-6%, and higher trial conversion among card-required trials; the report explicitly notes the tradeoff between conversion and signup volume. https://chartmogul.com/reports/saas-conversion-report/

[12] AppSumo, “How lifetime deals work in the new AI era”: AI LTDs increasingly use credit bundles, annual refreshes and BYOK because AI creates ongoing variable costs. https://appsumo.com/blog/lifetime-deals-in-ai-era

[13] AppSumo Partner Terms, effective June 15, 2026: partner revenue share is determined by the applicable Promotion Agreement. https://appsumo.com/partner-terms/

[14] AppSumo Partner Listing & Updates Policy: self-listed products must be lower-than-anywhere pricing, listings must remain live at least 120 days, refundable products have a 60-day refund window, LTDs require lifetime updates/support, and existing purchasers are grandfathered when deal terms change. https://appsumo.com/partner-terms/listing-policy/

[15] AppSumo current example: AIWriteBook uses four LTD tiers with recurring monthly AI credits and BYOK, with prices $79/$159/$319/$519. https://appsumo.com/products/aiwritebook/

[16] AppSumo current example: NoCodeBackend uses multiple LTD tiers with database, record, webhook and AI-call capacity limits. https://appsumo.com/products/nocodebackend/

[17] AppSumo current example: Support Board uses multiple LTD tiers with monthly message capacity and explicit third-party AI service costs excluded. https://appsumo.com/products/support-board/

[18] Rillet current 2026 materials: AI-native ERP, complexity/features-based pricing, white-glove implementation, no universal public price. https://www.rillet.com/help-center

[19] ERP Research 2026 estimate for Rillet: buyer-side observed ranges around $20,000-$35,000/year and higher first-year totals when implementation is included; this is a third-party estimate, not Rillet's published price list. https://erpresearch.com/pricing/rillet

[20] VenQore internal pricing audit supplied with this specification: current `PlanGate::check()`/`enforce()`/`getLimit()` are not enforcing entitlements; multiple entitlement tables/services and 74 gate call sites already exist. The implementation blocker must be resolved before pricing is considered operational.

---

## FINAL DECISION

**Do this:**

> **Free Solo + $99 Core + $399 Scale + Custom Enterprise, with universal core modules and capacity/scale add-ons.**

> **Do not cap transactions on LTDs. Cap durable resources and meter AI.**

> **Use a 14-day card-required Core trial as the primary CTA and Solo as the permanent fallback.**

> **Keep all LTD pricing off the main website.**

> **Do not create vertical pricing. Do not price by module count. Do not charge cashiers as seats. Do not sell surprise AI overages.**

This is the commercial architecture most consistent with VenQore's current positioning as an AI-built business operating system rather than a conventional vertical POS or a collection of industry-specific modules.
