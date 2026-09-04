# THE QORE MANDATE

**VenQore Unified Calculation Core + Financial Bible v4**
Status: Blueprint & Audit · Supersedes: ad-hoc "Single Source of Truth" doctrine
Audience: implementing engineer / coding agent

---

## 0. Verdict

Two questions were asked. They get opposite answers.

**"Should everything be unified behind one gate in and one gate out?"**
Yes. Unreservedly. This is not the same idea I pushed back on earlier, and the distinction matters: a mega-*file* fuses unrelated logic into one blast radius; a mega-*membrane* leaves the logic exactly where it is and removes every way of reaching it except one door. Your chip analogy is the correct one — a CPU package has one pin-out and specialised cores inside. Nobody solders a wire onto the GPU die.

**"Is calculator.php / the Financial Bible correct?"**
Partly, and less than it appears. It is more careful than most files of its kind — it already survived one audit round and carries a self-check that closed a prior finding. But it is **structurally incapable** of catching the class of error you are most exposed to. Six of its nine transaction types replay journal entries you hand-wrote into `spec.yaml` rather than deriving them. Ten of your seventeen engines are outside its reach entirely. And the tax path your POS actually runs in production — inclusive pricing — has zero coverage in it.

**The single most important instruction in this document:** fix the oracle *before* you build Qore. Refactoring 238 controllers behind a ruler you cannot trust is how a codebase ends up computing wrong numbers with total architectural confidence. Ruler first. Always.

---

# PART I — WHAT THE CODE ACTUALLY SAYS

Every number below was measured against the repo, not estimated.

## 1.1 The shape you have

| Layer | Files | Lines |
|---|---|---|
| `app/Engines/` | 17 | 5,664 |
| `app/Reckoner/` (+ Sources) | 24 | 5,465 |
| `app/Http/Controllers/` | 238 | — |

The engines are not the problem. They are reasonably factored, single-purpose, and mostly well-behaved. `FinanceSource` even injects `FinancialReportingService` rather than reimplementing P&L, so the read side is genuinely less duplicated than it looks from the outside.

## 1.2 The problem is the membrane, and it is leaking in about thirty places

| Measurement | Value |
|---|---|
| Files referencing `journal_items` | **52** |
| …of which are HTTP controllers | **21** |
| Controllers that consult the Reckoner | **9 of 238** (3.8%) |
| Controllers running raw money SQL (`selectRaw` / `DB::raw`) | **28** |
| Non-engine code writing journal rows | **2** — `DataImportService:743,769`, `MigrateV3Ledger:307,399,417` |
| Live audit: routes rendering all-zero financials | **60 of 261** |
| Live audit: routes throwing | **18** |
| Live audit: routes actually mismatching the ledger | **0** |

Read that last row carefully, because it is the good news and the bad news in one line. **Nothing in your app currently contradicts the ledger.** What 60 routes do instead is *not ask it*.

A doctrine that says "only `AccountingService` may touch the ledger" while twenty-one controllers touch it is not an architecture. It is an aspiration with a nice diagram. That is the real answer to your question — you were right that things are scattered, but the scattering is not among the engines. It is in the request-path files that reach around them.

## 1.3 Money has twenty different shapes

Distinct money precisions across migrations:

| Precision | Columns |
|---|---|
| `decimal(20,4)` | 214 |
| `decimal(15,2)` | 84 |
| `decimal(10,2)` | 63 |
| `decimal(5,2)` | 24 |
| `decimal(12,2)` | 17 |
| 15 further shapes down to `decimal(6,3)` | 61 |

A value computed at four decimals and written into a two-decimal column is rounded by MySQL silently — no error, no warning, no log line. Every boundary between two precisions is a place where money can quietly change value in transit. This is not hypothetical; with 214 columns on one side of the boundary and 84 on the other, it is a certainty somewhere in the system.

---

# PART II — QORE

## 2.1 What Qore is, in one paragraph

