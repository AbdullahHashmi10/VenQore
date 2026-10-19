# VenQore adaptive builder: recommended decision system, version 2

> **18 October 2026 design revision:** [AI business interview v3](BUILDER_AI_INTERVIEW_V3_2026-10-18.md) overrides this document for opening-description ingestion, semantic evidence, AI-led question selection and session continuity. AI may choose or generate the next useful question; it is no longer restricted to phrasing a fixed candidate. Workflow bundles, capability validation and question-budget requirements remain. This revision is a design specification; application changes have not been made in this review.

14 October 2026. Design only; no application code implemented.

Read with BUILDER_DESIGN_REVIEW_2026-10-14.md and BUILDER_BUSINESS_TYPE_COVERAGE_2026-10-14.md. This specification replaces conflicting rules in the pasted Claude proposal and the earlier BUILDER_ADAPTIVE_DISCOVERY_SPEC.md. It preserves minimal questions, complete useful workflows, low clutter, a three-question preview, an eight-question target and a maximum of ten discovery screens.

## 1. Product promise and goals

Tell us how your business works. We will give you complete workflows for the things you do, keep the everyday screens focused, and clearly show anything we still need to configure.

An owner should complete actual daily tasks without discovering missing companion features or navigating unrelated workspaces. More enabled modules is not necessarily better; fewer visible workspaces can contain more useful capabilities. Owners should not need to recognise purchase orders, debit notes or module dependencies during setup.

This is a multi-workflow discovery problem, unlike identifying one mutually exclusive personality. Find the smallest sufficient set of working tools; keep multiple activities possible.

P0: no missing verified companion in a confirmed workflow; no unrelated workflow enabled solely by sector; equivalent evidence gives equivalent results across entry routes; revisions remove stale conclusions; preview matches applied setup; unsupported needs remain explicit.

P1: concise trade-specific examples, local-language comprehension, low answer effort, honest inclusion reasons and an editable review.

P2: calibrate question rankings and likelihoods using independently reviewed owner outcomes. No invented probability percentages in v1.

Scope is selection and setup design. Module implementation, external activation, legal tax determinations and existing-tenant changes have separate requirements. This document changes none of them.

## 2. Separate five layers

1. Evidence: what the owner said, including unknowns and contradictions.
2. Prior: what is common for the trade; useful for question order and provisional templates.
3. Workflow policy: which complete capabilities established activities require.
4. Technical capability: live status, dependencies, exact supported behaviour, permissions and entitlement.
5. Presentation and activation: what appears, what is configured, and what is connected, scheduled or published.

Enabled does not mean top-level menu item. Online-shop management does not mean published. Recurring-invoice capability does not mean a schedule exists. Payment correctness does not require advanced banking screens for everyone.

Core/Likely/Possible/Never mixes evidence, likelihood, availability and policy. Replace it with independent evidence and derived decisions.

## 3. Evidence and prior contract

Each fact retains key, value, status (confirmed, explicit-negative, unknown, not-applicable, conflict), source, original evidence, question/turn, revision and extraction confidence if applicable. Sources distinguish owner text, selected answer, confirmed summary and template assumption.

A trade prior, default module or displayed suggestion is not owner evidence. Important ambiguous AI interpretations need confirmation. Not mentioned, unchecked, none, skipped and not applicable are distinct states.

Independent dimensions:

- Activities: goods, services, making/assembly, hire, recurring relationships, mixed work.
- Selling/work: counter, client bills, ongoing jobs, booked slots, later fulfilment, tables/kitchen, delivery and channels.
- Items: resale stock, consumed materials, counted supplies, externally supplied stock, customer-owned items, no tracked quantities.
- Buying/money: stock/material procurement, expense-only buying, customer terms, supplier terms, advances, staged payments and settlement channels.
- Identity: variants, owned-stock serials, customer-item identifiers, lots, expiry, measured quantities, conversions, scanning and labels.
- Operation: independently counted stock places, stock movement, offices, system users, roles, attendance.
- Specialist work: financial tasks, customer programmes, billing automation and connection intent.

Precedence: confirmed clarification > explicit current answer > explicit earlier description > reviewed template assumption > trade likelihood. Conflicting explicit facts require clarification. A scoped correction supersedes the earlier fact and its derivatives. Recompute from evidence rather than accumulating modules.

