# VenQore — Reckoner Contract & Guided Onboarding

**Build specification. Hand this to the IDE.**

Stack: Laravel 12 · React 18 · Inertia.js · multi-tenant
Companion artefact: `extras/VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html` — open it, go to the
**Export** tab, and copy the seven JSON blocks. They are the machine-readable source for
everything below. Do not retype any list from this document that the Export tab already emits.

---

## 0. The numbers, fixed

| Thing | Count |
|---|---|
| Modules | 46 |
| Business types | 85 |
| Presets | 20 |
| **Dashboard cards, total** | **349** |
| — of which the Qore (no module required) | 32 |
| — of which module-owned | 317 |
| Qore engines | 13 |
| Reckoner streams | 16 |
| Invariants | 16 |
| Cards available to the thinnest business type | 80 |
| Cards available to the richest | 142 |
| Default dashboard | 12, computed per business and per preset |

> Earlier working notes said "370". The real figure is **349**. Every registry count,
> test assertion and coverage probe in this spec uses 349. If a count anywhere in the
> codebase says otherwise, that is the bug.

---

## 1. Why cards are blank in production right now

Before building anything, fix the diagnosis. A blank card today can mean any of nine
different things, and the UI cannot tell them apart. That indistinguishability *is* the
bug — not the missing number.

Work this list in order. Each is a real, separately-testable failure.

1. **Card registered in the frontend, no resolver in the backend.** The API returns nothing
   for that key, the component renders `undefined`, and you get a blank tile. There is
   currently no test that the two registries match.
2. **`SUM()` over zero rows returns `NULL`, not `0`.** Every aggregate resolver must
   `COALESCE`. A new tenant, or a tenant with no rows in the selected period, hits this on
   almost every money card.
3. **Division by zero in gauge cards.** `margin = profit / revenue` with zero revenue gives
   `NaN` or `Infinity`. `NaN` formats to blank.
4. **The owning module is off, and the resolver short-circuits silently.** Correct behaviour,
   invisible outcome. The card must say *"Needs the Inventory module"*, not go blank.
5. **Tenant scope missing on the query.** A global scope that is not applied on a raw
   aggregate returns either cross-tenant data or nothing. Audit every raw builder.
6. **The period parameter is dropped, or the stat and its trend use different boundaries.**
   Classic symptom: the headline says one thing, the chart under it says another.
7. **Batch endpoint partial failure swallowed.** If the dashboard fetches N cards in one
   request and one resolver throws, a bare `try/catch` around the whole loop drops the rest.
   Each card must fail independently.
8. **Cache key missing tenant or period.** Serves a stale or foreign empty result.
9. **Seeded / demo tenants have master records but no ledger postings.** Every
   ledger-derived card is then legitimately zero — but renders as blank, so it reads as broken.

**The structural fix is Section 3: no resolver may ever return a bare value.**
Once every reading carries a `status`, all nine become legible instead of identical.

---

## 2. The Reckoner model — 16 streams, not 349 queries

### 2.1 The principle

The brief asked for "all 349 values available at all times". Taken literally — materialise
each card independently — that is 349 resolvers per tenant per refresh, each its own chance
to be wrong, and a recompute cost that grows with the catalogue.

**The cards are not independent.** They are **16 data streams** projected into **6 shapes**
(`stat`, `trend`, `breakdown`, `list`, `gauge`, `status`). Get a stream right and every card
reading it is right. Get one wrong and you know exactly which cards to distrust.

That is the design. It delivers the same promise — any card, any period, instantly — at a
fraction of the surface area, and it makes correctness testable, because there are 16 things
to prove rather than 349.

### 2.2 The streams