Qore is **one package with two ports and no side doors.** Every state change in VenQore — a POS sale, a purchase bill, a payment, an AI Builder action, a WooCommerce webhook, a CSV import, an admin correction — enters through `Qore::do()`. Every number the product displays — a dashboard tile, a report row, a Growth Brain reading, an AI Copilot answer — leaves through `Qore::ask()`. Between the port and the work sit **gates**, which are the only place where tenancy, permission, plan limits, money typing, idempotency, invariants and audit are enforced. Behind the gates sit the **cores** — your existing engines, mathematics untouched, but no longer reachable by anything except Qore.

Nothing about the engines' internals changes in phase one. What changes is that they stop being public.

## 2.2 The chip, made literal

| Your analogy | Qore component | Job |
|---|---|---|
| Package pin-out | `Qore.php` | Two public methods. That is the entire external surface. |
| Bus controller / MMU | `Qore/Gates/` | Address translation and protection — nothing reaches a core unvalidated, untenanted, unlogged |
| Word format / ALU | `Qore/Money/` | One money type, one rounding policy, fixed for the whole chip |
| CPU / GPU / NPU dies | `Qore/Cores/` | Specialised, isolated, no direct pin access |
| Instruction set | `Qore/Registry/` | Command → handler, metric → source |
| ECC | `InvariantGate` | Catches corruption *before* commit, not in a nightly reconciliation job |

## 2.3 Directory

```
app/Qore/
  Qore.php                  ← the only public class in the package
  Contracts/
    Command.php             ← marker: a write
    Query.php               ← marker: a read
    Receipt.php             ← what a write returns (ids, postings, invariant proof)
    Answer.php              ← what a read returns (value, unit, period, provenance)
  Money/
    Money.php               ← integer minor units. No float crosses this boundary.
    Rounding.php            ← ONE policy, named and versioned
  Gates/
    IdentityGate.php        ← who is acting: user, AI agent, system job, webhook
    TenantGate.php          ← pins tenant; nothing runs tenant-less
    PermissionGate.php      ← RBAC
    CapabilityGate.php      ← plan limits, module enablement
    ContractGate.php        ← typed DTO in; arrays are rejected
    MoneyGate.php           ← every money field is a Money object or the call dies
    IdempotencyGate.php     ← replay protection by key
    TransactionGate.php     ← opens and commits the DB transaction
    InvariantGate.php       ← POST-condition proofs (§2.5)
    AuditGate.php           ← immutable record of command + receipt
    CacheGate.php           ← read side only; keyed tenant + period + metric
  Cores/
    Ledger/                 ← AccountingService
    Party/                  ← PartyService
    Inventory/              ← FifoService, InventoryService, UomService
    Trade/                  ← SaleService, PurchaseService, PaymentService, SaleReversalService
    Tax/                    ← TaxService
    Production/             ← ManufacturingService
    Ops/                    ← ServiceEngine, SettlementService, OccupancyEngine
    Insight/                ← Reckoner + Sources + FinancialReportingService
    Growth/                 ← GrowthEngine + ProfitBrain, CashflowBrain, InventoryBrain, CustomerBrain
    Intelligence/           ← AiGateway, AI Builder, SmartCapture
  Registry/
    CommandMap.php
    MetricMap.php           ← ReckonerRegistry, promoted
```

## 2.4 The two ports

```php
final class Qore
{
    /** Every state change in the product. */
    public static function do(Command $command): Receipt;

    /** Every number the product displays. */
    public static function ask(Query $query): Answer;
}
```

Two rules follow, and they are the whole design:

> **Write rule.** No code outside `app/Qore/Cores/Ledger/` may reference `journal_items`, `JournalItem` or `JournalEntry`. Ever. Not in a controller, not in a console command, not in a migration helper, not in an import service.

> **Read rule.** No code outside `app/Qore/Cores/` may compute a financial figure. Every number is `Qore::ask()`, and a metric that does not exist in `MetricMap` is added there, never inlined at the call site.

## 2.5 The gate that does not exist today

`InvariantGate` is the piece with no current equivalent, and it is the one that will earn its keep fastest. It runs as a **post-condition inside the transaction**, before commit. If any assertion fails, the whole command rolls back and is logged as a defect rather than persisted as corruption.