Trade priors use expected/plausible/atypical for ranking. No permanent sector Never. Grocery services may be atypical but are valid. Availability is a separate capability check.

Skipping uses consequence-sensitive defaults:

| Category | Default | Explanation |
|---|---|---|
| Foundation correctness, basic expenses, relevant reports | Available under baseline policy | Not a business questionnaire choice. |
| Recovery/settlement companion in a confirmed workflow | Included inside parent | Missing it breaks work; minimal additional clutter. |
| Unresolved major workflow | Ask; if skipped, disclose assumption or undecided area | Inventory, production, tables and jobs can reshape the product. |
| Optional programme | Off unless established or deliberately chosen | Loyalty or an additional storefront is a separate activity. |
| Automation/publication/provider connection | Unconfigured until deliberate activation | Need detection does not establish readiness to act. |
| Beta/building or blocked dependency | Unavailable for ordinary onboarding; retain the need | Do not silently promise it or erase the request. |

Skip-all after a clear selected type gets a named starting template with its material assumptions. A vague description gets an activity clarification or reviewed template choice. Neither becomes a claim of complete understanding.

Show trade guesses as unselected suggestions. Explicit owner text can appear in a sourced confirmation card: You said you have one shop and buy stock weekly. Confirm or Change. Avoid pre-ticked sector guesses; GOV.UK checkbox guidance warns that pre-selection can influence answers: https://design-system.service.gov.uk/components/checkboxes/.

## 4. Eight question families

This is a budgeted bank, not a mandatory sequence. Ask the highest-value unresolved family and its relevant version. Usually show three to five options; six is acceptable only for a clear subject. Use single choice for exclusive facts, multi-select for combinations. Do not hide twenty unrelated toggles in one screen.

Offer unsure/explain where relevant. None rejects only displayed options. Skip leaves unknown. An untouched unselected option is not a broad negative; a correction to a previous confirmed choice is scoped and explicit.

### Q1: What do customers pay you for?

Ask when activities are not explicit. Multi-select: goods we sell; work/services we do; things we make/cook/assemble; items customers hire; something else/explain.

Establish activities, not stock ownership, production runs or recurring automation. Making can coexist with resale. Hire triggers a capability check: invoices do not supply rental availability/asset returns. Digital or catalogue-only sales must not automatically become warehouses.

A selected trade does not prove secondary activities absent. Always include an editable What you sell/do statement in review.

### Q2: What happens between a customer asking and the sale being finished?

Goods version: choose/pay at counter; send a bill; take an order and supply later; serve at tables/need kitchen tickets when relevant; another way.

Services version: finish service and charge straight away; send client a bill; book a time; track a job start to finish; another way.

Methods can coexist. Mixed businesses get a concise combined version or a second specialist screen if the distinction changes setup materially. Phone/WhatsApp is a channel, not proof of goods orders or service bookings. Tables and appointments never share one option.

Counter -> POS compatibility check. Bills -> invoicing. Later goods fulfilment -> sales_orders. Slots/jobs -> relevant Services subview. Tables/kitchen -> table_service only for exact verified behaviour. Current POS requires Products: verify pure service charging compatibility without presenting fictitious retail inventory.

### Q3: Which items do you buy, keep or use?

Ask when stock/materials/buying are unresolved. Multi-select:

- Goods we buy and keep to sell.
- Parts/materials we buy to use in our work.
- Supplies we want to count.
- Goods/materials provided by someone else.
- Goods we buy only after an order, without keeping stock.
- No items we need to count / explain expense-only buying.

Resolve purpose, quantity tracking and procurement independently. Provided-by-others can mean head office, consignment or customer materials; clarify ownership/payment only if consequential. Supplies can also be externally supplied; counting them does not prove buying.

Confirmed stock/material buying enables the full Purchasing bundle. No separate PO/returns preference question. Orders remain available for immediate or deferred supplier payment.

No held stock must not bypass unavoidable stock logic if the actual engine cannot support the model. Dropship, consignment and customer-material handling are verification gates, not invented supported modes.

### Q4: Which payments need following up?

Multi-select: customers pay later/in parts; we pay suppliers later/in parts; customers pay deposits/advances; everything paid in full at the time; unsure/explain.

Keep receivables and payables distinct. Deposit is not stock reservation; service retainer, booking fee, goods advance and hire security differ. Reservation follows actual goods allocation need.

