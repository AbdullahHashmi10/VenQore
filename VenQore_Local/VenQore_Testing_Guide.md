# VenQore SaaS V1 Testing & Launch Checklist

**Everything you need to test before a single real customer signs up.**

Prepared June 2026 · Test locally first, then staging, then production

**15 Test Sections A → O** covering every part of the system

**Roles Covered:** Platform Owner (Hashmi), Store Owner, Admin, Manager, Cashier, Accountant, Purchasing Officer, Viewer

**Multi-Tenant Architecture:** Path-based isolation (`/s/{slug}/...`)

**Data Isolation:** Every test verifies Store A cannot see Store B

**Final Sign-off:** A sign-off checklist at the end before going live

---

## How to Use This Document

- **Rule 1:** Test in this exact order: Local machine → Staging server → Production. Never skip local.
- **Rule 2:** A section is only done when every single checkbox in it is ticked. Not 'mostly done'. All of them.
- **Rule 3:** If something fails: fix it, then re-run the entire section from the top. Not just the failed item.
- **Rule 4:** The data isolation tests (Section D) must pass before you go live. This is the most important section.

### Testing Order Explained

| Environment | What it is and when to use it |
|---|---|
| **Local Machine** | Your laptop/PC running VenQore with XAMPP or Laravel Herd. Free to break. Reset the database in seconds. Do ALL testing here first. |
| **Staging Server** | A cheap temporary server (even a $6/month droplet) that mirrors production. Test the deployment process itself here. |
| **Production (Hostinger)** | Your real server. Only deploy here after local AND staging pass completely. Real users, real data, no mistakes. |

### What This Checklist Specifically Tests For: Data Safety

The single biggest risk in a multi-tenant system is data leaking between stores. A customer at Store A should never see anything from Store B. This checklist tests this in 4 different ways:

- **Database isolation** — running `php artisan tenants:audit` to verify zero leaky rows
- **Browser isolation** — logging in as Store B user and confirming Store A data is invisible
- **API isolation** — directly calling a Store A URL (`/s/store-a/dashboard`) while authenticated as Store B
- **Multi-tab isolation** — two tabs open on two DIFFERENT stores simultaneously under same user (if member of both)

---

## A. Before You Test Anything — Environment Check

Run every command below in your terminal before touching anything else. If any of these fail, fix them first.

**Everything else depends on this.**

Check health endpoint:
```bash
curl -s https://venqore.com/health # Must return JSON: {"status":"ok",...}
```

Check zero pending migrations:
```bash
php artisan migrate:status --pending # Must return: 0
```

Run structural audit:
```bash
php artisan tenants:audit # Must all show: GREEN/PASS
```

Check Horizon queue is running:
```bash
php artisan horizon:status # Must say: Horizon is running
```

Test email sending (Postmark):
```bash
php artisan tinker --execute="Mail::raw('test', fn(\$m) => \$m->to('your@email.com')->subject('test'));"
```

Test file storage (Cloudflare R2):
```bash
php artisan tinker --execute="Storage::disk('r2')->put('_test/ping.txt', 'ok'); echo Storage::disk('r2')->get('_test/ping.txt');"
```

Check APP_DEBUG is off:
```bash
grep APP_DEBUG .env # Must show: APP_DEBUG=false
```

- [x] `/health` endpoint returns 200 OK and all components 'ok'
- [x] `php artisan tenants:audit` passes completely
- [x] Horizon is running with 'provisioning', 'emails', and 'heavy' queues active
- [x] Redis is connected (for sessions and caching)
- [x] Postmark/Mail service confirmed working
- [x] Cloudflare R2 read/write/delete working
- [x] APP_DEBUG=false confirmed in .env
- [x] CSRF self-healing logic active (bootstrap.js)
- [x] **AUDIT:** `FinancialReportingService` raw queries scoped (July 2026)
- [x] **AUDIT:** `FinanceController` ledger queries scoped (July 2026)

---

## B. Creating a New Store — The Full Sign-Up Flow

This tests the complete journey from a stranger visiting your website to them being inside their own working store. Do this with a fresh email address you have never used before.

