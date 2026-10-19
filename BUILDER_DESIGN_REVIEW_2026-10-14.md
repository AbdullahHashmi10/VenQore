# VenQore builder: review of Claude's question-system proposal

14 October 2026. Design review only. No application implementation or application tests were performed.

## Decision

Keep the business-language questions, workflow bundles, deterministic decisions and inclusion reasons. Replace permanent sector exclusions, automatic likely-on defaults, pre-ticked guesses and the proposed convergence proof. The supplied design is a useful first draft, but its current rules can both omit essential capabilities and enable unrelated ones.

The recommended replacement is BUILDER_DECISION_SYSTEM_V2.md. Its companion business-type coverage document covers all 85 catalogue entries. This review audits the pasted proposal's claims, every sector-matrix row, all question options, worked examples, merges and build plan. It distinguishes source observations, logical counterexamples and recommendations; it does not claim a live-product audit.

## What the source establishes

All paths below are relative to app-code/main-app in the shared workspace.

| Evidence | What is established | Limit |
|---|---|---|
| config/modules.php | 48 entries: 45 live, 2 beta (landed_cost, composite_items), 1 building (quotations) | Registry status is not proof that a complete workflow works in production. |
| config/business_types.php | 85 types across services 26, retail 25, food 12, wholesale 12, manufacturing 10 | A type's modules array is an existing configuration default, not evidence of universal business need. |
| config/module_companions.php | One-hop companion recommendations exist; purchases already includes purchase_orders | The pasted Q3 contradicts this companion policy by excluding purchase orders for immediate payment. |
| resources/js/Pages/Workspace/BuildWorkspace.jsx, companionWhy/proposedWithCompanions | The browser adds one-hop companions to the preview | Shared server composition is still required for consistent answers, preview and provisioning. |
| app/Services/AiBuilder/BusinessProfile.php and CapabilityRegistry.php | Business profiles, trade defaults, eligibility filters and deterministic question selection already exist | "No starting belief" and "AI chooses the questions" are not accurate descriptions of this source. |
| app/Services/AiBuilder/DiscoverySession.php, recordSkip | Skip resolves neither yes nor no and suppresses repeat questions; currently consumes a turn | "Skipping means off" is too broad. An unconfirmed optional module may remain off, but the stored evidence is unknown. |
| app/Services/AiBuilder/DiscoveryResolver.php, impliedModules/merge | Manual implication rules add modules and merge preset modules | Manual negative answers do not reliably remove preset defaults. This is a different problem from having no prior. |
| CapabilityRegistry.php, selectNextCandidateQuestion/calculateReadinessConfidence | Ranking is impact plus affinity; readiness is weighted resolution of selected relevant capabilities | Neither is calibrated probability or complete workflow coverage. |
| config/qore.php | Ledger, payment engine, tax calculation, parties and user identity are foundation services | Turning off their management screens must not turn off numerical correctness, tax calculation or user access. |
| config/modules.php, b2b_proposals/quotations | Live-labelled proposals requires building-labelled quotations | Do not promise proposals until the full dependency closure is verified shippable. |
| app/Services/VenSynQ/PlatformRegistry.php and config/vensynq.php | Adapter map names Amazon, WooCommerce, eBay and TikTok; default allowlist names Amazon and WooCommerce | Daraz is not in this adapter map. Adapter presence does not prove deployment enablement, credentials or successful sync. |
| config/modules.php, ai_insights/marketplace_sync | AI insights is marked metered; sync marked addon | "Free gifts" and automatic connection must not conceal allowances, costs or activation work. Current selling terms require separate verification. |

## Audit of the model and claims