| Invariant | Assertion |
|---|---|
| Balance | Σ debits = Σ credits, **exactly** (integer, no tolerance) |
| Accounting equation | Assets = Liabilities + Equity, exactly |
| Party control | Σ party balances = AR + AP control account balances |
| Inventory control | Inventory GL balance = Σ (remaining_qty × unit_cost) across all FIFO layers |
| COGS | Σ COGS postings = Σ consumed layer costs |
| Tax | Output tax payable = Σ line taxes on sales in period |
| Reversal | Reversing entry `X` returns every touched balance to its pre-`X` value |
| Idempotency | Replaying a command with the same key changes nothing |

Today these are checked, when they are checked at all, by console commands run after the fact — `AuditFinancialIntegrity`, `LedgerTruthAuditCommand`, `ReconcileInventoryGl`, `RecalculateAccountBalances`. The existence of a `RecalculateAccountBalances` command is itself the diagnosis: balances are expected to drift, so a repair tool was built. With `InvariantGate`, drift cannot be committed in the first place, and that command becomes a migration tool rather than a maintenance one.

## 2.6 Enforcement — the part that makes this real

Every previous "single source of truth" doctrine in this codebase failed for the same reason: it was a *convention*. Fifty-two files referencing `journal_items` is what conventions produce. Qore only works if the leak is **mechanically impossible to add**.

Ship these four tests with the very first commit, before any migration work:

```php
// tests/Architecture/QoreMembraneTest.php

test('ledger tables are untouchable outside the Ledger core')
    ->expect(['journal_items', 'JournalItem::', 'JournalEntry::'])
    ->not->toBeUsedIn(allFilesExcept('app/Qore/Cores/Ledger'));

test('controllers may only depend on Qore')
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Qore\Cores');

test('money never appears as float in a command contract')
    ->expect('App\Qore\Contracts')
    ->not->toUseTypes(['float']);

test('every metric a view renders exists in MetricMap')
    ->expect(renderedMetricKeys())
    ->toBeRegisteredIn(MetricMap::class);
```

Plus one line in CI, which costs nothing and catches everything the static analyser misses:

```bash
! grep -rn "journal_items" app/ --include=*.php \
    | grep -v "^app/Qore/Cores/Ledger/" \
    || { echo "QORE VIOLATION: ledger accessed outside the Ledger core"; exit 1; }
```

Add violations to an explicit allow-list file as you migrate, and delete entries from it as each is fixed. The list only ever shrinks. When it hits zero, delete the file and the membrane is sealed.

## 2.7 Migration — strangler fig, never big bang

With 238 controllers, a rewrite-then-switch takes months and lands on top of a launch. Do this instead:

**Phase 0 — Freeze the ruler.** Fix the oracle (Part III). Nothing else starts until `php calculator.php --check` is trustworthy.

**Phase 1 — Qore as pass-through.** Build `Qore.php`, the contracts, and the registry. `Qore::do()` does nothing but forward to the existing engine. Zero gates, zero behaviour change. Golden verify must produce **byte-identical** output. Ship it.

**Phase 2 — Gates, one at a time.** Add each gate behind a feature flag, in this order: `TenantGate` → `ContractGate` → `IdempotencyGate` → `AuditGate` → `PermissionGate` → `CapabilityGate` → `InvariantGate`. After each, run golden verify. Identical numbers, or revert.

**Phase 3 — Controllers in waves.** Highest-value money paths first: POS sale → purchase bill → payment → expense → reports → dashboards → imports → admin. Each wave: swap the call, golden verify, ship. Remove the corresponding entries from the CI allow-list as you go.

**Phase 4 — Seal.** Allow-list empty, architecture tests on, build fails on any new leak.

**Phase 5 — Money migration.** Float → integer minor units, on its own, last, with a full before/after diff of every account balance signed off by a human. See §2.8.

