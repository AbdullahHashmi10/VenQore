# VenQore — Reckoner Coverage & Query Composition Mandate

**Companion to:** `VENQORE_AI_CONSOLIDATION_MANDATE.md`
**Target agent:** IDE coding agent with full repo access
**Repo root:** `app-code/main-app`

**The governing rule for this entire document:**

> **VenQore never displays, offers, or answers with a number it did not compute through the Reckoner.**
> Not in a card. Not in a picker. Not in an AI answer. Not as a placeholder.

Everything below follows from that one sentence.

---

## 0. Why this file exists

Two problems, one root cause.

1. The V6 dashboard offers **108 readings**; `ReckonerRegistry` implements **25**; only **17** overlap. Ninety-one of the readings a user can pick do not compute.
2. OmniSearch / "Ask AI" cannot answer any question that is not one of its 8 hardcoded tools — *"which customer buys the most sugar from us?"* has no path at all.

Both are the same problem: **the calculation layer is enumerated as a flat list of fixed answers instead of a small set of parameterised readings.** Fix the modelling and both problems shrink dramatically.

---

## 1. Findings

### F-A — OmniSearch bypasses the Reckoner entirely ⚠ **most serious**

`AiController::executeFunction()` (`:514`) implements its 8 tools with its own Eloquent queries:

```php
Product::where(...)->first();
Sale::whereHas('items', fn ($q) => $q->where('product_id', $prod->id))->sum(...);
```

It never calls `Reckoner`. So the AI assistant computes revenue, profit, stock and party balances through **a second, untested code path**.

This directly violates the product's stated core principle — *one central, heavily-tested calculation engine that all modules route through, so no feature can introduce inconsistent numbers*. Today the assistant can state a revenue figure that disagrees with the dashboard's revenue figure, and both will look authoritative. In an accounting product, that is the worst failure mode there is, and it is worse than showing nothing.

The 8 tools are: `get_sales_summary`, `get_profit_summary`, `get_expense_summary`, `get_purchase_summary`, `get_party_balance`, `get_stock_level`, `get_top_products`, `analyze_cash_discrepancy`.

**Every one must be re-implemented as a Reckoner call.** This is not optional and it is not a Phase 3 nicety.

### F-B — The parameter channel already exists and is unused

`ReckonerRequest` already carries `args`:

```php
public function __construct(
    public string $key,
    public string $period = 'today',
    public ?array $custom = null,
    public ?string $granularity = null,
    public array $args = [],
)
```

`Reckoner`'s own docblock lists gate 6 as *"Validate + resolve — period legal, **args whitelisted**, cache lookup, source dispatch, envelope"*, and `cacheKey()` already includes `$request->args`, so parameterised results cache correctly per argument set.

**But `ReckonerRegistry` declares no argument schema on any reading** (`grep` for `dimensions` / `filters` / `args` in the registry returns 0). The channel is built, gated and cache-keyed — and nothing has ever declared what may travel down it.

This is the single highest-leverage fact in this document. **The query engine does not need to be built. It needs to be declared.**

### F-C — The 91 missing readings are not 91 calculations

Grouping the missing keys by entity shows most are the same query with a status filter:

| Family | Missing keys | Collapses to |
|---|---|---|
| `serial_tracking.*` | `total_serials, in_stock, sold, returned` | `serial_tracking.count(status)` — **4 → 1** |
| `reminders.*` | `total_scheduled, pending, sent, overdue` | `reminders.count(status)` — **4 → 1** |
| `recurring_invoices.*` | `total, active, paused, monthly_revenue` | `.count(status)` + `.revenue` — **4 → 2** |
| `batch_tracking.*` | `total_batches, expiring_soon, expired, total_qty` | `.count(status)` + `.qty` — **4 → 2** |
| `proposals.*` | `total_proposals, accepted, pending` | `proposals.count(status)` — **3 → 1** |
| `bank_reconciliation.*` | `total_txns, matched, unmatched` | `.txn_count(status)` — **3 → 1** |
| `returns.*` | `total_returns, items_returned, total_refunded` | `returns.{count,qty,value}` — **3 → 3** |
| `purchase_orders.*` | `pending, received` | `.count(status)` — **2 → 1** |
| `sales_orders.*` | `confirmed, pending` | `.count(status)` — **2 → 1** |
| `pre_sales.*` | `total_quotes, pending` | `.count(status)` — **2 → 1** |
| **Subtotal** | **31 keys** | **14 readings** |