1. **Eight answers always find the perfect system — replace.** Different owners can give the same eight answers but differ on an unasked requirement. Skip-all supplies almost no evidence. Promise complete known workflows and visible unknowns, not certainty.
2. **The analogy to Akinator — refine.** Businesses can need several simultaneous workflows; there is no single mutually exclusive personality to identify. Narrow possible configurations and their important differences.
3. **Core by sector — replace with core by confirmed activity.** Selling a catalogue does not prove the owner holds stock; manufacturing may use customer materials; a food outlet may be takeaway only.
4. **Likely means automatically on — restrict.** A harmless companion within an established workflow can be included. Loyalty, staffing, online shops and manufacturing are whole workflows; prevalence alone is insufficient.
5. **Never by sector — remove.** Grocery plus phone repair, restaurant catering to trade customers and wholesalers with loyalty schemes are valid mixed businesses. Suppress irrelevant questions provisionally; reopen on evidence.
6. **An answer raises a module to Core — replace.** Store a confirmed fact, then derive modules. Otherwise later answers cannot cleanly undo previous decisions.
7. **One-hop companions — inadequate as the whole resolver.** services -> invoicing -> customers/payments requires more than one hop. Define bounded, explicit business bundles and apply full hard-dependency closure; never recursively expand every optional suggestion.
8. **Skip resolves to prior — partially keep.** Use disclosed, low-risk defaults for established workflows; keep missing evidence unknown. Do not silently publish, connect, automate billing or choose tax obligations.
9. **Business type already answers questions — qualify.** It can rank questions and suggest an answer. Only explicit description, previous confirmed answer or a reviewed operating template supplies evidence sufficient to skip a consequential question.
10. **One reason per module — expand.** Record every independent justification. Removing one reason must not remove a module still justified by another workflow.
11. **All reasons for exclusions shown by default — simplify.** Show workflow summaries and material unknowns first, detailed module rationale on expansion. Forty-eight on/off rows recreate the complexity the builder is meant to remove.
12. **Seventy percent decided, typical six or seven questions, two or three sessions — unsubstantiated.** Treat as hypotheses. Measure question effort and scope implementation after design and dependency gaps are resolved.

## Every row of the proposed sector matrix

This audits all five cells through the row's governing correction. Sector likelihood may remain an internal ordering hint; C/L/P/N is not the final inclusion authority. No sector-level Never survives evidence of a mixed activity.