**The rule that makes all of this safe:** at every step, golden verify must return the same numbers as the step before. If a number moves, you have either found a real bug (log it, celebrate, then fix it deliberately) or introduced one (revert immediately). There is no third possibility, and no step where "close enough" is acceptable.

## 2.8 One warning about money

Converting float → integer minor units **will change some totals by 0.01**. That is the point — the old value was wrong — but it means this change can never be smuggled inside a refactor, because it breaks the "numbers must not move" rule that keeps every other phase safe.

Do it alone. Do it last. Produce a diff of every account balance before and after. Sign each difference off as expected. Ship it as its own release with its own rollback plan.

---

# PART III — FINANCIAL BIBLE AUDIT

Findings against `verification/golden_company/calculator.php`, `spec.yaml`, and the live engines.

## Credit where it is due

Before the findings: this file is better than its reputation in your own head. `deriveSaleTotals()` (L427) derives sale totals from raw inputs and cross-checks them against the declared spec values, throwing on any mismatch above 0.005. Its docblock explicitly closes a prior audit finding — *"F-C1 (calculator transcribes instead of deriving)"* — and calls out a real production bug it refuses to reproduce (*"the POS-003 fabrication bug; see audit FC-3"*). Someone did careful work here. The findings below are about what that work did not reach, not about carelessness.

## Section A — Does the ruler measure anything?

### A-1 · CRITICAL · Six of nine transaction types are transcribed, not derived

`runCalculations()` posts `$txn['journal']` verbatim for:

| Type | Line |
|---|---|
| `opening_balance` | 517 |
| `purchase` | 522 |
| `customer_payment` | 633 |
| `supplier_payment` | 646 |
| `expense` | 659 |
| `bank_transfer` | 671 |

Only `sale` and `sale_return` derive. For the six above, the oracle is not an independent witness — it replays the journal you hand-wrote into `spec.yaml`.

Why this matters more than it sounds: the oracle can still catch an **implementation** bug (the app disagrees with the spec). It is structurally blind to a **doctrine** bug — where the spec itself encodes the wrong accounting, the app matches it, and the audit reports green. Since you wrote both the spec and the app from the same understanding, doctrine bugs are precisely the errors most likely to be present and least likely to be caught. The F-C1 fix was applied to sales only; it needs to reach all nine.

### A-2 · CRITICAL · The production tax-inclusive path has zero coverage

`app/Engines/TaxService.php:56` runs a full inclusive branch:

```php
$net = round($amount / (1 + ($taxRate / 100)), 2);
$tax = round($amount - $net, 2);
```

The oracle's entire tax implementation is `calculateTax()` at L411:

```php
return round($amount * $taxRate / 100, 2);
```

Exclusive only. Every tax-inclusive sale in production is unverified — and for Pakistani retail POS, inclusive pricing is the common case, not the edge case. This is not thin coverage. It is none.

### A-3 · HIGH · Float equality in the tax gap correction

`app/Engines/TaxService.php:60`:

```php
if (($net + $tax) !== round($amount, 2)) {
    $tax = round($amount, 2) - $net;
}
```

Strict `!==` on floats. In PHP, `0.1 + 0.2 !== 0.3` evaluates to `true`. This correction fires when it should not and fails to fire when it should, unpredictably by amount. Fix immediately as `abs($net + $tax - round($amount, 2)) > 0.001`, and properly with integer minor units.

### A-4 · HIGH · FIFO layer selection is declared, not derived

`spec.yaml` supplies `fifo_batches_consumed` per sale, with `batch_id`, `qty_taken` and `unit_cost` already filled in (L307, L346, L467). `FifoEngine::deduct()` (L326) takes `$orderedBatchIds` as a parameter rather than sorting layers itself.

So the oracle verifies the *arithmetic* of a consumption you computed by hand, and never verifies the *ordering doctrine* at all: tie-breaks between same-date receipts, layer restoration on returns, a backdated receipt inserted before existing consumption. The oracle must build its own layer stack from the purchase transactions and sort it itself. That is the whole job of a FIFO witness.

### A-5 · HIGH · Two different balance tolerances

