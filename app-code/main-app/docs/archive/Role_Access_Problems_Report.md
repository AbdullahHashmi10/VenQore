# VenQore — Role Access & UI Problems Report
**Prepared:** April 20, 2026  
**Scope:** All 7 tenant roles + Platform Admin · Frontend UI · Backend Route Guards  
**Status:** Active — Needs Fixes Before Production

---

## Quick Summary

This document covers two things:
1. **What each role should see** — the intended, correct experience
2. **What is broken right now** — bugs, leaks, and missing guards

Problems are marked with severity:
- 🔴 **Critical** — data leakage or unauthorized action possible
- 🟠 **High** — wrong UI shown, user confusion or scope creep
- 🟡 **Medium** — incorrect behaviour but limited impact
- 🟢 **Low** — cosmetic or minor UX issue

---

## Part 1 — What Each Role Should See (The Intended Design)

### 1.1 Cashier

**Purpose:** Process point-of-sale transactions and handle customer returns at the counter. No visibility into business finances, stock management, or other staff's work.

**Sidebar should show:**
- Home
- Dashboard (cashier-only version — transactions today, session total, clock-in status)
- Sell → **only two items:**
  - Open POS Terminal (button)
  - Returns (to process a customer return)
- Nothing else

**Dashboard should show:**
- "Open POS Terminal" CTA button
- "Process Return" CTA button (currently missing — see Problems)
- Transactions Today (count)
- Session Total (cash collected today)
- Time on Shift / clock-in status
- "Need access to reports? Contact your manager" notice

**Activity Hub should show:** Only that cashier's own active POS sessions — no invoices from other staff, no purchases

**Growth Engine button:** Should NOT be visible

**After closing POS or Return:** Should return to the Cashier Dashboard — not to the sales index

---

### 1.2 Admin

**Purpose:** Full operational control of the store. Same as Owner except cannot manage billing/subscription.

**Sidebar should show:** Everything except Subscription

**Dashboard should show:** Full dashboard — performance, outstanding, net profit, sales chart, top products, low stock, right panel (bank accounts, cash, recent transactions), Opportunities (TodaysOpportunities panel)

**Activity Hub:** All active invoices, POS sessions, and purchases

**Growth Engine button:** Visible

---

### 1.3 Owner

**Purpose:** Unrestricted access including billing.

**Sidebar should show:** Everything including Subscription

**Dashboard:** Same as Admin + Opportunities panel

**Growth Engine button:** Visible

---

### 1.4 Manager

**Purpose:** Run day-to-day operations. Can sell, purchase, manage stock, view reports. Cannot manage staff or billing.

**Sidebar should show:**
- Home, Dashboard, Sell (all sub-items), Purchase (all sub-items), Stock (all sub-items), Contacts, Money, Insights
- Should NOT see: Staff Summaries, Staff Attendance, Subscription, System Settings

**Dashboard:** Full KPI dashboard but WITHOUT the Opportunities (TodaysOpportunities) panel — that is an admin/owner-only intelligence feature

**Activity Hub:** Active invoices, POS sessions, and purchases relevant to the store

**Growth Engine button:** Should NOT be visible (strategic business intelligence, owner/admin only)

---

### 1.5 Accountant

**Purpose:** Financial oversight only. Can view and record financial transactions. Cannot sell, purchase, or manage staff.

**Sidebar should show:**
- Home, Dashboard (accountant version)
- Sell → Returns History (read-only, for reconciliation)
- Money (all sub-items)
- Insights (reports)
- Should NOT see: POS, Orders, Quotations, Proposals, Purchase, Stock, Contacts (active), Marketing, Staff

**Dashboard (AccountantDashboard):** AR aging, payables breakdown, 6-month P&L chart, cash position (cash + bank totals), journal entry count

**Activity Hub:** Should NOT show active POS sessions or purchase drafts — those are operational, not financial records

**Growth Engine button:** Should NOT be visible

---

### 1.6 Purchasing Officer

**Purpose:** Manage supplier relationships, raise purchase orders, track inbound stock. Cannot sell or access finances.

**Sidebar should show:**
- Home, Dashboard (purchasing version)
- Purchase (all sub-items)
- Stock → Products, Stock Levels (read to know what to order)
- Contacts → Suppliers
- Should NOT see: Sell, Money, Insights/Reports, Marketing, Staff

**Dashboard (PurchasingDashboard):** Open POs, reorder alerts, monthly spend summary

**Activity Hub:** Only active purchase drafts — not invoices or POS sessions

**Growth Engine button:** Should NOT be visible

---

### 1.7 Viewer

**Purpose:** Read-only reporting access. Cannot perform any transactions.

**Sidebar should show:**
- Home, Dashboard (viewer version)
- Insights (reports only)
- Should NOT see: Sell, Purchase, Stock operations, Money, Marketing, Staff

