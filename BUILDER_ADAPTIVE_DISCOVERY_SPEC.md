# Adaptive builder decision specification

Date: 14 October 2026
Status: Proposed product and implementation contract. Application code has not been changed.
Scope: Preset, business-type and free-description entry; manual and conversational discovery; module composition; final review.

## Product decision

Discover how the business works, then assemble complete workflows. Do not ask owners to design an ERP or recognise module names. Optimise for avoiding missing essential capabilities while keeping unnecessary navigation out of the way. Module count is not the measure of success.

Use an adaptive question bank, not eight mandatory questions. Three answers produce a useful preview. Usually finish in three to eight answered questions; allow nine and ten only when a consequential uncertainty remains. A complicated business may remain uncertain at ten: explicitly show the unresolved choice instead of claiming perfect understanding. No finite questionnaire guarantees a perfect configuration for every business.

Business type supplies a starting hypothesis. Actual activities and explicit answers decide the configuration. A grocery may also deliver, sell wholesale or offer services. A service business may own consumables, sell products or employ multiple people. Never make a business-type exclusion irreversible.

## Evidence and present gaps

Source reviewed in app-code/main-app:

- config/ai_builder.php: stock=deep combines item volume and locations, adding multi_location and stock_transfers. These are independent facts.
- The manual buying and buying_depth questions split purchasing, supplier balances, orders and returns into separate choices. This makes completeness depend on an owner recognising optional features.
- app/Services/AiBuilder/CapabilityRegistry.php: question ranking uses impact plus affinity; this is a useful relevance heuristic, not a probability model or an estimate of uncertainty reduction.
- Its readiness calculation is weighted resolution of selected capabilities. It does not prove coverage of the business's essential workflows. A zero-denominator fallback can report high readiness with very little evidence.
- Trade matrices include auto_reject lists. Treat trade-derived exclusions as reversible relevance defaults, not customer denials.
- coreModules falls back to the full preset when core is missing. An unconverted preset can therefore bypass discovery and enable broad functionality.
- DiscoverySession currently specifies four initial turns, ten total and five additional deep-round turns, with a three-answer minimum per round. This differs from the intended three-answer preview and eight-question target.
- config/modules.php already defines purchase_orders and purchase_returns as separate live modules; purchase_returns includes debit notes. Separate technical modules do not require separate onboarding decisions.

These are source findings, not a claim that the current deployed experience has been reproduced. This specification supersedes conflicting question-selection recommendations in earlier builder planning documents for this scope.

## Facts, not guesses

Each fact stores value, state, source, evidence, question ID and revision. States: confirmed yes; confirmed no; unknown; not applicable; conflicting. A trade-derived likelihood is stored separately and never masquerades as a confirmed fact. Preserve the distinction between skipped and no.

Track at least:

- Activities: goods, services, making/assembling, rental; allow combinations.
- Selling: counter, client invoices, advance orders, own online shop, external marketplaces, delivery.
- Stock: held for sale, materials used in work, supplies only, no stock, supplied by another party.
- Buying: stock/materials purchased, externally supplied without purchasing, operating expenses only.
- Money: immediate payment, customer balances, supplier balances, deposits, staged or recurring billing.
- Fulfilment: immediate completion, jobs over time, bookings, tables/kitchen, production, dispatch.
- Stock identity: quantity, weight/length/volume, variants, serial numbers, batch and expiry.
- Physical operation: one stock location, several independently counted stock locations; movement between them is a separate fact.
- People: solo, shared staff access, differentiated roles, attendance/payroll needs.
- Unsupported requirements and unresolved contradictions.

Do not infer branches from item count, purchase orders from expiry tracking, recurring automation from monthly invoicing, payroll from employee count, delivery management from online selling, or manufacturing from the bakery label alone.

## Question bank: eight families, variable order

Ask only families whose answers can change the result. Plain options can resolve several related facts, but one screen must stay about one recognisable subject. Multi-select means "Choose everything that happens in your business"; none is exclusive; unsure remains unknown. Do not count a screen containing twenty unrelated switches as one efficient question.

