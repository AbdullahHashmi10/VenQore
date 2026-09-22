# Bugs: independent verification and what Codex missed

Date: 22 September 2026. Source audit of `app-code/main-app`. No code was changed and no runtime tests were executed — findings are from reading the source, with line references.

This document does two things: confirms (or corrects) each of Codex's eight findings with my own evidence, and adds three findings Codex did not report. Fixes for the confirmed ones are in Codex's doc 03, which is accurate; I only add where my reading differs or goes further.

---

## New findings

### N1 — Role dashboard presets reference a dead key namespace (P1 for the V6 project; silent)

**This is the significant miss.** Codex's doc 01 lists `config/dashboard_pool.php` under "What already exists" and advises *"Audit and extend presets rather than starting again."* The presets do not work.

**Evidence.** Cross-checking every `'key' => '...'` in `config/dashboard_pool.php` against the keys in `resources/data/reckoner/cards.json`:

```
Distinct keys in dashboard_pool.php : 31
Present in cards.json catalogue     : 7
Missing from catalogue              : 24
```

Missing: `sales.revenue`, `sales.revenue_trend`, `sales.top_products`, `sales.top_customers`, `sales.payment_breakdown`, `sales.gross_margin_pct`, `sales.live_feed`, `finance.net_profit`, `finance.receivables`, `finance.payables`, `finance.receivables_aging`, `finance.total_liquidity`, `finance.expenses_total`, `finance.expenses_by_category`, `finance.profit_trend`, `finance.balance_sheet_ok`, `finance.paid_to_suppliers`, `party.customer_count`, `party.supplier_count`, `purchasing.spend`, `purchasing.count`, `operations.open_sales_orders`, `restaurant.tables_occupied`, `restaurant.kitchen_orders_pending`.

The live catalogue uses a different namespace — `core.revenue`, `core.net_profit`, `core.receivables`, `core.gross_margin_pct`, `accounting.balance_sheet`, and so on. `dashboard_pool.php` was written against an earlier scheme and never migrated.

**Why it is silent.** Traced through the code:

1. `app/Services/Dashboard/FrameFiller.php:211` — `pool()` returns `config('dashboard_pool.roles')[$role]` directly for any role that is not owner/admin/superadmin.
2. That array goes to `DashboardSanitizer::sanitize($cards, $availableKeys)`.
3. `app/Reckoner/DashboardSanitizer.php:75` — `if (! in_array($readingKey, $availableKeys, true)) { continue; }`. Unknown keys are dropped with no log, no error, no warning.
4. `DashboardSanitizer::DEPRECATED_MAP` (line 34) is **empty** — it contains only a commented-out example. Nothing is remapped.

**Net effect.** The cashier preset contains 7 keys. 6 do not exist. The survivor, `staff.on_shift_count`, requires `admin.staff_view`, which the cashier role does not hold (`config/permissions.php:95-100` grants only `pos.open_session`, `pos.checkout`, `pos.discounts`, `pos.close_session`, `inventory.view`). **The cashier V6 preset resolves to zero cards.** The accountant, purchasing_officer and viewer presets fail the same way.

**Consequence for the plan.** Codex's Phase 6 is budgeted as extending working configuration. It is actually authoring presets from scratch for every role against the real vocabulary. Anyone following doc 01 will lose time discovering this the hard way, because nothing surfaces an error.

**Repair.**

- Rewrite `dashboard_pool.php` against real catalogue keys (preferred), or populate `DEPRECATED_MAP` with old→new translations. Rewriting is cleaner; a translation layer preserves the confusion.
- Make the drop loud: log a warning when `DashboardSanitizer` discards a key that originated from a **config preset** rather than a user's saved layout. This bug survived precisely because nothing complained.
- Add a boot-time or test-time assertion that every key in `dashboard_pool.php` exists in `CardRegistry`. This class of bug should be impossible to reintroduce.

**Regression.** A test that iterates every role in `dashboard_pool.roles` and asserts each key resolves in `CardRegistry`. A second test asserting a cashier's seeded dashboard returns a non-empty card set.