| System | Location | Rejects above |
|---|---|---|
| Oracle | `calculator.php:220` | `0.005` |
| App | `AccountingService.php:84` | `0.001` |

The oracle accepts entries production refuses. Two systems claiming to enforce the same law at different thresholds are not enforcing one law.

And note what a tolerance *is*: an admission that exactness is unreachable. With integer minor units the correct threshold is zero, and the comparison becomes `$totalDebit === $totalCredit`. A ledger that needs a tolerance is a ledger built on the wrong number type.

### A-6 · MEDIUM · The oracle's balance sheet is a hard-coded five-account sum

`Ledger::getBalanceSheet()` (L287) sums literal codes `1000, 1010, 1100, 1200, 2300` for assets and `2000, 2100, 2200` for liabilities. Any tenant chart of accounts containing an account outside that list produces a balance sheet that silently omits it — while still reporting `'balanced' => true`, because the omission is consistent on both sides.

This cannot validate a real, tenant-customised COA, which is the entire premise of a multi-tenant ERP. It must walk the accounts table by `type` / `normal`, never by a literal list.

### A-7 · MEDIUM · Retained earnings = current-period net profit; no fiscal close

`$retainedEarnings = $pl['net_profit']` (L296). No prior-period retained earnings, no closing entries, no year roll. The spec is single-year (2025), so this never surfaces in the audit.

But the app ships `app/Http/Controllers/V3/FiscalYearController.php`. Year-end close runs in production against zero oracle coverage. Your first customer to close a fiscal year is the test.

### A-8 · MEDIUM · Money is float end to end, in both systems

Oracle: `post(...)`, `getBalance(): float`, `deduct(float $qty)`, `calculateTax(float, float): float`. App: `round((float)$line['debit'], 2)`. Rounding after every operation *limits* drift; it does not eliminate it, and it makes exactness unprovable by construction. This is the root cause of A-5 and a contributing cause of A-3.

### A-9 · LOW · Hand-rolled YAML subset parser

`parseYamlLines()` (L61) implements a partial YAML grammar, used whenever `ext-yaml` is absent. A spec that is valid YAML but outside the supported subset parses wrong, silently, with no error. Depend on `symfony/yaml` — it is already in your Laravel dependency tree, so this costs nothing and removes a whole class of silent failure.

## Section B — What the ruler never reaches

### B-1 · CRITICAL · Ten of seventeen engines have no golden coverage

Keyword scan of `spec.yaml` returns **zero** matches for: `manufactur`, `bom`, `production`, `service`, `occupancy`, `payroll`, `uom`, `write_off`, `credit_note`.

| Engine | Lines | Golden coverage |
|---|---|---|
| ManufacturingService | 685 | **none** |
| InventoryService | 426 | **none** |
| SaleReversalService | 236 | partial — one `sale_return` |
| ServiceEngine | 195 | **none** |
| SettlementService | 138 | **none** |
| UomService | 77 | **none** |
| OccupancyEngine | 73 | **none** |
| AuditService | 42 | **none** |

`ManufacturingService` is twice the size of `AccountingService`, and it posts inventory and COGS entries. It is entirely unwitnessed. If it is wrong, nothing in your verification stack will tell you.

### B-2 · HIGH · 31 transactions, 9 types, one fiscal year, one currency

Current spec composition: 12 sales, 6 purchases, 6 expenses, 2 customer payments, 1 supplier payment, 1 sale return, 1 opening balance, 1 bank transfer, 1 zero-activity marker.

Scenarios absent that will occur in the first month of real use:

- partial returns and partial refunds
- one payment settling multiple invoices; one invoice settled by multiple payments
- overpayment, advances, and advances applied across documents
- bad-debt write-off
- credit notes
- invoice-level discount as distinct from line-level discount
- multi-warehouse transfer
- negative stock
- a backdated entry landing *before* existing FIFO consumption
- reversal of a reversal
- any second fiscal year
- rounding-boundary amounts (`0.005`, `0.015`, `1/3` splits)

---

# PART IV — CALCULATOR v4: THE BEAST

## 4.1 The honest framing