Settlement channels (cash, bank/card, wallet) are a small Money setup choice when necessary, or an explicit description fact. Count any extra discovery screen honestly. Necessary account configuration can happen in first-use setup; it is still measured as user effort. Cash controls require cash/till-use evidence.

### Q5: What must you distinguish when counting or selling these items?

For held/handled stock, materials or identity needs: sizes/colours/versions; batches/expiry; individual item number; weight/length/volume or boxes-to-pieces; scanning barcodes/printing labels; just quantities/none.

Sector must not suppress known needs. Preserve stock serials versus customer-device intake; measurements versus conversions; expiry versus lots; scanning versus printing as distinct facts/settings beneath shared module keys. Service examples include pipe lengths and chemical litres. Dependencies may add an internal material catalogue without suggesting a retail storefront.

### Q6: Where is stock kept, and who will use the system?

Two independent fact panels on one screen, explicitly treated as two parts:

Stock panel, only if quantities matter: one shared count; separate counts for shops/storage places; no stock counts. One shop plus store room is not automatically separate counts.

People panel: only me; team with shared access; team needing different access. Employees and users are different populations. Roles/logins are foundation, not attendance evidence.

Separate stock counts get multi_location and a supported transfer companion; do not assert movement has occurred or force transfer entry. Multiple offices without stock get no warehouse modules. Attendance uses a specialist choice when relevant. Never infer payroll from staff count.

### Q7: Which financial tasks should the system help you handle?

Task checklist: basic bills/payments/expenses; tax summaries or tax/e-invoice setup already needed; detailed books/accounts/journals; bank statement matching; long-term equipment value/depreciation; business borrowing/repayments.

Use when scope is unresolved and consequential. Simple finances already have baseline access, so this need not be mandatory. Detailed books does not select all advanced tasks. Tax selection establishes a setup need, not registration/rate/provider readiness. Owner-confirmed treatment, region and supported submission need verification. Offer unsure/help.

Accountant involvement is access/context, not proof of assets, loans or reconciliation. Self-bookkeepers can want detailed books. Accounting correctness stays on even with the workspace hidden.

### Q8: Highest-value remaining specialist question

Use a focused relevant version with three to five options. It is not a master checklist.

- Making/food: What do you record when making things? Ingredients/material costs; quantities made and materials used; only sales of finished items; made elsewhere. BOM and runs differ.
- Orders/jobs: What stays with an order/job? Goods set aside; parts used; job progress; delivery details; none. Show relevant options; map only to verified behaviours.
- Channels: Which channel should work with this setup? Existing supported external channel to connect; new VenQore shop; QR catalogue; no additional channel. Record exact provider, viewing/ordering and connection intent.
- Repeat clients/prices: Which do you use or want to start? Different group prices; rewards; gift cards; automatic repeat invoices; none. Monthly cadence alone does not select automation. Ordinary refund credit is not a loyalty programme.
- People: Do you track shifts or attendance? Both; shifts; attendance; no.
- Written offers: Do customers need an offer before agreeing? Simple estimate; detailed proposal/tender; no. Current Quotations building and Proposals dependency gap must remain explicit.

Essential specialist branches displace optional families or use screens nine/ten. Optional modules still receive a reasoned off/recommended decision without being asked. Every module needs a policy; every owner need not see every option.

## 5. Choosing questions and stopping

First resolve a consequential contradiction; next find unknown facts that can change essential work. Rank configuration consequences, not uncertainty about business names.

Deterministic v1 bands:

1. Contradiction/ownership ambiguity blocking composition.
2. Actual activities and primary work/sale lifecycle.
3. Relevant stock/source, procurement and settlement.
4. Consequential specialisation: production, tables, bookings, stock identity, financial/tax task, supported channel.
5. Scale/access when it changes setup.
6. Optional convenience/growth.

Within a band prefer more related consequential decisions resolved for less effort; penalise unfamiliar terms and unrelated clauses. Stable tie-breakers are coverage need, shorter question and versioned ID. One important yes/no can be better than artificially affecting six modules.

Later calibrated ranking can use:

V(q) = (minimum current expected configuration loss - expected minimum loss after answer) / measured answer effort.

