# Spec — plan-gated reports, plus Decisions 1 and 2

Rules of engagement from `IDE_INSTRUCTIONS_PRELAUNCH.md` still apply. Two additions
after the last round:

- **Do not paste test output for tests that were not run.** The Round 2 report claimed
  passes for test names that do not exist in the files (`Module02` reported five tests
  that are not in the file; `FullRouteSweepTest` was reported under the wrong namespace
  with six invented names). Before pasting any result, confirm the test name appears in
  the file you ran.
- **Do not swap entries in the permission ratchet baseline.** Round 2 protected
  `sync/orders/batch` but also added the unauthenticated `POST workspace/converse/deepen`
  to `unprotected_write_routes.json` and rewrote the checksum. Report that route for a
  decision instead — it is an unauthenticated endpoint that spends AI credits.

---

## Part A — Decision 1: multi_branch and owners_daily_pulse are NOT free

Chosen: **Option A.**

1. In `database/migrations/2026_08_16_000300_include_every_module_on_every_plan.php`,
   remove `'multi_branch'` and `'owners_daily_pulse'` from the `NOW_FREE` array.
2. Add a new corrective migration that sets, in `plan_limits`:
   - `multi_branch` → `'0'` for `solo`, `starter`, `ltd_1`
   - `owners_daily_pulse` → `'0'` for `solo`, `starter`
3. Leave `config/plans.php` as it is — it already declares these `false` for Solo.
4. Do not touch `PlanGatingAndLimitsTest` or `V11PlanGatingAndEntitlementsTest`. All
   eight failures should clear on their own. If any remain, report them; do not edit.

## Part B — Decision 2: unknown module key fails closed

Chosen: **keep the fail-closed code, update the test.**

In `tests/tests/Feature/Module/EnsureModuleTest.php`, rename
`an_unknown_module_key_is_never_denied` to `an_unknown_module_key_is_denied`, invert both
assertions to `assertFalse`, and add:

```php
// Changed deliberately (R10). Fail-open let SendPaymentReminders guard on the key
// 'invoices' — which is not a module — so the guard silently passed and the command
// ran for tenants who had it switched off. ModuleRegistryIntegrityTest already stops
// unknown keys reaching the gate from config, so the lock-out risk is covered there.
```

---

## Part C — Plan-gated reports

### The rule

**Operational reports are free. Analytical reports are paid.**
The test for any report: *does it tell the owner what to do next, or how well the
business did?* "What have I got / who owes me / what sold today" is free. "What did I
actually earn" is paid.

### C1. Free on Solo — do not gate these

```
reports.index                 reports.dashboard             reports.day-book
reports.daily-sales           reports.sales                 reports.low-stock
reports.expiry                reports.all-parties           reports.party-statement
reports.party-ledger          reports.aged-receivables      reports.aged-payables
reports.expenses              reports.expense-by-category   reports.purchases
reports.purchase-returns      reports.sale-orders           reports.sale-order-items
reports.inventory-movement    reports.movement-history      reports.item-detail
reports.stock-summary-by-category                           reports.bank-statement
reports.loan-statement
```

Chasing money stays free on purpose — `aged-receivables`, `aged-payables` and the party
statements are a to-do list, not analysis, and they are the strongest reason a shop opens
the app daily.

### C2. Paid from Starter up — gate these

```
reports.profit-loss                        reports.gross-profit
reports.cogs                               reports.balance-sheet
reports.cash-flow                          reports.account-ledger
reports.stock-valuation                    reports.inventory-valuation
reports.point-in-time-inventory (+ .details)
reports.stock-aging                        reports.sale-aging
reports.customer-insights (+ .details)     reports.supplier-insights
reports.party-wise-profit-loss             reports.sale-purchase-by-party
reports.sale-purchase-by-party-group       reports.sale-purchase-by-item-category
reports.item-report-by-party               reports.party-report-by-item
reports.item-wise-profit                   reports.item-category-wise-profit-loss
reports.bill-wise-profit                   reports.analytics
reports.discount                           reports.discount-report
reports.item-wise-discount                 reports.refund-reasons
reports.expense-by-item                    reports.export
```

`reports.owner-daily-pulse*` is already fenced by `owners_daily_pulse` — leave it alone.

`reports.export` is deliberately in the paid list: seeing the number is free, sending it
to your accountant is not.

### C3. Plan keys

In `config/plans.php`, for `solo` (and `starter` if that tier should also be excluded —
**confirm with Abdullah before changing starter**):

| Key | From | To |
|---|---|---|
| `reports` | `'advanced'` | `'basic'` |
| `report_profit_loss` | `true` | `false` |
| `cash_flow_report` | `true` | `false` |
| `stock_valuation` | `true` | `false` |
| `discount_report` | `true` | `false` |

**Leave `true` on Solo, do not touch:** `outstanding_balance_grid`, `daily_cash_audit`,
`profit_peek`, `double_entry_ledger`.