| Family | Owner-facing question and answer examples | Decision changed |
|---|---|---|
| A. Actual activity | What do customers pay you for? Goods; services or jobs; things we make; hiring items. Choose all that apply. | Product/service/production/rental branches; mixed businesses remain possible. Skip if already explicit. |
| B. Sale and fulfilment | How does a sale usually happen? Paid and completed at the counter; send a client a bill; take an order and complete it later; online or message orders. | POS, invoicing, sales orders and channel follow-up eligibility. Multiple methods allowed. |
| C. Stock and source | Which of these do you handle? Goods I buy and keep to sell; materials I buy to use in jobs or making things; supplies I want to count; goods supplied by someone else; no items to count. | Inventory and purchasing independently; supplied-by-others answer may require clarification. Never infer locations. |
| D. Money outstanding | Which payments do you need to keep track of? Customers paying later; suppliers I pay later; deposits or part payments; everyone pays in full immediately. | Receivables, payables, payment allocation and relevant billing follow-ups. |
| E. Trade-specific workflow | Select one relevant branch below, based on activity and unresolved facts. | Operational capabilities that determine whether the business can work. |
| F. Stock identity | What must you distinguish when counting or selling items? Weight or length; sizes or colours; each item's serial number; batches or expiry dates; just item quantities. | Units, variants, serials, batches; ask only for relevant stock, including consumables where needed. |
| G. Stock locations | Where do you need separate stock counts? One place; several shops or storage places; I do not keep stock. | multi_location independently of stock volume. Follow up on movement only if it changes the workflow. |
| H. People and control | Who will use this system? Only me; a team with the same access; a team needing different access. | Access setup and roles. Attendance/payroll are not automatic implications. |

Family E branch wording:

- Services: How do you organise the work? Finish on the spot; booked appointments; jobs with progress to track; ongoing client work. Follow up on automatic repeat billing only when recurring work is confirmed.
- Repairs: What must stay with each job? Work/status only; parts and labour; the customer's device/item details. Map only to verified available features; device ownership is not proof of resale inventory.
- Hospitality: How do you serve customers? Counter/takeaway; seated tables; deliveries; combinations. Ask recipes/ingredient consumption only when producing food or ingredient costing is in scope.
- Making goods: Do you need to record materials used and finished items made? Yes; only sell finished items; someone else makes them. Do not enable production merely because the preset says bakery.
- Wholesale: Do trade customers need different prices or orders delivered later? Different prices; advance orders; both; neither.
- Channels: Where do orders come from? Own shop site; marketplaces; messages/phone; counter only. Distinguish owning an online channel from wanting VenQore to create one.

These are reusable templates, not a fixed script. Clarifying an ambiguous source of stock outranks an optional team question. A service-only solo freelancer may finish after activity/selling, work organisation and payments; no stock questions are required when the description explicitly rules stock out.

## Selecting the next question

1. Extract explicit facts from description/preset selection. A selected preset confirms the owner's chosen category, not every workflow in its module list.
2. Build candidate configurations from unresolved facts that materially affect supported workflows. Reconcile contradictions before making more assumptions.
3. Remove questions already answered, made irrelevant by confirmed facts, or incapable of changing the configuration.
4. Rank remaining questions by expected reduction in configuration error, adjusted for answer effort. Missing essential work receives a higher cost than an unused secondary capability; a whole unrelated workflow receives a substantial clutter cost.
5. Ask the highest-value question. Recompute facts, eligibility, bundles and remaining uncertainty after every answer.

Ranking contract:

value(q) = [current minimum expected configuration loss - sum over answers of P(answer | evidence) * minimum expected loss after answer] / answer effort.

Loss includes missing essential workflows, irrelevant visible workflows, and incompatible settings. Use dependencies and workflow bundles when comparing configurations, so one question can resolve several modules. A question separating two equally likely business names is low-value if both require the same software.

Initial likelihoods must be versioned expert estimates, explicitly labelled uncalibrated. Do not display them as factual percentages. Where no reliable probability model exists, use an ordinal fallback: contradictions; missing core activity; essential unresolved workflow; relevant specialisation; optional enhancement. Use stable tie-breaking and identical policies in AI and offline paths. Later calibrate against corrected configurations and actual workflow use; non-use alone does not prove irrelevance.

