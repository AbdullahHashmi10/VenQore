# VenQore Builder — Final Plan (build-ready)

> **18 October 2026 design revision:** [AI business interview v3](BUILDER_AI_INTERVIEW_V3_2026-10-18.md) overrides this document for opening-description ingestion, semantic evidence, AI-led question selection and session continuity. AI may choose or generate the next useful question; it is no longer restricted to phrasing a fixed candidate. Workflow bundles, capability validation and question-budget requirements remain. This revision is a design specification; application changes have not been made in this review.

**Date:** 14 Oct 2026 · **Status:** final plan for implementation by Abdullah · no code changed
**Author:** merged from Codex `BUILDER_DECISION_SYSTEM_V2.md` + `BUILDER_DESIGN_REVIEW_2026-10-14.md` + `BUILDER_BUSINESS_TYPE_COVERAGE_2026-10-14.md` and Claude spec v3.

---

## 0. How to use this document

### 0.1 Document hierarchy (when two documents disagree)

| Rank | Document | Owns |
|---|---|---|
| 1 | **This plan** | Exact fact keys, exact question copy, rule tables, screens, API, files, phases, launch gates |
| 2 | Codex `BUILDER_DECISION_SYSTEM_V2.md` | Principles, the 48-module policy ledger (§7), the 42 failure cases (§9), invariants (§10) |
| 3 | Codex `BUILDER_BUSINESS_TYPE_COVERAGE_2026-10-14.md` | Per-type unresolved facts and counterexamples for all 85 types |
| — | Claude spec v1 / v2 / v3, Codex `BUILDER_ADAPTIVE_DISCOVERY_SPEC.md` | **Superseded.** Read for background only |

### 0.2 Verdict

**The decision design is ready to build.** Codex's review fixed the real errors in my earlier drafts; this plan adds the parts needed to implement it.

Two things cannot be settled on paper, and both are built into the phases as gates rather than left open:
1. Whether each capability we bundle **actually works end to end** (Phase 0).
2. Whether real owners **understand the wording** (Phase 8).

Start with Phase 0. Do not start the campaign before Phase 8.

### 0.3 The promise this builder must keep

> Tell us how your business works. You get complete tools for everything you do, a short menu, and an honest list of anything we assumed or don't do yet.

---

## 1. Final rulings on every disagreement

| Topic | Ruling | Why |
|---|---|---|
| "Never" by sector | **Removed.** Business type only orders questions and supplies a disclosed starting template. Any activity can be opened by evidence. | A grocery can do repairs; a salon sells products. |
| Probabilities / percentages | **None in v1.** Deterministic priority bands (§5). Calibrated ranking comes later, from real outcome data. | No invented numbers; nothing to defend. |
| Pre-ticked options | **Never pre-tick trade guesses.** Facts from the owner's own words appear as a sourced **confirmation card** ("You said: one shop. Correct?"). Trade guesses appear as a quiet "Common for groceries" label beside an option, unticked. | Pre-selection biases answers (GOV.UK guidance). |
| Purchase orders | **Always part of Purchasing**, whatever the supplier payment terms. Available, never a forced step. | Codex correction. |
| Supplier credit | Separate fact; adds supplier balances inside Purchasing. Does not decide POs. | |
| Accountant | Context only. Books, bank matching, assets and loans are **separate ticks**. | Codex correction. |
| Deposits | Advance-payment handling only. Reserving stock needs its own evidence ("goods set aside"). | Codex correction. |
| Staff | Logins/roles ≠ attendance. Attendance only if asked for. | Codex correction. |
| Cash register | Only with evidence of cash or a till. A cashless counter is valid. | Codex correction. |
| Skip | Stays **unknown**. Consequence-sensitive defaults (Codex §3 table). Every assumption is listed in the review. | |
| Skip-all | Produces a labelled **"Starting setup with assumptions"**, never "tailored". | |
| Beta / building modules | Not offered in onboarding: landed_cost, composite_items, quotations, and b2b_proposals (its dependency is still being built). The need is **recorded and shown as "coming soon — notify me"**. | Don't promise what isn't ready. |
| Marketplaces | Only providers verified in Phase 0. An alias ("Daraz") never implies a working connector. | |
| Gifts (AI Advisor, Online shop, QR menu) | **AI Advisor:** baseline, within the plan's real AI allowance. **Online shop / QR menu:** offered as gifts on the preview and read-back as an **active choice** (unticked). Ticking enables the module **unpublished**. Channel answers in Q8c also set them. | Keeps today's "gift" feel without enabling things on a guess. |
| Tax | Asked as one small panel inside Q7 for anyone who sells. Records the receipt mode (added / included / none / unsure). Never decides legal obligations. | The founder flagged that owners expect tax on receipts; Codex's legal-caution rule is kept. |
| Navigation | Bundled capabilities appear **inside their parent area** (Purchasing → Orders / Returns tabs). **Launch gate**, not "later". | A capability that exists only in Settings is, for most owners, missing. |
| After-signup safety net | Built, but as **recovery**, not a substitute for good onboarding (Codex). Phase 10. | |