| Key | Name | What it holds |
|---|---|---|
| `ledger.journal` | Journal postings | Every debit and credit the accounting engine writes |
| `ledger.accounts` | Account balances | Running balance per chart-of-accounts node, per period |
| `sales.headers` | Sale documents | One row per sale / invoice / counter ticket |
| `sales.lines` | Sale lines | Product, qty, price, **cost at time of sale**, discount, tax |
| `purchase.headers` | Purchase documents | One row per supplier bill |
| `purchase.lines` | Purchase lines | Item, qty, cost, landed additions, tax |
| `stock.movements` | Stock movements | Every in, out, transfer, adjustment, write-off, with valuation |
| `stock.positions` | Stock positions | Qty and value per item per location per batch, plus reorder points |
| `party.balances` | Party balances | Receivable / payable per customer and supplier, with age |
| `payment.entries` | Payments | Every receipt and payout with method, instrument, allocation |
| `expense.entries` | Expenses | Category, payment method, paid / unpaid state |
| `tax.entries` | Tax entries | Output and input tax per document, per rate band |
| `production.entries` | Production | Runs, consumption, output, yield, wastage |
| `attendance.entries` | Attendance | Shifts, hours, presence, per-staff sale attribution |
| `doc.status` | Document states | Open / fulfilled / overdue / expired counts |
| `master.registry` | Master records | Counts and completeness of products, parties, accounts, staff |

`cardStreams` in the Export tab maps every one of the 349 card keys to its streams.
Load it into the registry; do not hand-maintain it.

### 2.3 Storage — three tiers

**Tier A — `reckoner_daily`. The history table. This is what makes the period selector instant.**

```
reckoner_daily
  tenant_id     bigint        indexed
  d             date          indexed          -- one row per day
  measure       varchar(48)   indexed          -- ~58 base measures, see 2.4
  dim           varchar(64)   nullable         -- optional single dimension, capped cardinality
  v             decimal(20,4)
  PRIMARY KEY (tenant_id, d, measure, dim)
  PARTITION BY RANGE (d)                       -- monthly partitions
```

One row per tenant per day per measure. ~58 measures × 365 days ≈ **21,000 rows per tenant
per year**. At 10,000 tenants that is ~210M rows in a partitioned table — comfortable, and
it is the honest number. Do not let anyone write a row per card.

- Written by a **queued rollup job**, debounced per tenant per day, dispatched on transaction
  commit (sale, purchase, payment, expense, stock movement, production run, attendance).
- A **nightly repair job** recomputes the last 7 days from source for every active tenant and
  overwrites. This is the self-healing path: a dropped queue job costs at most one night.
- A **backfill command** `reckoner:backfill {tenant} {--from} {--to}` recomputes any range.
  Run it once over the last 365 days for every existing tenant as part of this release.
- `dim` is for the small set of dimensioned measures worth keeping daily
  (`revenue` by location, by channel, by payment method; `expenses` by category). Cap
  cardinality at 50 per measure per tenant; everything beyond falls to Tier C.

**Tier B — live read-through.** Point-in-time cards (stock positions, open documents, cash in
drawer, tables occupied) are not historical. Indexed aggregate, cached 60–300s per
tenant+period key. Never precompute these into Tier A.

**Tier C — on-demand.** Breakdowns and ranked lists with open cardinality (top customers,
spend by supplier, stock value by category). Computed on request, cached 60s. A list card
that truncates **must** set `rows.truncated = true`; see invariant `list_total_matches_stat`.

### 2.4 Base measures

The rollup job computes these, not cards. Exact list lives in code as
`App\Reckoner\Measures` and is asserted against the card registry by test.

```
revenue  cogs  gross_profit  expenses  net_profit  service_revenue  labour_cost
tax_out  tax_in  cash_in  cash_out  bank_balance  cash_balance  liquidity
receivables  payables  khata_out  khata_in  khata_collected
stock_value  stock_units  dead_stock_value  expiring_value  transfer_in_transit
sale_count  sale_units  discount_given  returns_value  returns_count
purchase_value  purchase_count  purchase_returns_value  landed_cost_added
new_customers  active_customers  dormant_customers  new_suppliers
production_cost  production_output  production_waste
attendance_hours  attendance_present
open_orders_value  open_orders_count  open_po_value  open_po_count
unpaid_invoice_value  overdue_invoice_value  quote_value  quote_won_value
recurring_value  covers  table_turns  till_variance
journal_count  txn_count  asset_depreciation  loan_outstanding
loan_interest  unreconciled_value  loyalty_points_issued  loyalty_points_redeemed
```

