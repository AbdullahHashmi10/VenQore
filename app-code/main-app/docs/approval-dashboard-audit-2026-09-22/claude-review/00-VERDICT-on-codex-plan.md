# Verdict on the Codex audit and plan

Date: 22 September 2026. Reviewer: independent re-audit of `app-code/main-app` against Codex's three documents.

## Bottom line

**Follow Codex's plan. Do not rewrite it.** I independently verified its claims against the source and every material finding holds. The architecture is correct, the invariants are the right ones, and the bug evidence is accurate down to the line.

But **do not hand it to your IDE as-is.** It has four problems that will cost you real money and time if uncorrected:

1. It **misses a defect that invalidates its own central premise** about the V6 dashboard work (see D1 below — this is the big one).
2. It **understates the integration surface** by roughly 3x, which will wreck any schedule built on it.
3. It is **scoped far beyond what your prospect actually asked for**, and following it in order means you do not ship to that customer for months.
4. It **has no sequencing that produces a demoable product early**, which is what you need for a sale in progress.

My recommendation: take Codex's documents as the *architecture reference*, and execute against the resequenced plan in `01-what-to-actually-build.md`. That plan reaches a sellable demo in roughly a third of the work, without building anything you would later throw away.

---

## What I verified (claim by claim)

I read the code for every bug Codex listed. All eight confirmed, exactly as described.

| Codex finding | My verification | Verdict |
|---|---|---|
| B01 unscoped raw date rewrite in `PaymentController::index()` | `PaymentController.php` line 60: `DB::statement('UPDATE payments SET date = DATE(created_at) WHERE sale_id IS NOT NULL AND date != DATE(created_at)')` — no tenant predicate, runs on a GET page load. Two `Payment::where(...)->update(...)` type-normalizations run alongside it. | **Confirmed. Worse than stated — see D2.** |
| B02 sensitive props bypass card gate | `DashboardController.php` builds debtor names/phones/balances and charity totals outside the finance check; `$canSeeSales` satisfied by checkout/create/edit. | **Confirmed** |
| B03 empty `[]` override falls back to role defaults | `User.php:412` `!empty($membership->permissions)` — an explicit empty array falls through to `config('permissions.'.$role)`. | **Confirmed** |
| B04 middleware vs `hasPermission()` disagree | `User.php:230` returns `true` for *any* permission if role is owner/admin; `CheckPermissions.php` instead tests `in_array($permission, $user->permissions)` against the possibly-narrower custom array. Two different answers to the same question. | **Confirmed** |
| B05 cashier "session total" is the whole store | `DashboardController.php:58,62` filter on `tenant_id` + `status=posted` + `whereDate('posted_at', today())`. **No user, register or shift filter at all**, under a comment claiming "sales created by this user today". | **Confirmed** |
| B06 aging buckets are invented fractions | Lines 126-138: `overdue_30 => round($outstanding['receivables'] * 0.3, 2)`, and 0.15 / 0.05 / 0.02; payables 0.2 / 0.5 / 0.1. `'pendingJournalCount' => 0` hardcoded. | **Confirmed** |
| B07 `getActiveMembership()` cross-store fallback | `User.php` — tenant-bound branch returns null-through on miss, then falls to `current.membership`, then `last_store_id`, then *first active membership of any store*, and `updateQuietly`s `last_store_id` while answering an authorization question. | **Confirmed** |
| B08 shared dashboard `show()` ignores `for_role` | `Api/DashboardController.php` — `index()` filters by `for_role`, `show()` only rejects a different personal owner. | **Confirmed** |

Codex's architectural claims also hold:

- No approval infrastructure exists. No `ApprovalDocument` model, no approval tables, no migrations. `approval_status` appears only on `Invoice` and `PurchaseOrder` as unrelated fields. **This is genuinely a build-from-zero feature.**
- `Api/SyncController.php:242-245` really does construct a `new Request($orderData)` and call `SaleController::store()` directly. Codex is right that this must not be the approval mechanism.
- `Reckoner.php` gates on ANY-of permissions (`passesPermissions`, line 751) and `cacheKey()` (line 713) keys on tenant + metric + period + granularity + args — **no user, no scope**. Codex is right that this is safe today only because results are uniform store aggregates, and becomes a cross-user data leak the moment you add "my shift" cards. This is the single most important forward-looking warning in its documents.
- `ReckonerContext` holds exactly `?Tenant $tenant` and `User $user`. No scope. Extension is required as stated.
- `config/permissions.php` has 18 role entries. `cards.json` has exactly 349 entries: 63 verified, 229 implemented_unverified, 57 unimplemented. `CardRegistry.php:106` hard-asserts `count($cards) !== 349` and throws. Codex correctly flags that adding cards breaks this assertion.

So: the foundation of its analysis is sound. Now the problems.

---

## D1 — The defect Codex missed, and why it changes the plan

**The role dashboard presets are almost entirely dead code. 24 of the 31 card keys in `config/dashboard_pool.php` do not exist in the 349-card catalogue.**

I cross-checked every key in `dashboard_pool.php` against `cards.json`:

