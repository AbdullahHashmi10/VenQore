# Part A — Dashboard Card Audit

**Scope:** `resources/js/Pages/Dashboard.jsx`, `resources/js/Pages/Admin/Dashboard.jsx`, `resources/js/Pages/Admin/ExecutiveDashboard.jsx`, `resources/js/Pages/Dashboards/AccountantDashboard.jsx`, `resources/js/Pages/Dashboards/CashierDashboard.jsx`, `resources/js/Pages/Dashboards/PurchasingDashboard.jsx`, `resources/js/Pages/Dashboards/ViewerDashboard.jsx`. Excludes the duplicate project trees per instructions.

There is **no single "Dashboard" component** in this codebase — there are at least 7 distinct dashboard files. Which one a user sees is decided server-side by role (not traced to the controller in this pass — see Open Questions), and *within* the main one (`Dashboard.jsx`) individual cards are further hidden by a local permission check. The other role dashboards (Admin Hub, Executive Dashboard, Accountant, Cashier) render their entire card set unconditionally — there is no per-card gating inside those files at all.

---

## 1. `resources/js/Pages/Dashboard.jsx` (the main/default dashboard — "OneGlance" layout)

This is the only dashboard file found with **per-card conditional rendering**.

**Gating source:** a **local, ad-hoc permission check**, not the plan-entitlement system (`PlanGate`/`usePlan`/`plan.feature`). Quote (lines 37–46):

```jsx
const { auth, store } = usePage().props;
const isAdmin = auth?.user?.role === 'platform_admin' || auth?.user?.role === 'admin' || auth?.user?.role === 'owner';

const userPerms = auth?.user?.permissions || [];
const hasPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
const canSales = isAdmin || hasPerm('sales', 'reports');
const canFinance = isAdmin || hasPerm('finance');
const canInventory = isAdmin || hasPerm('inventory');
const canReports = isAdmin || hasPerm('reports');
const canPurchases = isAdmin || hasPerm('purchases');
```

`canReports` is computed but never referenced anywhere else in the file (dead variable) — worth flagging separately, not part of this brief's scope but noted.

**Hide mechanism:** JSX short-circuit — `{canX && (<div>...</div>)}` — i.e. the card element is **not mounted at all** when the condition is false (equivalent to `return null` for that fragment). This is a true conditional-render, not `display:none`/`visibility:hidden`.

**Cards and their exact gating conditions (all four are role/permission-based, none are plan-feature based):**

| Card | Condition | Line |
|---|---|---|
| Performance (Total Revenue / Gross Profit) | `{canSales && (...)}` | `Dashboard.jsx:147` |
| Outstanding (To Receive / To Pay) | `{canFinance && (...)}` | `Dashboard.jsx:163` |
| Net Profit | `{canFinance && (...)}` | `Dashboard.jsx:179` |
| Right Panel (recent transactions, bank/cash accounts, inventory value) — desktop | `{(isAdmin \|\| auth?.user?.role === 'manager' \|\| auth?.user?.role === 'accountant') && (...)}` | `Dashboard.jsx:231` |
| Right Panel — mobile drawer variant | same condition | `Dashboard.jsx:92` |
| Sales Chart | `{canSales && (...)}` | `Dashboard.jsx:244` |
| Today's Opportunities | `{isAdmin && (...)}` | `Dashboard.jsx:250` |
| Top Products table | `{canSales && (...)}` | `Dashboard.jsx:259` |
| Low Stock Alerts table | `{canInventory && (...)}` | `Dashboard.jsx:311` |
| "Order" button inside Low Stock card | `{(auth?.user?.role === 'owner' \|\| ... \|\| auth?.user?.permissions?.includes('purchases')) && (...)}` (a *third*, independently-written permission check, inline, comment-tagged `// PROBLEM 7 FIX`) | `Dashboard.jsx:329` |
| Recent Purchases table | `{canPurchases && (...)}` | `Dashboard.jsx:350` |

**Layout behavior on card removal — CSS/layout bug or logic bug?**

The outer container is CSS Grid with explicit spans, not flexbox that auto-reflows:

```jsx
<div className="grid grid-cols-12 lg:grid-rows-6 gap-6 lg:h-[calc(100vh-5rem)] h-auto w-full ...">
```
(`Dashboard.jsx:144`)

Individual cards use fixed `col-span-*`/`row-span-*` (e.g. `"col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-1"` at line 148). **However**, the component does *not* rely on the grid auto-flowing around gaps blindly — it explicitly recalculates span classes in JS before render based on which cards are visible:

```jsx
let topProductsSpan = "col-span-12 md:col-span-8 lg:col-span-6";
let lowStockSpan = "col-span-12 md:col-span-4 lg:col-span-3";
let purchasesSpan = "col-span-12 md:col-span-4 lg:col-span-3";

if (canSales && canInventory && canPurchases) { ... }
else if (canSales && canPurchases) { ... }
else if (canInventory && canPurchases) { ... }
else if (canPurchases) { ... }
```
(`Dashboard.jsx:48–65`)

**Finding:** This is a **partial mitigation, not a complete fix** — it only covers the three bottom-row table cards (Top Products / Low Stock / Purchases) and only for specific combinations of `canSales`/`canInventory`/`canPurchases` being simultaneously true. It does **not** have an `else` branch covering every possible subset (e.g. `canSales && canInventory` with `canPurchases` false, or `canInventory` alone) — those fall through to the original hardcoded default spans (`col-span-12 md:col-span-8 lg:col-span-6` / `md:col-span-4 lg:col-span-3` / `md:col-span-4 lg:col-span-3`), which assumes 3 cards are present. If, say, only Low Stock is visible (Inventory permission only, no Sales/Purchases), it will render at `md:col-span-4 lg:col-span-3` — a narrow card alone on the row with visible empty grid space beside it, because nothing reflows to fill the gap.

Similarly, the top row (Performance / Outstanding / Net Profit, each independently gated by `canSales` or `canFinance`) has **no dynamic span logic at all** — each is hardcoded to `col-span-12 md:col-span-6 lg:col-span-3` regardless of how many of the three are visible. If only `canFinance` is true (Outstanding + Net Profit render, Performance does not), the two remaining cards keep their fixed 1/4-width-equivalent columns and leave a visible gap where Performance would have been, rather than expanding to fill the row.