Loss covers missing essential tasks, irrelevant workspaces, incompatible settings and unresolved setup. Until outcome data exists, expert ordering remains an uncalibrated heuristic; no invented trade percentages or factual confidence display. Compare bundled/dependency-complete configurations, not independent module toggles.

Count each new decision screen, including skipped screens and consequential clarification. Opening description/type selection is logged separately and included in usability effort. Network/AI retry showing the same pending decision does not consume a new question. Do not disguise a sequence of panels as one question.

Offer a preview after three answered decision screens, or earlier when explicit opening evidence resolves essentials. Three skipped screens get a provisional template preview. The owner may stop or continue; material unknowns remain visible.

Target at most eight screens. Nine/ten require a logged material reason, never a compulsory second round. At ten stop asking; review shows unresolved choices or unsupported workflow limits. Editing the review also counts in measured effort, even though it is outside the discovery-screen budget.

Stop when applicable essential dimensions are evidenced or safely/disclosed defaulted, contradictions are resolved and technical closure is valid. Remaining questions should affect only optional convenience. Labels: Ready for described workflows; Starting setup with assumptions; Requested workflow not yet supported. Question count/module count is never proof of completeness.

Workflow selection readiness and transaction readiness differ. Necessary first-use settings (opening stock, account names, owner-confirmed tax treatment, connection credentials) belong to the selected workflow's short checklist. Discovery finishing does not erase this setup work.

## 6. Complete workflow bundles

| Established workflow | Included capabilities | Presentation and safeguards |
|---|---|---|
| Goods/material catalogue | products; inventory only if quantities matter | Items or internal materials, no automatic storefront. |
| Quantity tracking | inventory, stock_takes, products | Stock includes counts/corrections. Volume never establishes locations. |
| Stock/material procurement | purchases, suppliers, purchase_orders, purchase_returns, payments, technical prerequisites | One Purchasing area: record, order, receive, pay, return/debit note. PO available, never compulsory. |
| Counter charging | pos, park_recall, sales_returns, necessary settlement/party prerequisites | Counter/Sales; cash_register when cash/till-control workflow is established. |
| Client bills | invoicing, customers, payments, supported sales_returns credit/cancellation, actual products OR services | Billing/Clients, no forced physical inventory for pure services. |
| Later fulfilment | sales_orders, necessary parties/settlements; pre_sales for actual goods allocation | Orders; phone channel alone insufficient. |
| Service work | services, appropriate invoicing/settlement companions | Job/calendar subviews matched to activity; hire/membership support checked separately. |
| Separate stock places | multi_location, stock_transfers as standard supported companion, inventory prerequisites | Locations/movement inside Stock, no forced transfer entry. |
| Making/costing | cookbook for recipe/BOM; production_runs for output/usage recording | Production only when established; no automatic maker workflow for resellers. |
| Detailed finances | accounting_workspace plus only established specialist tasks | Money/Books; assets/loans/reconciliation remain independent. |

Bundles are explicit bounded sets, followed by full hard-dependency closure. Optional enhancements must not recursively expand indiscriminately. Service billing directly declares clients and settlement companions instead of depending on a fragile one-hop recommendation chain.

A negative answer removes its scoped assumption or optional activity, not an indispensable dependency of another confirmed workflow. Recompute when a bundle's triggering fact changes. Retain children justified by another bundle. If the owner requests an incoherent parent/child combination, explain the exact conflict and coherent alternatives.

Full Purchasing is a completeness policy, not a factual claim that every buyer raises POs, owes suppliers or returns goods. Reasons distinguish You buy materials from Included so you can order, pay and return when needed.

## 7. Complete module coverage ledger

B = baseline; W = workflow companion; C = conditional task; O = optional enhancement; U = unavailable/blocked for ordinary onboarding. Live below means registry-labelled live, not end-to-end verified. Every dependency must independently pass availability, entitlement and permission checks.