---

## 2. The fact schema (exact keys)

Every fact record:

```
{ key, value, status, source, evidence, question_id, turn, revision, extraction_confidence? }
status ∈ confirmed | negative | unknown | not_applicable | conflict
source ∈ owner_text | answer | readback_edit | owner_override | template_assumption
```

Trade priors are **not** facts. They live in `type_hints` and only order questions and fill the skip-all template (§6.4).

| Group | Key | Values |
|---|---|---|
| Activity | `activity.goods` · `activity.services` · `activity.making` · `activity.hire` | bool |
| | `activity.other_text` | string (explain) |
| Sale (goods) | `sale.counter` · `sale.bill` · `sale.order_later` · `sale.tables` | bool |
| Work (services) | `work.on_the_spot` · `work.bill` · `work.booking` · `work.job_tracked` | bool |
| Items | `items.resale_stock` · `items.work_materials` · `items.counted_supplies` · `items.supplied_by_other` · `items.buy_to_order` · `items.none` | bool |
| Money | `money.customer_later` · `money.supplier_later` · `money.advances` · `money.paid_in_full` | bool |
| | `money.cash_till` | bool (only asked when `sale.counter`) |
| Identity | `id.variants` · `id.batch_expiry` · `id.serial_owned` · `id.customer_item_id` · `id.measured` · `id.pack_convert` · `id.scan_labels` · `id.quantity_only` | bool |
| Places | `place.stock_counts` | one · separate · none |
| People | `people.users` | solo · shared · roles |
| | `people.attendance` | none · shifts · attendance · both |
| Tax | `tax.mode` | added · included · none · unsure |
| Finance | `fin.books` · `fin.bank_match` · `fin.assets` · `fin.loans` · `fin.tax_reports` | bool |
| Making | `make.costing` · `make.runs` · `make.sell_finished_only` · `make.made_elsewhere` | bool |
| Food | `food.counter_takeaway` · `food.tables` · `food.delivery` | bool |
| Channels | `channel.new_online_shop` · `channel.qr_menu` · `channel.existing_site` · `channel.marketplace` | bool + provider string |
| | `channel.messages` | bool (channel only; implies nothing alone) |
| Repeat / prices | `repeat.group_prices` · `repeat.rewards` · `repeat.gift_cards` · `repeat.auto_invoices` | bool |
| Offers | `offer.estimate` · `offer.formal_proposal` | bool |
| Job detail | `job.parts_used` · `job.progress` · `job.goods_set_aside` · `job.delivery_details` | bool |
| Owner overrides | `owner.added.{module}` · `owner.removed.{module}` | bool |
| Gaps | `gap.{need}` | string (unsupported need, kept) |

**Derived facts** are computed by rules, never stored as answers:
- `d.procures` = (`items.resale_stock` or `items.work_materials` or `items.buy_to_order`) and not "only supplied by other"
- `d.tracks_qty` = `items.resale_stock` or `items.work_materials` or `items.counted_supplies` or `items.supplied_by_other`
- `d.sells_goods_at_counter` = `sale.counter` or `food.counter_takeaway`

**Precedence:** readback_edit > answer (latest) > owner_text > template_assumption. Two explicit facts that conflict → `conflict` → band-1 clarification. A revision recomputes everything from facts; nothing accumulates.

---

## 3. The question bank (exact copy)

### 3.1 Copy rules

- Question title ≤ 12 words. Option label ≤ 8 words, plus one grey example line.
- No software words: never "module", "inventory", "PO", "debit note", "receivables", "khata", "godown".
- Multi-select subtitle is always **"Choose everything that happens in your business."**
- Every screen has, in this order:
  - **Not sure** — fact stays unknown; offers "Tell us in your words".
  - **Skip** — unknown.
  - **Back**.
  - **Stop and show my setup** (from screen 3 on).
- "None of these" rejects **only the options shown**.
- Options marked *(if)* appear only when that option's facts are still unknown or relevant.
- "Common for {type}" hint label: optional, shown at most twice per screen, never ticked.

### 3.2 Questions

**Q1 — Activity.** *Ask when activity is not explicit in the owner's text or chosen type.* Multi.
**"What do customers pay you for?"**

| Option | Example | Writes |
|---|---|---|
| Goods we sell | e.g. groceries, clothes, phones, parts | activity.goods |
| Work or a service we do | e.g. repairs, haircuts, cleaning, design | activity.services |
| Things we make, cook or put together | e.g. food, furniture, printed items | activity.making |
| Items customers hire from us | e.g. tools, event chairs, equipment | activity.hire → capability check (§7 gap) |
| Something else — let me explain | free text → extraction | activity.other_text |