**Verdict: CSS/layout bug** (specifically: an *incomplete* JS-driven span-recalculation — the mechanism to avoid gaps exists but doesn't cover the top row or all bottom-row permutations), not a pure logic bug, and not a pure CSS bug either — it's a hybrid where the JS-computed-className approach was implemented for one row and not the other, and even where implemented, is not exhaustive over all boolean combinations.

---

## 2. `resources/js/Pages/Admin/Dashboard.jsx` (Admin Hub / feature-card grid)

Six `FeatureCard` tiles (Admin Dashboard, User Management, System Settings, Security Logs, Reports Center, Database Management) rendered in:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
```
(`Admin/Dashboard.jsx:83`)

**No conditional rendering of any kind found** — all six cards are unconditional JSX, no `{condition && ...}`, no `PlanGate`, no permission check anywhere in the file. **Not gated at all.**

## 3. `resources/js/Pages/Admin/ExecutiveDashboard.jsx`

Multiple KPI/chart tiles (Pending Actions, Profit Margin, Overdue Payments, Purchases Trend, Inventory Health, Payment Methods, Expenses, Active Staff, System Status, Last Backup) all rendered unconditionally inside plain grid divs (e.g. `grid grid-cols-1 md:grid-cols-3 gap-4` at line 108, `grid grid-cols-9 grid-rows-2 gap-4` at line 177). **No gating condition of any kind found in this file** — no permission check, no `PlanGate`, no feature key reference.

## 4. `resources/js/Pages/Dashboards/AccountantDashboard.jsx`

Four `MetricCard` KPIs (Net Cash Position, Total Receivables, Total Payables, Net Profit) plus charts/aging tables, all unconditional. **No gating found in this file.** (Access control for this whole page is presumably handled by which dashboard the server chooses to render for the `accountant` role — not confirmed in this pass, see Part B.)

## 5. `resources/js/Pages/Dashboards/CashierDashboard.jsx`

Stat tiles (Transactions Today, Session Total, Time on Shift) and action buttons (Open POS, Process Return), all unconditional. **No per-card gating found.** Ends with a static text notice: *"Need access to reports, inventory, or finances? Contact your Store Manager or Owner"* — confirms by design that cashiers are meant to see a wholly different, smaller dashboard rather than a filtered version of the main one.

## 6. `resources/js/Pages/Dashboards/PurchasingDashboard.jsx` / `ViewerDashboard.jsx`

Not read line-by-line in this pass beyond file existence confirmation (`find` output). **Not confirmed** whether they contain any per-card gating — flagged as an audit gap below.

---

## "Bills Payable" / "Accounts Receivable" — Counter-tier hiding: CONFIRMED, but not on a Dashboard file

There is no card literally named "Bills Payable" or "Accounts Receivable" on any Dashboard file. The closest equivalent is a **feature key literally named `outstanding_balance_grid`**, which is a Receivables/Payables-style stats card block — but it lives on the **Parties list page** (`resources/js/Pages/Parties/PartiesList.jsx`), not on `Dashboard.jsx`.

**Confirmed hidden for Counter tier.** Seeder (`database/seeders/PlanFeatureMatrixSeeder.php:369`), inside the `counter`-only override block starting at line 362:
```php
if ($slug === 'counter') {
    $counterDisabledKeys = [
        'customer_khata', 'supplier_khata', 'unified_party_ledger',
        'aged_receivables', 'aged_payables', 'double_entry_ledger',
        'purchase_orders', 'purchase_returns', 'suppliers_directory',
        'expense_manager', 'report_profit_loss', 'report_trial_balance',
        'report_party_statement', 'customer_statements', 'supplier_statements',
        'debit_credit_notes', 'outstanding_balance_grid', 'payment_due_dates',
        'woocommerce', 'api_access', 'production', 'bill_of_materials',
        'loyalty_points', 'digital_gift_cards', 'marketing_campaigns',
        'white_label', 'recurring_invoices', 'fund_management', 'bank_reconciliation',
        'e_invoicing'
    ];
    if (in_array($key, $counterDisabledKeys, true)) {
        $val = '0';
    }
    ...
}
```
`outstanding_balance_grid` is explicitly in this list — set to `'0'` for every Counter-tier tenant, no matter what its default value is in the base matrix above.

**No comment on this specific line** explaining *why* `outstanding_balance_grid` specifically is disabled for Counter (unlike the `woocommerce` key elsewhere in the same seeder, which has an explicit dated owner-decision comment — see `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md` §3). The whole `counterDisabledKeys` block reads as an intentional, designed restriction (Counter is documented elsewhere as the cash-register-only/no-ledger tier — `customer_khata`, `supplier_khata`, `double_entry_ledger`, `aged_receivables`/`aged_payables` are all disabled alongside it, which is internally consistent with "Counter tenants don't get ledger/accounting features"), but there is **no inline comment, changelog entry, or doc citation found tying `outstanding_balance_grid` specifically to a founder decision** the way `woocommerce` has one. **This looks intentional-by-pattern but is not individually documented** — flagged as "undocumented but consistent with an intentional restriction," not "accidental."

**Enforcement point and hide mechanism (confirmed, both backend and frontend):**
- Backend: `app/Http/Controllers/PartyController.php:149` — `$canViewGrid = \App\Services\PlanRepository::canUseFeature($tenant, 'outstanding_balance_grid');`
- Frontend: `resources/js/Pages/Parties/PartiesList.jsx:370` — `<PlanGate feature="outstanding_balance_grid" showUpgradeBadge={false}>` wrapping the stats grid.
- `PlanGate.jsx` (`resources/js/Components/PlanGate.jsx:9-21`): calls `usePlan().hasFeature(feature)`; if false and `showUpgradeBadge` is `false` (as it is here), **returns `null`** — a true JSX unmount, not a CSS hide:
```jsx
const isAllowed = hasFeature(feature);
if (isAllowed) { return <>{children}</>; }
if (fallback) { return <>{fallback}</>; }
if (!showUpgradeBadge) { return null; }
```

This is the one place in the codebase found in this pass where the plan-entitlement system (not a local permission check) directly gates a card-like UI block, and it does so cleanly (`return null`, not CSS).

---

## Table — every dashboard card found

| File | Card | Gating condition | Documented reason? | Notes |
|---|---|---|---|---|
| `Dashboard.jsx` | Performance | `canSales` (permission, local) | No | Ad-hoc, not plan-based |
| `Dashboard.jsx` | Outstanding (To Receive/To Pay) | `canFinance` (permission, local) | No | Ad-hoc, not plan-based |
| `Dashboard.jsx` | Net Profit | `canFinance` (permission, local) | No | Ad-hoc |
| `Dashboard.jsx` | Right Panel (desktop + mobile) | `isAdmin \|\| role in {manager, accountant}` | No | Hardcoded role list, not permission array |
| `Dashboard.jsx` | Sales Chart | `canSales` | No | — |
| `Dashboard.jsx` | Today's Opportunities | `isAdmin` only | No | Only admins, regardless of `canSales`/etc. |
| `Dashboard.jsx` | Top Products | `canSales` | No | Span recalculated in JS (partial) |
| `Dashboard.jsx` | Low Stock Alerts | `canInventory` | No | Span recalculated in JS (partial); "Order" button has a 3rd independent check |
| `Dashboard.jsx` | Recent Purchases | `canPurchases` | No | Span recalculated in JS (partial) |
| `Admin/Dashboard.jsx` | 6 FeatureCards (Admin Dashboard, Users, Settings, Logs, Reports, Database) | **None found** | N/A | Unconditional |
| `ExecutiveDashboard.jsx` | ~10 KPI/chart tiles | **None found** | N/A | Unconditional |
| `AccountantDashboard.jsx` | 4 MetricCards + tables | **None found** | N/A | Unconditional |
| `CashierDashboard.jsx` | Stat tiles + action buttons | **None found** | N/A | Unconditional (whole page is role-scoped instead) |
| `Parties/PartiesList.jsx` | `outstanding_balance_grid` stats block | `PlanGate feature="outstanding_balance_grid"` → `PlanRepository::canUseFeature()` | Partial — pattern-consistent with other Counter restrictions, but no dedicated comment | The one plan-feature-gated card block found; disabled for Counter tier; hide = `return null` |

---

## Open questions for the founder

1. Which controller/route decides whether a tenant/user sees `Dashboard.jsx` vs. `AccountantDashboard.jsx` vs. `CashierDashboard.jsx` vs. `PurchasingDashboard.jsx` vs. `ViewerDashboard.jsx`? Not traced in this pass — needed to confirm whether card-level gating inside `Dashboard.jsx` is even reachable by non-admin roles, or whether those roles are routed to a different file entirely before any card-level logic runs.
2. Is it intentional that `Admin/Dashboard.jsx` and `ExecutiveDashboard.jsx` have **zero** access gating on any card, while `Dashboard.jsx` has fine-grained per-card permission checks? If a low-privilege user can ever reach these two pages, every card (including Users, Settings, Security Logs, Database Management, financial KPIs) renders with no restriction.
3. Why does `outstanding_balance_grid` get disabled for Counter tier without the same kind of dated, named owner-decision comment that `woocommerce` has in the same file? Was this a deliberate bundled decision (i.e., "Counter = no ledger, so no aged-balance grid either") or copied into the list without independent sign-off?
4. Is the `canReports` variable in `Dashboard.jsx` (line 45) meant to gate something that was removed, or is a card missing its check? It's computed but never used.
5. `PurchasingDashboard.jsx` and `ViewerDashboard.jsx` were not read line-by-line in this pass — should a follow-up confirm whether they contain gating logic before treating this audit as complete?
6. Should the JS-computed span-recalculation pattern used for the bottom row of `Dashboard.jsx` (lines 48–65) be extended to the top row and to all boolean permutations, to eliminate the layout-gap issue identified above? Or is a flex/auto-fit-based grid a preferred fix over more `if/else` branches?