```
Distinct keys in dashboard_pool.php : 31
Present in cards.json               : 7
MISSING from catalogue              : 24
```

The missing keys include `sales.revenue`, `sales.revenue_trend`, `sales.top_products`, `sales.payment_breakdown`, `sales.gross_margin_pct`, `finance.net_profit`, `finance.receivables`, `finance.payables`, `finance.total_liquidity`, `finance.receivables_aging`, `party.customer_count`, `purchasing.spend`, `restaurant.tables_occupied` — essentially the entire preset vocabulary.

The real catalogue uses a different namespace: `core.revenue`, `core.net_profit`, `core.receivables`, `core.gross_margin_pct`, `accounting.balance_sheet`, and so on. **`dashboard_pool.php` was written against an older, abandoned key scheme and never migrated.**

Why this matters, traced through the code:

1. `FrameFiller::pool()` (line 211) returns `config('dashboard_pool.roles')[$role]` for cashier/accountant/purchasing_officer/viewer.
2. That array is handed to `DashboardSanitizer::sanitize($cards, $availableKeys)`.
3. `DashboardSanitizer` line 75: `if (! in_array($readingKey, $availableKeys, true)) { continue; }` — silently drops every unknown key. `DEPRECATED_MAP` is **empty** (only a commented-out example), so nothing is remapped.
4. Result: the cashier preset yields **at most one surviving card** (`staff.on_shift_count`), and that one requires `admin.staff_view`, which cashiers do not have — so it is dropped too.

**A cashier's V6 preset resolves to zero cards.** Same story for the other three role presets. This is not a theoretical gap.

### Why this breaks Codex's premise

Codex's doc 01 states: *"`config/dashboard_pool.php` already includes role pools; `FrameFiller` filters candidate availability... Audit and extend presets rather than starting again."*

That is wrong, and it is wrong in the direction that causes the most damage. Codex treats presets as an existing asset to refine. They are **non-functional configuration referencing a dead namespace**. Its Phase 6 ("All role presets and missing operational cards") is budgeted as an extension of working code; it is actually a from-scratch authoring job for all 18 roles against the real key vocabulary.

Hand this to your IDE as written and they will spend a day trying to "extend" presets before discovering nothing in them resolves — and the silent-drop behavior means there is no error, no log, no warning. Just empty dashboards.

**There is one piece of good news buried in this.** Codex's doc 03 argues that cashiers currently see too much, and cites the preset granting `sales.gross_margin_pct`. Because that key does not exist, **cashiers are not currently leaking gross margin through V6 presets.** The real cashier exposure is B02 and B05 on the *legacy* `CashierDashboard.jsx` path — which is what they actually get today, since `DashboardController::index()` routes them to `cashierDashboard()`, not to V6 at all. This narrows your urgent security surface, and I have re-prioritized accordingly.

---

## D2 — B01 is more dangerous than Codex says

Codex correctly identifies the raw `UPDATE` as unscoped. It does not emphasize two things that change the severity:

1. **The two Eloquent normalizations above it (`type` `received`→`in`, `sent`→`out`) are also effectively unscoped in practice.** Codex notes they "must be distinguished" but leaves it open. They are `Payment::where('type','received')->update(...)` — whether these stay in-tenant depends entirely on whether the global tenant scope applies to mass `update()` on this model. That needs a direct test, not an assumption, because if the scope is not applied these rewrite payment *types* across every tenant on the platform.

2. **It fires on a page view, which means it has almost certainly already run in production, repeatedly.** This is not a latent risk. Any payment attached to a sale whose accounting date legitimately differed from its creation date has had that date overwritten — every time anyone opened the payments list. Codex says "preserve backups and logs if investigating historical B01 effects," which is right but too quiet.

**Action:** this is not a "P1, fix before pilot." This is a "delete these three lines today, before any other work in this plan." It costs five minutes and it is actively corrupting data on every page load. Then separately assess historical damage from backups. I have put it as step 0.

---

## D3 — The integration surface is ~3x larger than doc 02 implies

Doc 02's table of "existing integration files" lists roughly 15 controller families. I counted the actual posting call sites:

**44 distinct files call `AccountingService::createEntry()`** — 81 call sites total.

That includes paths doc 02 mentions only in a catch-all row ("V3 customer/supplier advance, opening-balance, payroll..."), plus several it does not name at all: `CharityController`, `DebitNoteController`, `PartyController`, `SalesOrderController`, `V3/CashShortageController`, `V3/DisasterClaimController`, `V3/BadDebtController`, `V3/FiscalYearController`, `Engines/SettlementService`, `Engines/ManufacturingService`, `Engines/InventoryService`, `Observers/SaleObserver`, `Services/SmartCapture/TransactionBuilderService`, `Services/VenSynQ/MarketplaceSettlementService`, `Services/WooSync/WooOrderPoster`, and three Artisan commands.

To its credit, doc 02 explicitly hedges — *"observed principal paths and integration families, not a claim that every raw financial write has been exhaustively inspected"* — and makes "produce a checked route/action/command matrix" the first task. That is the correct instruction. But anyone reading the table and estimating from it will underestimate by a factor of three, and `Observers/SaleObserver` calling `createEntry` is a genuinely nasty one: a model event that posts to the ledger will not be intercepted by any controller-level approval guard.