You asked whether a stronger model should rebuild the calculator. Yes — but understand precisely what the upgrade buys, because it is easy to spend the effort in the wrong place.

**The model was never the bottleneck. The spec was.** A better model rewriting `calculator.php` against the same hand-written `spec.yaml` produces a more elegant tautology. The findings in Part III are not code-quality problems that better code fixes; they are consequences of a spec that contains its own answers. Change the spec's nature and the oracle becomes a witness. Leave it and no rewrite helps.

Where a stronger model genuinely does change the outcome is §4.4 — generating and reasoning about thousands of adversarial transaction sequences and the invariants they must satisfy. That is work no human writes 31 examples for.

## 4.2 The spec becomes input-only

The single highest-value change in this entire document.

Delete from `spec.yaml`, for every transaction:

- the entire `journal:` block
- `subtotal`, `tax_amount`, `total`, `net_sales`, `total_tax`, `invoice_total`, `cogs`
- `fifo_batches_consumed`

What remains is only what a human would type into the POS: date, party, product, qty, unit price, discount, tax rate and mode, payment method, warehouse. Everything else — every journal line, every account code, every layer consumption, every tax figure — is **derived by the oracle, from first principles, for all nine transaction types.**

The moment the spec stops containing answers, agreement between the oracle and the app stops being partly circular and becomes evidence, which is what the file's own docblock has always claimed.

## 4.3 Doctrine becomes data — the actual Financial Bible v4

The Bible should stop being prose and become a machine-readable file that **both** the oracle and the app read at runtime. One document, two consumers, no drift.

```yaml
# doctrine.yaml — VenQore Financial Doctrine v4.0
version: "4.0"
money:
  representation: integer_minor_units
  minor_unit: paisa
  scale: 2
  storage_precision: "decimal(19,2)"     # one precision, everywhere
rounding:
  mode: half_up                          # named, not implied
  level: line                            # line | invoice — decide once, state it
  tax_base: net_after_discount           # discount then tax, or tax then discount
tax:
  modes: [exclusive, inclusive]
  inclusive_residual: assign_to_tax      # where the last paisa lands
fifo:
  order_by: [received_at, id]            # explicit tie-break
  backdated_receipt: reorder_open_layers # or: append_only — decide, don't discover
  return_restores: original_layer
ledger:
  balance_tolerance: 0                   # integers make zero achievable
  zero_value_lines: retain               # currently silently dropped — see note
reversal:
  method: contra_entry                   # never delete, never update
fiscal_year:
  close: explicit_entry
  retained_earnings_account: "3100"
```

Two of these lines are decisions you have not consciously made yet, and both are currently made *by accident* in code:

- `rounding.level` — the app rounds per line (`TaxService`), and the oracle rounds per line then re-rounds the running total (`deriveSaleTotals`). On a 40-line invoice these diverge. Pick one and enforce it in both.
- `ledger.zero_value_lines` — `AccountingService::createEntry()` currently filters out every line where both debit and credit are zero. A zero-rated tax line that exists for audit trail is silently deleted from the journal. That may be what you want; right now nobody decided it.

## 4.4 Property-based invariants — where a strong model actually pays

Stop hand-writing examples. Generate them.

Build a transaction fuzzer that produces valid-but-adversarial sequences — random quantities, prices, discounts, tax rates and modes, payment splits, returns, reversals, backdated entries, boundary amounts — then run every invariant from §2.5 after **every single transaction**, not just at the end.

```
for 10,000 random sequences of 1..200 transactions:
    replay through oracle
    replay through app
    after each transaction, assert:
        Σ debits === Σ credits                    (exact)
        assets === liabilities + equity           (exact)
        Σ party balances === AR + AP controls
        inventory GL === Σ (layer.remaining × layer.unit_cost)
        Σ COGS === Σ consumed layer costs
        oracle balances === app balances           (every account, every date)
    then reverse every transaction in reverse order and assert:
        all balances === opening state
```

