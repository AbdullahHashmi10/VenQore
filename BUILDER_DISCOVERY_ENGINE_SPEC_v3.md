# VenQore Builder — Discovery Engine, spec v3 (merged)

**Date:** 14 Oct 2026 · **Status:** design for approval, nothing implemented
**Supersedes:** `BUILDER_QUESTION_SYSTEM_SPEC_2026-10-14.md` (v1/v2) and merges `BUILDER_ADAPTIVE_DISCOVERY_SPEC.md` (Codex).
**Why this matters:** the campaign promise is "we build the software around your business". The builder *is* that promise. If it asks the wrong questions or leaves out what they need, the campaign is proving the opposite.

---

## 0. What each earlier spec got right, and what this one adds

| Idea | Source | Kept? |
|---|---|---|
| Ask about the business, never about software | both | ✅ |
| Adaptive question count, preview after 3, usually ≤ 8, 9–10 only with a reason | both | ✅ |
| Business type is a starting belief, never a final exclusion | both | ✅ |
| **Facts with states** (yes / no / unknown / not applicable / conflicting), and skipped ≠ no | Codex | ✅ core of v3 |
| **Three separate layers:** technical dependency · workflow bundle · navigation visibility | Codex | ✅ |
| Contradiction and revision rules ("no batches" never removes purchasing) | Codex | ✅ |
| Don't infer: branches from item count, POs from expiry, payroll from headcount, production from the word "bakery" | Codex | ✅ |
| Don't show probabilities to users as percentages | Codex | ✅ (v2's "80% sure" bar removed) |
| Concrete priors, miss-vs-bloat weights, value-of-question formula | v2 | ✅ moved from modules to facts |
| Full plain-language question bank with examples | v2 | ✅ rewritten against the fact model |
| Learning from real usage (calibration) | v2 | ✅ sharpened |
| Persona simulation in CI | both | ✅ merged suites |
| **NEW: probability on ~30 facts, not ~45 modules** | v3 | the main structural change |
| **NEW: "Is this you?" read-back as the final step** | v3 | |
| **NEW: unknown-fact policy per fact (include-if-unknown vs leave-out-if-unknown)** | v3 | |
| **NEW: discovery continues after signup** (in-product safety net) | v3 | the main answer to "they'll think we don't have it" |
| **NEW: one-click business types also get a 2–3 question quick fit** | v3 | closes a hole: today they get zero questions |
| **NEW: launch validation with real shop owners + a builder playground for you** | v3 | |

---

## 1. The model in one picture

```
 Sentence / business type / preset
            │  (AI extracts cues; keyword fallback)
            ▼
   ┌─────────────────┐     each answer updates facts
   │  ~30 FACTS      │◄────────────────────────────────┐
   │  yes/no/unknown │                                 │
   │  + belief %     │                                 │
   └────────┬────────┘                                 │
            │ rules (deterministic, versioned)          │
            ▼                                          │
   ┌─────────────────┐     next question = the one     │
   │  ~14 WORKFLOWS  │──── whose answer most reduces ──┘
   │  (bundles)      │     the risk of a wrong setup
   └────────┬────────┘
            │ bundle → modules → technical dependencies
            ▼
   ┌─────────────────┐
   │  MODULES        │──► Navigation: companions live INSIDE their parent
   └─────────────────┘     (Purchasing shows orders + returns as tabs)
```

**Why facts, not modules:** a business owner knows ~30 facts about their business. They don't know 45 module names. Thirty variables with clear meanings are also far easier to get right, test and calibrate than 45 interlocking modules. Questions settle facts, rules turn facts into workflows, and bundles turn workflows into modules. The Akinator search runs over facts.

---

## 2. The fact catalogue

Each fact stores: `value`, `state` (confirmed-yes · confirmed-no · unknown · n/a · conflicting), `source` (answer · sentence · type prior · default), `evidence` (the words), `question_id`, `revision`. A belief from the business type is stored separately as `prior` and **never** becomes a confirmed fact by itself.