A card declares which measure(s) it reads and which shape it applies. `Revenue`,
`Revenue Trend` and `Revenue vs Last Period` are **one measure, three shapes** — which is
exactly why they can never disagree once this is in place.

---

## 3. The reading envelope — the fix for blank cards

Every resolver returns this. No exceptions, no bare numbers, no nulls, no empty responses.

```ts
type Reading = {
  status:    'ok' | 'empty' | 'locked' | 'stale' | 'error'
  value:     number | null
  unit:      'currency' | 'count' | 'percent' | 'days' | 'ratio'
  precision: number
  delta:     { value: number; pct: number; basis: string } | null
  series:    { t: string; v: number }[] | null        // trend cards
  segments:  { key: string; label: string; v: number }[] | null  // breakdown cards
  rows:      { truncated: boolean; items: unknown[] } | null     // list cards
  period:    { from: string; to: string; grain: 'day'|'week'|'month' }
  asOf:      string                                   // ISO timestamp
  sources:   string[]                                 // stream keys
  checks:    { invariant: string; passed: boolean }[]
}
```

### Status semantics — this is the whole point

| Status | Means | UI must show |
|---|---|---|
| `ok` | Resolver ran, data found | The number |
| `empty` | Resolver ran, **no rows in this period**. A new tenant, not a fault | `—` with *"No data in this period yet"* |
| `locked` | The owning module is off | Lock icon + *"Needs the {module} module"* + enable link |
| `stale` | `asOf` older than the freshness threshold | The number, dimmed, with *"as of {time}"* |
| `error` | Resolver threw | Amber tile + *"Couldn't calculate this"* + logged with card key and tenant |

`empty` and `error` are **different**, and today they look identical. A tenant with no sales
this week should see *"No data in this period yet"*, not a blank box that reads as a broken
product. Ship this before anything else — it converts an unknown number of silent failures
into a visible, countable list.

### Rules

- `value` is `null` **if and only if** `status !== 'ok'`.
- `unit` and `precision` are declared per card in the registry, never inferred from the value.
  Wrong units are the second most common "wrong number" report.
- `period` is echoed back exactly as used. The UI renders the window it was given, so a
  mismatch between requested and returned period is visible rather than silent.
- `sources` makes a wrong number traceable in one step: which stream fed this.
- `checks` carries the invariant results asserted on this reading (Section 5).

---

## 4. The registry and its gates

### 4.1 Single source of truth

```
App\Reckoner\CardRegistry     — 349 entries, seeded from the exported `cards` block
App\Reckoner\Resolvers\*      — one class per card key
App\Reckoner\Measures         — the ~58 base measures
App\Reckoner\Streams          — the 16 streams
```

The registry entry carries: `key`, `title`, `shape`, `module` (null for Qore), `measures[]`,
`streams[]`, `unit`, `precision`, `period_aware`, `weight`, `topic`, `insight`.

### 4.2 Gates — these fail the build

| Gate | Assertion |
|---|---|
| `registry_complete` | Every one of the 349 catalogue keys has a resolver class. Count is exactly 349. |
| `no_orphan_resolver` | Every resolver class maps to a catalogue key. |
| `module_cards_match` | Each module's card list matches the catalogue exactly; every module has ≥ 5 cards. |
| `qore_cards_universal` | All 32 Qore cards resolve for a tenant with **zero** modules enabled. |
| `envelope_shape` | Every resolver returns a complete `Reading`. Static analysis plus runtime assertion. |
| `empty_tenant` | Against a fixture tenant with no data: every card returns `status: 'empty'` or `'ok'`. **Zero `error`.** |
| `full_tenant` | Against a fully seeded fixture tenant: every card returns `status: 'ok'`. |
| `locked_module` | With a module disabled, its cards return `'locked'` — never `'empty'`, never a throw. |
| `no_silent_null` | No resolver returns `null`, `undefined`, `NaN` or `Infinity` as `value` while `status === 'ok'`. |
| `units_declared` | Every card declares `unit` and `precision`; neither is derived at runtime. |
| `tenant_scoped` | Every resolver query carries a tenant predicate. Assert by query log inspection in test. |

