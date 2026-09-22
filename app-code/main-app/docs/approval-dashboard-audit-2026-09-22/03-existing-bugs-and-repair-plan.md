# Existing defects: evidence and repair specification

Date: 22 September 2026. Source audit only; fixes and regression tests below have not been implemented or executed. Locations refer to the inspected working tree in `app-code/main-app`; line numbers may move because unrelated work is present.

These defects are separate from the missing approval feature. Priority P1 means fix before pilot because it affects data integrity, sensitive data or authorization. P2 means material correctness/access behavior requiring repair. “Confirmed” means the problematic code path is present, not that an exploit was demonstrated against a running deployment.

## B01 — Payments list rewrites dates across tenants (P1, confirmed)

**Evidence:** `app/Http/Controllers/PaymentController.php:60`, inside `index()`:

```sql
UPDATE payments SET date = DATE(created_at)
WHERE sale_id IS NOT NULL AND date != DATE(created_at)
```

The raw statement has no tenant predicate and executes during a normal non-JSON list request. Eloquent tenant scopes do not apply to raw SQL. It can replace legitimate accounting/payment dates with creation dates in every tenant. Type-normalization updates also run in this read endpoint, although their Eloquent scope must be distinguished from the unscoped raw statement.

**Repair:** remove all normalization writes from the list action. If legacy repair is genuinely required, implement a separate dry-run-first tenant-scoped command with backup/audit, an explicit row selection and evidence of incorrect dates. Do not run that repair automatically on deployment. Do not assume `created_at` is the correct transaction date. Investigate historical changes using backups/audit evidence; the source audit cannot reconstruct lost dates.

**Regression:** create two tenants with legitimate backdated payments; GET the list as tenant A and assert neither tenant's dates/types change. GET and JSON list results remain read-only. Test any separate repair command's tenant selection and dry-run mode.

## B02 — Dashboard sends sensitive data beyond its intended card gate (P1, confirmed)

**Evidence:** `app/Http/Controllers/DashboardController.php:492`, `:499`, `:678`, `:688` build charity totals and debtor records without the surrounding finance permission check. Debtor responses include names, phones and balances. `fullDashboardExperimental()` is reached by `/new-dashboard` (`routes/web.php:1168`), and these values are included as Inertia props. At `:558` checkout/create/edit is enough for `$canSeeSales`; `getSalesStats()` includes gross profit, COGS and expenses, and the product data block also includes profit/margin.

**Impact:** hiding a card does not remove JSON props already delivered to the browser. A user with checkout-level access can receive more business information than required for their own work, and unrelated low-permission members can receive unguarded debtor/charity props when they can access this dashboard route.

**Repair:** immediately permission-gate and field-filter every sensitive prop on both dashboard builders. Prefer replacing V6's legacy bulk props with a shared presenter and scoped Reckoner reads. Separate profit/cost/contact access from ordinary sales or inventory permission. Review all aliases, not just the default role dashboard. Filtering the catalogue alone does not fix this.

**Regression:** authenticated cashier, custom-empty and inventory-only requests to `/dashboard`, `/dashboard-v1` and `/new-dashboard`; recursively assert absence of debtor contacts, profit, COGS, company balances and unauthorized arrays. Positive tests grant the specific capability and verify only authorized scope is returned.

## B03 — Empty permission override restores role defaults (P1, confirmed semantics; migration needed)

**Evidence:** `app/Models/User.php:412` uses `!empty($membership->permissions)` before honoring custom permissions. An explicit empty array therefore falls through to `config('permissions.' . $role)`. `StaffInvitationController` also writes `[]` as a default, so not every existing empty array signifies an intentional deny-all.

**Impact:** the representation cannot distinguish “inherit this role” from “I removed every permission.” Implementing dashboard access on top of it could restore permissions an administrator expected to remove.

**Repair:** add explicit `permissions_mode` (`inherit` / `custom`) or equivalent nullable semantics, update all save/invitation/provisioning paths, and centralize resolution. Custom `[]` must resolve to no grants. Preserve historical inherit intent through a migration/report; do not blanket-convert existing `[]` to deny-all and lock staff out.

**Regression:** role default, custom nonempty, custom empty, null/inherit, invitation acceptance and subsequent changes; both serialized permissions and every backend authorization method agree.

## B04 — Permission middleware and hasPermission disagree for restricted administrators (P1, confirmed)

**Evidence:** `app/Models/User.php:230` returns true for any permission when active role is owner/admin. `getPermissionsAttribute()` can return a narrower custom array. `app/Http/Middleware/CheckPermissions.php` checks that array directly, whereas Reckoner and dashboard edit checks call `hasPermission()`.

**Impact:** the same member can be denied a route but allowed equivalent data or actions through another code path. This is particularly dangerous for future approval rights and sensitive dashboard data. This finding does not assume platform administrator behavior is the same as store membership behavior.

**Repair:** implement one canonical resolver and make all consumers use it. Keep owner recovery/full-control semantics explicit and consistent; allow restricted store administrators only their effective grants. Define whether an owner may be restricted rather than letting two methods disagree. Audit wildcard handling and frontend `usePermission` behavior against the same server result. Keep platform access policy separate.

**Regression:** owner, restricted admin, custom role, platform admin and removed member through route middleware, Reckoner catalogue/read, layout publish and approval actions. Identical grant questions must produce identical answers.