| Proposed row | Verdict and corrected rule |
|---|---|
| Products | Keep for physical-item catalogue or materials. Service businesses can need internal parts/material records without retail sales. |
| Services | Remove retail/food/wholesale Never. Enable for actual billed work or service jobs; do not infer from broad sector alone. |
| Inventory incl. count | Replace retail/food/wholesale/manufacturing Core with evidence of quantities needing separate tracking. Catalogue-only, dropship and customer-owned goods need distinct handling. |
| POS/counter | Replace retail/food Core with counter transaction evidence. Online-only retail and invoice-only catering are counterexamples. Current POS requires Products even for a service counter. |
| Invoicing | Include when client billing/document workflow is confirmed. Services can be immediate counter work; do not force a prominent second selling surface. |
| Sales returns/refunds | Keep as sales-workflow companion, including invoice credits/cancellations where supported. It is a recovery tool, not proof the owner routinely accepts returns. |
| Sales orders | Replace wholesale Core with advance fulfilment evidence. Phone enquiry alone is not an order. Services may have job bookings rather than goods orders. |
| Reserve stock | Remove food/services Never. Catering and service parts can need reservation; reservation requires actual stock and confirmed allocation need. |
| Restaurant tables | Replace food Likely with seated service/table-ticket evidence. Takeaway, food trucks and cloud kitchens should not inherit it. |
| Recipes/BOM | Replace manufacturing Core/food Likely with materials/recipe costing or consumption need. Resale bakeries and outsourced makers are counterexamples. |
| Production runs | Confirm recording production quantities and material consumption. "Maker" alone does not prove formal run management. |
| Purchases bundle | Confirm stock/material procurement independently of goods sale. A service business buying parts qualifies; operating expenses alone do not. |
| Purchase orders | Include in the confirmed purchasing bundle as an available companion. No credit prerequisite; no enforced order-first process. Services buying parts qualifies. |
| Landed cost | Keep need detection for allocation of freight/duty/extra procurement costs, but beta blocks ordinary onboarding. Imports do not establish a usable capability. |
| Variants | Remove services Never. A salon selling colour/size products or a uniform service qualifies; clothing category alone is a likelihood, not universal need. |
| Batches/expiry | Remove services Never. Consumed salon chemicals or pest-control supplies can expire. Food batch tracking depends on item/workflow requirements. |
| Serials/IMEI | Available for individually tracked stock. Customer-owned device intake is a different capability and must not force stock ownership. |
| Units | Remove services Never. Plumbers buy lengths, painters litres. Distinguish conversion from a basic unit label. |
| Barcodes/labels | Remove services Never. Include only relevant scanning/label use or an explicitly accepted stock companion; existing barcodes do not require printing labels. |
| Customers | Include for identified clients, credit, orders and relationship workflows. Anonymous walk-in sales must remain possible. |
| Customer credit | Replace wholesale Core/services Likely with outstanding balance evidence. Supplier balances must not be described as customer credit. |
| Payments | Keep settlement capability with money workflows. Current Payments screen has customers-or-suppliers dependency; do not create unnecessary directories to satisfy a universal screen default. |
| Bank accounts | Provide relevant cash/bank/wallet account management inside Money when needed. Card payment does not by itself prove statement matching or bank configuration is already complete. |
| Bank reconciliation | Confirm statement matching need. Wholesale/manufacturing Likely or accountant involvement does not establish it. |
| Tax | Replace global Likely with confirmed tax/reporting workflow and regional setup. Tax calculation foundation and compliance/e-invoicing screen are distinct. No automatic government connection. |
| Expenses | Retain accessible baseline expense recording. Avoid implying inventory procurement should be recorded only as a simple expense. |
| Accounting books | Reveal workspace for desired journal/accounts/financial-review workflow. Underlying accounting remains always correct. Self-bookkeepers may need it; accountants may use external software. |
| Fixed assets/Loans | Split into two distinct needs. An accountant, staff or equipment purchase does not prove depreciation-register or borrowing-management need. |
| Pricing tiers | Replace wholesale Core with customer/group pricing evidence. A wholesaler may use one price; food/services can have negotiated rates. |
| B2B proposals | Detect formal proposal/tender need separately from selling B2B. Current building dependency blocks promising an ordinary live bundle. |
| Recurring invoices | Remove retail/manufacturing Never. Confirm automatic repeat-document need; monthly cadence or equal amounts is insufficient. |
| Multi-location/transfers | Require separate stock-count locations, then distinguish movement from independent stock. Offices, employee count and catalogue size do not prove warehouses. |
| Staff/attendance | Separate identities/roles from attendance/shift tracking. Employees and system users are different populations. No sector default for attendance. |
| Loyalty/gift cards | Remove wholesale/manufacturing Never. Default off unless actual or explicitly wanted rewards/gift workflow; store-credit refunds need not imply reward points. |
| Marketplace sync | Remove food/services Never as permanent rule, then enforce product/stock/provider support. Confirm desire to connect, explain costs, keep unconnected until authorised activation. |
| Reports | Baseline, filtered to actual enabled workflows, permissions and actual data. |
| AI Advisor gift | Useful optional assistant access, with truthful allowance/cost and no fabricated readiness on an empty business. Do not make metered use compulsory. |
| Online store/QR gift | Split into two capabilities. Existing site does not imply creating a second one. Food/retail Likely must not auto-publish. Current Products dependency excludes a pure service promise without further verification. |

## Audit of every question option

### Q1: what customers pay for

- Buy/resell: establishes goods activity; does not necessarily establish held inventory. For bought-to-order goods, discover procurement and stock handling separately.
- Make/cook/assemble: establishes making activity; recipe and production-run needs are separate. Cooking, assembly and outsourced making can differ.
- Time/expertise: establishes service activity; billing method remains open.
- Work on customer's item: establishes service/customer-owned item handling. Jobs, scheduling and part consumption must be supported and independently identified.
- Subscription/rent/membership: split concepts. Repeat invoices do not supply rental availability, memberships, access control or deposits. Automatic invoicing is a further intention.
- Missing: combined activities, digital/non-stock catalogue, customer-supplied materials, plain counter service, other/explain and unknown.