**Dashboard (ViewerDashboard):** Current month P&L summary + inventory value only

**Activity Hub:** Should NOT appear at all — no operational context

**Growth Engine button:** Should NOT be visible

---

## Part 2 — Problems Found (What Is Currently Broken)

---

### PROBLEM 1 — Cashier Sees "Sell" Menu With All Sub-Items
**Severity:** 🟠 High  
**File:** `resources/js/Layouts/OneGlanceLayout.jsx` line 247–256  

**What happens:** The `MENU_PERMISSIONS` map at line 397 gates the top-level "Sell" menu item on `['pos', 'sales', 'sales_view']`. A cashier has `pos` permission, so they pass the filter and see the entire Sell menu — including **Orders**, **Quotations / Pre-Sales**, **Proposals**, and **Returns History** as clickable sub-items.

**What should happen:** A cashier should only see POS and Returns as actions. The sub-item list should be filtered per-role, not just the top-level menu.

**Fix needed:**
- Add sub-item level permission filtering in the sidebar
- Cashier should only see: Open POS Terminal (direct button) + Returns
- All other Sell sub-items (Orders, Quotations, Proposals) should be hidden from cashier

---

### PROBLEM 2 — No "Process Return" Button on Cashier Dashboard
**Severity:** 🟠 High  
**File:** `resources/js/Pages/Dashboards/CashierDashboard.jsx`  

**What happens:** The CashierDashboard only shows an "Open POS Terminal" CTA. There is no button or link to process a return. If a customer comes back to return an item, the cashier has no clear path to handle it from their dashboard.

**What should happen:** The cashier dashboard should have a second prominent CTA: "Process Return" that links to the returns creation flow.

**Fix needed:**
- Add a "Process Return" button below the "Open POS Terminal" button in `CashierDashboard.jsx`
- Route it to the correct returns route: `route('store.returns.create', { store_slug: storeSlug })`

---

### PROBLEM 3 — POS Close Button Sends Cashier to Sales Index
**Severity:** 🟠 High  
**File:** `resources/js/Pages/Pos.jsx` line 485  

**What happens:** When a cashier closes the last POS tab (or presses X), the code does:
```javascript
router.visit(route('store.sales.index', { store_slug: store?.slug }));
```
This sends them to the full Sales / Orders list — a page with all store invoices that a cashier should never see. The same problem applies when closing the Returns screen.

**What should happen:** Closing POS or Returns should send the user back to their own dashboard (`store.dashboard`), which will render the role-appropriate CashierDashboard for a cashier and the full dashboard for other roles.

**Fix needed:**
- In `Pos.jsx` line 485, change the redirect to `route('store.dashboard', { store_slug: store?.slug })`
- Apply the same fix to the Returns close/back button

---

### PROBLEM 4 — Growth Engine Button Shows to All Roles
**Severity:** 🟡 Medium  
**File:** `resources/js/Layouts/OneGlanceLayout.jsx` line 1017  

**What happens:** The Growth Engine button is only hidden for Platform HQ admins who have no store selected:
```javascript
{!(isPlatformAdmin && !store) && (
    <button ...>Growth Engine</button>
)}
```
This means cashiers, viewers, accountants, purchasing officers, and managers can all see and click the Growth Engine button. It shows AI-powered business recommendations based on sales trends, pricing, and customer profitability — information that should be restricted to owners and admins.

**What should happen:** Only `owner` and `admin` roles should see this button.

**Fix needed:**
```javascript
{!(isPlatformAdmin && !store) && (userRole === 'owner' || userRole === 'admin') && (
    <button ...>Growth Engine</button>
)}
```

---

### PROBLEM 5 — Activity Hub Shows Recent Sales to Cashier
**Severity:** 🟡 Medium  
**File:** `resources/js/Layouts/OneGlanceLayout.jsx` lines 648–733  

**What happens:** The Activity Hub section shows:
- Active invoices (sales being created) — visible if user has `sales` or `sales_view` permission
- POS Sessions — visible if user has `pos` permission ✓ (cashier should see their own sessions)
- Active purchases — visible if user has `purchases` permission

The cashier correctly sees POS sessions (they have `pos` permission). However, if a cashier somehow also has `sales_view` permission assigned (which can happen), they would also see all active invoices being created by other staff. Additionally, the cashier can see customer names in other people's POS sessions in the hub — this leaks who else is being served.

**More importantly:** The Activity Hub shows ALL sessions across the store — not just the current user's sessions. A cashier at the counter can see what another cashier is selling in their tab.

**What should happen:**
- Activity Hub should only show the **current user's own sessions** for cashier/non-admin roles
- For owner/admin/manager: show all sessions (as today — they need oversight)
- For cashier: only show the current user's POS sessions
- For viewer/accountant: Activity Hub should not appear at all