## B05 — Cashier session metrics actually total the entire store (P2, confirmed)

**Evidence:** `app/Http/Controllers/DashboardController.php:58` and `:62` filter by tenant, posted status and today, without an employee, register or shift filter. The adjacent comment describes sales created by this user, and the response calls this a session total.

**Repair:** define “my shift” using the canonical register-shift relationship and cashier assignment. Inspect the in-progress `RegisterShift` integration before selecting columns. Use store timezone boundaries. If historical transactions have no shift mapping, expose a clearly labeled own-day metric only when authorship is reliable; do not infer individual sales from all-store totals. Use the same scope in V6 replacements.

**Regression:** two cashiers in one store, multiple shifts crossing midnight, another store, returns and missing legacy assignments. Cashier A must never receive B's totals; a manager's all-shift view requires its own grant.

## B06 — Accountant aging buckets contain invented percentages (P2, confirmed)

**Evidence:** `app/Http/Controllers/DashboardController.php:128` onward calculates overdue receivables as fixed fractions of the total (30%, 15%, 5%, 2%); payables due/overdue use similar fractions. `pendingJournalCount` is hardcoded to zero at `:149`.

**Repair:** replace aging with invoice-level outstanding amounts after valid allocations, grouped by actual due date and tenant-local as-of date. Use mutually exclusive, documented bucket boundaries and reconcile to AR/AP control accounts, explaining unapplied credits/advances. Prefer existing verified aging/report services after parity checks rather than another calculation. Remove the fake pending count until a real defined source exists; use the new approval queue count after implementation. Migrate accountant role to V6 without carrying these placeholders forward.

**Regression:** known due dates in every bucket, partially settled invoices, unapplied credits, future due dates, reversed/voided entries, timezone boundaries and empty store. Bucket sums reconcile, not just chart rendering. No amount may be generated from a fixed allocation percentage.

## B07 — Active-membership resolver can fall back to a different store (P1 hardening, confirmed fallback; runtime reachability needs test)

**Evidence:** `app/Models/User.php::getActiveMembership()` queries the bound tenant around line 264. If no membership is found, it continues to `current.membership` and `last_store_id`/first-store fallbacks around lines 275–295. The bound-membership branch verifies user and status but not equality with the already bound tenant.

**Impact:** the method itself can return store B's active membership while resolving permissions for store A. Tenant middleware may stop many ordinary requests first; this audit has not demonstrated a reachable HTTP exploit. Controller/service calls and long-running contexts must not rely on that outer protection.

**Repair:** when `current.tenant` exists, resolve an active membership for exactly that tenant and user, or return null. No cross-store fallback in that branch. Apply fallback only in an intentionally tenantless hub workflow. Reset memoized membership on context changes and test long-lived service/job usage. Do not quietly mutate last_store_id while answering an authorization question.

**Regression:** bound tenant A with membership only in B, mismatched current.membership, revoked membership, tenant switch within the same process and no-tenant hub selection. A-context grants must be empty without A membership.

## B08 — Shared dashboard detail ignores role audience (P2, confirmed metadata access gap)

**Evidence:** `app/Http/Controllers/Api/DashboardController.php::index()` filters shared dashboards by `for_role`; `show()` around lines 137–140 rejects only a different personal owner. A shared dashboard with null user_id passes regardless of for_role. Card data is separately filtered by Reckoner, which limits the impact; this is not proof of unrestricted financial reading.

**Repair:** create a DashboardPolicy with consistent own/shared-role/publisher rules for index/show/reset/publish. Require same-role membership or explicit publisher access to shared templates. Sanitize card metadata and secondary reading keys uniformly. Validate target roles against the supported role registry when publishing.

**Regression:** cashier can open own and cashier template, cannot guess another role's private template ID; publisher behavior explicit; cross-tenant always denied; permitted template still strips cards whose grants were revoked.

## Follow-up risks, not separately proven incidents

- `PaymentController::store()` uses unscoped `exists:parties,id` and `exists:bank_accounts,id`. Some downstream model/engine checks may reject foreign references; trace those before claiming exploitable cross-tenant posting. Replace with tenant-constrained Rule::exists and assert no writes on foreign IDs regardless of downstream defenses.
- V6 catalogue generation has no user parameter; measure-library listing checks modules rather than full card sensitivity. Audit metadata exposure and unify the availability contract. Do not equate metadata availability with proven numerical data disclosure.
- Tenant-only Reckoner cache keys are not by themselves a current leak for uniform store-level results. They become unsafe once own/assigned scopes are introduced unless scope is part of the cache key.
- Many cards have broad permission labels and 57 are marked unimplemented. These are feature/access-design gaps requiring the complete matrix in document 02, not 57 separately demonstrated arithmetic bugs.

## Repair order and verification limits

First stop B01's read-triggered mutation and B02's unnecessary sensitive props. Then unify membership/permission resolution (B03/B04/B07) before implementing approval rights. Repair B05/B06 while migrating role dashboards; repair B08 with shared dashboard policies. Each repair should have its own failing regression test before the fix, then pass against MySQL using the canonical test configuration.

No database corruption extent, affected user count or deployment exploitability was measured in this audit. Preserve backups and logs if investigating historical B01 effects. Do not describe these repair plans as completed fixes or this source audit as a full-system security certification.