**Q2g — How a sale happens (goods).** *If activity.goods or activity.making.* Multi.
**"How does a sale usually happen?"**

| Option | Example | Writes |
|---|---|---|
| Customer pays at the counter and leaves | e.g. a shop till | sale.counter |
| I send the customer a bill | e.g. an invoice paid later or by transfer | sale.bill |
| They order now, I supply it later | e.g. deliveries, custom orders, bulk orders | sale.order_later |
| They sit at a table and are served *(if food/making-food or unknown)* | e.g. a café or restaurant | sale.tables |
| Another way — let me explain | | text |

**Q2s — How work happens (services).** *If activity.services.* Multi.
**"How does your work usually happen?"**

| Option | Example | Writes |
|---|---|---|
| I do the work and get paid straight away | e.g. a haircut, a quick fix | work.on_the_spot |
| I send the customer a bill | e.g. after a job or each month | work.bill |
| Customers book a time | e.g. appointments, sessions | work.booking |
| Each job is tracked from start to finish | e.g. repairs, installs, projects | work.job_tracked |
| Another way — let me explain | | text |

*Mixed businesses (goods + services) see Q2g and Q2s as **one screen with two labelled parts**. It counts as one screen if both parts fit without scrolling on a 360px phone; otherwise it counts as two.*

**Q3 — Items.** *If items are unresolved.* Multi.
**"Which of these do you buy, keep or use?"**

| Option | Example | Writes |
|---|---|---|
| Goods we buy and keep to sell | e.g. shelves of stock | items.resale_stock |
| Parts or materials we buy for our work | e.g. pipes, spare parts, ingredients | items.work_materials |
| Supplies we want to keep count of | e.g. shampoo, cleaning liquids | items.counted_supplies |
| Goods sent to us by someone else | e.g. head office, a supplier's stock on trust | items.supplied_by_other |
| We buy only after a customer orders | e.g. order it in, then deliver | items.buy_to_order |
| Nothing we need to count | | items.none (exclusive) |

**Q4 — Money.** *Always eligible.* Multi.
**"Which payments do you need to keep track of?"**

| Option | Example | Writes |
|---|---|---|
| Customers who pay later or in parts | e.g. monthly accounts, instalments | money.customer_later |
| Suppliers we pay later or in parts | e.g. 30-day terms | money.supplier_later *(if d.procures or unknown)* |
| Deposits or advance payments | e.g. booking fee, part payment before work | money.advances |
| Everyone pays in full at the time | | money.paid_in_full (exclusive with the first and third) |

Follow-up panel on the same screen, only if `sale.counter`: **"Do you take cash at a till?"** Yes / No, cards and transfers only → `money.cash_till`.

**Q5 — Item identity.** *If d.tracks_qty.* Multi. Options shown only where unknown.
**"What do you need to tell apart when you count or sell items?"**

| Option | Example | Writes |
|---|---|---|
| Sizes, colours or versions | e.g. shirt in M and L | id.variants |
| Batch numbers or expiry dates | e.g. medicines, food, chemicals | id.batch_expiry |
| A serial or IMEI on each item we sell | e.g. phones, laptops | id.serial_owned |
| Serial or ID of the customer's own item | e.g. a phone brought for repair *(if services)* | id.customer_item_id |
| Weight, length or volume | e.g. kg of rice, metres of pipe, litres | id.measured |
| Bought in boxes, sold in pieces | e.g. carton of 24, sold singly | id.pack_convert |
| Barcodes or price labels | e.g. scan at the till, print shelf labels | id.scan_labels |
| Just how many we have | | id.quantity_only (exclusive) |

**Q6 — Places and people.** Two panels on one screen; each panel is skippable on its own.
- Panel A, *if d.tracks_qty* — **"Where do you keep count of stock?"** Single.
  - One count for everything — e.g. one shop, even with a back room → `place.stock_counts=one`
  - Separate counts for different shops or stores — e.g. two branches, a warehouse counted separately → `separate`
- Panel B — **"Who will use VenQore?"** Single.
  - Only me → `solo`
  - A few people, same access → `shared`
  - A team where people need different access — e.g. cashier vs manager → `roles`

**Q7 — Tax and money tasks.** Two panels.
- Panel A, *if anything is sold* — **"Do you add sales tax, VAT or GST to prices?"** Single.
  - Yes, added on top of prices → `added`
  - Yes, already inside my prices → `included`
  - No → `none`
  - Not sure → `unsure`
- Panel B — **"Which money tasks should VenQore help with?"** Multi.
  - Full books and accounts — e.g. journals, profit and loss for an accountant → fin.books
  - Matching bank statements → fin.bank_match
  - Equipment value over time — e.g. vehicles, machines → fin.assets
  - Business loans and repayments → fin.loans
  - Tax reports or e-invoicing → fin.tax_reports
  - Just the basics: sales, bills, expenses → none of the above (exclusive)