| # | Fact | Meaning in plain words | Unknown policy |
|---|---|---|---|
| F1 | sells_goods | Sells physical items | from prior |
| F2 | sells_services | Paid for time, skill or work | from prior |
| F3 | makes_goods | Cooks, mixes, assembles or makes what it sells | **leave out** (heavy) |
| F4 | rents_items | Hires items out | leave out |
| F5 | keeps_stock | Counts items it holds | from prior |
| F6 | stock_for_jobs | Holds parts/materials used in jobs | from prior |
| F7 | buys_stock | Buys the stock or materials itself (not supplied by head office) | **include** if F5 |
| F8 | pays_suppliers_later | Supplier credit / terms | include if F7 |
| F9 | imports | Imports goods from abroad | leave out |
| F10 | sells_at_counter | Customer pays and leaves at once | from prior |
| F11 | bills_clients | Sends invoices / bills | from prior |
| F12 | takes_orders_ahead | Takes orders now, completes later | from prior |
| F13 | table_service | Customers sit and are served | leave out |
| F14 | delivery | Delivers to customers | leave out |
| F15 | sells_online_own | Wants its own online shop | gift offer |
| F16 | sells_marketplaces | Sells on Amazon / Daraz etc. | leave out |
| F17 | customers_pay_later | Customer credit / accounts | **include** for wholesale, else prior |
| F18 | deposits | Takes deposits / part payments to hold items | leave out |
| F19 | recurring_billing | Same amount billed regularly *(cadence only, not automation)* | leave out |
| F20 | returns_happen | Customers return or exchange | **include** if F1 |
| F21 | charges_tax | Charges sales tax / VAT / GST, and whether prices include it | **include** (tax off by default, module present) |
| F22 | has_accountant | An accountant or bookkeeper does the books | leave out |
| F23 | jobs_over_time | Work tracked over days (repairs, installs, projects) | from prior |
| F24 | appointments | Booked time slots | from prior |
| F25 | trade_prices | Different prices for different customers | from prior |
| F26 | quotes_first | Customers ask for a price quote first | leave out |
| F27 | id_variants / id_serials / id_batches / id_units / id_barcodes | How items must be told apart | **leave out** each (specialisations) |
| F28 | separate_stock_places | Stock counted separately in more than one place | **leave out** (never from item count) |
| F29 | moves_stock_between | Moves stock between those places | include if F28 |
| F30 | team | Solo / team with the same access / team needing different access | solo |
| F31 | rewards_regulars | Points, gift cards, store credit | from prior |

**Unknown policy is the safety rule Codex was missing a mechanism for.** "Include if unknown" is for things whose absence causes tickets and is cheap to have (returns, tax setup, supplier terms). "Leave out" is for heavy workflows that clutter navigation (production, multi-location, tables). Every unknown that affected the result is listed on the review screen.

---

## 3. Workflows (bundles) — what facts switch on

A workflow is a complete job the owner does. Turning one on brings every module needed to do that job properly. No more "you have purchases but not purchase returns".

| Workflow | Turned on by | Modules (bundle) | Navigation |
|---|---|---|---|
| **Selling at a counter** | F10 | pos, cash_register, park_recall, sales_returns*, payments | "Sell" — returns, drawer and held bills inside |
| **Billing clients** | F11 | invoicing, customers, payments, sales_returns* (credit notes) | "Invoices" |
| **Orders for later** | F12 | sales_orders, + pre_sales if F18 | inside "Sales" |
| **Stock** | F5 or F6 | products, inventory, stock_takes | "Stock" — counts inside |
| **Purchasing** | F7 | purchases, suppliers, purchase_orders, purchase_returns, payments | **one "Purchasing" area**; record purchase first, orders and returns/debit notes as tabs. POs are included but never forced as a step. |
| **Imports** | F9 | landed_cost | inside Purchasing |
| **Making** | F3 | cookbook (+ production_runs when making in batches) | "Production" |
| **Restaurant service** | F13 / F14 | table_service (FOH tabs: tables / takeaway / delivery as confirmed) | "Front of house" |
| **Jobs & appointments** | F23 / F24 | services (+ job tracking / bookings where live) | "Jobs" |
| **Customer credit** | F17 | customers, khata_credit (shown as "Customer balances"), payments | inside "Customers" |
| **Supplier credit** | F8 | supplier balances (part of Purchasing) | inside Purchasing |
| **Tax** | F21 | tax_compliance, receipt tax mode (added / included) | Settings + reports |
| **Books** | F22 | accounting_workspace, bank_accounts, bank_reconciliation (+ fixed_assets / loans offered) | "Accounts" |
| **Locations** | F28 | multi_location, + stock_transfers if F29 | inside "Stock" |
| **Team** | F30 ≠ solo | staff roles; staff_attendance only if asked | Settings |
| **Specialisations** | F27 each | variants / serials / batches_expiry / units_of_measure / barcodes_labels | **fields inside Stock forms**, not menu items |
| **Trade selling** | F25 / F26 | pricing_tiers, b2b_proposals | inside "Sales" |
| **Regular billing** | F19 | recurring_invoices offered, not automated by default | inside "Invoices" |
| **Retention** | F31 | loyalty_gift | "Customers" |