`empty_tenant` and `full_tenant` are the two that would have caught the current production
problem. Build them first; they will produce a list of exactly which cards are broken.

### 4.3 Production probe

Scheduled command `reckoner:probe`:

- Runs nightly over a rolling sample of tenants (all tenants weekly).
- Resolves every registered card for that tenant across 7d / 30d / 90d.
- Records status counts and any failed invariant to `reckoner_probe_results`.
- Alerts when a tenant has any `error`, or when `empty` exceeds a threshold on a module
  the tenant actively uses (a signal of a broken write path, not an idle tenant).
- Platform-owner screen shows: cards by status, per tenant, per module. This is the
  dashboard that tells you the dashboards are right.

---

## 5. Invariants — how the Reckoner proves itself

The ledger is trustworthy because debits must equal credits; it can prove itself wrong.
The Reckoner needs the same property or every number is just a hopeful query.

Three kinds. All 16 are in the exported `reckoner.invariants` block.

### Tied to the books (`ledger`)

| Key | Rule |
|---|---|
| `balanced_books` | Debits = credits for the tenant, any period. **Failing this blocks the dashboard and raises.** |
| `accounting_equation` | Assets = Liabilities + Equity |
| `revenue_ties_to_ledger` | Revenue from `sales.headers` = credit movement on revenue accounts, same period |
| `cogs_ties_to_ledger` | COGS from `sales.lines` = debit movement on COGS accounts, same period |
| `receivables_control` | Receivables = Σ positive customer balances = AR control account |
| `payables_control` | Payables = Σ positive supplier balances = AP control account |
| `stock_value_control` | Stock value from `stock.positions` = inventory control account |
| `tax_control` | Tax collected − tax paid = net tax liability account |

`revenue_ties_to_ledger` and `cogs_ties_to_ledger` are the two most valuable. The single
most common cause of a wrong revenue or margin card is the sales table and the ledger
drifting apart — a sale posted without a cost layer, or a ledger entry written outside the
sale service.

### Card against card (`internal`)

| Key | Rule |
|---|---|
| `gross_profit_identity` | Gross Profit = Revenue − COGS |
| `net_profit_identity` | Net Profit = Gross Profit − Total Expenses |
| `liquidity_identity` | Total Liquidity = cash in hand + Σ bank balances. Also proves *Balance in Each Account* sums to the headline. |

Pure arithmetic. Never allowed to drift, and cheap to assert on every read in non-production.

### Structural (`shape`) — cheap, generic, catches the most

| Key | Rule |
|---|---|
| `breakdown_sums_to_parent` | Any breakdown card's segments sum to the stat it splits, within rounding tolerance |
| `aging_sums_to_total` | Every aging breakdown's buckets sum to its headline |
| `trend_endpoint_matches_stat` | The last point of a trend series = the stat for the same period end |
| `list_total_matches_stat` | A complete ranked list's rows sum to the stat they rank; a truncated list must declare `truncated` |
| `no_silent_null` | No registered card returns null, undefined or a bare zero without a status |

These four shape rules apply automatically to **every card of that shape** — no per-card
work. `trend_endpoint_matches_stat` alone catches the entire class of "headline says one
thing, chart says another", which is almost always a date-boundary mismatch.

### Enforcement levels

- **CI:** all 16, against both fixture tenants. Any failure fails the build.
- **Local / staging:** assert on every read, attach results to `Reading.checks`.
- **Production:** sample-assert (1 in N reads) plus the nightly probe. Never block a user's
  dashboard on an invariant except `balanced_books`.

---

## 6. Guided onboarding

### 6.1 The principle

**The AI decides what to show. The owner decides what to take.**