**Silver lining, and a correction to Codex's doc 03.** Codex cites the cashier preset granting `sales.gross_margin_pct` as evidence of over-broad cashier visibility. Because that key does not exist, **cashiers are not currently leaking gross margin through V6 presets.** They also do not reach V6 at all — `DashboardController::index()` (line 38-44) routes cashier/accountant/purchasing_officer/viewer to legacy builders. The real cashier exposure is B02 and B05 on the legacy path, which narrows what is genuinely urgent.

---

### N2 — `CardRegistry` hard-asserts exactly 349 cards and throws (P2, will break the build)

**Evidence.** `app/Reckoner/CardRegistry.php:106`:

```php
if (count($cards) !== 349) {
    throw new InvalidArgumentException("CardRegistry must contain exactly 349 cards, found " . count($cards));
}
```

Codex mentions this in doc 02 §7 ("update that invariant deliberately") and is right to. I raise it separately because of its failure mode: the moment anyone adds a card to `cards.json` — including the `work.my_pending` / `pos.my_shift_sales` cards the approval feature needs — **the application throws at registry load**, not at a test. It will look like a catastrophic breakage rather than a stale assertion.

**Repair.** Keep a versioned snapshot of the original 349 keys for parity testing; change the live invariant to uniqueness + contract-completeness over the full set. Update golden fixtures and UI catalogue generation in the same commit.

---

### N3 — `SaleObserver` posts to the ledger from a model event (P2, approval-bypass risk)

**Evidence.** `app/Observers/SaleObserver.php` is among the 44 files calling `AccountingService::createEntry()`.

A model observer fires on Eloquent events, not on controller actions. Any approval guard placed at the controller or command layer will not intercept it. If the approval workflow ever persists a `Sale` row in a non-posted state — or if any adapter touches the model during preview — the observer can create a journal entry for a document that has not been approved.

Codex's doc 02 requires the posting boundary and notes that low-level journals may be legitimate internal legs of a larger approved operation. It does not call out observers specifically, and they are the one place where the "intercept before the financial write" strategy can silently fail.

**Repair.** Inventory what fires `SaleObserver::createEntry()` and under which conditions, before Step 2 of the build plan. Either move that posting into the explicit command path, or make it require a trusted `PostingContext` so an unapproved save cannot trigger it. Verify with a test that creating an approval revision for a sales invoice produces zero `journal_entries` rows.

---

## Codex's eight findings — independently verified

All eight confirmed against the source. Codex's repair guidance in doc 03 is sound; I note only where I would go further.

### B01 — Payments list rewrites dates across tenants (P1, **escalate to P0**)

**Confirmed.** `app/Http/Controllers/PaymentController.php`, in `index()`, immediately after the `wantsJson()` early return:

```php
Payment::where('type', 'received')->update(['type' => 'in']);
Payment::where('type', 'sent')->update(['type' => 'out']);
DB::statement('UPDATE payments SET date = DATE(created_at) WHERE sale_id IS NOT NULL AND date != DATE(created_at)');
```

The raw statement has no tenant predicate; Eloquent tenant scopes do not apply to `DB::statement`. It executes on an ordinary HTML page view.

**Where I go further than Codex.**

1. Codex leaves the two Eloquent `update()` calls open ("their Eloquent scope must be distinguished"). They should be treated as suspect until proven scoped — whether a global tenant scope applies to a mass `update()` on this model needs a direct test. If it does not, these rewrite payment *types* platform-wide.
2. Codex rates this P1 "fix before pilot." **It is not a pilot risk, it is active corruption.** It fires on page load, so it has almost certainly already run many times in production. Any sale-linked payment whose accounting date legitimately differed from its creation date has had that date overwritten.

**Repair.** Delete all three lines now. Do not write a scoped replacement. If legacy normalization is genuinely needed, do it as a separate Artisan command, `--dry-run` by default, tenant-scoped, with explicit row selection and an audit trail — never on a read path, and never automatically on deploy. Do not assume `created_at` is the correct transaction date; it is not recoverable from the current data.