| ID | Registry key | Rule and evidence | Status / limit |
|---|---|---|---|
| 1 | products | C: goods catalogue or internal materials; technical prerequisites | Live; not proof of inventory. |
| 2 | services | C: service/work/jobs | Live; relevant job/calendar views. |
| 3 | customers | W: client bills, identified orders, credit/loyalty or settlement prerequisite | Live; anonymous walk-ins valid. |
| 4 | suppliers | W: relevant purchasing/supplier settlement | Live; no expense-only inference. |
| 5 | pos | C: counter charging | Live; requires products; pure-service compatibility gate. |
| 6 | invoicing | C/W: client bills/service billing | Live; products OR services. |
| 7 | quotations | U: detect estimates; retain gap | Building. |
| 8 | sales_orders | C: committed order for later fulfilment, exact workflow verified | Live; bookings/jobs not automatically orders. |
| 9 | sales_returns | W: sale recovery/return/credit | Live; verify ordinary invoice credit. |
| 10 | recurring_invoices | C: automatic repeat-document intention | Live; no schedule from cadence alone. |
| 11 | b2b_proposals | U pending dependency readiness: formal offers | Live label, requires building quotations. |
| 12 | pricing_tiers | C/O: group/customer pricing | Live; service-price support verification. |
| 13 | park_recall | W: POS | Live; inside Counter. |
| 14 | table_service | C: actual supported table/kitchen workflow | Live; not appointments. |
| 15 | pre_sales | C: allocated/reserved goods/material stock | Live; deposit alone insufficient. |
| 16 | inventory | C: tracked quantities | Live; requires products, not inferred from item count. |
| 17 | multi_location | C: separately counted stock places | Live; offices insufficient. |
| 18 | stock_transfers | W: multi-location stock bundle | Live; available, not compulsory. |
| 19 | stock_takes | W: inventory | Live; counts/corrections within Stock. |
| 20 | batches_expiry | C: lot/expiry need on handled stock/materials | Live; requires inventory. |
| 21 | serials | C: individually identified stock | Live; customer-device identity separate. |
| 22 | variants | C: size/colour/versions | Live; clothing label insufficient. |
| 23 | barcodes_labels | C/O: scanning/label workflow | Live; preserve separate intentions. |
| 24 | units_of_measure | C: measured quantities/conversions | Live; service materials eligible. |
| 25 | purchases | C: relevant stock/material procurement | Live; requires products; expense-only excluded. |
| 26 | purchase_orders | W: Purchasing | Live; all supplier payment timings. |
| 27 | purchase_returns | W: Purchasing | Live; debit notes per registry scope. |
| 28 | landed_cost | U: freight/duty allocation need retained | Beta. |
| 29 | cookbook | C: BOM/recipe/material costing | Live; products/inventory prerequisites. |
| 30 | production_runs | C: output/material-usage recording | Live; requires cookbook. |
| 31 | composite_items | U: composite/auto-deduction need retained | Beta. |
| 32 | khata_credit | C: party balances/pay-later management | Live; customers OR suppliers; verify payables surface. |
| 33 | payments | W: settlements | Live; customers OR suppliers prerequisite. |
| 34 | expenses | B: operating expenses | Live; not substitute for procurement. |
| 35 | cash_register | C/W: POS cash/till-control | Live; no compulsory cash counting for cashless work. |
| 36 | bank_accounts | W/C: relevant Money account management | Live; payment foundation remains separate. |
| 37 | bank_reconciliation | C: bank statement matching | Live; requires bank_accounts. |
| 38 | accounting_workspace | C: journals/accounts/detailed books | Live; ledger always on. |
| 39 | tax_compliance | C: confirmed tax reporting/setup | Live; no guessed obligations or automatic submission. |
| 40 | fixed_assets | C: asset/depreciation task | Live; accounting prerequisite; route/page verification. |
| 41 | loans | C: borrowing/repayment task | Live; accounting prerequisite. |
| 42 | reports | B: relevant permitted reports | Live; actual data and enabled workflows. |
| 43 | ai_insights | O: assistant/insights under actual allowances | Live, metered marker; not unlimited free-use promise. |
| 44 | loyalty_gift | C/O: reward/gift programme | Live; customers dependency; ordinary refunds separate. |
| 45 | marketplace_sync | C/O: exact supported provider and connection intent | Live, addon marker; not connected by prior. |
| 46 | staff_attendance | C: staff shifts/attendance task | Live; logins/roles not conditional on attendance. |
| 47 | online_store | C/O: wants VenQore public ordering shop | Live; products dependency; unpublished by default. |
| 48 | onsite_catalogue | C/O: wants QR catalogue/menu | Live; products dependency; viewing/ordering distinct. |

Excluded outcomes distinguish no relevant fact, explicit denial, optional not selected, unavailable and incompatible dependency. Forty-eight deliberate outcomes do not require forty-eight owner questions. Keep all independent reasons per module, not just the first reason.