The same collapse applies beyond the status families — `bank_accounts.{money_in_today, money_out_today}` is one reading with a direction argument; `party.{customer_count, supplier_count}` is one with a type argument; `accounting.{income_ytd, expense_ytd}` is one with an account-class argument.

**Realistic target: 91 flat keys → roughly 40–45 genuine calculations.** Still real work, but less than half of what the flat count implies, and the dimensioned versions answer far more questions than the 91 fixed keys ever could.

---

## 2. Part A — The truth gate (do this first, it is one afternoon)

Before any new reading is written, make it **impossible** to offer a number that does not compute.

1. **Filter the V6 catalog at source.** `NewDashboard.jsx:50` `READINGS` is a hardcoded array of 108. Replace it with a server-provided list built from `ReckonerRegistry::all()`, intersected with the acting user's permissions. Ship V6 offering **17 real readings** rather than 108 of which 91 are decorative.
2. **Generate, do not hand-maintain.** The V6 catalog must be emitted from the registry (an Inertia prop or a generated JSON asset), so the two can never drift again. A hand-kept second copy is what produced this gap.
3. **Add a CI guard.** A test that fails if any reading key referenced by the frontend is absent from `ReckonerRegistry::exists()`.
4. **Keep the 91 as a roadmap, not as UI.** Move them to `config/reckoner_backlog.php` — a build queue, not a picker.
5. **Never render a placeholder number.** No sample data, no zeroes, no dashes styled to look like data, in any surface a user can reach. If it does not compute, it does not appear.

`NewDashboard.jsx`'s sample `rowNames` / `sliceNames` (*"Basmati 5kg"*, *"Rana Traders"*) are correct for a design-verification harness and must not survive into a tenant-facing build. Gate them behind a demo flag.

---

## 3. Part B — Declare dimensions on readings

Extend each registry definition with an explicit, whitelisted argument schema. Nothing not declared here may ever be passed.

```php
'sales.revenue' => [
    // ... existing definition ...
    'dimensions' => [
        'group_by' => ['enum' => ['none','customer','product','category','channel',
                                  'payment_method','warehouse','staff'],
                       'default' => 'none'],
        'metric'   => ['enum' => ['value','qty','count'], 'default' => 'value'],
        'limit'    => ['int' => [1, 50], 'default' => 10],
    ],
    'filters' => [
        'product'   => ['type' => 'entity', 'model' => Product::class],
        'customer'  => ['type' => 'entity', 'model' => Party::class],
        'category'  => ['type' => 'entity', 'model' => Category::class],
        'warehouse' => ['type' => 'entity', 'model' => Warehouse::class],
    ],
],
```

Rules:

- **Entity filters take IDs, never free text.** The caller resolves *"sugar"* → `product_id` with the existing `FuzzyMatchService` / `ProductSearchIndexService` **before** the Reckoner is called. The Reckoner never receives a user string.
- **`Reckoner` rejects any undeclared arg** — the gate 6 whitelist its docblock already promises. Make that assertion real and test it.
- **`group_by` changes the result shape** from `SCALAR` to `RANKING`. Declare the shape mapping so V6 picks the right card category and `resolveFit()` still places it legally.
- **Permissions are per reading, and adding a dimension never widens them.** Grouping revenue by staff member does not grant `staff.*` permissions.
- Cache keys already include args (F-B), so no cache work is needed.

**One dimensioned reading replaces dozens of flat ones.** `sales.revenue` with `group_by` × `filter` × `period` covers *revenue by customer*, *by product*, *by channel*, *for one product*, *for one customer*, *last month*, *this quarter* — thousands of questions, one tested calculation, one set of permissions.

---

## 4. Part C — Coverage build order

Build in this order; each step unlocks more questions than the last.

| Step | Work | Unlocks |
|---|---|---|
| **C1** | Add `dimensions` + `filters` to the **existing 25** readings | The largest single jump in answerable questions, with zero new calculations and zero new risk |
| **C2** | The 14 collapsed status-count readings from F-C | 31 of the 91 V6 keys |
| **C3** | The remaining `inventory` (14) and `purchasing` (7) gaps | The two largest un-dimensioned areas |
| **C4** | `finance` (7), `staff` / `staff_attendance` (7), `party` (4) | — |
| **C5** | Everything else, ranked by the `ai_reading_requests` miss log | Demand-ordered, not guessed |