Thirty-one hand-written examples check thirty-one paths. This checks properties that must hold on *every* path. It will find in an afternoon what example-based testing will not find in a year — and the reversal round-trip alone will surface bugs in `SaleReversalService` that nothing currently tests.

## 4.5 Differential runner, not end-state comparison

Today the audit compares final figures. Change it to compare **every account balance, every party balance, every FIFO layer, and every registered metric, at every date in the spec**, oracle against app.

A drift that appears on 3 March and self-corrects by 31 December is currently invisible. It should be a hard failure at 3 March, naming the transaction that caused it.

## 4.6 Freeze it in CI

`manifest.yaml` gets a checksum and is committed. Any code change that moves any number fails the build until a human reviews the diff and signs it. That is the mechanism that stops silent drift permanently — and it is the only one that survives you being busy.

---

# PART V — SEQUENCING

```
Phase 0   Fix the ruler          A-1..A-9, spec becomes input-only, doctrine.yaml
   │                             Nothing else starts until --check is trustworthy
   ▼
Phase 1   Qore pass-through      Two ports, contracts, registry. No gates.
   │                             Golden verify: byte-identical.
   ▼
Phase 2   Gates, one at a time   Tenant → Contract → Idempotency → Audit
   │                             → Permission → Capability → Invariant
   ▼
Phase 3   Controllers in waves   POS → purchase → payment → expense
   │                             → reports → dashboards → imports → admin
   ▼
Phase 4   Seal                   Allow-list empty, architecture tests on
   │
   ▼
Phase 5   Integer money          Alone. Last. Full balance diff, human sign-off.
```

**Why the oracle must come first, stated once more:** Qore's whole safety property is "the numbers did not move." That property is worthless if the instrument measuring it cannot see six of nine transaction types, ten of seventeen engines, or the tax mode your POS actually runs.

---

# PART VI — IF YOU ONLY DO THREE THINGS

Done properly, everything above is two to four months of solo work. You have a launch. So here is the version that captures most of the value in about two weeks, and leaves every door open.

### 1 · Stop the bleeding — one day

- Set both balance tolerances to the same value. Oracle `0.005` → `0.001` to match production (A-5).
- Fix the float equality at `TaxService.php:60` (A-3). One line, real bug, ships today.
- Add the CI grep from §2.6 with a generated allow-list of today's 52 files. It cannot fix what exists, but **no new leak can ever be added**, and the list only shrinks from here.

### 2 · Make the oracle a real witness — three to five days

- Strip `journal:` blocks and declared totals from the six transcribed transaction types; derive them (A-1).
- Add an inclusive-tax path to `calculateTax()` mirroring `TaxService` exactly (A-2).
- Have `FifoEngine` build and sort its own layer stack instead of accepting `$orderedBatchIds` (A-4).

After this, a green audit means something it does not mean today.

### 3 · Build Qore as a facade — one week

- `Qore.php` with the two ports, forwarding straight to existing engines.
- The four architecture tests from §2.6, switched on.
- Migrate only the POS sale path and the main dashboard as proof.

Then migrate the remaining controllers opportunistically — whenever you touch one for another reason, move it behind Qore and delete its allow-list entry. The membrane closes gradually and for free, instead of requiring a project.

**Defer until after launch:** integer money, property-based fuzzing, manufacturing and service coverage, the full differential runner. All valuable, none urgent, and all much easier once the three steps above are in place.

---

# PART VII — WHAT THIS COSTS IN TIME

Estimates are in **focused working days** for one developer working the way you do — with AI assistance, on a codebase you know. They are not calendar days. Multiply by roughly 1.6 for calendar time if this is your only project, more if it is not.

## The full programme