## 8. Review, presentation and AI contract

Lead with an editable factual summary and actual workflow areas. About three to seven areas is a simple-business presentation goal, not a limit on complex operations. Expand each area for companions/reasons; all-module technical decisions remain optional detail.

Example: You sell groceries at one shop, buy stock from suppliers, and let some customers pay later. Your setup includes Counter sales, Stock, Purchasing with orders and returns, Customer balances, and Money & reports. Expiry tracking is off because you told us you do not use it.

If unknown: We have assumed one shared stock count because you skipped locations. Change this if you count shops or storage places separately.

Required companions are discoverable inside the everyday parent area: Purchasing includes Orders and Returns; Counter includes Refunds/Parked bills; Stock includes Counts. A feature that exists only in module settings is effectively absent for many owners. Search/direct actions obey the same enabled/permitted policy.

Future correction may arise from an owner's action such as adding a stock place, but it is a recovery mechanism, not a substitute for complete onboarding.

AI extracts evidenced facts, interprets explanations into validated schema, flags ambiguity and phrases the selected question. Deterministic policy selects questions, bundles, dependencies, readiness and composition. Free text can supply additional facts, subject to evidence/reconciliation.

AI must not turn silence into no, choose legal obligations, invent support, schedule invoices, publish stores or connect paid services from an inferred need. During outage, plain templates and deterministic selection share the same policy. The source already selects deterministically; this redesign improves selection and evidence handling.

## 9. Manually reasoned failure trials

These are paper design cases, not executed application tests. Outcomes name workflow requirements; current capability gaps require verification.

| Case | Expected decision | Error prevented |
|---|---|---|
| Grocery, 10,000 items, one shop, buys stock, no expiry | Counter/Stock/Purchasing; expiry/locations off | Item count -> branches. |
| Grocery with supplier terms | Purchasing plus payables | Credit -> PO-only eligibility. |
| Grocery pays suppliers immediately | Same PO/returns access, no claimed debt | Immediate payment -> missing order tools. |
| Grocery supplied by head office | Stock; source/ownership clarified if consequential | Stock -> purchasing. |
| Grocery plus repair/parcel services | Mixed work scope | Grocery -> Never services. |
| Online-only boutique | Catalogue/orders/channel/stock as confirmed | Retail -> compulsory POS. |
| Boutique skips all | Disclosed template, optional programmes off | Skip -> complete understanding. |
| Boutique distinct items only | No compulsory variants | Fashion -> variants regardless of answer. |
| Pharmacy confirms expiry/lots | Stock/batches, sales/buying as confirmed | Optional question displaces essential identity. |
| Pharmacy declines digital batch tracking | Excluded scope visible, answer respected | Trade prior overriding owner answer. |
| Plumber buys pipe/materials | Services/billing, materials/Purchasing/units | Service -> no stock traits. |
| Plumber uses customer materials only | Jobs/services, buying not inferred | Material handling -> buys it. |
| Freelancer bills monthly manually | Billing/clients, no repeat schedule | Cadence -> automation. |
| Freelancer wants automatic monthly bills | Recurring capability and deliberate schedule setup | Needed automation hidden forever. |
| Booked service with deposit, no stock | Bookings/advance settlement | Deposit -> reserve stock. |
| Pure service cashless counter | Verify supported charging interface | POS prerequisite -> retail warehouse. |
| Repair customer phones with bought parts | Intake identifiers separate from own parts stock | Customer IMEI -> owned inventory. |
| Salon plus retail cosmetics | Both activities and relevant traits | Service -> Never expiry/variants. |
| Salon counts consumed supplies only | Materials/buying if confirmed | No retail -> no procurement. |
| Cloud kitchen/takeaway | Orders/counter/ingredients as confirmed | Food -> dining tables. |
| Restaurant tables, no run tracking | Tables/kitchen, no assumed production runs | Cooking -> formal production. |
| Bakery resells only | Retail/Purchasing, no recipe/runs | Bakery label -> manufacturing. |
| Bakery makes recorded batches | BOM/runs/batches as established | Resale default suppresses making. |
| Catering B2B with negotiated prices | Food plus billing/orders/pricing | Food -> Never B2B prices. |
| Cash wholesaler, one warehouse | Confirmed orders/stock/buying, no assumed debt/branches | Wholesale -> credit/locations. |
| Wholesaler reward programme | Loyalty if requested | Sector -> Never loyalty. |
| Manufacturer customer-owned materials | Making/source scope, no assumed buying | Maker -> universal purchasing. |
| Outsourced maker/designer | Bills/orders, stock/BOM only if managed | Maker name -> runs. |
| Accountant uses external books | Detailed workspace only if desired | Accountant -> assets/loans/bank matching. |
| Owner self-manages books and borrowing | Books/loans as requested | Just me -> no accounting. |
| Equipment mentioned, no asset tracking | No assumed depreciation task | Equipment -> asset register. |
| Three offices, no stock | Access/services | Offices -> warehouses. |
| Staff users, no attendance | Users/roles, attendance off | User count -> attendance. |
| Owner-only login, employee attendance needed | Attendance if established | One login -> no staff workflow. |
| Existing WooCommerce, wants sync | Verify provider/entitlement/connection | Existing site -> duplicate new shop. |
| Wants Daraz sync | Unsupported under inspected adapter map | Alias -> working provider. |
| Imported landed-cost allocation | Need retained, beta gap visible | Import -> beta auto-enabled. |
| Formal B2B proposal needed | Dependency gap surfaced | Live parent -> usable closure. |
| Changes no expiry to expiry | Recompute identity support | Stale negative locking. |
| Changes several counts to one | Remove location bundle unless still justified | Accumulated stale modules. |
| AI outage/misunderstanding | Deterministic relevant clarification/provisional review | Confident generic-retail fallback. |
| Two workflows justify Customers, one removed | Retain for surviving reason | First reason removed -> dependency deleted. |