Do **C1 before C2**. Dimensions on 25 tested readings are worth more than 14 new untested ones, and they cost less.

---

## 5. Part D — Composed questions

*"Which customer is buying the most sugar from us?"*

### D.1 What it is

With Part B done, that question is **one call**, not a new feature:

```php
new ReckonerRequest(
    key: 'sales.revenue',
    period: 'this_year',
    args: ['group_by' => 'customer', 'metric' => 'qty', 'limit' => 5,
           'filter' => ['product_id' => '…resolved from "sugar"…']],
);
```

Most questions that feel open-ended are a single dimensioned reading. Build Part B and the majority of *"can it answer…"* becomes yes without any new machinery.

### D.2 Genuinely multi-step questions

*"Why did my profit fall even though revenue went up?"* needs several readings compared. Handle it with an explicit plan, not a bigger prompt:

```json
{ "steps": [
    {"key":"sales.revenue",           "period":"last_month","compare":"prev"},
    {"key":"finance.cogs",            "period":"last_month","compare":"prev"},
    {"key":"finance.expenses_by_category","period":"last_month","args":{"group_by":"category"}},
    {"key":"sales.discount_given",    "period":"last_month","compare":"prev"}
  ],
  "intent": "explain_profit_variance" }
```

- The model produces **only the plan** — reading keys and declared args, validated exactly like the dashboard patch in Appendix A of the companion file.
- `Reckoner::resolve()` already batches multiple requests in one call, grouped per source. Execution is one round trip.
- The model then **narrates the returned envelopes**.

### D.3 The hard rule

> **The model may plan, and may explain. It may never calculate.**
>
> Every number, percentage, delta, ratio and ranking in an answer must arrive from a `ReckonerResult`. If the answer says *"profit fell 12% because COGS rose 18%"*, both figures were computed in PHP and handed to the model as facts. The model's only job is the word *"because"*.

Enforce it mechanically: extract every numeric token from the drafted answer and assert each appears in the Reckoner envelopes for that request. Reject the answer and retry once if not. This is cheap, deterministic, and it is what makes an LLM safe to point at financial data.

### D.4 When there is genuinely no reading

Do **not** generate SQL. Ever. Not for a read-only replica, not with a linter, not behind a sandbox. Three reasons, in order:

1. **Tenant isolation.** Every scoped query depends on the `HasTenant` global scope. Generated SQL does not inherit it. A single omitted `tenant_id` is a cross-tenant financial data leak — the exact class of bug already found and fixed once in this codebase.
2. **It destroys the moat.** A figure from ad-hoc SQL can disagree with the same figure from the Reckoner. See F-A for what that already costs today.
3. Unbounded cost and latency, and a trivial DoS surface.

Correct behaviour when nothing fits: say so plainly, offer the nearest reading, and **log it to `ai_reading_requests`** (tenant, raw question, closest match, timestamp). That log is what orders step C5 — the roadmap, written by users.

---

## 6. Part E — Free or paid

The pricing boundary should fall exactly where the **cost** boundary falls, because then it needs no policing:

| Tier | What | Marginal cost | Price |
|---|---|---|---|
| **Deterministic answer** — matched intent → one reading, no model | *"sales today"*, *"who owes me money"*, *"low stock"* | **$0** | **Free, unlimited** |
| **Single dimensioned reading** — model maps question → key + args | *"which customer buys the most sugar"* | ~$0.0002 | **Free, fair-use capped** (e.g. 50/month) |
| **Composed / multi-step** — model plans, Reckoner executes, model narrates | *"why did profit fall"* | ~$0.002 | **Paid AI add-on** |

Rationale:

- The free tiers are the hook. They cost nothing, they demonstrate that the assistant actually knows the business, and they make the paid tier obvious.
- Tier 3 is where real value and real cost both live, and it is genuinely hard to replicate — it needs the Reckoner underneath it, which competitors do not have.
- This maps 1:1 onto the resolver ladder in the companion file, so **no separate metering logic is required**: `AiResult::$source` already says which tier answered. Meter on `source`, not on feature.

---

## 6a. Part F — Making the Reckoner a beast

The goal: hundreds of readings, every one true. The obstacle is not writing readings — a new key in a `Source` is cheap. The obstacle is **proving** each one, and proving them the current way does not scale.

### F.1 What you have (the starting point is strong)