### Q2: how customers buy

- Counter: appropriate POS evidence; cash management depends on cash use and intended till-control workflow.
- Sit at table OR book a time: invalid combined option. Table/kitchen workflow and service appointments need different consequences.
- Message/call: channel evidence only. Ask whether work is immediately completed, an order waits, or a service job is booked.
- Own online shop: distinguish existing external shop, existing VenQore shop and desire to create one.
- QR: distinguish viewing catalogue from ordering; no implication of table service.
- Amazon/eBay/Daraz: record exact provider, adapter and deployment support. Daraz unsupported by inspected map; do not silently label it working sync.
- B2B invoice/bulk: invoicing is plausible. Pricing tiers and proposals do not follow automatically.
- Missing: takeaway versus kitchen tickets, delivery need, job lifecycle, appointment branch, mixed selling methods.

### Q3: supply

- Buy on terms: establishes stock/material buying and supplier liability; does not establish purchase orders.
- Buy paid immediately: include the same purchasing companion package; payment timing changes balances, not whether order capability exists.
- Imports: detect extra cost allocation; mark unsupported/beta rather than adding a beta module silently.
- Make raw materials: establishes material handling, not necessarily formal BOM or run tracking.
- Don't buy stock: does not rule out material procurement, opening stock, consignment, head-office supply or made-from-customer-material work.
- Gate "Products is on": wrong evidence source. Eligibility follows buying/handling facts, not whichever modules the previous defaults happened to enable.
- Missing: consumables for services, supplied by another party, buy-to-order/no-held-stock, not sure.

### Q4: product traits

- Barcodes OR wants labels: separate scanning behaviour and label-printing intention as settings within the same module.
- Sizes/colours/styles: valid variant evidence, with plain examples and ability to say only distinct items.
- Expiry OR lot: both justify the available batches module, but preserve which requirement is confirmed.
- Serial/IMEI: ask whether it belongs to owned/sold stock or customer-item intake.
- Boxes/singles OR weight: same module can cover multiple needs; record conversion and measurement independently.
- None: valid negative for displayed traits only. It must not disable inventory, purchasing, trait options not displayed, or facts already established elsewhere without reconciliation.
- Sector short list: do not hide a known requirement merely because it is atypical. Service consumables must be eligible.

### Q5: money

- Cash: settlement method; not proof a drawer/till-opening process is wanted.
- Card/transfer/wallet: settlement channels and accounts, not reconciliation or tax status.
- Goods now/pay later: broaden wording to services/invoices as well; applies to customer receivables.
- Deposit: may be service retainer, booking fee, goods deposit or hire security. Reserve stock only when held goods are allocated.
- Refund/exchange: include correction capability as companion; question should not be needed to recover from mistakes.
- Missing: supplier balances, staged payments, customer advances, held marketplace proceeds; keep unsupported special cases visible.

### Q6: tax and books

- Added/included/no: useful tax-setting distinction only after tax applicability is supplied by owner. "Unsure" is essential; "no" does not settle all filing/withholding needs.
- Just me/accountant/nobody: describes responsibility, not desired software scope. Replace with actual tasks: basic bills/expenses; detailed books; bank matching; assets; loans.
- Accountant -> reconciliation/assets/loans: remove false implications.
- Geographic tax/e-invoice details belong to transaction readiness after regional account setup, not guessed from trade.

### Q7: people and places

- One/2–5/6+: employee size does not define user roles or attendance needs. Ask who needs access and whether shifts/attendance are tracked separately.
- One/several shops/shop+warehouse: distinguish separately counted stock locations from offices; no inventory dependency merely from office count.
- Both panels can fit one screen, but must retain independent facts and outcomes. Do not misrepresent a two-part question as a single inference.

### Q8: keeping customers