## Workflow composition

Maintain three different concepts: technical dependency, complete workflow bundle, and visible navigation. They solve different problems.

| Confirmed need | Enable together | Visibility policy |
|---|---|---|
| Buy stock or job/production materials | purchases, suppliers, purchase_orders, purchase_returns, and necessary payment/ledger dependencies | One Purchasing area. Record purchase is primary; orders and returns/debit notes remain accessible inside it. No separate setup question required. |
| Sell goods and manage quantities | products, inventory, supported stock counting/correction tools; selling method determines POS/invoicing | Show Stock and the confirmed selling surface. No multi_location without separate-place evidence. |
| Counter selling | POS and its required payment/register dependencies, sales_returns where supported | Returns are available from the sales workflow; avoid another "do you need refunds?" question. |
| Client billing | services where applicable, invoicing, customers, payments and supported credit/correction tools | Show Clients/Billing; no retail stock or counter POS unless independently confirmed. |
| Customer or supplier pays later | Appropriate party records, balances and payment allocation | Place balances with the relevant sales/purchasing workspace. |
| Several separately counted stock places | multi_location; stock_transfers when movement is confirmed or explicitly included as a standard reversible companion | Do not infer several branches from one shop plus a stockroom unless separate counts are wanted. |
| Specific stock identity | Only confirmed units/variants/serials/batches modules and their dependencies | Show the relevant fields in stock and transaction forms. |

Purchasing does not logically prove that an owner raises formal orders before delivery. This proposal deliberately includes purchase orders as a useful companion capability because the user requires a complete buying package. It must not force an order-first process or mark "uses purchase orders" as a confirmed fact. Similarly, purchases do not imply inventory when the purchase is only an operating expense.

Do not change global module dependency definitions to force business bundles onto all existing customers. Compose onboarding bundles in a dedicated policy layer, then apply technical dependency closure. Existing tenants retain configuration unless deliberately reconfigured.

Only compose live, entitlement-available, verified capabilities. If the bundle cannot supply an essential requested capability, report the gap; silently stripping an unavailable module and calling the result complete is unacceptable. Verify actual routes, forms, permissions and accounting behaviour before promising a named feature. The presence of a module key alone is insufficient.

## Completion and the three-answer preview

After three answers show an editable preview: "Here is the setup we have so far." Include a short business summary and the workflow areas it produces. The owner may use this setup or continue refining it. If they stop, retain and disclose material unknowns; do not say everything has been established.

Stop discovery when all applicable essential dimensions have evidence or a safe, disclosed default; no consequential contradiction remains; enabled workflows are dependency-complete; and the next question would affect only optional convenience. Finishing fewer than three questions is acceptable when the initial description already resolves the essentials. Do not enforce a minimum just to fill space.

Target eight answered questions. Questions nine and ten must carry a recorded reason such as unresolved goods-versus-services, supplier versus customer-owned stock, tables versus takeaway, or recurring invoices versus automation. Reaching a count is never proof of readiness. Count customer question screens consistently across manual and conversational paths; retries, refusals and AI failures do not advance the answered-question count.

At the cap, show an honest provisional setup with the remaining consequential choice editable in the review. Do not require a second questionnaire or silently enable an unrelated workflow. A skipped question remains unknown and can be resolved in this review.

Final review is comprehension, not another module checklist:

"You sell groceries at one shop, buy stock from suppliers, and let some customers pay later. Your setup includes Sales, Stock, Purchasing with orders and returns, and Customer balances. We have left expiry tracking off because you said you do not need it."

Owner can edit these business facts directly. Review all unsupported needs and consequential unknowns beside the relevant area. Show inclusion reasons internally and in concise user-facing language. The review should be sufficient for ordinary owners who never visit module settings later.

## Contradictions and revisions

