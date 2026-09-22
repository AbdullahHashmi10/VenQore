# What to actually build, and in what order

Date: 22 September 2026. This plan keeps Codex's architecture and reorders the work. Read `00-VERDICT-on-codex-plan.md` first for why.

Governing constraints: one developer, a large prospect evaluating against an incumbent that already ships maker-checker, and a codebase with live data-corrupting bugs. The plan optimizes for **a demoable approval flow as early as safely possible**, with nothing built that has to be thrown away later.

---

## Step 0 — Today, before anything else (1 hour)

**Delete the three normalization writes in `PaymentController::index()`.**

`app/Http/Controllers/PaymentController.php`, immediately after the `wantsJson()` return:

```php
Payment::where('type', 'received')->update(['type' => 'in']);
Payment::where('type', 'sent')->update(['type' => 'out']);
DB::statement('UPDATE payments SET date = DATE(created_at) WHERE sale_id IS NOT NULL AND date != DATE(created_at)');
```

Delete all three lines. Do not replace them with a scoped version. Do not write a repair command yet.

This is a write executing on every page view of the payments list, and the raw statement has no tenant predicate. It has been silently overwriting legitimate payment dates across every tenant, every time anyone opened that page.

Then, separately and not urgently:

- Check whether any tenant's `payments.date` values are suspiciously equal to `DATE(created_at)` for sale-linked payments. If your backups predate this code, you can quantify the damage; if not, you cannot reconstruct the lost dates and should say so honestly if a customer ever asks.
- If legacy `type` values genuinely need normalizing, write a tenant-scoped Artisan command with `--dry-run` as the default, run it deliberately, log what it changed. Never on a page load.

**Regression test:** two tenants, each with a sale-linked payment whose `date` is deliberately a week before `created_at`. GET `/payments` as tenant A. Assert **both** tenants' `date` and `type` values are byte-identical afterwards.

---

## Step 1 — The three security fixes that actually matter now (3-5 days)

Codex's doc 03 lists eight. Only three are urgent, because of what D1 established: cashiers, accountants, purchasing officers and viewers do **not** currently reach V6 — `DashboardController::index()` routes them to legacy Blade/JSX dashboards. So V6 card-gating is not your live exposure. The legacy props are.

### 1a. B02 — strip sensitive props from the dashboards people actually load (P1)

`app/Http/Controllers/DashboardController.php` builds debtor records (names, phones, balances) and charity totals outside the finance permission check, and treats `pos.checkout`/create/edit as sufficient for `$canSeeSales`, which then includes gross profit, COGS and expenses.

Fix: gate every sensitive prop at the point of construction, not at render. Specifically separate these from ordinary sales/inventory permission:

- profit / margin / COGS → require `reports.financial`
- debtor and creditor **contact details** → require an explicit contacts grant (add `parties.contact_view`)
- charity / donation totals → require `reports.financial`
- company-wide cash and bank balances → require `finance.balances`

Do this on `fullDashboard()`, `fullDashboardExperimental()`, and each of the four role builders. Hiding a card in the UI does nothing; the prop is already in the browser's Inertia payload.

**Test:** authenticate as cashier, as a custom-empty member, and as inventory-only. GET `/dashboard`, `/dashboard-v1`, `/new-dashboard`. Recursively walk the returned props and assert the absence of debtor phone numbers, profit, COGS, and company balances. Then grant each capability individually and assert only that capability's data appears.

### 1b. B05 — the cashier "session total" is the whole store (P1, do it in the same pass)

`DashboardController.php:58,62` — filters tenant + posted + today, with **no user, register or shift filter**, under a comment claiming it is this user's sales.

Every cashier is currently shown the entire store's daily revenue and transaction count, labeled as their own session. That is a live data-exposure bug and it is also embarrassing in a demo.

Fix: scope to the cashier's register shift. Look at the in-progress `RegisterShift` work before choosing columns — do not invent a relationship. If a reliable shift mapping does not exist for historical rows, show an explicitly labeled "my sales today" based on authorship, or show nothing. **Do not show store totals under a personal label.**