This is the change that removes the ambiguity between what the owner wants and what a model
guessed. Nobody has to trust a classification of their business — they tick what they
recognise, in their own language, and see the cart before anything is provisioned.

### 6.2 The flow

```
1  Owner describes the business in their own words (free text, voice-friendly).
2  Match to one of the 85 business types. Show the match, allow correction.
   → this decides only WHAT IS OFFERED, never what is enabled.
3  Provision the 4 always-on modules silently: customers, payments, expenses, reports.
   No business runs without them, so asking is wasted attention.
4  Remove every module this trade can never use (Section 6.3). These are ABSENT —
   not greyed, not behind "advanced". Never shown, never explained, never a decision.
5  Ask 5 rounds. Each round: ~6–8 modules, heading + one plain line each, tick boxes.
   Modules the matched preset expects arrive PRE-TICKED. The owner can untick any.
6  Review screen: the full cart, grouped by module group, with card counts.
7  Provision. Apply the lexicon. Seed the dashboard with the computed top 12.
```

Offered per business ranges **29–38** modules across the five rounds. The Export tab's
`onboarding` block gives the exact rounds, pre-tick state and sector probability per business.

### 6.3 Eligibility rules

Three mechanisms per module, in `App\Onboarding\ModuleEligibility`:

| Field | Meaning | Effect in the UI |
|---|---|---|
| `needs[]` | Every listed module must also be on | Shown, greyed, with *"needs Inventory"* until satisfied |
| `needsAny[]` | At least one of the listed modules must be on | Same |
| `only[]` | Allow-list of sectors and/or business keys. Empty = everyone | Outside the list → **never offered** |
| `never[]` | Deny-list of sectors and/or business keys | On the list → **never offered** |
| `why` | One plain line | Shown in the never-offer explanation, and in support tooling |

**`needs` gates. `only` / `never` hide.** That distinction matters: a prerequisite is a
sequence problem the owner can solve by ticking the prerequisite; an ineligibility is not a
decision at all.

18 of the 46 modules carry a hard rule. Examples:

- `table_service` — only the food sector, and never for food trucks, dark kitchens or
  caterers. *Floor plans and kitchen tickets only exist where there is a floor.*
- `serials` — only 17 business types that sell individually identifiable high-value units.
- `batches_expiry` — only trades whose goods spoil or that regulation makes traceable.
- `cookbook` — only food and manufacturing. A recipe or BOM only exists where you turn
  inputs into something else.
- `landed_cost` — only importers and wholesale distributors.
- `pos` — never for the seven pure professional practices. *A law firm never rings up a
  walk-in counter sale.*
- `loyalty_gift` — only consumer-facing trades. Points do not work on trade buyers.

**Build-time assertion:** no preset may enable a module its businesses are forbidden. This
test already caught three real conflicts (bakeries and sweet shops do take orders ahead;
commercial bakeries do track batches) and the rules were corrected, not the presets. Keep
the test — it is the guard against the rule set and the preset set drifting.

### 6.4 The round planner

```
pool    = all 46 modules
        − modules forbidden for this business type
        − the 4 always-on modules
sort by : (is in matched preset) desc,
          (share of businesses in this sector that run it) desc,
          module id asc
chunk   : ceil(pool.length / 5) into 5 rounds
```

Round 1 is therefore the highest-confidence set and is almost entirely pre-ticked; round 5 is
the long tail and almost entirely unticked. Probability comes from the exported
`probability` map (`"{sector}|{module}" → percent`).

The planner is deterministic. Compute it server-side at onboarding start, store the plan
against the onboarding session so a resumed flow shows identical rounds.

### 6.5 The cart

- Client-side state, POSTed once at the review step. Never provision per-tick.
- Ticking a module with an unmet `needs` auto-ticks the prerequisite and says so inline
  (*"Also turning on Products — Inventory needs it"*). Unticking a prerequisite warns and
  unticks its dependants.
- The review screen shows: modules chosen, grouped; total cards unlocked; the 12 that will
  be on the dashboard. Seeing "you will get 118 cards, here are the 12 we'll start you with"
  is the moment the product feels built for them.