| Phase | Work | Days |
|---|---|---|
| **0** | Fix the ruler | **10–15** |
| | └ Tolerance alignment + float equality fix | 0.5 |
| | └ Derive the six transcribed types; strip the spec | 4–6 |
| | └ Inclusive tax in the oracle | 0.5 |
| | └ FIFO builds and sorts its own layer stack | 1 |
| | └ Balance sheet by account type, not literal codes | 0.5 |
| | └ Fiscal close + second year in the spec | 1–2 |
| | └ `symfony/yaml` swap | 0.5 |
| | └ `doctrine.yaml` + wire both sides to read it | 2–3 |
| **1** | Qore pass-through: ports, contracts, registry, architecture tests | **5–8** |
| **2** | Gates, one at a time | **20–25** |
| | └ Tenant · Idempotency · Audit · Permission · Capability | 9–11 |
| | └ ContractGate — typed DTOs for ~40–60 commands | *5–8* |
| | └ InvariantGate | 4–5 |
| **3** | Controllers in waves (~40–60 financial-surface files) | **20–30** |
| **4** | Seal — allow-list to zero, tests enforcing | **2–3** |
| **5** | Integer money: value object, schema, engines, balance diff | **15** |
| **6** | v4 extras: fuzzer, 10 uncovered engines, differential runner | **20–25** |
| | **Total** | **≈ 92–121 days** |

**Roughly four to six months of focused work.** In calendar terms alongside a launch, sales, and support: realistically six to nine months.

## The two-week version

| Step | Work | Days |
|---|---|---|
| 1 | Stop the bleeding — tolerances, float equality bug, CI allow-list | **1** |
| 2 | Oracle becomes a real witness — derive six types, inclusive tax, FIFO ordering | **3–5** |
| 3 | Qore facade — two ports, architecture tests, POS + dashboard migrated as proof | **5** |
| | **Total** | **≈ 10 days** |

Ten days buys you: a ledger no new code can reach around, a green audit that actually means something, and a membrane that closes gradually and free of charge as you touch controllers for other reasons. That is the large majority of the risk reduction for roughly a tenth of the effort.

## Where these estimates are most likely to be wrong

Three items scale with surface area not yet fully inventoried, and they are where an overrun will come from:

- **ContractGate DTOs (5–8 days).** Depends entirely on how many distinct commands exist. Count them before committing to a date — if it is 100 rather than 50, this doubles.
- **Phase 3 controller migration (20–30 days).** 238 controllers exist; the financial subset is estimated at 40–60. Verify that number before scheduling.
- **Phase 5 money migration (15 days).** The only phase that changes production numbers, so it carries a testing and rollback burden the others do not. Treat 15 as a floor.

Phases 0 and 1 are the reliable ones. They touch code you already understand, and neither can move a production number.

---

## Appendix — Primary sources

| Finding | File | Lines |
|---|---|---|
| Transcribed journal posting | `verification/golden_company/calculator.php` | 517, 522, 633, 646, 659, 671 |
| Sale derivation + self-check | `verification/golden_company/calculator.php` | 427–476 |
| Oracle tax (exclusive only) | `verification/golden_company/calculator.php` | 411 |
| Oracle balance tolerance `0.005` | `verification/golden_company/calculator.php` | 220 |
| Hard-coded balance sheet | `verification/golden_company/calculator.php` | 287–306 |
| Retained earnings = net profit | `verification/golden_company/calculator.php` | 296 |
| FIFO takes ordered ids | `verification/golden_company/calculator.php` | 326 |
| Hand-rolled YAML parser | `verification/golden_company/calculator.php` | 61–161 |
| Declared FIFO consumption | `verification/golden_company/spec.yaml` | 307, 346, 467 |
| App balance tolerance `0.001` | `app/Engines/AccountingService.php` | 84 |
| Float rounding of journal lines | `app/Engines/AccountingService.php` | 61–62 |
| Zero-value lines dropped | `app/Engines/AccountingService.php` | 67–78 |
| Inclusive tax branch | `app/Engines/TaxService.php` | 56–61 |
| Float equality bug | `app/Engines/TaxService.php` | 60 |
| Non-engine journal writes | `app/Services/DataImportService.php` | 743, 769 |
| Non-engine journal writes | `app/Console/Commands/MigrateV3Ledger.php` | 307, 399, 417 |
| Raw ledger SQL in reports | `app/Http/Controllers/ReportController.php` | 142–157, 295–329, 358–373 |
| Live route audit | `verification/discrepancy_report.md` | summary table |