**Regression.** Two tenants with deliberately backdated sale-linked payments. GET `/payments` as tenant A. Assert both tenants' `date` and `type` are unchanged.

### B02 — Sensitive props delivered past the card gate (P1)

**Confirmed.** `DashboardController.php` constructs charity totals and debtor records — including names, phones and balances — outside the surrounding finance permission check, and passes them as Inertia props. At the `$canSeeSales` determination, checkout/create/edit permission is sufficient, and the sales stats block includes gross profit, COGS and expenses; the product block includes profit and margin.

Hiding a card client-side does not remove a prop already serialized to the browser.

**Repair.** As Codex specifies — gate and field-filter at construction, on both dashboard builders and all four role builders, separating profit/cost, contact details and company balances from ordinary sales or inventory permission. Add `parties.contact_view` as a distinct grant.

### B03 — Empty permission override silently restores role defaults (P1 semantics)

**Confirmed.** `app/Models/User.php:412`:

```php
if (!empty($membership->permissions) && is_array($membership->permissions)) {
    return $membership->permissions;
}
$role = $membership->role ?? 'viewer';
return config('permissions.' . $role, []);
```

An explicit empty array is indistinguishable from "not set," so removing every checkbox restores the full role default. `StaffInvitationController` also writes `[]` as a default, so existing empties do not reliably signal intent either way.

**Repair.** As Codex specifies — explicit `permissions_mode` (`inherit` | `custom`), migrate existing `[]` conservatively as inherit, report affected memberships, require explicit custom-empty going forward. Add `permissions_version` for cache invalidation.

### B04 — Middleware and `hasPermission()` give different answers (P1)

**Confirmed.** `app/Models/User.php:230`:

```php
public function hasPermission(string $permission): bool
{
    if ($this->is_platform_admin) return true;
    $membership = $this->getActiveMembership();
    if ($membership && in_array($membership->role, ['owner', 'admin'])) {
        return true;                    // ← any permission, unconditionally
    }
    $perms = $this->permissions;
    return in_array($permission, $perms);
}
```

`app/Http/Middleware/CheckPermissions.php` instead reads `$user->permissions` and tests membership directly. For a restricted admin with a narrower custom array, the middleware denies the route while `hasPermission()` — used by the Reckoner and dashboard edit checks — allows the equivalent data or action.

**Repair.** One canonical resolver consumed by all paths. Decide explicitly whether an owner can be restricted (suggest: owner no, admin yes) rather than letting two methods disagree. This must land before approval rights are built, since "can this person approve?" will be asked from middleware, policy, Reckoner and frontend.

### B05 — Cashier "session total" is the entire store (P2 per Codex; **I rate P1**)

**Confirmed.** `DashboardController.php:57-66`:

```php
// Session totals for today (sales created by this user today)
$session = [
    'transaction_count' => Sale::where('status','posted')
        ->where('tenant_id', $storeId)
        ->whereDate('posted_at', today())->count(),
    'session_total' => Sale::where('status','posted')
        ->where('tenant_id', $storeId)
        ->whereDate('posted_at', today())->sum('net_sales'),
];
```

No employee, register or shift filter. The comment claims it is this user's sales; the query returns the whole store's day.

**Why P1 rather than P2.** Every cashier is shown total store revenue, mislabeled as their own session. That is a data-exposure issue in its own right, and it is on the dashboard cashiers actually load today (they are routed to `cashierDashboard()`, not V6).

Note also that `today()` uses the server default timezone, while `index()` at line 28 correctly resolves `app('current.tenant')->timezone`. Day boundaries are inconsistent within the same controller.

**Repair.** Scope to the cashier's register shift using the canonical relationship — inspect the in-progress `RegisterShift` work before choosing columns. Use store-local day boundaries. Where no reliable shift mapping exists for historical rows, show a clearly labeled own-day metric based on authorship, or nothing. Never show store totals under a personal label.

### B06 — Aging buckets are fabricated percentages (P2)

**Confirmed.** `DashboardController.php:126-138`:

```php
$receivables = [
    'total'          => $outstanding['receivables'],
    'overdue_30'     => round($outstanding['receivables'] * 0.3, 2),
    'overdue_60'     => round($outstanding['receivables'] * 0.15, 2),
    'overdue_90'     => round($outstanding['receivables'] * 0.05, 2),
    'overdue_90plus' => round($outstanding['receivables'] * 0.02, 2),
];
```

Payables use 0.2 / 0.5 / 0.1 the same way. `'pendingJournalCount' => 0` is hardcoded at line 149.

These are presented to an accountant as aging analysis. They are the total multiplied by constants and bear no relationship to any invoice due date. They also do not sum to the total, so the chart is internally inconsistent as well as wrong.

**Repair.** As Codex specifies — real invoice-level outstanding amounts after valid allocations, grouped by actual due date in tenant-local time, reconciled to AR/AP control accounts. Prefer existing verified aging services after a parity check over writing a third implementation. **Interim:** remove the fabricated numbers rather than leaving them displayed while the real fix waits.

### B07 — Active membership can resolve to a different store (P1 hardening)

**Confirmed.** `User::getActiveMembership()` — the tenant-bound branch queries `memberships()->where('tenant_id',$tenant->id)->where('status','active')` and returns on a hit, but on a miss **falls through** to: bound `current.membership`, then `last_store_id`, then the first active membership of any store — and `updateQuietly(['last_store_id' => ...])` while doing so.

So a permission question asked in store A's context can be answered from store B's membership. Tenant middleware stops many ordinary HTTP requests before this matters; controller/service/job contexts do not get that protection, and writing `last_store_id` inside an authorization read is a side effect that should not exist.

**Repair.** When `current.tenant` is bound, resolve for exactly that tenant or return `null`. No fallback in that branch. Reserve the fallback for the intentionally tenantless hub flow. Reset memoized membership on context change. ~10 lines, removes a whole category of future bug.

### B08 — Shared dashboard `show()` ignores role audience (P2)

**Confirmed.** `app/Http/Controllers/Api/DashboardController.php` — `index()` filters shared dashboards by `for_role`; `show()` rejects only a different *personal* owner, so a shared dashboard with `null` user_id passes regardless of `for_role`. Card data is separately gated by the Reckoner, which limits the impact to layout and metadata rather than financial values.

**Repair.** A `DashboardPolicy` applying consistent own / shared-role / publisher rules across index, show, reset and publish. Validate target roles against the supported registry when publishing.

---

## Priority order

| # | Finding | Severity | When |
|---|---|---|---|
| B01 | Unscoped payment date/type rewrite on page load | **P0** | **Today — delete the lines** |
| B02 | Sensitive props past the card gate | P1 | Step 1 |
| B05 | Cashier session total = store total | P1 | Step 1 |
| B04 | Permission resolution disagreement | P1 | Step 1 (blocks approval rights) |
| B07 | Cross-store membership fallback | P1 | Step 1 (cheap) |
| N3 | `SaleObserver` posts from a model event | P2 | Verify before Step 2 |
| N1 | Dead preset namespace | P1 for V6 | Step 3 (blocks role dashboards) |
| N2 | 349-card hard assertion | P2 | Step 3 (blocks adding cards) |
| B03 | `[]` inherit/custom ambiguity | P1 | Step 5 |
| B06 | Fabricated aging buckets | P2 | Step 5 (strip numbers now) |
| B08 | Shared dashboard role audience | P2 | Step 5 |

Also worth carrying from Codex's follow-up list: `PaymentController::store()` uses unscoped `exists:parties,id` and `exists:bank_accounts,id` — replace with tenant-constrained `Rule::exists` in Step 5.

---

## Verification limits

This was a source read. No migrations were applied, no transactions submitted, no database tests executed, and no running deployment was probed. "Confirmed" means the code path is present as described, not that an exploit was demonstrated. The extent of historical B01 damage was not measured and cannot be reconstructed from the current data — preserve backups before investigating.

Unrelated in-progress work is present in the working tree (sales, restaurant, register-shift, dashboard). Line numbers will move.