| | |
|---|---|
| `ReckonerSource` interface | `supports()` + `resolveBatch()` — batching is structural, not bolted on |
| 12 sources | 1,433 LOC total. Small, focused, one domain each |
| Tests | 2,509 LOC across 13 files |
| `ReckonerGateTest` | asserts a gated metric executes **zero** database queries, with a query-count spy |
| `not_applicable` ≠ `0` | `production.total_cost` on a store with no runs must not silently read 0 |
| Sign-aware labels | Net Profit / Net Loss swap, and unsigned metrics never swap |
| `ReckonerSettings` | per-tenant metric behaviour (e.g. `overstock_mode`) |
| `finance.balance_sheet_ok` | an invariant already modelled as a reading |

The `not_applicable` distinction in particular is a mature instinct — most metric layers get that wrong forever. Build on it.

### F.2 The problem: per-reading tests scale linearly

`ReckonerConsistencyTest` asserts things like *"low_stock excludes out_of_stock"* and *"expenses_total excludes cogs"*. These are correct and necessary — and each one covers exactly one reading. At 45 readings × dimensions, that is several hundred hand-written assertions, each a fresh chance to be silently wrong, and each new reading arrives untested by everything that came before.

**A metrics engine becomes a beast when correctness is enforced by laws that hold *between* readings, tested automatically over generated data.** One law covers every reading that has ever existed and every reading you will add. That is the sub-linear scaling that lets reading count grow without risk growing with it.

### F.3 The eight laws

Each is **one test class** that iterates `ReckonerRegistry::all()`. Adding a reading adds zero test code and is immediately covered by all eight.

| # | Law | Statement | Catches |
|---|---|---|---|
| **L1** | **Tenant isolation** | Every reading returns an identical result whether or not a second tenant's data exists in the database. | Cross-tenant bleed — the bug class already found once in this codebase. **Highest value; build first.** |
| **L2** | **Grouping conservation** | For any reading with a `group_by` dimension, `Σ(grouped rows) == ungrouped total`, within rounding. | The entire dimension surface from Part B, automatically. Add a `group_by` → it is tested. |
| **L3** | **Period additivity** | For any reading declared `additive`, `Σ(Jan…Dec) == year`, and `Σ(days) == month`. | Boundary bugs, timezone drift, off-by-one windows, double-counted edges. |
| **L4** | **Comparison symmetry** | `resolve(key, period, compare: prev).comparison_value == resolve(key, prev_window).value`. | Comparison windows computed differently from primary windows. |
| **L5** | **Empty-tenant law** | On a tenant with no data, every reading returns `0` **or** `not_applicable` — never null, error, NaN, `-0`, or a division-by-zero. | The new-signup experience, which is every user's first impression. |
| **L6** | **Permission law** | Every reading refuses when the actor lacks any one of its declared `permissions`, and executes **zero queries** when it refuses. | Extends the existing `ReckonerGateTest` spy to all readings. Also closes the V6 permissions gap and the F5 bypass class. |
| **L7** | **Reversal law** | Posting a transaction then reversing it returns every affected reading to its prior value, exactly. | The deepest class of accounting bug. Ties directly to the double-entry engine and the "never hard-delete a posted purchase" rule. |
| **L8** | **Registry contract** | Every reading declares complete metadata (`unit`, `precision`, `direction`, `signed`, `permissions`, `source`, `method`, `periods`), its `source` class actually `supports()` its key, and its `method` exists. | Silent drift — the same failure mode as the dead `config/ai_models.php` and the 108-vs-25 gap. |

**Build L1 first.** Given the cross-tenant history, it is the one whose failure is unrecoverable.

### F.4 Derive, don't recompute — turn invariants into guarantees

Some relations should not be *tested*; they should be **impossible to violate**. Any reading that is arithmetic over other readings must declare itself as derived rather than carrying its own query:

```php
'finance.gross_profit' => [
    'derived' => ['sales.revenue', 'finance.cogs'],
    'compute' => fn (array $r) => $r['sales.revenue'] - $r['finance.cogs'],
    // no 'source', no 'method'
],
'sales.net_margin_pct' => [
    'derived' => ['finance.net_profit', 'sales.revenue'],
    'compute' => fn (array $r) => $r['sales.revenue'] > 0
        ? ($r['finance.net_profit'] / $r['sales.revenue']) * 100
        : null,           // null ⇒ not_applicable, never 0, never ÷0
],
```