*sales_returns only when F1 (goods). Always on: payments, expenses, reports, AI Advisor. Gifts (online store, QR menu) are offered according to F1 and F10/F13.

**Rule:** bundles live in an onboarding policy file. They never change global `requires`, so existing stores are not affected. After the bundle, technical dependency closure runs. A module that isn't live or isn't entitled is **reported as a gap, never silently dropped**.

**Navigation is half the anti-bloat answer.** A complete Purchasing bundle is 4 modules but **one menu item**. Specialisations are fields, not pages. The owner gets every capability while the sidebar stays short. "More modules" and "less clutter" stop being in conflict.

---

## 4. Choosing the next question (the Akinator part)

Each fact has a **belief** (0–1) from the type prior, sentence cues and answers. Each workflow has a **miss cost** and a **clutter cost**:

| Miss cost 3 (must not miss) | Miss cost 2 | Miss cost 1 |
|---|---|---|
| Counter selling, Billing, Stock, Purchasing, Customer credit, Tax, Restaurant service, Making, Returns | Orders for later, Supplier credit, Specialisations, Locations, Team, Trade selling, Jobs | Imports, Books, Regular billing, Retention |

Clutter cost: 1 for an extra menu area, 0.3 for an in-area tab or field.

**Value of a question** (Codex's formula, made computable):

```
expected_loss(state) = Σ workflows  min( P(needed) × miss_cost ,  (1 − P(needed)) × clutter_cost )
value(q) = [ expected_loss(now) − Σ_answers P(answer) × expected_loss(after answer) ] / effort(q)
effort = 1 for single choice, 1.3 for multi-select, +0.3 if it needs thinking (numbers, money)
```

**Ask the highest value. Stop when:**
1. the best value < **0.25** (nothing worth the visitor's time), **and**
2. every miss-cost-3 workflow is confirmed, ruled out, or covered by its unknown policy, **and**
3. no fact is `conflicting`.

The hard cap is **10**. Questions 9 and 10 need a recorded reason (which unresolved workflow they decide). Codex is right that a count is never proof of readiness, so the coverage condition (2) is what actually ends discovery.

**Fallback ordering when beliefs are thin** (AI down, unknown business): resolve contradictions → core activity (F1/F2/F3) → stock and buying → how sales happen → money owed → specialisations → people → retention. Stable tie-break by question id, and the same policy in the AI and non-AI paths.

**Belief numbers are internal.** They are versioned expert estimates labelled *uncalibrated* until §9 calibrates them, and are never shown to users as percentages.

---

## 5. The question bank (final wording)

Rules:
- ≤ 15 words per question; every option ≤ 10 words with a grey example under it.
- No software words and no local slang.
- Multi-select says "Pick everything that happens in your business".
- Every question has **Not sure** (fact stays unknown) and **Skip**.
- Options pre-ticked when belief ≥ 0.85: one tap to confirm. Pre-ticks are shown as "we guessed this — change it if wrong".
- Each answer shows a live line: *"Adds: Purchasing (with orders and returns)"*.

| ID | Question | Options (→ facts) |
|---|---|---|
| **Q1** | What do customers pay you for? | Products I sell (F1) · Things I make or cook (F3) · My time, skill or service (F2) · Fixing or working on their item (F2, F23) · Renting items out (F4) |
| **Q2** | How does a sale usually happen? | They pay at a counter and leave (F10) · I send them a bill or invoice (F11) · They order now, I deliver or finish later (F12) · They sit down and are served (F13) |
| **Q3** | Which of these do you keep and count? | Products I sell (F5) · Parts or materials I use for jobs (F6) · Ingredients or raw materials (F5, F3) · Nothing — I don't keep stock (F5=F6=no; cuts the stock branch) |
| **Q4** | Where does your stock come from? | I buy it from suppliers (F7) · …and pay them later (F8) · Some is imported (F9) · Another branch or head office sends it (F7=no) · I make it myself (F3) |
| **Q5** | What must you tell apart when you sell items? | Sizes, colours or styles · A serial or IMEI number on each · Batches or expiry dates · Boxes vs single pieces, or weight · Barcodes or price labels · Just how many I have (all no) |
| **Q6** | Which of these happen with payments? | Some customers pay days or weeks later (F17) · Some pay a deposit first (F18) · Some pay the same amount every month (F19) · Customers return things for refund or exchange (F20) · Everyone pays in full at once |
| **Q7** | Do you charge sales tax, VAT or GST? | Yes, added on top of my prices · Yes, already inside my prices · No (F21 + receipt mode) |
| **Q8** | Who will use VenQore? | Only me · A few people doing the same work · A team where people need different access (F30) |
| **Q9** | Where do you keep or count stock? | One place · More than one shop or store room, counted separately (F28) · …and I move stock between them (F29) |
| **Q10** | How do you organise your work? *(services)* | Done on the spot · Booked appointments (F24) · Jobs that take days to finish (F23) · Ongoing work for regular clients (F19?) |
| **Q11** | How do you serve customers? *(food)* | At tables · Takeaway · Delivery (F13, F14) |
| **Q12** | Do some customers get different prices? | Yes — trade, wholesale, staff or VIP (F25) · Customers ask for a quote first (F26) · No |
| **Q13** | Who looks after your accounts? | I do, simply · An accountant or bookkeeper (F22) · Nobody yet, I'd like it done properly (F22 likely) |
| **Q14** | Where else do customers order? | My own online shop (F15) · Amazon, Daraz or similar (F16) · Phone, WhatsApp or messages (F12) · Only in person |
| **Q15** | Do you want to reward customers who come back? | Points or rewards · Gift cards or store credit · Not now (F31) |

**The "Is this you?" read-back (always last, never counted as a question).** A short paragraph built from the confirmed facts, with each fact as a tappable chip:

> You **sell groceries** at **one shop**, **buy stock from suppliers** and **pay them later**, sell **at the counter**, let **some customers pay later**, and **prices include tax**. You work **with 3 people**.
> *We left out: expiry tracking (you said you don't need it), branches, restaurant service.*
> *Not sure yet: rewards for regulars — tap to decide.*

Tapping a chip flips the fact and recomputes everything. This catches a wrong answer at almost no cost, and it is the moment the owner feels understood: "this is my business".

---

## 6. Contradictions and revisions (from Codex, kept whole)

- An explicit answer beats a prior. Two conflicting answers → one short clarifying question.
- "No batches" removes batches only, never purchasing, stock or returns.
- "One place" removes locations regardless of item count.
- "Head office supplies us" means stock without purchasing. Ask about paying for it only if it matters.
- "Only services" does not rule out materials. Only "Nothing — I don't keep stock" does.
- "Monthly bills" sets a cadence, not automatic billing.
- Any change recomputes from facts. Nothing stale is left over from earlier answers.
- A dependency of a confirmed workflow is never removed; if asked to, explain the conflict.

---

## 7. Every entry route runs through the same engine

| Entry | Today | v3 |
|---|---|---|
| Free sentence | AI picks questions from the capability list | AI extracts facts; engine picks questions |
| One-click business type | **zero questions**, full preset (and presets missing `core` fall back to everything) | Type = prior. A **Quick fit** of the 2–3 highest-value questions (~20 seconds), skippable. Every preset gets a reviewed minimal core |
| Pricing / solutions page preset | same as above | same as above |
| Manual "I'll answer myself" | separate written-question config | same engine, same bank, just no AI phrasing |
| Builder inside the product (re-run later) | separate | same engine, pre-filled with the store's current facts |

**Test:** the same facts through any route must produce the same workflows.

---

## 8. Discovery continues after signup — the safety net

No 10 questions will be perfect for every business. The cost the founder named (tickets, bad reviews, "they don't have it") comes from an owner **not finding** a capability, not from the builder leaving it off. So we make anything that's off still **findable**:

1. **Search finds switched-off modules.** Search for "purchase return", "expiry" or "GST" and the result says: *"Purchase returns — not switched on yet. Switch on (free)."* One tap, no settings hunt.
2. **Vena answers "where is X / can I do X"** with the same one-tap switch-on instead of "we don't have that". It already has the knowledge index, so this only needs a module-state lookup.
3. **Behaviour nudges in the first 30 days**, each shown at most once:
   - Product names with "mg", "tablet" or dates → *"Track expiry dates?"*
   - The same supplier paid in parts → *"Track what you owe suppliers?"*
   - Same product name with sizes → *"Use sizes and colours?"*
   - A second person invited → *"Give them different access?"*
   - Refunds done as negative sales → *"Use proper returns?"*
4. **"Ghost" menu entries for must-not-miss workflows that were left out.** These are faint, at the bottom: "+ Purchasing", "+ Returns". They are shown only for miss-cost-3 workflows, and hidden once dismissed.

This turns "the builder must be perfect" into "the builder must be good, and the product finishes the job". That is achievable.

---

## 9. Learning from real stores (calibration)

Record from day one: the facts and answers at signup, and per module **switched on by hand**, **switched off**, **never opened (30 days)**, plus **search / Vena "where is" hits** for switched-off modules.

| Signal | Means | Proposed fix |
|---|---|---|
| Switched on by hand ≤ 14 days, or found via search/Vena | **Miss** | Raise the prior or change the unknown policy for that fact and type |
| Switched off ≤ 7 days | **Wrong guess** | Lower the prior; inspect which answer pushed it |
| Never opened in 30 days | **Possible bloat** (not proof, per Codex) | Review only if also a menu-level area |

A monthly `vq:builder:calibrate` report proposes prior edits per type. A human approves them, and they are versioned. **Targets: misses < 5% of stores, menu-level bloat < 10%, median questions ≤ 6, completion ≥ 85%.**

---

## 10. Proving it before the campaign goes live

1. **Scenario suite (CI) = Codex's 12 edge scenarios + 30 personas.** Each persona has expert truth (must / nice / never) and scripted answers. It runs three ways: all answered, all skipped, random half skipped. It also runs through every entry route. Gates:
   - zero must-have misses on any path
   - zero "never" workflows on
   - ≤ 2 nice-to-have extras when fully answered
   - question count inside the persona's range
   - identical results across routes
   - every revision scenario recomputes cleanly
2. **Every live module classified:** baseline · bundle member · conditional specialisation · optional enhancement · not offered by the builder. A test fails if a new module is added without a classification.
3. **Builder Playground** (Platform HQ, admin only). Type any business, see the facts, beliefs, the question it would ask and *why*, and the final setup with a reason per module. Lets you or support explain any result, and tune priors without a deploy.
4. **Real owners, before launch.** Ten shop owners (grocery, pharmacy, mobile, clothing, café, hardware, wholesaler, salon, repair, tutor), using a phone, unaided.
   - Measure: do they understand every question first time (note every hesitation), how long it takes, and whether the read-back is "yes, that's me".
   - Fix wording until every question passes 9 of 10 owners.
   - Do the same in Urdu for the extraction side.
5. **Verify bundles really work** under permissions: purchase → partial return → debit note → supplier balance; sale → refund → tax on receipt. A bundle we promise must work end to end.

---

## 11. Known gaps in today's code that this replaces (from both audits)

- `stock=deep` mixes item volume with locations. *(Codex)*
- Buying, orders and returns are separate optional choices. *(Codex, and the founder's report)*
- The question ranker is impact plus relevance, not uncertainty reduction. Readiness can read high with little evidence. *(Codex)*
- Presets without `core` fall back to every module. *(Codex + Sept audit)*
- Round 1 is forced to at least 3 questions. The deep round can find nothing to ask and jump to the end. *(today's bug)*
- One-click business types get zero questions. *(v3)*
- Switched-off modules are invisible to search and to Vena. *(v3)*

---

## 12. Build order (when approved)

1. **Fact catalogue + workflow bundles + unknown policies + priors** as one versioned config. Classify every live module. *(foundation)*
2. **Engine** (pure PHP: extract → update → value → next → stop → resolve), with the **scenario suite in the same change**.
3. **Wire every entry route**, give every preset a minimal core, add Quick fit for one-click types. The AI is limited to extraction and phrasing.
4. **Builder screens:** pre-ticks, "Adds:" line, honest checkpoint, read-back with editable fact chips, gap reporting.
5. **Navigation grouping:** Purchasing, Sell, Stock and Customers as parent areas with tabs.
6. **Safety net:** search and Vena switch-on, first-30-day nudges, ghost entries.
7. **Calibration events + monthly report + Builder Playground.**
8. **Owner testing round** → wording fixes → campaign launch.

Steps 1–4 and 8 are the launch gate. Steps 5–7 can follow within weeks, **but the step-7 usage events must be recording from the first signup**, or the data needed to improve is lost.

---

## 13. Decisions for you

1. **Unknown policies (§2):** agree that returns, tax setup and supplier terms are *include-if-unknown*?
2. **Purchase orders inside Purchasing by default** (Codex and v3 agree), never as a forced first step. OK?
3. **One-click types get a 2–3 question Quick fit:** OK, or keep zero questions?
4. **Safety net (§8):** OK to show faint "+ Purchasing / + Returns" ghost entries for must-not-miss workflows that were left out?
5. **Owner testing:** can you line up ~10 owners in Okara/Lahore for a 15-minute test each?