- Points/rewards: valid loyalty evidence, but do not default it on for every retail skip.
- Gift cards OR store credit: preserve which one; refund credit must be usable without enrolling reward points.
- Different customer prices: valid tier/group-price evidence, verify exact implementation of service prices.
- Same amount monthly: repeat cadence only. Ask explicit automation intention before recurring-invoice schedules.
- None: rejects displayed retention workflows, not customers, returns, receivables or unrelated repeat work.
- Priority: optional growth never takes the last available question while a core stock/service/production ambiguity remains.

## Worked examples: corrected outcomes

**Grocery example:** counter plus confirmed advance WhatsApp orders supports POS and sales orders. Terms supports payables; purchasing bundle includes PO regardless of terms. Expiry/boxes support their stock traits. Two to five users does not itself support attendance. Skipped retention does not justify Loyalty. No reason to add three gifts automatically. "Just me" bookkeeping is not a denial of detailed accounting.

**Plumber example:** the proposed example introduces "I also sell parts" without an option in its Q1. A plumber using bought parts can need material inventory without retail parts sales. Q4 cannot be skipped merely because the sector is services; pipe lengths, chemicals or serialised parts may matter. Phone orders may become service jobs rather than sales orders. Immediate supplier payment still permits POs. Solo operation does not prove absence of hired labour, but it can resolve system-user scope when explicit.

**Skip-everything boutique:** a starting catalogue and basic selling setup is defensible as a disclosed template. Variants might be a useful unconfigured suggestion, not an established fact. Loyalty, tax settings, staff attendance and public shops must not be silently asserted. Review must say what was assumed. Skip-all cannot be described as fully tailored.

## Module merge recommendations

- Purchasing: keep user-facing grouping of suppliers, purchases, POs, returns/debit notes and settlement access. Keep technical IDs, permissions and data ownership separate. Order creation is available, not mandatory.
- POS: park/recall is a sensible companion. Cash register controls require a cash/till workflow; a cashless counter is valid. Avoid forcing daily cash count solely to use POS.
- Inventory: keep stock takes/correction inside Stock. Tracking a catalogue alone does not imply inventory.
- Sales: keep returns/credits/cancellations within the relevant sales workflow, verify that ordinary invoice credit works without physical stock returns.
- Payments/bank accounts: one Money area is reasonable. Keep transfer/account setup distinct from payment correctness and party-directory dependencies.
- Credit wording: customer pay-later and supplier payables must stay distinguishable, even if the technical module serves both.
- 45 to 35: no reliable count is established. Count visible workspaces and task steps after grouping; technical modules remain 48.

## Build-plan corrections and verification

Use one facts-to-workflows-to-modules policy, server authoritative, consumed by all entry routes. Export schema/question definitions for display if needed; do not duplicate decision logic in an independently evolving JS resolver. Keep module availability, dependencies, permissions, allowances, configuration and activation as separate checks.

Replace golden tests tied to the prior matrix with independently specified real tasks. A golden test can agree with an incorrect prior. Skip variants must preserve foundation and known needs, but legitimately have different unresolved choices. Every valid business combination need not have the same output.

Use coverage, invariants, changed-answer tests, mixed-business cases, integration availability, and owner comprehension testing. Exhaustive combinations across many multi-selects are impractical; exhaust small local branches and use pairwise/property-based coverage across larger combinations. No build-duration promise until the resulting work is estimated.

The design can be considered coherent after these corrections; user validation and application verification remain needed before calling it proven.

## External design guidance used

- GOV.UK Design System, Checkboxes: discourages pre-selecting checkboxes because defaults can influence responses. For VenQore, proposed sector guesses should be suggestions; explicit facts from the owner's own description may be shown in a clearly sourced confirmation card. https://design-system.service.gov.uk/components/checkboxes/
- Microsoft HAX Toolkit, Scope services when in doubt: recommends limiting or clarifying uncertain AI behaviour. For VenQore, unknown evidence must lead to a bounded provisional setup and easy correction, not a claim that discovery is complete. https://www.microsoft.com/en-us/haxtoolkit/guideline/scope-services-when-in-doubt/

These sources inform interaction policy; they do not validate the module table or the proposed question budget.