### Step 1 — Register a New Account

- [x] Go to venqore.com/register — Midnight Nebula design loads correctly
- [x] Try submitting without ticking "I agree to Terms of Service" — must be blocked
- [x] Submit valid details — account created, redirected to THE HUB (`/hub`)
- [x] At The Hub: user can see "Create Store" and "Join Store" options
- [x] System automatically dispatches `ProvisionTenantJob` in background

### Step 2 — Create the First Store

- [x] Click 'Create my first store' — form appears
- [x] Try submitting with no store name — blocked
- [x] Submit valid store name
- [x] Tenant (store) record created in database with status = 'trial'
- [x] trial_ends_at is set to 14 days from now
- [x] You are set as the Owner in tenant_users with role = 'owner'
- [x] StoreLicense updated: status = 'consumed', tenant_id is filled in
- [x] Chart of accounts seeded for the new store (check accounts table)
- [x] Redirected to the Setup Wizard — NOT the dashboard yet

### Step 3: Setup Wizard & Store Initialization

- [x] Select Currency (e.g., USD $) — Dashboard and Settings MUST show $ (not Rs.)
- [x] Enter Business Details (Address, Phone, Name) — verify reflection in **Settings > Business Info**
- [x] Select Industry — verify correct seeding of categories/units
- [x] Verify Dashboard Stats:
    - [x] Revenue shows 0.00
    - [x] Low Stock Count shows 0
    - [x] Parked Sales Count shows 0
    - [x] **LEAK CHECK:** Ensure NO rows from other stores (Demo, Store A) appear here.
- [x] Complete Wizard — verify `setup_completed = true` in `tenants` table.
- [x] Log out and log in again — wizard does NOT appear a second time.

- [x] Create store "Admin" — slug MUST be "admin-[random]" (reserved word protection)
- [x] Create store "API" — slug MUST be "api-[random]"
- [x] System level reserved slugs (www, app, static, docs) are all blocked

---

## C. Role Isolation — Does Each User See Only What They Should?

For each role below: create a fresh user, invite them to the test store with that role, log in AS that user, and verify the access. Do not skip any role.

### Setup Before Role Testing

Create a test store called 'VQ Test Store' with this data pre-loaded:

- [x] 5 products with prices and stock quantities
- [x] 3 customers
- [x] 2 completed sales
- [x] 1 purchase order
- [x] 1 manual journal entry

### Owner Role