## 10. Verification and launch criteria

Define independent expected tasks, not goldens copied from the prior table: sell/refund; buy/receive/pay/return; book/complete/bill; count/correct; fulfil/reserve; produce; reconcile. Derive expected module sets from independently reviewed task needs.

Required invariants:

1. Modules and every dependency are real/available/permitted; live parents cannot pull unavailable children.
2. Confirmed workflows contain verified, discoverable companions.
3. Scoped negatives override priors without unrelated deletion.
4. Mixed evidence can reopen atypical activity branches.
5. Skip remains unknown; unsupported remains unsupported.
6. Quantities/locations, supplier terms/POs, invoice cadence/automation and users/attendance stay independent.
7. Equivalent evidence composes equivalently across manual, preset, type and description routes.
8. Adding an independent activity preserves existing justified workflows.
9. Revisions remove stale derivatives and preserve surviving reasons.
10. Provider support and pricing are exact, never inferred from aliases.
11. Preview, validation and provisioned workspace agree, or explain the difference before applying.
12. Relevant actions exist within parent workflows; unrelated primary workspaces stay out.
13. Prior alone never activates schedules/publications/paid connections.
14. At most ten new discovery screens; cap/early exit never becomes fabricated completeness.
15. All 48 modules and 85 types have explicit review policies; additions require coverage.

Exhaust small local multi-select branches. Use pairwise/property-based coverage for larger combinations, including skips, explicit negatives, mixed activity, changed answers, unavailable support and dependency conflict. No Never module is not a sufficient correctness test because the Never table may be wrong.

Proposed initial human validation: 12 owners across grocery, online retail, food, field trades, professional services, mixed salon/retail, wholesale and making. Compare factual-summary comprehension and real task completion against an independently prepared consultant setup.

Proposed launch targets: no essential task missing or unrelated primary area in the agreed acceptance set; 90% of supported pilot cases within eight screens, all within ten; at least 90% accurately understand the factual summary without coaching. These are targets, not results or statistical population guarantees. Correct comprehension failures before optimising speed.

After launch track absent-feature tickets, material assumption corrections, first-workflow completion, question effort, unsupported needs and unnecessary-workspace removals. Infrequent recovery tools can still be essential; non-use alone must not demote them.

## 11. Verification gates and eventual implementation sequence

Before implementation approval verify: B2B/Quotations dependency closure, beta cost allocation/composites, pure service POS, invoice credits, customer-owned device/material/rental handling, provider enablement, entitlement/legacy-gate consistency, and internal materials catalogue presentation. Source module labels alone cannot settle these.