**Q8 — Specialist (one version per screen, chosen by §5).**

*Q8a — Making* (if activity.making). **"What do you record when you make things?"**
- Ingredients or materials and their cost → make.costing
- How much we made and what it used → make.runs
- Only the sale of the finished item → make.sell_finished_only
- Someone else makes it for us → make.made_elsewhere

*Q8b — Food service* (if food-related). **"How do customers get their food?"**
- At the counter or takeaway → food.counter_takeaway
- At tables, with orders sent to the kitchen → food.tables
- Delivered to them → food.delivery

*Q8c — Channels* (if goods or making). **"Where else should customers be able to order?"**
- A free VenQore online shop — e.g. a link you can share *(gift)* → channel.new_online_shop
- A QR code menu or catalogue in the shop *(gift)* → channel.qr_menu
- My existing website — e.g. WooCommerce → channel.existing_site
- An online marketplace → channel.marketplace + provider picker (verified providers only)
- Phone or WhatsApp messages → channel.messages
- Nowhere else

*Q8d — Repeat customers and prices.* **"Which of these do you use or want to start?"**
- Different prices for some customers — e.g. trade, wholesale, staff → repeat.group_prices
- Points or rewards for regulars → repeat.rewards
- Gift cards or store credit → repeat.gift_cards
- Bills that go out automatically every month → repeat.auto_invoices
- None of these

*Q8e — Attendance* (if users = shared/roles). **"Do you want to track staff shifts or attendance?"**
- Shifts → shifts · Attendance → attendance · Both → both · No → none

*Q8f — Written offers* (if goods bill/order_later or services). **"Do customers ask for a price before they agree?"**
- A simple estimate → offer.estimate
- A detailed proposal or tender → offer.formal_proposal
- No

*If ticked while quotations is "building": shown in review as "Coming soon — we'll notify you".*

*Q8g — Job details* (if work.job_tracked or sale.order_later). **"What needs to stay with each job or order?"**
- Parts or materials used → job.parts_used
- Progress or status → job.progress
- Goods set aside for the customer → job.goods_set_aside
- Delivery address and details → job.delivery_details

---

## 4. Rules: facts → workflows → modules

Bundles are explicit. After a bundle, hard-dependency closure runs (`BusinessTypes::withDependencies`), then the capability gate (§7).

| # | Workflow | Turns on when | Modules | Lives inside (nav) |
|---|---|---|---|---|
| W1 | Item catalogue | activity.goods or activity.making or items.work_materials or items.counted_supplies | products | Items |
| W2 | Stock | d.tracks_qty | inventory, stock_takes | **Stock** (Counts tab) |
| W3 | Purchasing | d.procures | purchases, suppliers, purchase_orders, purchase_returns, payments | **Purchasing** (Record · Orders · Returns & debit notes · Suppliers) |
| W3b | Supplier balances | money.supplier_later | khata_credit (supplier side) | Purchasing → Suppliers |
| W4 | Counter | sale.counter or food.counter_takeaway or work.on_the_spot* | pos, park_recall, sales_returns, payments | **Sell** (Refunds · Held bills) |
| W4b | Cash till | W4 and money.cash_till | cash_register | Sell → Cash drawer |
| W5 | Bills | sale.bill or work.bill | invoicing, customers, payments, sales_returns (credit notes) | **Invoices** |
| W6 | Orders for later | sale.order_later | sales_orders, customers | Sell → Orders |
| W6b | Set aside goods | job.goods_set_aside | pre_sales | Sell → Orders |
| W7 | Services & jobs | activity.services | services | **Jobs** (calendar if work.booking; job board if work.job_tracked) |
| W8 | Tables | sale.tables or food.tables | table_service | **Front of house** |
| W9 | Recipes / costing | make.costing | cookbook | Production |
| W10 | Production | make.runs | cookbook, production_runs | Production |
| W11 | Customer balances | money.customer_later | customers, khata_credit, payments | Customers → Balances |
| W12 | Advances | money.advances | payments, customers (advance handling) | Money |
| W13 | Identity | id.* each | variants / batches_expiry / serials / units_of_measure (id.measured or id.pack_convert) / barcodes_labels | **fields inside Stock forms**, not menu items |
| W14 | Locations | place.stock_counts = separate | multi_location, stock_transfers | Stock → Locations |
| W15 | Team | people.users = shared or roles | (roles setup; no module) | Settings |
| W16 | Attendance | people.attendance ≠ none | staff_attendance | Team |
| W17 | Tax | tax.mode = added or included, or fin.tax_reports | tax_compliance + receipt tax mode | Settings + Reports |
| W18 | Books | fin.books | accounting_workspace | **Accounts** |
| W19 | Bank matching | fin.bank_match | bank_accounts, bank_reconciliation | Accounts |
| W20 | Assets / loans | fin.assets / fin.loans | fixed_assets / loans | Accounts |
| W21 | Group prices | repeat.group_prices | pricing_tiers | Sell |
| W22 | Rewards | repeat.rewards or repeat.gift_cards | loyalty_gift | Customers |
| W23 | Auto invoices | repeat.auto_invoices | recurring_invoices (enabled, **no schedule created**) | Invoices |
| W24 | Online shop (gift) | channel.new_online_shop or gift ticked | online_store (**unpublished**) | Online shop |
| W25 | QR menu (gift) | channel.qr_menu or gift ticked | onsite_catalogue (unpublished) | Online shop |
| W26 | Existing site / marketplace | channel.existing_site / channel.marketplace (verified provider) | marketplace_sync (**not connected**) | Integrations |
| — | Baseline (always) | — | expenses, reports, payments, ai_insights (gift, within allowance) | |