- [x] Can open: Dashboard, POS, Sales, Purchases, Inventory, Finance, Reports, Staff, Settings, Billing
- [x] Billing page shows subscription status and payment portal link
- [x] Can invite staff — all V1 roles visible in the dropdown
- [x] Can change a staff member's role
- [x] Can remove a staff member from the store
- [x] CANNOT see any /hq/* pages — trying to go there returns a 403 error

### Admin Role

- [ ] Can open: Dashboard, POS, Sales, Purchases, Inventory, Finance, Reports, Staff, Settings
- [ ] CANNOT open the Billing page — gets a 'not allowed' error
- [ ] CANNOT delete the store
- [ ] CANNOT transfer ownership
- [ ] Can invite staff but CANNOT set the role to 'Owner'
- [ ] CANNOT change the actual Owner's role

### Manager Role

- [ ] Can open: Dashboard, POS, Sales, Purchases, Inventory, All 38 Reports
- [ ] CANNOT open: Staff management, Billing, Settings
- [ ] Can create and edit products
- [ ] Can do a stock adjustment — creates a log entry with a reason
- [ ] Can open and close POS sessions

### Cashier Role — Most Restricted

The Cashier is the most security-sensitive role. Test every restriction carefully.

- [ ] Dashboard shows only the **Cashier Dashboard** (POS button, session stats, no financials)
- [ ] Dashboard does NOT show Revenue, Expenses, or Staff stats
- [ ] CANNOT open `/sales` or `/finance` — gets 403 or redirect
- [ ] POS Page: **25+ Keyboard Shortcuts** work (F1 Search, F2 Qty, etc.)
- [ ] POS Page: **Senior Mode** works (A+ icon makes fonts 40% larger)
- [ ] POS Page: **Secure Profit Peek** works (drag/hover total to see margin %)
- [ ] After sale: **V3 Journal Entries** created (Revenue, Inventory, COGS, Tax)
- [ ] POS **Cart Rescue**: Refresh the page with items in cart — they MUST persist

### Accountant Role

- [ ] Dashboard shows **Accountant Dashboard** (P&L, Aging, Bank Balances)
- [ ] Can create a journal entry (Double-entry V3 engine)
- [ ] Financial Reports (Trial Balance, P&L) load from `journal_items` (V3 sources)

### Purchasing Officer Role

- [ ] Can open: Dashboard (procurement), Purchases, Supplier management, Inventory (view only)
- [ ] CANNOT open Sales list or Customer list
- [ ] CANNOT open Finance/Accounting
- [ ] Can create a purchase order
- [ ] Can receive stock against a purchase order — stock increases correctly
- [ ] Stock receipt creates a movement record in the database

- [ ] Dashboard shows **Viewer Dashboard** (Read-only reports summary)
- [ ] There are NO create, edit, or delete buttons anywhere visible
- [ ] Can view all 38 reports but cannot change any numbers

---

## D. DATA ISOLATION — The Most Critical Tests

⚠️ **CRITICAL:** If even one of these tests fails, you must NOT go live. A failure here means one customer's private business data is visible to another customer. This is a catastrophic breach of trust.

### Setup for Isolation Testing

Create two completely separate stores:

- [ ] **Store A: 'Ali Shoes'** — add 3 products: 'Red Shoe', 'Blue Shoe', 'Sandal'
- [ ] **Store A:** add 1 customer named 'Ali Customer', make 1 sale for Rs. 5,000
- [ ] **Store B: 'Zain Electronics'** — add 3 products: 'TV', 'Phone', 'Laptop'
- [ ] **Store B:** add 1 customer named 'Zain Customer', make 1 sale for Rs. 15,000

### Test 1 — Browser Isolation

Log in as a Store B user. Look everywhere.

- [ ] Products list shows: TV, Phone, Laptop — NOT Red Shoe, Blue Shoe, Sandal
- [ ] Customers list shows: Zain Customer — NOT Ali Customer
- [ ] Sales list shows: Rs. 15,000 sale — NOT the Rs. 5,000 sale
- [ ] Dashboard revenue shows Rs. 15,000 — NOT Rs. 20,000 (combined)
- [ ] All 38 reports show only Store B data — not combined totals
- [ ] Log back in as Store A — Store A's data is still intact (Store B didn't corrupt it)

### Test 2 — Direct URL Attack Simulation

While logged in as a Store B user, try to access Store A's data directly by typing Store A's URL in the browser bar:

- [ ] Type Store A's URL `/s/ali-shoes/dashboard` while in Store B's session — MUST return 404 or 403
- [ ] API Isolation: Call `/api/s/ali-shoes/products` with Store B's token — MUST be blocked
- [ ] Resource Guessing: Find a product UUID from Store A, request it via Store B's slug — MUST return 404

```bash
php artisan tenants:audit # This command verifies ALL isolation rules at once
```

- [ ] `tenants:audit` returns GREEN for: products, sales, parties, journal_items, batches

### Test 4 — Multi-Tab Safety (Two Stores Open Simultaneously)

This tests that opening two stores in two browser tabs does not mix data.

- [ ] Open Tab 1: `/s/ali-shoes/pos`
- [ ] Open Tab 2: `/s/zain-electronics/pos` (if you are a member of both)
- [ ] Complete sale in Tab 1 — it does NOT affect Tab 2 or Store B session
- [ ] **Live Shield**: Open Store A POS in TWO tabs. Update a price in Tab 1 Admin. Tab 2 POS MUST auto-sync price without reload.

---

## E. Staff Invite System

### Inviting Staff by Email

- [ ] Owner opens Staff management page, clicks 'Invite Staff'
- [ ] Invite form shows: email field, role dropdown (V1 roles only, no Owner option)
- [ ] Submit with invalid email — blocked with error
- [ ] Submit with email of someone already in this store — shows 'already a member' error
- [ ] Submit valid invite — invitation record created in staff_invitations table
- [ ] Invite email arrives in the invitee's inbox within 60 seconds
- [ ] Invite email shows correct store name, correct role, and a secure link

### Accepting an Invite

- [ ] Invitee clicks the link while NOT logged in — redirected to login with invite preserved
- [ ] After logging in — invite accepted, access to the store granted
- [ ] Invitee clicks link while logged in as WRONG email — blocked with clear error
- [ ] Invitee clicks link while logged in as CORRECT email — accepted immediately
- [ ] After acceptance: redirected to the store dashboard with a welcome message
- [ ] After acceptance: clicking the same link again shows 404 (token is gone, single-use)
- [ ] After acceptance: store appears in the invitee's store switcher if they have 2+ stores

### Expired Invites and Security

- [ ] Invite older than 7 days: clicking the link shows 'invitation has expired'
- [ ] Owner can resend an expired invite — new token created, old one invalidated
- [ ] Join code (VQ-XXXX format) visible in store settings
- [ ] Entering wrong join code: shows 'invalid code' error
- [ ] Person already in the store enters their own store's join code: shows 'already a member'
- [ ] Owner regenerates join code — old code immediately stops working

---

## F. Core ERP Functions — Does the Business Logic Work?

### F1 — Complete a Sale End-to-End

**Setup before this test:** Product 'Test Shoes', price Rs. 5,000, cost Rs. 3,000, stock 10. Customer 'Ahmed Ali'.

- [ ] Open POS, search 'Test Shoes' — appears in results within 1 second
- [ ] Add 2 units to cart — cart shows 2 × Rs. 5,000 = Rs. 10,000
- [ ] Apply 10% discount — cart updates to Rs. 9,000
- [ ] Select customer 'Ahmed Ali'
- [ ] Select payment method: Cash, enter Rs. 10,000 received
- [ ] Change shown: Rs. 1,000
- [ ] Complete the sale — receipt appears

#### After Sale — Verify in Database:

- [ ] Sale record: correct tenant_id, correct total Rs. 9,000, correct discount Rs. 1,000
- [ ] Sale items: 2 items, correct product_id, correct price
- [ ] Stock: 'Test Shoes' now shows 8 in stock (was 10, sold 2)
- [ ] Stock movement record created: type = 'sale', quantity = -2
- [ ] **V3 Journal Entries**: DR Cash | CR Revenue (Net) | CR Tax Liability | DR COGS | CR Inventory
- [ ] **V3 FIFO**: Check `sale_item_batches` table — it MUST record which specific purchase batch was used
- [ ] Sale visible in Ledger for Account 1000 (Cash) and 4000 (Sales Revenue)
- [ ] Trial Balance: Total Debits = Total Credits (must balance to the cent)

#### Edge Cases:

- [ ] Attempt to sell 11 units when stock is 10 — blocked with 'out of stock' error
- [ ] Attempt to sell 0 quantity — blocked
- [ ] Attempt to complete sale with empty cart — blocked

### F2 — Purchase Order Flow

- [ ] Create supplier 'Ali Traders' with contact details
- [ ] Create purchase order: 5 units of 'Test Shoes' at Rs. 3,000 each
- [ ] PO status shows: Ordered
- [ ] Receive 3 units — stock increases by 3, PO status: Partially Received
- [ ] Journal entry created: Debit Inventory, Credit Accounts Payable
- [ ] Receive remaining 2 units — PO status: Fully Received
- [ ] Post payment to supplier — Accounts Payable decreases, Cash decreases
- [ ] Supplier balance updated correctly

### F3 — Inventory Management

- [ ] Create product with all fields: name, SKU, barcode, price, cost, category, image
- [ ] Product image uploads and displays correctly
- [ ] Creating a duplicate SKU is blocked with an error
- [ ] Barcode search in POS finds the product instantly
- [ ] Delete product with NO sales history — succeeds
- [ ] Delete product WITH sales history — blocked with clear error
- [ ] Stock adjustment (manual increase) — reason is logged
- [ ] Stock adjustment (manual decrease) — reason is logged
- [ ] Create a category, then try to delete it WITH products — blocked
- [ ] Create a category with no products, then delete — succeeds

### F4 — Reports

- [ ] All 38 reports open without a 500 server error
- [ ] P&L report shows figures matching the test sales and purchases you created
- [ ] Balance Sheet: Assets column total equals Liabilities + Equity column total
- [ ] Trial Balance: total debits column equals total credits column
- [ ] Changing the date range filter changes the data shown
- [ ] Export to PDF: job runs in background, PDF is downloadable
- [ ] Export to Excel: job runs in background, Excel file is downloadable

---

## G. Platform HQ — "Midnight Nebula" Command Center
The Platform HQ at `/VenQore/` (name: `platform.dashboard`) is the high-density command center for the Platform Owner. Every other user must be completely blocked.

### G1 — Access Control & Secure Login
- [x] Log in as Store Owner (`ali@ali-shoes.com`) at `/VenQore-login` — MUST be blocked.
- [x] Log in as Platform Owner (`Hashmi@venqore.com`) at regular `/login` — MUST be blocked (Access Denied).
- [x] Log in as Platform Owner (`Hashmi@venqore.com`) at `/VenQore-login` — SUCCESS.
- [ ] Verify **Sidebar Presence**: Sidebar HUD appears on EVERY page (Users, Stores, Support, Health).
- [ ] Verify **Navigation Performance**: Clicking sidebar icons (Stores, Users, Support) navigates instantly via Inertia (no full page reload).
- [ ] Verify **Retraction Toggle**: Click the double-chevron on the sidebar — HUD retracts without clipping or visual artifacts.
- [ ] **Tab Synchronization**: Navigate to `/VenQore/tickets` — Verify the Support tab opens automatically within the unified Dashboard.
- [ ] **Active State Logic**: All management links (`/VenQore/stores`, `/VenQore/users`, etc.) correctly highlight the active menu item in the sidebar.

### G2 — Revenue Intelligence & Dashboard Metrics
- [ ] Verify **Currency Persistence**: All metrics MUST show **$ (USD)**.
- [ ] Verify **Real-Only Sanitization**: Dashboard counts MUST NOT include `is_demo` stores.
- [ ] Test **Time-Period Filters**:
    - [ ] Click 'Today' / 'Month' / 'Year' / 'All' buttons.
    - [ ] Revenue volume and registration counts update correctly.
    - [ ] URL updates to `?period={p}` without losing visual state.
- [ ] Platform Growth Trend Chart:
    - [ ] X and Y axes are visible with clear scale markings.
    - [ ] Data points render accurately for the selected period.
- [ ] Plan Distribution: Breakdown bar shows correct counts for Starter, Growth, Business, and LTD tiers.
- [ ] System Health: Action Center shows live counts for Resolve-Pending Error Logs and New Contact Submissions.

### G3 — Platform Management & Recovery
- [ ] **Stores List (`/VenQore/stores`)**:
    - [ ] Search works by Store Name and Slug.
    - [ ] Filter by Status (Active, Trial, Suspended, Cancelled).
    - [ ] **Trash Control**: Toggle 'Show Trashed' — deleted stores appear with 'Restore' and 'Purge' buttons.
- [ ] **User List (`/VenQore/users`)**:
    - [ ] Search works by Name and Email.
    - [ ] **Disaster Recovery**: Restore a deleted user — user immediately regains login capability.
- [ ] **AppSumo Code Bank**:
    - [ ] Bulk Generate codes works (Artisan call).
    - [ ] Import CSV works (No duplicate codes).
    - [ ] Export CSV generates a clean report with Tier and Redemption status.
- [ ] **Support Hub**:
    - [ ] Direct inbox integrated into the Dashboard.
    - [ ] **Deep-Link Persistence**: Accessing `/VenQore/tickets` or clicking a ticket notification correctly navigates to the 'Support' tab.
    - [ ] Status updates (Open → In Progress → Resolved) work instantly.
    - [ ] Message threading: Platform replies are highlighted with a Shield icon.

### G4 — Impersonation & Security
- [ ] Start Impersonation on a store — redirected to the store's dashboard.
- [ ] **Red Banner Control**: High-contrast red warning banner stays pinned at the top.
- [ ] **Read-Only Enforced**: Try to delete a product while impersonating — system MUST return 403 Forbidden.
- [ ] 'Back to Platform HQ' button in sidebar returns you safely to `/VenQore`.

---

### G5 — Testing Credentials (Sandbox)
| Account | Email | Password | Role |
|---|---|---|---|
| **HQ Admin** | `Hashmi@venqore.com` | `Admin1234` | Platform Owner |
| **Store A** | `ali@ali-shoes.com` | `password` | Owner |
| **Store B** | `zain@zain-electronics.com` | `password` | Owner |

---

## H. Payments, Subscriptions and AppSumo

### H1 — Trial Expiry

Run this command to manually expire a trial for testing:

```bash
php artisan tinker --execute=" Tenant::withoutGlobalScopes() ->where('slug', 'your-test-store') ->update(['trial_ends_at' => now()->subMinute()]);"
```

- [ ] After running command: store Owner trying to log in sees 'Trial Expired' page
- [ ] Trial expired page shows an upgrade/payment link — not a blank 500 error
- [ ] Expired store data is preserved in the database (not deleted)
- [ ] Pay via Lemon Squeezy test card: 4242 4242 4242 4242 — webhook fires, access restored
- [ ] After payment: store Owner can log in immediately without doing anything extra

### H2 — Lemon Squeezy Webhook Events

| Event | Expected Result |
|---|---|
| subscription_created | New tenant created + welcome email sent + owner can log in |
| subscription_updated | Plan change updates tenant.plan immediately |
| subscription_cancelled | tenant.status → 'cancelled' (not suspended yet — access until end of period) |
| subscription_expired | tenant.status → 'suspended' — owner sees payment required page |
| subscription_payment_failed | Payment failure email sent to store owner |
| Invalid signature | Returns 401 — webhook is NOT processed |

- [ ] Each event type above produces the correct result (test one by one)
- [ ] Webhook processing is asynchronous — fires a background job, does not block
- [ ] Same webhook sent twice: second one is ignored (idempotent — no duplicate stores)

### H3 — AppSumo Code Redemption and Stacking (End-to-End)

This section verifies the core Lifetime Deal (LTD) logic and stacking tiers.

- [ ] **Redeem First Code (LTD Starter)**:
    - [ ] Log in as a new user (no license).
    - [ ] Go to `/redeem`, enter a valid available code.
    - [ ] Verify success message: "Code redeemed! You're on LTD Starter (ltd_1)."
    - [ ] **Database Check**: `store_licenses` table has 1 record for user, plan `ltd_1`.
    - [ ] Create a store using this license.
    - [ ] **Database Check**: `tenants` table for this store shows plan `ltd_1`.
- [ ] **Stack Second Code (LTD Growth Upgrade)**:
    - [ ] Go to `/redeem` again, enter a second valid code.
    - [ ] Verify success message: "Upgraded to LTD Growth (ltd_2)!"
    - [ ] **Database Check**: `store_licenses` record for user updated to plan `ltd_2`.
    - [ ] **Database Check**: `tenants` table `plan` column updated to `ltd_2`.
    - [ ] **Critical Check**: `tenants.plan_limits` JSON column updated and matches `config('plans.ltd_2')`.
- [ ] **Stack Third Code (LTD Business Max Tier)**:
    - [ ] Go to `/redeem` again, enter a third valid code.
    - [ ] Verify success message: "Upgraded to LTD Business (ltd_3) — maximum tier unlocked!"
    - [ ] **Database Check**: `tenants.plan` updated to `ltd_3`.
    - [ ] **Database Check**: `tenants.plan_limits` updated to `config('plans.ltd_3')`.
- [ ] **Limit Check**: Try to redeem a 4th code — MUST be blocked with "Maximum of 3 AppSumo codes" error.

### H4 — Limit Enforcement (Hard Stops & UI Feedback)

Verify that the system actually stops users from exceeding their AppSumo tier limits.

- [ ] **Monthly Transaction Limit (LTD 1)**:
    - [ ] Use a store on `ltd_1` (500 tx/mo limit).
    - [ ] Manually set sale count to 500 for the current month in database.
    - [ ] Attempt to complete a new sale in POS.
    - [ ] Verify: Sale is blocked, **Upgrade Modal** (Glassmorphic) appears.
    - [ ] Verify: Modal explicitly mentions "Stack another AppSumo code" to increase limits.
- [ ] **Plan Usage Banner**:
    - [ ] At 400/500 (80%), verify Yellow header banner appears: "80% of monthly transactions used".
    - [ ] At 490/500 (98%), verify Red Pulsing header banner appears: "Approaching hard limit".
- [ ] **Store Count Limit**:
    - [ ] On an `ltd_1` account (1 store limit).
    - [ ] Try to create a second store at `/hub`.
    - [ ] Verify: Redirection to `/redeem` or error message: "Your current plan only allows 1 store. Stack another code to add more."
- [ ] **Feature Gating**:
    - [ ] On `ltd_1`, try to access **Growth Engine** or **WooCommerce**.
    - [ ] Verify: Access is blocked or "Upgrade to LTD 2" message appears.
    - [ ] On `ltd_2`, verify these features are now UNLOCKED and functional.

---

## I. Security Tests

### Authentication Boundaries

- [ ] Unauthenticated user accessing /app/any-store/dashboard is redirected to login
- [ ] Store A user trying to access Store B's URL gets a 403 error
- [ ] Store user trying to access /hq/ gets a 403 error (not a redirect)
- [ ] Login brute force: 10+ wrong attempts from same IP triggers a block (429 error)
- [ ] Password reset token: using the same reset link twice fails (single-use)
- [ ] Password reset token: link expires after 60 minutes
- [ ] CSRF protection: submitting a form without the CSRF token returns 419 error

### Plan Limit Enforcement at API Level

Limits must be enforced even if someone bypasses the UI and sends a direct API request. Test this by making the API call directly, not through the browser buttons.

- [ ] Starter store: trying to exceed limits (e.g. 1001 products) shows **Upgrade Modal** (Glassmorphic design)
- [ ] **DRM Check**: Turn off internet. Store must work for 30 days. On Day 31, Lock Screen appears.
- [ ] **DRM Bypass**: Attempting to change PC clock to bypass lockout is detected and blocked.

---

## J. Performance — Is It Fast Enough?

### Run These Commands to Measure Speed

POS page load (must be under 1 second):
```bash
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://venqore.com/s/your-store/pos
```

POS product search with 1,000 products (must be under 300ms):
```bash
time curl -s "https://venqore.com/s/your-store/pos/products?q=shoe" > /dev/null
```

Dashboard load (must be under 2 seconds):
```bash
time curl -s https://venqore.com/s/your-store/dashboard > /dev/null
```

### Performance Checklist

- [ ] POS page loads in under 1 second — the page does NOT include the full product list
- [ ] POS product search returns results in under 300ms even with 1,000+ products
- [ ] Dashboard loads in under 2 seconds with real data
- [ ] All 38 reports load without a 500 server error (they can be slow, but must not crash)
- [ ] Horizon dashboard shows zero failed jobs after all tests completed
- [ ] Application error log shows no ERROR or CRITICAL entries after testing

---

---

## K. AI & Growth Engine Intelligence

### L1 — Predicted Customer Return
- [ ] Open Growth Engine dashboard
- [ ] System shows "Retention Leads" (Customers due for a refill/order based on history)
- [ ] Click "WhatsApp Reminder" — generates a message with the customer's top products

### L2 — Churn & Outage Alerts
- [ ] Forecast Brain: System warns about stock running out BEFORE it hits zero
- [ ] Churn Brain: Flagging regular customers who haven't visited in 30 days

---

## L. Technical Recovery & Workforce

### M1 — "Light Gone" (Load Shedding) Recovery
- [ ] Kill the PC/Browser while logged in
- [ ] Restart and log back in
- [ ] System sees the gap: *"You were away for 2 hours. What were you doing?"*
- [ ] Enter "Manual Cleaning". Check Admin panel — log MUST show the gap and reason.

### M2 — Vyapar Restoration
- [ ] Upload a `.vyb` or `.vyp` file in the Hub/Restoration screen
- [ ] System performs "Forensic Analysis" and shows counts before importing
- [ ] Run import — Invoices, Parties, and Items MUST migrate into V3 architecture perfectly

---

## M. Mobile Checkout (Flutter)
- [ ] Open VenQore Flutter App
- [ ] Log in with Store credentials
- [ ] Dashboard shows live V3 balances (Cash in Hand, Banks)
- [ ] Recent transactions from the Web POS appear in the Mobile feed instantly

---

## N. Clean Up Before Real Users Arrive

Run these cleanup steps after all tests pass. You do not want test data mixed in with real customer data when you go live.

### Delete All Test Stores and Data

```bash
php artisan tinker --execute=" \$testSlugs = ['vq-test-store', 'ali-shoes', 'zain-electronics']; foreach(\$testSlugs as \$slug) { \$t = Tenant::withoutGlobalScopes()->where('slug', \$slug)->first(); if(\$t) { foreach(['products','sales','sale_items','parties','accounts','journal_entries','categories','warehouses','tenant_users'] as \$table) { DB::table(\$table)->where('tenant_id', \$t->id)->delete(); } \$t->forceDelete(); echo 'Deleted: ' . \$slug . PHP_EOL; } }"
```

- [ ] All test store slugs deleted from database
- [ ] No test email addresses (test@, temp@) in the users table
- [ ] Queue cleared of test jobs: `php artisan queue:clear --queue=default`
- [ ] Failed jobs cleared: `php artisan queue:flush`
- [ ] Demo store reset to clean state: `php artisan demo:reset`
- [ ] Application logs cleared of test noise
- [ ] AppSumo test codes invalidated

---

## O. Document Known Gaps Before Going Live

There will always be things that are not perfect in V1. That is okay. The important thing is to know what they are and have decided they are acceptable for now. Write the answer to each question below.

1. **Is the store_activity_log actually being written on every action?**
   - Test: create a product, check the store_activity_log table.
   - Answer: _______________________________________________

2. **What happens if a Lemon Squeezy webhook fails to deliver? Is there a way to manually trigger it again?**
   - Answer: _______________________________________________

3. **Is there a database backup running automatically? When was the last backup tested by restoring it?**
   - Answer: _______________________________________________

4. **Is there a health check endpoint (/health) being monitored by UptimeRobot or similar?**
   - Answer: _______________________________________________

5. **Is there an error alert (Slack or email) set up for production 500 errors?**
   - Answer: _______________________________________________

6. **Has the ownership transfer flow been tested end-to-end?**
   - Answer: _______________________________________________

---

## ✓ Final Sign-Off Checklist

- [x] **Section A** — Environment Check: ALL PASSED (Self-Audit)
- [ ] **Section B** — Store Creation: ALL PASSED __________
- [ ] **Section C** — Role Isolation: ALL PASSED __________
- [ ] **Section D** — Data Isolation: ALL PASSED __________
- [ ] **Section E** — Staff Invites: ALL PASSED __________
- [ ] **Section F** — Core ERP Functions: ALL PASSED __________
- [ ] **Section G** — HQ Admin Panel: ALL PASSED __________
- [ ] **Section H** — Payments & AppSumo: ALL PASSED __________
- [ ] **Section I** — Security Tests: ALL PASSED __________
- [ ] **Section J** — Performance: ALL PASSED __________
- [ ] **Section K** — AI Growth Engine: ALL PASSED __________
- [ ] **Section L** — Technical Recovery: ALL PASSED __________
- [ ] **Section M** — Mobile Integration: ALL PASSED __________
- [ ] **Section N** — Cleanup: ALL PASSED __________
- [ ] **Section O** — Known Gaps: DOCUMENTED __________

### Known Issues Accepted for V1 Launch:

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Final Approval

- [ ] **System ready for real paying customers:** YES / NO
- [ ] **Tested on local machine:** YES / NO
- [ ] **Tested on staging server:** YES / NO

**Date:** ___________________

**Signed off by:** ___________________