Use the store timezone (`app('current.tenant')->timezone`) for day boundaries, not `today()` on the server default — the existing `index()` already does this correctly at line 28, so follow that precedent.

**Test:** two cashiers, one store, overlapping shifts, one shift crossing midnight. Cashier A must never see B's figures.

### 1c. B04 — make permission answers consistent (P1, foundational)

`User::hasPermission()` returns `true` for **any** permission when the active role is owner or admin. `CheckPermissions` middleware instead tests membership in `$user->permissions`, which for a restricted admin can be a narrower custom array. The same question gets two different answers depending on which code path asks.

This must be fixed before you build approval rights, because "can this person approve?" will be asked from middleware, from a policy, from the Reckoner, and from the frontend — and they must agree.

Fix: one resolver, `app/Services/Authorization/PermissionResolver.php`. Everything consumes it: `User::hasPermission()`, `getPermissionsAttribute()`, `CheckPermissions`, API checks, and the props that drive the frontend `usePermission`. Decide explicitly whether an owner can be restricted (recommendation: owner cannot, admin can) and encode that in one place.

**Defer B03** (the `[]` inherit/custom migration). Codex is right about the semantics, but it is a schema change across every staff-save path and it blocks nothing below. Do it in Step 5.

**Defer B06** (fake aging fractions) and **B08** (shared dashboard `for_role`). B06 is on the accountant legacy dashboard, which Step 6 replaces wholesale — fixing the fractions now is work you delete later. Just remove the fabricated numbers and the hardcoded `pendingJournalCount => 0` so nothing false is displayed in the meantime.

### 1d. B07 — cross-store membership fallback (P1 hardening, cheap)

In `getActiveMembership()`, the tenant-bound branch falls through to `current.membership`, then `last_store_id`, then *any* active membership. It can answer "what may this user do in store A?" using their store B membership, and it `updateQuietly`s `last_store_id` while doing so.

Fix: when `current.tenant` is bound, resolve a membership for exactly that tenant or return `null`. No fallback in that branch. Keep the fallback only for the tenantless hub flow. Never mutate `last_store_id` inside an authorization query.

This is a ~10 line change and it removes a whole category of future bug.

---

## Step 2 — The approval spine, narrow (2-3 weeks)

This is the demo. Build it for **four document types only**:

1. Standalone customer receipt (money in)
2. Standalone supplier payment (money out)
3. Administrative sales invoice / credit sale
4. Expense

These are exactly what your prospect described — "taking the receipts, taking money from someone, giving someone some money", and the invoices their admin staff raise. Purchase bills, journals, funds, payroll, assets, loans, and everything else comes later, **denied by default** until their adapter exists.

### Tables

Build Codex's schema, minus what a first release does not need. Keep:

- `approval_documents`
- `approval_document_revisions`
- `approval_events`
- `approval_policies`
- `approval_attachments`
- `transaction_postings`

**Defer** `transaction_outbox` and `pending_cash_custody`. The outbox matters when you have external tax delivery and third-party effects on the approval path; with these four types and no FBR submission on pending documents, a single atomic transaction is enough. Custody matters, but it is a Step 4 conversation with the customer, not a blocker.

Follow Codex's field lists and constraints exactly — particularly:

- Unique `(tenant_id, client_submission_key)` for idempotency
- Unique `(document_id, revision_number)`
- Money stored as decimal/string, never float
- `lock_version` on the document
- Append-only events

### The one invariant that cannot bend

**A pending document creates no row in any financial or stock table.** No journal, no journal item, no payment row, no allocation, no stock movement, no loyalty accrual, no final document number, no tax submission, no printed receipt marked as posted.

The payload lives as JSON in `approval_document_revisions`. Nothing else exists until approval succeeds.