\* W4 for pure services is **only** allowed if Phase 0 verifies POS works without a fake product. Otherwise services charge-now uses a quick invoice.

**Bank accounts:** on with W5, W11, W12, W19, or when the owner takes cards/transfers (money.cash_till = no). Shown inside Money; not a decision on its own.

**Negative scope rule:** a negative fact removes only its own workflow. A module stays on while **any** surviving workflow justifies it. Store **all** reasons per module, not just the first.

**Owner overrides:** `owner.added.X` always wins (reason: "Added by you"). `owner.removed.X` wins unless X is a hard dependency of a confirmed workflow. In that case, explain: "Purchasing needs Suppliers. Remove Purchasing too?"

---

## 5. Choosing the next screen and stopping

### 5.1 Eligibility

A screen is eligible when its `ask_when` holds and at least one option could still change a workflow decision.

### 5.2 Priority bands (v1, deterministic)

1. Conflicts and ownership ambiguity (e.g. "supplied by head office" but also "we pay suppliers").
2. Activity (Q1) and how sales/work happen (Q2g / Q2s).
3. Items (Q3), money (Q4).
4. Consequential specialisation: Q5 identity, Q8a making, Q8b food, Q8g job details, Q7 panel A (tax) for anyone selling.
5. Scale and access: Q6.
6. Optional: Q7 panel B, Q8c channels, Q8d repeat, Q8e attendance, Q8f offers.

**Within a band:** prefer the screen that settles more still-open workflows → shorter screen → id order.

**Type hints** (from the coverage doc) can raise a screen **one band** for a type. For example, pharmacy raises Q5 and plumber raises Q3. A hint never lowers a band-1–3 screen.

### 5.3 Counting

- Every new decision screen counts, including skipped ones and clarifications.
- Retries and AI failures that show the same pending screen do not count.
- The opening sentence or type pick is logged separately.

### 5.4 Preview

Offer the preview after **3 answered screens**, or earlier when the opening text already settles bands 1–3. Three skipped screens produce a preview labelled "Starting setup with assumptions".

### 5.5 Stop when all of these hold

- No band-1–4 screen is eligible.
- No `conflict` facts remain.
- Dependency closure is valid.

**Target ≤ 8 screens.** Screens 9–10 only with a logged reason (the workflow it decides). Hard stop at 10.

**Readiness label** (shown on the read-back):
- **Ready for what you described**
- **Starting setup with assumptions** (any band-2–4 unknown was defaulted)
- **Part of what you need isn't available yet** (gap facts exist)

### 5.6 Unknown defaults (Codex consequence table, made concrete)

| Unknown | Default | Disclosed as |
|---|---|---|
| Companions inside a confirmed workflow | Included | (not an assumption — part of the workflow) |
| place.stock_counts | one | "We assumed one stock count" |
| people.users | solo | "We assumed only you will use it" |
| tax.mode | none, with tax_compliance available | "Tax is off — switch on in Settings" |
| id.* | off | "We didn't turn on sizes/expiry/serials" |
| Q8 optional facts | off | listed under "Not included" with a reason |
| Activity / items unknown (vague text, everything skipped) | type template if a type is known; otherwise **ask Q1 again with examples** | "Starting setup for {type}" |

---

## 6. Screens and flow

### 6.1 Entry routes

All three run through the same engine:
- **Sentence:** extraction → confirmation card of owner-text facts → next screen.
- **Business type picked / `?type=` / `?preset=`:** type hints set → **Quick fit**: the 2–3 highest-band screens, skippable with "Use the {type} starting setup".
- **"I'll choose myself":** goes straight to §6.6 with nothing on except the baseline.

### 6.2 Question screen anatomy (mobile-first, 360px)