`double_entry_ledger` must stay `true` on every plan. The ledger keeps recording in the
background even when a module or report is hidden — that is the data-preservation
guarantee. Gating the *report* must never gate the *recording*.

`profit_peek` stays `true` and becomes the teaser (see C5).

Remove these from the migration's `NOW_FREE` array so they are no longer forced to `'1'`
on every plan:

```
report_profit_loss, report_trial_balance, report_cash_flow, report_stock_valuation,
report_sales_aging, cash_flow_report, stock_valuation, discount_report,
point_in_time_inventory, customer_insights, supplier_insights, stock_aging
```

Keep these in `NOW_FREE` (they stay free): `report_party_statement`, `aged_receivables`,
`aged_payables`, `customer_statements`, `supplier_statements`, `unified_party_ledger`,
`bulk_upload`, `double_entry_ledger`, `auto_vat_gst`.

Mirror every change in `database/seeders/PlanFeatureMatrixSeeder.php`. Config, seeder and
migration must agree — a split between them is what produced the `multi_branch` bug.

### C4. The two-gate contract — this is the part that must not be got wrong

A report can now be blocked for two unrelated reasons, and they need opposite messages.

`EnsureModule` exists to say *"this isn't part of your system yet — add it?"* and send the
customer to the **builder**. That is correct for modules, because adding one is free. It
is completely wrong for a plan-locked report: the customer would go to the builder, switch
Reports on, come back, and still be blocked. That is a dead end.

Implement it like this:

1. Create `app/Support/ReportPlanMap.php`, mirroring `ReportModuleMap`: a constant map of
   report suffix → required plan feature key, plus `requiresPlanFeature(string $suffix):
   ?string` and `visible(Tenant $tenant, string $suffix): bool` backed by `PlanGate`.
2. In `EnsureModule`'s existing fine-grained report branch, evaluate **both** gates, and
   apply this precedence:
   - plan gate fails → return the **upgrade** refusal, regardless of the module gate
   - plan gate passes, module gate fails → return the existing `add_module` refusal
   
   Plan-first-on-failure is deliberate: if a tenant lacks both, telling them to add a
   module they still cannot see afterwards is two walls in a row.
3. The upgrade refusal must be distinct from `refuse()`. JSON shape:

```php
return response()->json([
    'success' => false,
    'code'    => 'plan_upgrade_required',
    'feature' => $featureKey,
    'label'   => $label,
    'message' => "Profit reporting is on the Starter plan and up.",
    'action'  => 'upgrade',          // NOT 'add_module'
    'upgrade' => true,
    'plan_url'=> route('store.billing', ['store_slug' => $tenant->slug]),
], 403);
```

   The HTML branch redirects to **billing**, never to `store.builder`.

### C5. Absent versus locked — the copy rule

Two different ideas that must not be blended:

- A module the customer did not choose is **absent**. No trace, no upsell. This is what
  `Blueprint.jsx` promises and it stays true.
- A report on a higher plan is **visible and locked**. Show the card, show the lock, show
  the CTA. They cannot want what they cannot see.

Apply that in the sidebar (`OneGlanceLayout.jsx`) and on the reports index: module-gated
entries are filtered out; plan-gated entries render with a lock and an upgrade link. Use
`profit_peek` to show the P&L tile with its headline value masked and a "See your profit"
CTA rather than hiding the tile.

Update the Blueprint copy so it distinguishes the two in one sentence — tools you did not
pick are gone; features on higher plans are shown with a lock.

### C6. Respect existing retention

Free reports must still obey `history_retention_days => 90`. Do not widen it, and do not
add a second date fence on top of it.

---

## Part D — Tests

Add to `tests/tests/Feature/Module/`:

1. `ReportPlanGateTest` — for a Solo tenant **with** the Reports module enabled,
   `reports.profit-loss` returns 403 with `code = plan_upgrade_required` and
   `action = 'upgrade'`, and **asserts `action !== 'add_module'`**. That assertion is the
   whole point: it is the regression guard against the dead end in C4.
2. Same test, free list: `reports.day-book`, `reports.low-stock`, `reports.aged-receivables`
   return 200 for the same Solo tenant.
3. A tenant on `core` gets 200 on `reports.profit-loss`.
4. `double_entry_ledger` still records for a Solo tenant while `reports.profit-loss` is
   blocked — the ledger row count rises after a sale even though the report 403s.

Update `PlanGatingAndLimitsTest` and `V11PlanGatingAndEntitlementsTest` only where the new
fences genuinely change expectations, with a comment on each change saying why.

---

## Part E — Then re-run

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round3.xml
```

Report the summary line and every remaining failure, raw. For each suite you claim
passed, paste the actual test names as the runner printed them.

Then commit and push. No readiness score, no percentage, no verdict.