**Fix needed:** Filter `activeInvoices`, `posSessions`, and `activePurchases` by `created_by === auth.user.id` before rendering, when `userRole === 'cashier'`

---

### PROBLEM 6 — Full Financial Dashboard Rendered for Managers Without Role Guard
**Severity:** 🟡 Medium  
**File:** `resources/js/Pages/Dashboard.jsx` lines 129–138  

**What happens:** The `Dashboard.jsx` component always renders the `RightPanel` containing:
- Bank account balances
- Cash account balances
- Recent financial transactions
- Inventory value

The only role check in Dashboard.jsx is:
```javascript
const isAdmin = auth?.user?.role === 'platform_admin' || auth?.user?.role === 'admin' || auth?.user?.role === 'owner';
```
This is only used to conditionally show/hide the Opportunities panel (line 145). The RightPanel with full financial data is always rendered.

A `manager` role gets the full dashboard via `fullDashboard()` in the backend (line 42 in DashboardController — managers fall into `default`), which passes `bankAccounts`, `cashAccounts`, and `cashData` to the frontend.

**What should happen:** Managers should see performance stats and charts but not the detailed bank account balances and cash flow data in the right panel — that is finance-level data. The right panel should be conditionally rendered based on whether the user has `finance` permission.

**Fix needed:** Wrap the RightPanel rendering in a permission check:
```javascript
{(isAdmin || userPerms?.includes('finance')) && (
    <div className="...">
        <RightPanel ... />
    </div>
)}
```

---

### PROBLEM 7 — Dashboard "Low Stock Alerts" Has an "Order" Button for All Roles
**Severity:** 🟡 Medium  
**File:** `resources/js/Pages/Dashboard.jsx` line 221  

**What happens:** The Low Stock Alerts section has an "Order" button on each item that navigates to `store.purchases.create`. This button is visible and functional for ANY role that sees the full dashboard — including managers who should be able to order, but also potentially viewers.

**What should happen:** The "Order" button should only be visible to roles with `purchases` permission. Viewers/accountants getting the full dashboard in fallback scenarios should not see this action button.

**Fix needed:** Wrap the Order button in a permission check:
```javascript
{(userRole === 'owner' || userRole === 'admin' || userPerms?.includes('purchases')) && (
    <button onClick={...}>Order</button>
)}
```

---

### PROBLEM 8 — Hub/Index.jsx ROLE_LABELS Missing accountant and purchasing_officer
**Severity:** 🟢 Low  
**File:** `resources/js/Pages/Hub/Index.jsx` lines 30–36  

**What happens:** The `ROLE_LABELS` map in the Hub (multi-store picker) only defines labels for: `owner`, `admin`, `manager`, `cashier`, `viewer`. The roles `accountant` and `purchasing_officer` are not mapped. If a user with either of those roles has access to multiple stores and reaches the Hub, their role chip falls back to the `viewer` config — showing "Viewer" label and the wrong icon.

**Fix needed:** Add entries for the two missing roles:
```javascript
accountant:          { label: 'Accountant',        icon: Calculator, color: 'text-blue-400' },
purchasing_officer:  { label: 'Purchasing Officer', icon: ShoppingBag, color: 'text-orange-400' },
```

---

### PROBLEM 9 — Sidebar Shows "Dashboard" Menu Item to Cashier (Goes to Full Dashboard Route)
**Severity:** 🟡 Medium  
**File:** `resources/js/Layouts/OneGlanceLayout.jsx` lines 244–246  

**What happens:** The sidebar has a "Dashboard" menu item for all roles. The backend correctly routes cashiers to `CashierDashboard` and other roles to the full `Dashboard`. However, the sidebar still shows "Dashboard" as a nav item for cashiers, and clicking it works — but if the routing logic ever changes or the middleware is misconfigured, cashiers could land on the full financial dashboard.

This is less a bug and more a risk: the cashier dashboard works correctly today, but it depends entirely on the backend `match` statement in `DashboardController::index()`. There is no frontend guard preventing the full `Dashboard.jsx` from loading if a cashier somehow gets routed there directly (e.g., by a bookmark or stale URL).

**Fix needed:** `Dashboard.jsx` should check the role at the top and redirect to the appropriate dashboard if the role is cashier/accountant/viewer/purchasing_officer. This adds a safety net layer.

---

### PROBLEM 10 — Returns Routes Have No Backend Role Middleware
**Severity:** 🔴 Critical  
**File:** `routes/web.php` (returns route group), `app/Http/Controllers/ReturnController.php`  

**What happens:** The Returns routes (listing, creating, processing) do not have explicit `permission:returns` or role-based middleware. Any authenticated store member can potentially access these routes. While the `CheckPermissions` middleware exists for route-level guards, the returns routes are not wrapped in a `permission:X` middleware call.