Then gross profit **cannot** disagree with revenue minus COGS — not because a test checks it, but because there is only one number. `Reckoner::resolve()` already batches, so dependencies resolve in the same round trip at no extra query cost.

Candidates to convert immediately: `gross_profit`, `net_profit`, `net_margin_pct`, `gross_margin_pct`, `expense_ratio`, `quick_ratio`, `dso`, `dpo`, `inventory.turnover`, `days_of_cover`, `sell_through`, `cash_runway`, `attendance_rate`, `sales_per_head`, `on_time_rate`, `supplier_concentration`, `retention_rate`, `return_rate`.

That is **18 of the readings in the V6 catalog that need no query at all** — they are algebra over readings you already have. Declaring them derived closes a meaningful slice of the 91-reading gap with no new SQL and no possibility of inconsistency.

### F.5 The golden company

`GoldenCompanySeeder` and `GoldenAuditSeeder` already exist. Make them the correctness anchor:

- One seeded tenant, a full year of transactions, with **every** reading's expected value hand-computed once and recorded in a fixture file.
- Every reading asserted against its hand-verified figure at every supported period.
- The fixture is reviewed by a human when it changes. **A changed golden number is a code review event, not a test update.** If a refactor moves a figure, someone states in writing why the old one was wrong.

This is what makes "financial correctness is our moat" a claim you can defend rather than assert.

### F.6 Adding a reading, after all this

The payoff. To add a reading:

1. Add the key to the source's `supports()` and a branch in `resolveBatch()` — or declare it `derived` and write no query at all.
2. Add the registry definition with full metadata and any `dimensions` / `filters`.
3. Add its golden-company expected value.

**Zero new test code.** L1–L8 cover it on the next run: it is tenant-isolated, permission-gated, additive where declared, conserving under grouping, correct on an empty tenant, reversal-safe and contract-complete — or CI fails.

*That* is the beast: not a large engine, but a small one where being wrong is caught mechanically. 45 readings and 450 cost roughly the same per reading.

### F.7 Performance, so scale does not become slowness

- **`resolveBatch()` is the contract — honour it.** A source receiving 7 requests must issue ~1 query, not 7. Add a query-count assertion per source, reusing the existing spy from `ReckonerGateTest`.
- **Cache keys already include args**, so dimensioned results cache correctly. Set `cache_ttl` per reading by volatility: live feeds 0–15s, daily aggregates 300s, month/year rollups 3600s.
- **Never let a dashboard N+1 the Reckoner.** One page render = one `Reckoner::resolve()` call with all card requests batched.
- **Cap `group_by` cardinality** — `limit` declared in `dimensions`, enforced in SQL, never in PHP after the fact.
- **Pre-aggregate only when measured.** If a reading is genuinely slow at real data volume, add a nightly rollup table behind the same reading key — the key is the interface, so callers never change.

---

## 7. Sequencing

| When | Work |
|---|---|
| **Immediately** (½ day) | Part A — truth gate. Generate the V6 catalog from the registry, add the CI guard, remove sample data from tenant-facing builds. |
| **With Phase 1 of the companion mandate** | F-A — re-point all 8 `AiController` tools at the Reckoner. This is a correctness fix, not an enhancement. |
| **Next** (C1) | Dimensions + filters on the existing 25 readings. Biggest return in the document. |
| **Then** (C2–C4) | The collapsed reading families, ~40–45 calculations total. |
| **With Phase 3** | Query plans (D.2), the numeric-provenance assertion (D.3), tier metering (Part E). |
| **Ongoing** | `ai_reading_requests` orders everything after C4. |

---

## 8. Acceptance

- [ ] No reading key reachable from the UI is absent from `ReckonerRegistry::exists()` — enforced in CI
- [ ] No sample or placeholder data renders in any tenant-facing build
- [ ] `AiController::executeFunction()` contains **zero** direct Eloquent aggregation; all 8 tools route through `Reckoner`
- [ ] The same question asked of the dashboard and of the assistant returns an identical figure — assert it in a test for revenue, profit, receivables and stock value
- [ ] `Reckoner` rejects any argument not declared in the reading's `dimensions` / `filters`, with a test proving it
- [ ] A `group_by` result declares the correct shape and places legally under Layout Law
- [ ] Every number in a composed AI answer is traceable to a `ReckonerResult` — asserted, not assumed
- [ ] Entity filters accept resolved IDs only; no user string reaches the Reckoner
- [ ] No code path anywhere constructs SQL from model output