---

## 7. The lexicon — making it read like their own software

### 7.1 Shape

```
lexicon = { ...LEXICON_SECTOR[business.sector], ...LEXICON_BUSINESS[business.key] }
```

16 concepts: `customer, supplier, product, service, invoice, sale, sales_order, quotation,
stock, category, staff, location, recurring, production_run, recipe, unit`.

Five sector baselines, 40 business-level override sets. Resolved maps for all 85 business
types are in the Export tab's `lexicon` block.

Examples of what this buys:

| Business | Says instead |
|---|---|
| Pharmacy | Customer → **Patient**, Product → **Medicine**, Supplier → **Distributor** |
| Auto repair | Sales Order → **Job Card**, Product → **Spare Part** |
| Gym | Customer → **Member**, Recurring → **Membership** |
| Tuition centre | Customer → **Student**, Recurring → **Fee Plan**, Staff → **Teacher** |
| Wholesale | Customer → **Party**, Location → **Godown**, Invoice → **Bill** |
| Restaurant | Customer → **Guest**, Product → **Menu Item**, Stock → **Ingredients** |
| Jewellery | Product → **Piece**, Unit → **Weight (tola / gram)** |
| Manufacturing | Product → **Finished Good**, Recipe → **BOM**, Sales Order → **Work Order** |

### 7.2 Where it is applied — and where it is not

**Apply at render time only.**

- Ship the resolved map to the client once, on the Inertia shared props.
- One hook: `const t = useLexicon(); t('customer')` → `"Patient"`.
- Provide `t.plural('customer')` and `t.title('customer')`; do not let components build
  plurals by appending `s`. *Parchi → Parchiyan*, not *Parchis*.
- Card titles, table headers, form labels, nav items, empty states, validation messages.

**Never:**

- Do not rename database columns, model attributes, API fields, route names, permission
  keys, or card keys. The system vocabulary stays fixed; only the surface changes.
- Do not bake the lexicon into the 349 card titles in the registry. The registry title is
  canonical; the lexicon transforms it on the way out. Otherwise the card catalogue forks
  85 ways and every future change is 85 edits.
- Do not apply it to exported accounting documents where a statutory term is required.

### 7.3 Tenant override

Store the resolved map on the tenant at provisioning, editable in Settings. An owner who
calls customers something else again should be able to say so once. The stored map is a
*diff* against the business-type default, so a later platform change to the defaults still
reaches them.

---

## 8. The card picker

The filter categories in the "Add a card" screen are **the modules the tenant has enabled**,
plus the Qore. Not an invented taxonomy, not domains — the same modules they chose during
onboarding, in the same words, in module-id order.

```
Filters shown:
  🔒 The Qore — always on            (32 cards)
  #1 Products                        (10 cards)
  #5 POS / Counter                   (11 cards)
  ...                                 one per enabled module, in id order
```

Rules:

- Only cards whose owning module is enabled appear. A tenant never sees a card they cannot
  use — no locked teasers in the picker. (`locked` status exists for a card already *on* a
  dashboard whose module was later switched off, not for discovery.)
- Search across card title and the owner-facing `insight` line, not just the title.
- Show the shape badge (`stat` / `trend` / `breakdown` / `list` / `gauge` / `status`) and the
  one-line insight on every picker row. That line is what makes 118 options navigable.
- Sort within a module by `weight` descending — the most useful card first.
- Mark the 12 already on the dashboard.

---

## 9. Acceptance criteria

Ship in this order. Each block is independently verifiable.

**Phase 1 — Make the failure visible** *(do this first; it is small and it tells you the size of the real problem)*
- [ ] `Reading` envelope implemented; every resolver returns it
- [ ] UI renders all five statuses distinctly; no blank tiles remain possible
- [ ] `registry_complete` and `no_orphan_resolver` gates pass at exactly 349
- [ ] `empty_tenant` and `full_tenant` gates run and produce a list of failing cards
- [ ] Output of that list reviewed — it is the actual backlog