If you take one thing from Codex's documents, take this. The alternative — inserting a journal with `status = 'pending'` and filtering it out at read time — will work for a month and then quietly poison a balance sheet, because some report somewhere will forget the filter. There is no way to find them all.

### Services

```
app/Services/Approvals/ApprovalWorkflow.php          submit / return / reject / withdraw / approve
app/Services/Approvals/ApprovalPolicyResolver.php    immediate | review-required | denied
app/Services/Approvals/DocumentAdapterRegistry.php   allowlist, never a class name from the payload
app/Services/Approvals/Adapters/CustomerReceiptAdapter.php
app/Services/Approvals/Adapters/SupplierPaymentAdapter.php
app/Services/Approvals/Adapters/SalesInvoiceAdapter.php
app/Services/Approvals/Adapters/ExpenseAdapter.php
app/Policies/ApprovalDocumentPolicy.php
```

Adapter interface as Codex specified — `normalize`, `validate`, `preview`, `revalidateForPosting`, `post`. `preview` must be genuinely read-only: no number allocation, no stock reservation, no service-product creation.

Critically: **the adapter's `post()` calls your existing engines.** `AccountingService`, `SaleService`, `PaymentService` keep owning balancing, allocation, FIFO, rounding and stock. The approval layer must never do its own accounting arithmetic. Codex is right about this and it is where a naive implementation goes wrong.

### The approve transaction

Follow Codex's algorithm precisely:

1. Verify active membership in this tenant (post-Step-1c, via the single resolver)
2. Open transaction; `lockForUpdate()` the approval document
3. If this idempotency key already succeeded with this payload, return the existing result; if reused with different content, 409
4. Check state is `pending`, `lock_version` matches, revision id matches, reviewer ≠ author, reviewer eligible under current policy
5. Revalidate everything: tenant ownership of every party/account/bank/invoice/product, current balances, stock, period closure, duplicate constraints, plan limits
6. Call the adapter; reserve the unique posting key in the same transaction
7. Persist posting result, event, final state; commit

Any exception rolls back all financial and stock effects. The approval does not partially happen.

### Gating the four write paths

For these four types only, route the controller through the workflow **before** any financial write:

- `PaymentController::store()`
- `V3/CustomerPaymentController::store()`
- `V3/SupplierPaymentController::store()`
- `V3/ExpenseController::store()` and `ExpenseController::store()`
- `SaleController::store()` and `V3/SaleController::store()` — administrative invoice branch only

**POS checkout stays immediate.** Enforce this as a server-side decision: the policy resolver decides POS-eligibility from verified register/shift/cashier context and the document type, never from a `source=pos` value in the request body. A cashier sending an arbitrary voucher through the sales URL must not get the POS exemption.

Do not touch the other 40 files that call `createEntry()` in this step. The policy resolver returns "denied / not yet supported" for every document type without an adapter, so there is no silent bypass — but there is also no risky refactor of the whole posting surface.

> **Note on `Observers/SaleObserver.php`:** it calls `createEntry()` from a model event. Verify during this step that the approval path does not trip it into posting a journal for a pending document. A model observer will not be caught by any controller-level guard. This is the one place where a narrow approach could still leak, so check it explicitly.

### Return-for-correction

This is the part your prospect specifically asked for, so build it properly.

Return requires **at least one preset reason and a note**. Use Codex's list verbatim in `config/approvals.php`:

incorrect party · incorrect amount · incorrect date · wrong payment account/method · incorrect items/quantity/tax/discount · missing attachment · duplicate · allocation mismatch · other

"Other" still requires the note.

The returned document reopens **in the original editor** — the same invoice or payment form the employee used — with a visible feedback panel showing the reasons and note, and read-only access to the prior revision. Resubmitting creates a new revision. The reviewer never edits the employee's submission. Do not build a generic JSON editor for staff.

### Policy defaults — diverging from Codex

Codex recommends no self-approval and owner included in separation of duties. **Ship the opposite as the default**, with a setting:

- Default: **owner and admin can post directly** (recorded as an audited direct-post exemption, not a self-approval)
- Default: one required reviewer, no self-approval **for everyone else**
- Configurable amount threshold below which review is skipped
- Store setting to enforce separation of duties for owners, off by default

In your market the owner is the approver. A product that tells the owner they cannot record their own payment will be read as broken, not as rigorous. Codex's stricter posture is right for a regulated enterprise and wrong as a default here — but keep the setting so the firms that want it can have it.

If a store enables review and has no eligible independent reviewer, show a configuration error and hold submissions pending. Never auto-post as a fallback.

### Routes and screens

Codex's route table is fine. Minimum for the demo:

```
GET    /approvals                    inbox + my submissions
GET    /approvals/{id}               preview, history, allowed actions
POST   /approvals/{id}/submit
POST   /approvals/{id}/return        reason_codes[], note, expected_revision_id, lock_version, idempotency_key
POST   /approvals/{id}/reject
POST   /approvals/{id}/approve       version + idempotency only, never a replacement payload
POST   /approvals/{id}/withdraw
GET/PUT /settings/approval-policies
```

`POST /approvals/{id}/approve` must **never** accept a financial payload. The approver approves a specific revision; they do not submit a corrected one.

Screens: `Approvals/Index.jsx`, `Approvals/Show.jsx`, `Settings/ApprovalPolicies.jsx`, and components `StatusBadge`, `ReviewActions`, `ReturnDialog`, `RevisionHistory`. Reuse the existing design system.

Never print a posted receipt or say "payment received" for a pending document. If cash physically changed hands, the UI says "received, awaiting verification" and names who holds it.

### Tests for Step 2

Non-negotiable before you demo:

| Test | Asserts |
|---|---|
| `ApprovalLifecycleTest` | submit → return → correct → resubmit → approve; rejection; withdrawal; invalid transitions rejected; old revisions still readable; reason+note required |
| `ApprovalFinancialIsolationTest` | for each of the 4 adapters: pending/returned/rejected produce **zero** journals, journal items, payments, allocations, stock moves, document numbers |
| `ApprovalConcurrencyTest` | two real DB connections approve the same revision → exactly one posting; approve racing withdraw; duplicate idempotency key with same and different payloads |
| `ApprovalAuthorizationTest` | self-approval blocked; foreign tenant id 404s; another employee's draft inaccessible; forged `source=pos` / `approved_by` / `approval_status` ignored |
| `ApprovalRevalidationTest` | invoice settled between submit and approve → approval fails cleanly, no partial effects |
| `PosExemptionTest` | ordinary cashier sale still posts immediately with stock, tax, loyalty unchanged; admin invoice cannot forge POS eligibility |

Run against MySQL via `tests/phpunit.xml`. For the concurrency test use two genuine connections — a single rolled-back transaction does not simulate a race.

**At the end of Step 2 you can demo the feature your prospect asked for.** Stop here and show them.

---

## Step 3 — Dashboard cards for the roles that have none (1-2 weeks)

Do this only after the demo, and do it knowing what D1 established: **`config/dashboard_pool.php` is dead configuration.** 24 of its 31 keys do not exist in `cards.json`, `DEPRECATED_MAP` is empty, and `DashboardSanitizer` silently drops unknown keys. The four role presets resolve to nothing.

So this is not "extend the presets." It is "author presets for the first time, against the real key namespace."

### 3a. Fix the namespace first

Either rewrite `dashboard_pool.php` against real catalogue keys (`core.revenue`, `core.net_profit`, `core.receivables`, `core.gross_margin_pct`, …) or populate `DashboardSanitizer::DEPRECATED_MAP` to translate the old names. **Rewrite is cleaner** — the old names encode an abandoned scheme and keeping a translation layer preserves the confusion.