- Top: progress as *"Question 3 · about 4 more"*. The estimate is the count of eligible band-1–4 screens; never a percentage.
- Title, subtitle, options as large tap cards (min 48px tall) with the example line in grey.
- Live line under the options: **"This adds: Purchasing (with orders and returns)"**.
- Footer: Not sure · Skip · Back. From screen 3: **"Stop and show my setup"**.

### 6.3 Confirmation card (owner's own words only)

> **From what you told us:** you have **one shop** and **buy stock every week**. [Correct] [Change]

Correct → facts become `confirmed` and do not count as a screen. Change → opens the relevant question.

### 6.4 Preview (after 3, and at stop)

1. **Areas** the setup produces, as cards: Sell · Stock · Purchasing · Customers · Money & reports. Each card expands to show its included tools and why.
2. **Free gifts** band (existing GiftBundle design): AI Advisor *included*; Online shop and QR menu as **unticked** "Add free" cards. Ticking is evidence (`owner.added`).
3. Honest line: *"About 4 more questions would fine-tune this"* or *"We have what we need."*
4. Buttons: **Continue questions** (primary while band ≤ 4 screens remain) · **Looks right — review my setup**.

### 6.5 Read-back: "Is this you?"

A short paragraph generated from confirmed facts (§8). Every fact is a tappable chip. Then three sections:
- **Included** (areas, expandable)
- **We assumed** (each with [Change])
- **Not included** (each with a one-line reason and [Add])

Three exits:
1. **"Yes, that's my business — build it"** (primary)
2. **"Change something"** — tap any chip; the result recomputes live
3. **"Something's missing"** → opens §6.6

### 6.6 "Something's missing" panel (the founder's requirement)

1. **Search everything** — "Search for what you need, e.g. expiry dates, returns, delivery." Searches module labels, aliases and descriptions.
   - Results: **[Add — free]** with reason "Added by you", or "Already included in Purchasing", or **"Coming soon — notify me"** for beta/building.
2. **Browse all tools** by area: the existing ModuleCatalog with locks and dependency explanations.
3. **"Can't find it? Tell us."** Free text plus optional email. Saved to the demand log with the full fact snapshot and session id. Reply: *"Thank you — we read every one of these. If we build it, we'll email you."* It also shows on the read-back as "You asked for: …".

The panel is always reachable from the read-back and from any question screen (small link "Missing something?").

### 6.7 Account and build

Plan and account steps are unchanged. **Provisioning takes the server session id**: the server composes the modules. The client list is advisory only and is rejected if it differs from the server composition without owner overrides.

---

## 7. Capability gate (live ≠ ready)

`CapabilityGate` checks every module before it is offered:
- `status === live`
- entitlement on the chosen or trial plan
- Phase 0 verification flag
- all dependencies pass the same checks

| Gate result | Behaviour |
|---|---|
| Pass | Can be composed |
| Beta / building / unverified | Not composed. Need kept as `gap.*`. Shown as "Coming soon — notify me". |
| Not entitled on the plan | Composed only if the trial includes it; otherwise shown as "Available on {plan}". |
| Dependency fails | Parent not composed. Gap shown with the reason. |

**Known gaps at the time of writing** (to confirm in Phase 0):
- rental / hire availability
- memberships / class access
- formal quotations and proposals
- landed cost
- composite items
- Daraz (and any marketplace other than verified WooCommerce)
- POS for pure services

---

## 8. Summary sentence templates

Built from confirmed facts only. Assumptions are listed separately, never woven into the paragraph.

| Facts | Fragment |
|---|---|
| activity.goods (+ type label) | "You sell {type noun or 'goods'}" |
| activity.services | "you do {type noun or 'service work'}" |
| activity.making | "you make {what} yourself" |
| sale.counter / sale.bill / sale.order_later | "customers pay at the counter" / "you send bills" / "customers order and you supply later" |
| work.booking / work.job_tracked | "customers book times" / "you track each job to the end" |
| items.resale_stock + d.procures | "you buy stock from suppliers" (+ "and pay them later" if money.supplier_later) |
| items.supplied_by_other | "your stock is sent to you" |
| place.stock_counts | "from one place" / "from {n} separately counted places" |
| money.customer_later | "some customers pay later" |
| tax.mode | "prices include tax" / "tax is added to prices" |
| id.* | "you track expiry dates / sizes and colours / serial numbers" |
| people.users | "just you" / "a team of people" |

**Example output:**