- Explicit current answer overrides a business prior; explicit conflicting answers trigger a short clarification.
- "No batches" removes batches only; it does not remove purchases, inventory or supplier returns.
- "One location" removes location/transfer inference regardless of item count.
- "Goods are supplied by head office" establishes stock handling, not whether this tenant buys the goods. Ask ownership/payment only if relevant.
- "Only services" does not itself prove no consumables. Explicit "no stock or materials" does.
- "Monthly invoices" establishes cadence, not automatic recurrence.
- Correcting a fact recomputes the entire proposal and dependent facts; no accumulating stale modules from earlier answers.
- Never remove a dependency required by a confirmed workflow. Explain the conflicting requirement and resolve it.

## Implementation responsibilities

1. Shared fact schema and evidence precedence in BusinessProfile/BusinessUnderstanding. Preserve existing session compatibility with a schema version and safe migration.
2. Versioned workflow bundle policy beside CapabilityRegistry; remove accidental scale/location implications in manual config. Give every preset a reviewed minimal core; no full-list fallback.
3. One selector and completion evaluator consumed by manual DiscoveryResolver and ConversationalBuilderService. Replace impact-plus-affinity readiness with dimension coverage and consequential-unknown checks; keep model responsible for language/extraction within validated schema.
4. DiscoverySession owns target/cap and preview state, not a compulsory three-question minimum for each round. Frontend uses server-provided candidates and facts; it must not recreate implication rules.
5. Finalize through ConfigurationValidator, technical dependency resolution, live/entitlement checks and ApplyConfigurationService. Keep proposals and applied results equal or explain changes before applying.
6. Review UI offers editable facts, full workflow summary and unsupported needs. Navigation keeps companion features within their parent workflow; enabling modules alone will not satisfy the anti-clutter requirement.
7. Audit every registered live module into baseline, workflow companion, conditional specialisation, explicit optional enhancement, or unavailable-for-builder. Record its triggering fact/question and reason. Every module must have a deliberate classification; not every module needs a question.

## Required acceptance scenarios

| Scenario | Must include or resolve | Must avoid |
|---|---|---|
| Grocery, single shop, thousands of items, buys stock, no batches | Stock and complete purchasing, selling/payment workflow | Multiple locations, batches, services inferred from volume |
| Grocery, does not buy, supplied by head office | Stock; clarify separate counts or ownership only if consequential | Automatic purchases or "no stock" assumption |
| Freelancer, invoices monthly, solo, no stock, no recurring automation | Services/client billing/payments and relevant expenses | POS, inventory, supplier purchasing, automatic subscription billing |
| Salon with appointments and retail products | Service and retail branches, booking if supported, stock/purchasing if confirmed | Service-only classification hiding retail work |
| Phone repair shop using customer-owned devices and bought parts | Jobs/parts billing if supported; parts stock and purchasing | Customer device automatically treated as resale stock |
| Bakery reselling goods only | Retail stock/purchasing/sales | Recipes or production inferred from name |
| Bakery making food, takeaway plus tables | Production/ingredients and hospitality branches as confirmed and supported | Taking a preset as proof of every food module |
| Wholesaler, one warehouse, delayed customer payments | Orders/prices as confirmed, stock/purchasing/receivables | Multi-location inferred from wholesale |
| Service team with several offices but no stock | Team/client workflows | Warehouse modules inferred from office count |
| "No expiry", then "we buy every week" | Purchasing intact; expiry excluded | Negative answer bleeding into unrelated decisions |
| Changed answer from several shops to one | Recomputed one-location setup | Stale transfers or branches |
| Unknown business, skipped stock answer, AI unavailable | Deterministic relevant clarification; disclosed unknowns | Confident retail fallback and fabricated completeness |

Run the same facts through preset, manual and conversation entry and require equivalent workflow sets. Validate mixed activities, negations, answer revisions, dependency closure, unsupported needs, unavailable modules, three-answer exits and ten-question caps. Use bilingual/local-language examples for extraction and comprehension, with owners validating wording. No probability claim should be shipped without calibration evidence.

Launch gates: zero missing essential capabilities or unrelated primary workspaces across the agreed scenario suite; every live module classified; equivalent composition across entry routes; correct correction behaviour; provisioning equality; usable Purchasing/Returns paths under permissions; and representative owner testing that confirms they can complete their real tasks. Measure optional module corrections, support requests about absent features, question abandonment and time to first completed workflow after release. These gates are requirements to verify, not tests already passed.