**Phase 2 — Make it correct**
- [ ] All 349 resolvers return `ok` against the full fixture tenant
- [ ] All 349 return `ok` or `empty` against the empty fixture tenant, zero `error`
- [ ] All 32 Qore cards resolve for a tenant with zero modules
- [ ] 16 invariants implemented; all pass in CI on both fixtures
- [ ] `balanced_books` wired to block and raise

**Phase 3 — Make it fast, with history**
- [ ] `reckoner_daily` created, partitioned monthly
- [ ] ~58 measures implemented in the rollup job
- [ ] Rollup dispatched on transaction commit, debounced per tenant per day
- [ ] Nightly 7-day repair job scheduled
- [ ] `reckoner:backfill` run over 365 days for every existing tenant
- [ ] Period switch (7d / 30d / 90d / 1y) on any trend card returns in < 300 ms warm

**Phase 4 — Onboarding**
- [ ] Eligibility rules loaded; preset-vs-eligibility conflict test passes
- [ ] Round planner deterministic and stored against the onboarding session
- [ ] 5-round UI with pre-ticks, prerequisite auto-tick, and the never-offer set absent
- [ ] Review screen shows modules, total cards, and the 12 to be seeded
- [ ] Provisioning seeds the computed top 12 for the chosen module set

**Phase 5 — Lexicon and picker**
- [ ] Lexicon on shared props; `t()` hook with plural and title forms
- [ ] Applied across card titles, table headers, form labels, nav, empty states
- [ ] Zero lexicon terms written into the database schema or the card registry
- [ ] Card picker filters by enabled module, with shape badge, insight line and weight sort

**Phase 6 — Keep it honest**
- [ ] `reckoner:probe` scheduled nightly
- [ ] `reckoner_probe_results` table and platform-owner status screen
- [ ] Alerting on any `error`, and on `empty` above threshold for an active module

---

## 10. Where I would push back on the brief

Recorded so the decisions are deliberate, not accidental.

1. **"370 cards" is 349.** 32 Qore + 317 module. Fixed everywhere in this spec.
2. **"All values available at all times" should not mean per-card materialisation.**
   16 streams and ~58 measures give the same guarantee with a twentieth of the surface and,
   more importantly, a testable one. Implemented as Section 2.
3. **A full year of daily history for every card is unnecessary and expensive.**
   A year of history for every *measure* is cheap (~21k rows/tenant/year) and delivers the
   same user-visible behaviour, because trend cards are projections of measures. Point-in-time
   cards — stock positions, open documents, cash in drawer — have no meaningful history at
   daily grain and should not be rolled up at all.
4. **Fix the status envelope before adding any capability.** The current problem is not
   that numbers are missing; it is that five different conditions all render identically.
   Phase 1 is a few days of work and converts an unknown into a countable backlog. Do not
   let it be sequenced after the rollup table.
5. **Do not let the lexicon touch the schema.** It is tempting to rename the column to
   `patient_id` for a pharmacy tenant. That forks the data model 85 ways and every future
   migration multiplies. Render-time only, always.

---

## 11. Source data

All of it comes from the **Export** tab of
`extras/VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html`:

| Block | Contents |
|---|---|
| `cards` | 349 cards — key, shape, owning module, period-awareness, weight, owner-facing line |
| `modules` | 46 modules — cards unlocked, businesses, `needs`, `needsAny`, `alwaysOn`, `neverOfferTo`, `why` |
| `businesses` | 85 types — sector, preset, modules, ordered `default12`, cards available |
| `presets` | 20 presets — modules and ordered `default12` |
| `onboarding` | Per business — always-on set, never-offer set with reasons, the 5 rounds with pre-tick and probability |
| `lexicon` | Per business — resolved 16-concept term map |
| `reckoner` | Streams, envelope, invariants, and every card's stream dependencies |

The page derives ranking, the top 12, the rounds and the lexicon merge in the browser from
the same weights and rules the backend will use, so the export can never drift from what the
page shows. If the backend disagrees with the export, the backend is wrong.