**This is the strongest argument for my resequencing.** You cannot gate 44 call sites safely in one pass. You should not try. Gate the four your customer actually cares about, behind a policy that denies everything else by default.

---

## D4 — Scope vs. what your customer asked for

Your prospect asked for two things:

1. Cashier/admin staff create invoices, receipts, vouchers and tokens → they go to **pending**, not the ledger → owner/manager approves → *then* it posts.
2. The approver can **send it back** with a **preset reason + a note**, so the employee fixes it and resubmits, rather than the approver editing it themselves.

Codex's plan delivers both — correctly, and with the right invariants. But it delivers them inside a 7-phase program that also includes: a canonical permission resolver rewrite, a per-card access contract for all 349 cards plus scope fingerprinting in cache keys, V6 migration for all 18 roles, an outbox with idempotent external delivery, pending cash custody reconciliation, versioned policy tables, and full test matrices for each.

Every one of those is *defensible*. Several are genuinely required before a wide release. **None of them is required to show this customer a working maker-checker flow**, and Phases 0-1 alone (baseline + eight bug fixes + permission resolver unification + an `[]` migration strategy) will consume weeks before a single approval screen exists.

You are a solo founder with a large firm evaluating you against an incumbent that already has this feature. The sequencing has to put a demoable flow first.

Two specific over-reaches worth calling out:

- **"Owner/administrator roles are not an automatic exception to separation of duties."** Correct for a bank. Wrong default for your market. In a Pakistani retail/wholesale firm the owner *is* the approver, and a product that refuses to let the owner post their own entry will be seen as broken. Ship owner-can-self-post as the default, with a store setting to enforce separation for those who want it.
- **The `[]` → `inherit`/`custom` migration (B03).** Codex is right about the semantics and right to warn against blanket-converting. But this is a schema change touching every staff-permission save path, and it blocks nothing in the approval flow. It belongs after your demo, not before it.

---

## Where Codex is exactly right, and you should not negotiate

These are the parts to keep verbatim. They are the difference between a feature that works and one that loses somebody's money:

1. **Pending documents live outside the financial tables.** No "pending journal" filtered out at read time. Every report, every balance, every aging bucket would eventually forget the filter. This is the single most important design decision in the document and it is correct.
2. **Approval and posting are one atomic transaction, keyed by an idempotency key, with `lockForUpdate()`.** Two managers double-tapping approve must post once. Codex's algorithm (verify → lock → check idempotency → revalidate → post → record → commit → dispatch after commit) is right as written.
3. **Revalidate at approval time, not submission time.** The invoice may have been paid elsewhere, stock may be gone, the period may be closed, the submitter's permission may be revoked. Approving a three-day-old snapshot without rechecking is how you post a payment against a settled invoice.
4. **Immutable revisions.** Return-for-correction creates a *new* revision; the old one stays readable. This is the entire audit value of the feature and the reason your prospect's incumbent has it.
5. **Never trust `source=pos`, `approved_by`, `approval_status`, or a `skip_approval` flag from the request.** Server-derived only. Codex is emphatic here and should be.
6. **Reviewers do not edit submissions.** Return with reasons; the author fixes it in the original editor. This is precisely what your prospect asked for and Codex specified it correctly, including "Other requires a note".
7. **The preset return reasons.** Codex's list — incorrect party, incorrect amount, incorrect date, wrong payment account/method, incorrect items/quantity/tax/discount, missing attachment, duplicate, allocation mismatch, other — is well-chosen. Ship it as-is.
8. **Physical cash received before approval must show as "received, awaiting verification" with a named custodian, and must not sit in posted cash/AR.** Subtle, real, and the kind of thing that causes an ugly argument with a customer three months in.
9. **POS checkout stays immediate.** You raised this yourself and Codex agrees. Correct — but the enforcement must be a server-side typed command, not a client-supplied flag.
10. **The Reckoner cache-key warning.** Adding `pos.my_shift_sales` on a tenant-only cache key serves cashier A's numbers to cashier B. Non-obvious, high-severity, and Codex caught it.

---

## Summary judgment

| Dimension | Assessment |
|---|---|
| Bug evidence accuracy | Excellent — 8/8 confirmed at the line level |
| Architectural soundness | Excellent — invariants, atomicity, revisions, revalidation all correct |
| Completeness of current-state audit | **Good but with one critical miss (D1) and one understatement (D3)** |
| Fitness of sequencing for your situation | **Poor — inverted; security cleanup before anything demoable** |
| Market-fit of defaults | Mixed — separation-of-duties default is wrong for your customers |
| Safe to hand to your IDE unmodified | **No** |
| Safe to use as the architecture reference | **Yes** |

Codex did strong work. The gap is not analysis quality — it is that it audited the system as an auditor rather than planning as a founder with a deal in progress and one developer.

Read `01-what-to-actually-build.md` next. It keeps Codex's architecture intact and reorders the work so you have something to show in weeks rather than months, with the genuinely urgent security items pulled to the front and the rest deferred behind a feature flag.