While you are there: make the silent drop loud. `DashboardSanitizer` should log a warning when it discards a key that came from a *config preset* (as opposed to a user's saved layout). This bug survived because nothing complained.

### 3b. Add the cards that do not exist

Your prospect's workflow needs cards the catalogue does not have. Build these first, since they are what makes the approval feature visible on a dashboard:

- `work.my_pending` — my submissions awaiting review
- `work.my_returned` — sent back to me for correction
- `work.assigned_reviews` — waiting on me
- `work.oldest_review_age` — how stale is my queue
- `pos.my_shift_sales`, `pos.my_shift_count`, `pos.my_drawer_variance` — the honest version of B05

**Before building the `pos.my_*` and `work.my_*` cards, you must fix the Reckoner cache key.** This is Codex's most valuable forward-looking catch and it is not optional.

`Reckoner::cacheKey()` (line 713) currently keys on tenant + metric + period + granularity + args. **No user. No scope.** That is safe today only because every card returns a uniform store aggregate. The moment you add "my shift sales," cashier A's numbers get cached and served to cashier B.

Add to the cache key: a server-derived scope fingerprint, a permissions version, and a data-contract version. Extend `ReckonerContext` (currently just `?Tenant $tenant, User $user`) with immutable effective scope. Test both warm-cache orders — A-then-B and B-then-A.

### 3c. `CardRegistry::validateCatalog()`

Line 106 hard-asserts exactly 349 cards and throws otherwise. Adding cards breaks the app at boot. Update the invariant deliberately: keep a versioned snapshot of the original 349 keys for parity checks, enforce uniqueness and contract-completeness for the expanded set, and update the golden fixtures. Do not just bump the number.

New cards start as `implemented_unverified` until their calculation and access tests pass.

### 3d. Presets for the roles that need them

Author presets for the roles your customer actually employs — cashier, accountant, manager, purchasing_officer — using Codex's role table in doc 01 as the content guide. It is good work; use it.

Not all 18 roles. Do the four to six you will actually deploy, and leave the rest falling back to the business-type default, which at least resolves to real keys.

---

## Step 4 — Per-card access contracts (2-3 weeks, deferrable)

This is Codex's Phase 5 and its 349-row appendix. It is correct and it is a lot of work.

Do it when you are moving beyond this one customer, not before. The reason it is safely deferrable: today's cards return uniform store aggregates and the ANY-of permission gate, while too coarse, is not currently leaking per-user data — because there is no per-user data. Step 3b is what changes that, and Step 3b carries its own scope-fingerprint fix.

When you do it:

- `config/dashboard_access.php` with an explicit entry per card key; unknown keys **denied** by default
- Codex's contract shape (`view.all` / `view.any` / `scope` / `sensitivity` / `drill` / `export` / `actions` / `policy_version`)
- Enforce in `Reckoner` availability **and** read paths, before cache access
- Enforce in `Api/ReckonerController` catalogue **and** measure library
- Enforce again at every drill and export endpoint — a hidden button is not protection
- Export requires the view profile **AND** `data.export`, combined with AND, not the existing comma-separated OR middleware convention

Codex's warning here is worth repeating: do not mechanically convert every current ANY to ALL. Rewrite each contract on purpose. `reports.summary` appearing as an alternative must not keep granting profit, cost, payroll or contact data.

Its profile table (FIN / SALES / BUY / STOCK / COST / PROFIT / PEOPLE / CONTACTS / OPERATIONS) is a sound starting taxonomy. The appendix's per-card assignments are a reasonable first pass but were derived from metadata, not from reading each card's payload — treat them as a draft to review, not a finished mapping.

One test design note from Codex worth keeping: the existing `L6PermissionLawTest` derives its expectations from the registry's own permission lists, so a wrong grant in the registry makes the test pass by definition. Add an independent expectation fixture.

---

## Step 5 — Permission model cleanup (1 week)

**B03** — the `[]` ambiguity. Add explicit `permissions_mode` (`inherit` | `custom`) to `tenant_users`, plus `permissions_version` for cache invalidation. Update every save path including `StaffInvitationController` (which writes `[]` as a default, so existing empties do not reliably mean "deny all") and `Store/Staff/Index.jsx`.

Migrate conservatively: treat existing `[]` as **inherit**, report the affected memberships, and require explicit custom-empty going forward. Codex is right that blanket-converting to deny-all will lock staff out of live stores.

**B06** — replace the invented aging fractions with real invoice-level outstanding amounts grouped by actual due date in store-local time, reconciled to the AR/AP control accounts. Prefer the existing verified aging/report services after a parity check rather than writing a third calculation. Replace the hardcoded `pendingJournalCount => 0` with the real approval-queue count now that one exists.

**B08** — a `DashboardPolicy` covering index/show/reset/publish consistently: a shared template with `null` user_id must still check `for_role` on `show()`, not only on `index()`.

**Follow-up from Codex's list, worth doing here:** `PaymentController::store()` uses unscoped `exists:parties,id` and `exists:bank_accounts,id`. Replace with tenant-constrained `Rule::exists`. Downstream engines may already reject foreign references, but validation should not depend on that.

---

## Step 6 — Wider rollout (open-ended)

Only after the above, and only as the customer base justifies it:

- Remaining document adapters — purchase bills, manual journals, funds, transfers, returns, debit notes, advances, payroll, assets, loans
- **The full call-site matrix.** 44 files call `createEntry()` across 81 sites. Inventory every one, including `Observers/SaleObserver`, `Engines/SettlementService`, `Engines/ManufacturingService`, the SmartCapture / WooSync / VenSynQ services, and the three Artisan commands, before enforcing a required `PostingContext` at the engine boundary. Codex's warning is exact: adding a required argument to `createEntry()` without migrating callers breaks everything.
- `Api/SyncController.php:242-245` — replace the `new Request($orderData)` → `SaleController::store()` replay with a proper application command returning per-item pending/posted/conflict state
- `transaction_outbox` for idempotent external delivery, once tax submission or third-party effects sit on the approval path
- `pending_cash_custody`, once you have agreed the physical-cash process with the customer
- Recurring invoices, imports and marketplace ingestion under an explicit system principal — never `auth()->id() ?? 1`
- Remaining role presets and V6 migration for all 18 roles

---

## Sequence summary

| Step | Work | Rough effort | Gate |
|---|---|---|---|
| 0 | Delete the payment-date rewrite | 1 hour | **Today** |
| 1 | B02, B05, B04, B07 | 3-5 days | Before anything is shown to a customer |
| 2 | Approval spine, 4 document types | 2-3 weeks | **Demo here** |
| 3 | Fix dead preset namespace, work/shift cards, cache scoping | 1-2 weeks | Before promising role dashboards |
| 4 | 349-card access contracts | 2-3 weeks | Before broad multi-role sale |
| 5 | Permission mode, real aging, dashboard policy | 1 week | Before scale |
| 6 | Remaining adapters, full posting boundary | open | As demand requires |

Steps 0 and 1 are not optional and not reorderable. Step 2 is the product. Everything after is hardening you can sell against while you build.

---

## What to tell your developer

Three things, in this order:

1. **Delete the three lines in `PaymentController::index()` today.** Do not refactor them. Delete them.
2. **Treat `docs/approval-dashboard-audit-2026-09-22/02-technical-change-specification.md` as the architecture reference** — the schema, the adapter contract, the approve-transaction algorithm and the invariants are correct and should be followed closely. But build only the four document types in Step 2, and do not touch the other 40 `createEntry()` call sites yet.
3. **Ignore doc 01's claim that `config/dashboard_pool.php` presets can be "extended."** They reference a dead key namespace; 24 of 31 keys do not exist in the catalogue and `DashboardSanitizer` drops them silently. Role presets are a from-scratch job, and it comes after the approval demo, not before.

And one rule to hold the line on, because it is the one that gets compromised under deadline pressure: **a pending document never touches a financial table.** Not even with a status column. Not even filtered out at read time.