**What should happen:** Only roles with explicit returns permission (owner, admin, manager, and cashier for simple POS returns) should be able to create/process returns. Viewers and accountants should have read-only access at most.

**Fix needed:** Add middleware to the returns route group:
```php
Route::middleware(['permission:returns'])->group(function () {
    Route::get('/returns', ...);
    Route::post('/returns', ...);
    Route::get('/returns/{id}', ...);
});
```

---

### PROBLEM 11 — Cashier Can Navigate to Full Sales Index via Direct URL
**Severity:** 🟠 High  
**File:** `routes/web.php` — `store.sales.index` route  

**What happens:** The sales index route (`/s/{store}/sales`) is protected by `permission:sales` or `permission:sales_view`. A cashier has `pos` permission but typically NOT `sales` permission. However, the redirect from POS close (Problem 3) and any bookmarked URL would attempt to route a cashier there.

If the store's permission assignment is misconfigured (e.g., cashier accidentally given `sales_view`), they land on the full order list with all customer invoices.

**What should happen:** The backend should verify not just the permission but also that the role is appropriate for the view being rendered.

---

## Part 3 — Consolidated Fix Checklist

| # | Problem | File to Change | Priority |
|---|---------|---------------|----------|
| 1 | Cashier sees all Sell sub-items in sidebar | `OneGlanceLayout.jsx` | 🟠 High |
| 2 | No "Process Return" button on cashier dashboard | `CashierDashboard.jsx` | 🟠 High |
| 3 | POS close sends cashier to sales index | `Pos.jsx` line 485 | 🟠 High |
| 4 | Growth Engine visible to all roles | `OneGlanceLayout.jsx` line 1017 | 🟡 Medium |
| 5 | Activity Hub shows other users' sessions to cashier | `OneGlanceLayout.jsx` lines 661–730 | 🟡 Medium |
| 6 | RightPanel (bank/cash data) shown to managers | `Dashboard.jsx` lines 130–138 | 🟡 Medium |
| 7 | "Order" button in Low Stock visible to wrong roles | `Dashboard.jsx` line 221 | 🟡 Medium |
| 8 | Hub missing role labels for accountant & purchasing_officer | `Hub/Index.jsx` lines 30–36 | 🟢 Low |
| 9 | No frontend guard on full Dashboard.jsx for wrong roles | `Dashboard.jsx` | 🟡 Medium |
| 10 | Returns routes missing backend permission middleware | `routes/web.php` | 🔴 Critical |
| 11 | Cashier reachable at sales index via direct URL / misconfiguration | `routes/web.php` | 🟠 High |

---

## Part 4 — Role × Screen Matrix (Correct State After Fixes)

| Screen / Feature | Owner | Admin | Manager | Cashier | Accountant | Purchasing | Viewer |
|-----------------|-------|-------|---------|---------|------------|------------|--------|
| Full Dashboard (KPIs) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cashier Dashboard | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Accountant Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Purchasing Dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Viewer Dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| RightPanel (Bank/Cash) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Opportunities Panel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Growth Engine Button | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Open POS | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Process Return (CTA) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sales Orders list | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quotations / Proposals | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Returns History (view) | ✅ | ✅ | ✅ | ❌ | ✅ (read) | ❌ | ❌ |
| Purchase Orders | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Stock Management | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (view) | ❌ |
| Money / Finance | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reports / Insights | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (read) |
| Staff Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing / Subscription | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activity Hub (all) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Activity Hub (own only) | — | — | — | ✅ | ❌ | ✅ | ❌ |
| "Order" button on Low Stock | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Hub role label displayed | Owner | Admin | Manager | Cashier | Accountant ✴️ | Purch. Officer ✴️ | Viewer |

✴️ = currently broken, shows "Viewer" label instead

---

## Part 5 — Cashier Journey (What It Should Look Like End-to-End)

1. Cashier logs in → lands on `CashierDashboard`
2. Dashboard shows: greeting, **"Open POS Terminal"** button, **"Process Return"** button, today's stats (transaction count, session total, time on shift)
3. Sidebar shows: Home, Dashboard — and under Sell: only POS and Returns
4. Activity Hub: shows only that cashier's own active POS session(s), nothing else
5. Growth Engine button: not visible
6. Cashier clicks "Open POS Terminal" → goes to `/pos`
7. Cashier presses X or closes last tab in POS → returns to `CashierDashboard` (not sales index)
8. Cashier clicks "Process Return" → goes to Returns create page
9. Cashier presses back/close in Returns → returns to `CashierDashboard`
10. Cashier cannot navigate to Orders, Quotations, Finance, Reports, or any other section via sidebar (items not shown) or direct URL (backend middleware blocks)