Future phases: verify capability contracts; implement shared evidence/bundle/selector and independent scenario oracles; connect manual/conversation adapters; build truthful review and workspace grouping; verify provisioning and real tasks; owner pilot; later probability calibration. Preserve module IDs, data, permission boundaries and existing tenant setups. No duration is asserted from this review.

Microsoft HAX guidance supports bounded behaviour under uncertainty: https://www.microsoft.com/en-us/haxtoolkit/guideline/scope-services-when-in-doubt/. This informs the provisional-review policy, not the module mappings.

## 12. Concrete paths and what each answer settles

These are worked paper traces. They demonstrate the selection policy, not measured completion rates.

### Grocery: six decisions, with optional seventh only if requested

Opening: I run a grocery shop. Primary goods activity is a proposed trade interpretation; do not infer stock locations or exclude side services. A sourced activity summary stays editable.

1. Q2: counter sales, plus orders delivered later. Confirms Counter and Orders; messaging itself was not the implication.
2. Q3: buy and keep goods to sell. Confirms Stock and the whole Purchasing bundle, including PO/returns capability.
3. Q4: customers sometimes pay later; suppliers paid immediately. Confirms receivables; no supplier debt claimed. Show useful preview now; stock traits/places remain unresolved.
4. Q5: just quantities and box-to-piece conversion; explicitly no batch/expiry tracking. Enables Units; excludes batch/serial/variant workflows within answered scope.
5. Q6: one shared stock count; two users with different access; no requested attendance tracking. No branches/transfers; configure roles separately.
6. Q7 only if financial scope is consequential or owner wants it: basic records; no advanced books, bank matching, assets or loans. No advanced finance extras. If basic scope already explicit, skip this screen and finish at five.

No core ambiguity remains in the described supported model. Optional Loyalty/QR/store creation is left off with a reason; it does not consume a mandatory question. If an existing channel or reward scheme was mentioned, replace the optional financial screen or use the relevant specialist screen. Buying on credit would change payables, not the Purchasing companion set.

### Plumber: three or four decisions

Opening: Solo plumber, I bill customers for jobs. This supplies service activity, solo access and client-billing evidence; do not ask them again.

1. Q2 service version: track jobs until finished. Job scope established.
2. Q3: buy parts/materials, count the pipe lengths and fittings used. Confirms material stock, Purchasing and measured-unit need from the explanation. No retail counter inferred.
3. Q4: customers pay later, suppliers paid immediately. Relevant receivable/settlement scope established; preview may be ready for the described workflows.
4. Q5 only if identity needs remain unclear: ordinary quantities/lengths only. Resolves variants/serials/batches. It cannot be skipped just because this is services.

Jobs/Billing, Materials/Stock, Purchasing and Money/Reports support the established work. Appointment/routing, retail store, attendance and recurring automation are not inferred.

### Freelancer: description can replace questions

Opening: I work alone designing logos remotely, keep no stock, send client invoices manually each month and clients pay by bank transfer after delivery.

Explicit service activity, solo access, no stock, invoicing, manual cadence and receivables are already supplied. Show the sourced facts and a preview. Ask only if job-stage tracking or another consequential need is ambiguous. Do not force three questions as a minimum. If the owner says automatic repeat invoices instead, configure recurring capability and require deliberate schedule details.

### Skip-all boutique: honest provisional result

Selected type: clothing boutique. All offered questions skipped.

Provide a disclosed boutique starting template with basic item/selling/report/expense access, and recovery companions for whichever selling workflow the template includes. Show that stock handling and selling channel are assumptions. Variants may be a suggested setup, never an owner-confirmed fact. Rewards, advanced finances, attendance, publishing and paid connections do not automatically turn on.

The review label is Starting setup with assumptions. This path can be useful without pretending to match an online-only, made-to-order or mixed-service boutique perfectly.

### Complex maker: why question nine can be justified

A print-and-install business sells stock, makes custom items, buys materials, bills in stages, keeps separate workshop/site quantities and also takes marketplace orders. Several activities are explicit in the description. Spend early questions on material ownership, making/usage, order/job lifecycle, payments and stock identity; ask places/access independently. Specialist provider/connection and exact financial task can legitimately need screens nine/ten if unresolved. Optional rewards never outrank these. Unsupported estimates/proposals or provider requirements remain gaps, not silently replaced by a generic module.