> You sell **groceries** from **one place**, customers **pay at the counter**, you **buy stock from suppliers** and **pay them later**, **some customers pay later**, and **prices include tax**.
> **Your setup:** Sell (with refunds and held bills) · Stock (with counts, boxes→pieces) · Purchasing (with orders, returns and supplier balances) · Customer balances · Money & reports.
> **Not included:** expiry tracking (you said you don't need it) · branches · restaurant service.

---

## 9. Mapping to today's code

### 9.1 Keep

- AiGateway
- `config/business_types.php` + `BusinessTypes` (aliases, sectors, withDependencies)
- StoreProvisioner
- demand log endpoint
- Turnstile
- `config/signup_gifts.php` (copy) + `GiftBundle.jsx` (visuals; switch to unticked "Add free" for the shop and QR)
- ModuleCatalog
- PromptTextarea
- BuilderShell
- the international wording changes from today: Customer Credit, pay-later copy, tax copy

### 9.2 Add (new)

| File | Purpose |
|---|---|
| `config/builder/facts.php` | §2 schema |
| `config/builder/questions.php` | §3, exact copy, `ask_when`, option → fact writes, band |
| `config/builder/workflows.php` | §4 rules + bundles + nav parent |
| `config/builder/module_policy.php` | Codex ledger: 48 modules × class (B / W / C / O / U) + trigger |
| `config/builder/type_hints.php` | 85 types: starting template, band raises, counterexample notes (from the coverage doc) |
| `config/builder/summary.php` | §8 fragments |
| `config/builder/capabilities.php` | Phase 0 verification flags per module / provider |
| `app/Services/Builder/BuilderSession.php` | Replaces DiscoverySession. Schema version, facts, screen count, overrides, gaps. |
| `app/Services/Builder/FactStore.php` | Precedence, revision, conflicts, derived facts |
| `app/Services/Builder/FactExtractor.php` | AI (through AiGateway) → validated fact schema; deterministic alias / keyword fallback |
| `app/Services/Builder/ScreenSelector.php` | §5 |
| `app/Services/Builder/WorkflowComposer.php` | §4 + closure + all reasons |
| `app/Services/Builder/CapabilityGate.php` | §7 |
| `app/Services/Builder/SummaryWriter.php` | §8 |
| `app/Http/Controllers/BuilderDiscoveryController.php` | §10 API |
| `resources/js/Components/Builder/v2/QuestionScreen.jsx`, `ConfirmCard.jsx`, `Preview.jsx`, `ReadBack.jsx`, `MissingSomething.jsx` | §6 |

### 9.3 Retire (after the new path passes Phase 5)

- question selection and readiness in `CapabilityRegistry`
- turn logic in `ConversationalBuilderService`
- round logic in `DiscoverySession`
- `discovery` / `relevance` / `presets.core` fallbacks in `config/ai_builder.php`
- `useDiscovery` implication logic in JS
- today's interim pieces: `config/module_companions.php` (folded into workflows), the written deep-round fallback, client-side gift defaults

Keep the old files until the switch `VQ_BUILDER_V2=true` has run cleanly for 7 days.

---

## 10. API contract

```
POST /workspace/discover/start     { sentence?, type?, preset? }
  → { session_id, confirm_card?, screen?, preview_available, estimate_remaining }

POST /workspace/discover/answer    { session_id, screen_id, version, selected: [option_id], unsure?: bool, skip?: bool, explain?: string }
  → { screen? | done: true, confirm_card?, preview_available, estimate_remaining, live_adds: [area labels] }

POST /workspace/discover/revise    { session_id, fact_key, value }            → same shape + recomputed review
POST /workspace/discover/override  { session_id, module, action: add|remove } → { review, conflict? }
POST /workspace/discover/missing   { session_id, text, email? }              → { ok }

GET  /workspace/discover/{id}/review
  → { label, summary_html, areas: [{ key, name, modules: [{ key, label, reasons: [] }] }],
      assumptions: [{ fact, text }], not_included: [{ module, reason }],
      gaps: [{ need, status: coming_soon|unsupported }], gifts: [{ key, included }] }

POST /workspace/provision          { session_id, business_name, currency, … }   (modules composed server-side)
```

**Rules:**
- The frontend never computes facts → modules.
- Every response carries `policy_version`.
- Throttle and Turnstile as today.

---

## 11. Telemetry (record from the first signup)

**Builder:** `builder.started{route}` · `screen.shown{id, band}` · `screen.answered` · `screen.skipped` · `screen.unsure` · `confirm_card.result` · `fact.revised` · `preview.shown{after_n}` · `stopped_early{n}` · `readback.confirmed` · `readback.edited{fact}` · `missing.searched{q, hit}` · `missing.added{module}` · `missing.requested` · `provisioned{modules, label, n_screens}`

**After signup:**
- `module.enabled_by_owner{days_since}` · `module.disabled_by_owner`
- `search.miss_disabled_module{module}` · `vena.where_is{module}`
- `support.ticket.absent_feature`
- `workflow.first_completed{workflow, minutes}`

**Each event carries:** session_id, tenant_id (after provisioning), policy_version, type key.

---

## 12. Tests

1. **PolicyCoverageTest** — every live module has a policy class; all 85 types have hints; every question option writes ≥ 1 fact; every workflow is reachable; no option references an unknown fact.
2. **InvariantsTest** — Codex §10 invariants 1–15, written as code.
3. **ScenarioSuiteTest** — Codex's 42 failure cases plus the worked paths (grocery, plumber, freelancer, skip-all boutique, complex maker). Expected outcomes are written from **tasks** (sell / refund; buy / receive / pay / return; book / complete / bill; count / correct; produce; reconcile), not copied from the rules.
4. **RouteEquivalenceTest** — the same facts via sentence, type, preset and manual give the same workflows.
5. **RevisionTest** — change answers both ways; no stale modules; surviving reasons kept.
6. **PropertyTest** — random answer / skip / unsure sequences on random types:
   - never more than 10 screens
   - closure valid
   - no unverified module composed
   - skip never becomes a negative
   - a confirmed workflow always has its companions
7. **PreviewEqualsProvisionTest** — the review composition equals the provisioned tenant modules.
8. **Task smoke tests** (Phase 5) — for each bundle, perform the real task on a provisioned tenant under the default owner role:
   - purchase → partial return → debit note → supplier balance
   - sale → refund → tax on receipt
   - job → invoice → payment

---

## 13. Phases (each ends with its acceptance check)

| Phase | Work | Done when |
|---|---|---|
| **0. Verify capabilities** | Walk every bundle task in the product. Check: pure-service POS, invoice credit notes without stock, supplier side of khata_credit, pre_sales vs deposits, recurring invoices without a schedule, online_store / onsite unpublished state, marketplace providers (WooCommerce only?), quotations / proposals, landed cost, composite, rental / membership. Record in `config/builder/capabilities.php`. | Every one of the 48 modules is marked verified / unverified with a note |
| **1. Policy config** | facts, questions (§3 copy), workflows, module_policy, type_hints (85, from the coverage doc), summary | PolicyCoverageTest green |
| **2. Engine** | FactStore, ScreenSelector, WorkflowComposer, CapabilityGate, SummaryWriter, BuilderSession | Invariants, Scenario, Revision and Property tests green |
| **3. Extraction** | FactExtractor via AiGateway + keyword fallback; confirmation-card facts only from owner text | RouteEquivalence green; AI-off path passes the scenario suite |
| **4. Screens** | §6 complete, mobile-first; GiftBundle switched to active choice; "Something's missing" panel | Manual run of 5 worked paths on a phone, desktop and tablet |
| **5. Provision + switch** | Server-composed provisioning, `VQ_BUILDER_V2` flag, PreviewEqualsProvision, task smoke tests | Green; old path still available behind the flag |
| **6. Navigation grouping** | Purchasing / Sell / Stock / Customers / Accounts parent areas with tabs; identity as form fields | Every bundled tool reachable in ≤ 2 taps from its parent area |
| **7. Telemetry + Playground** | §11 events; Platform HQ "Builder Playground": type a business, see facts, the next screen and why, the composition and reasons | Events visible for a test signup; playground explains the 5 worked paths |
| **8. Owner pilot** | 12 owners (grocery, pharmacy, boutique online, café, restaurant, plumber/electrician, salon + retail, freelancer, wholesaler, bakery-maker, repair shop, workshop maker), on their own phones, unaided, then compared with a consultant-made setup | ≥ 90% read the summary as "that's me"; every screen understood first time by ≥ 9 of 12 (otherwise reword and re-test that screen); no essential task missing; ≥ 90% finish within 8 screens |
| **9. Campaign launch** | Flip `VQ_BUILDER_V2` on for all | Launch gate (§14) passed |
| **10. After launch** | Safety net: search / Vena "switch on" for disabled modules, first-30-day nudges; monthly calibration report from telemetry | Absent-feature tickets and owner-enabled modules trend down month on month |

---

## 14. Launch gate — all must be true

- [ ] Phase 0: every bundle task works end to end under the default owner permissions
- [ ] All tests in §12 green, including on the AI-off path
- [ ] Zero essential-task misses and zero unrelated primary areas across the scenario suite
- [ ] All 48 modules classified; all 85 types have hints
- [ ] Preview = provisioned workspace
- [ ] Navigation grouping live for Purchasing, Sell, Stock, Customers
- [ ] "Something's missing" panel writes to the demand log with the fact snapshot
- [ ] Telemetry recording
- [ ] Owner pilot targets met
- [ ] Every "Coming soon" item has a working notify-me

---

## 15. Decisions you still need to make (only these)

1. **Online shop / QR menu as an unticked "Add free" choice** (this plan, consistent with Codex) instead of auto-on (today's interim code). Recommended: unticked.
2. **Tax panel inside Q7, asked of everyone who sells.** Recommended: yes.
3. **Unsupported activities at launch** (hire / rental, memberships, formal quotations): show honestly as "coming soon — notify me" and still build the rest of the setup. Recommended: yes. The alternative is delaying the campaign until they exist.
4. **Pilot owners:** you recruit 12. This plan cannot do that part.

