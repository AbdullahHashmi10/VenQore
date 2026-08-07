# VenQore V1 — Complete Store Testing & Go-Live Checklist
**Purpose:** Every item on this list must pass before a single real paying customer touches the system.  
**Scope:** V1 roles only — Owner, Admin, Manager, Cashier, Accountant, Purchasing Officer, Viewer.  
**How to use:** Work section by section, top to bottom. A section is only done when every `□` in it is ticked. Failed items get documented with what broke and what fixed it.

---

## PART A — BEFORE YOU TEST ANYTHING: Environment Verification

Run these first. If any fail, fix them before testing anything else.

```bash
# 1. Confirm migrations ran completely
php artisan migrate:status | grep -c "Pending"
# Must return 0

# 2. Confirm all role ENUMs exist in database
php artisan tinker --execute="
echo DB::select(\"SHOW COLUMNS FROM tenant_users LIKE 'role'\")[0]->Type;
"
# Must show all 17 roles including the V2/V3 ones defined now

# 3. Confirm platform_role column exists and has correct values
php artisan tinker --execute="
echo DB::select(\"SHOW COLUMNS FROM users LIKE 'platform_role'\")[0]->Type;
"

# 4. Confirm store_activity_log table exists
php artisan tinker --execute="
echo Schema::hasTable('store_activity_log') ? 'EXISTS' : 'MISSING';
"

# 5. Confirm staff_invitations table exists
php artisan tinker --execute="
echo Schema::hasTable('staff_invitations') ? 'EXISTS' : 'MISSING';
"

# 6. Confirm Horizon is running
php artisan horizon:status

# 7. Confirm mail is configured
php artisan tinker --execute="
Mail::raw('checklist test', fn(\$m) => \$m->to('your@email.com')->subject('VenQore checklist'));
echo 'sent';
"
# Check your inbox — must arrive within 60 seconds

# 8. Confirm R2 storage is working
php artisan tinker --execute="
Storage::disk('r2')->put('_test/ping.txt', 'ok');
echo Storage::disk('r2')->get('_test/ping.txt');
Storage::disk('r2')->delete('_test/ping.txt');
"
# Must print: ok
```

```
□ Zero pending migrations
□ tenant_users.role ENUM contains all 17 roles
□ users.platform_role column exists with correct values
□ store_activity_log table exists
□ staff_invitations table exists  
□ platform_activity_log table exists
□ tenant_permission_overrides table exists
□ support_tickets table exists
□ Horizon is running
□ Test email arrived in inbox (not spam)
□ R2 read/write/delete working
□ APP_DEBUG=false in production .env
□ No hardcoded currency symbols (grep -rn "Rs\." resources/js/ returns 0 results)
```

---

## PART B — NEW STORE CREATION FLOW

### B1 — Registration → Trial Store → Wizard

**Test: Fresh signup as a new user with no existing account.**

```
Step 1: Go to venqore.com/register
□ Registration form displays correctly
□ Name, email, password, confirm password fields present
□ Terms of Service checkbox present and required
□ Submitting without ToS check: blocked with clear error
□ Submitting with weak password: blocked with clear error
□ Submitting with already-used email: blocked with clear error "Email already registered"

Step 2: Submit valid registration
□ User record created in database with platform_role = 'none'
□ StoreLicense created automatically with type='trial', status='available'
□ Redirected to /start (create-or-join page), NOT dashboard
□ Verification email sent (if email verification enabled)

Step 3: Click "Create my first store"
□ Store creation form displays
□ Store name field required — empty submission blocked
□ Submit valid store name
□ Tenant record created with status='trial', trial_ends_at = 14 days from now
□ tenant_users record created with role='owner', status='active'
□ StoreLicense updated: status='consumed', tenant_id populated
□ TenantDefaultSeeder ran: chart of accounts seeded
□ R2 folder created: tenants/{tenant_id}/
□ User redirected to /app/{store-slug}/setup (Setup Wizard)
□ store_activity_log entry created: action='store.created'
```

### B2 — Setup Wizard

```
Step 4: Setup Wizard — Page 1 (Business Profile)
□ Store name pre-filled from creation step
□ Currency dropdown works — selecting Pakistani Rupee sets symbol to Rs.
□ Timezone dropdown works
□ Business logo upload optional — works and stores to R2
□ Submitting without currency: blocked

Step 5: Setup Wizard — Page 2 (Industry Selection)
□ All industry groups displayed correctly (Big Retail, Hard Goods, Lifestyle, F&B, Niche B2B)
□ Selecting "Fashion/Apparel" → feature_variants flag set to true on tenant
□ Selecting "Electronics/IT" → feature_serials flag set to true on tenant
□ Selecting "Pharmacy" → feature_batches flag set to true on tenant
□ Selecting any non-specialty industry → no special flags set
□ Industry-specific categories seeded correctly after selection
□ Confirm categories in database: SELECT * FROM categories WHERE tenant_id = ?

Step 6: Wizard Completion
□ setup_completed = true on tenants table after finishing
□ Redirected to /app/{store-slug}/dashboard
□ Dashboard shows store name correctly
□ Dashboard shows correct currency symbol throughout
□ Dashboard shows empty/zero state (not another tenant's data)
□ Welcome banner or first-time message shown (if implemented)
□ Setup wizard does NOT appear again on second login
```

### B3 — Store Slug Validation

```
□ Store named "Admin" does not create slug "admin" — gets suffix
□ Store named "API" does not create slug "api" — gets suffix  
□ Two stores with same name get different slugs (test by creating twice)
□ Store slug contains only lowercase letters, numbers, hyphens
□ Store slug is unique in tenants table: SELECT COUNT(*) FROM tenants WHERE slug = 'test-slug'

SLUG RENAME POLICY CHECK:
□ If slug rename is allowed: old slug 301-redirects to new slug permanently
□ If slug rename is forbidden: settings page shows slug as read-only
□ Confirm which policy is implemented and test it
```

---

## PART C — ROLE ISOLATION TESTS

For each role test below, create a fresh user, invite them to the test store with that role, log in as them, and verify access.

**Test store setup (do this once):**
- Store name: "VQ Test Store"  
- Pre-loaded with: 5 products, 3 customers, 2 sales, 1 purchase order, 1 journal entry

### C1 — Owner Role

```
□ Can access: Dashboard, POS, Sales, Purchases, Inventory, Finance, Reports (all 38), Staff, Settings, Billing
□ Billing page shows subscription status and Lemon Squeezy portal link
□ Can invite new staff (all roles visible in dropdown)
□ Can change another staff member's role
□ Can remove a staff member
□ Can transfer ownership (see Transfer Ownership section below)
□ Can delete the store (shows warning, requires confirmation)
□ Can set/reset staff POS PINs
□ Cannot see any /hq/* routes (returns 403, not redirect to login)
□ Dashboard shows correct revenue figures (not another store's data)
```

### C2 — Admin Role

```
□ Can access: Dashboard, POS, Sales, Purchases, Inventory, Finance, Reports, Staff, Settings
□ CANNOT access: Billing page (returns 403)
□ CANNOT delete the store (button absent or returns 403)
□ CANNOT transfer ownership (option absent)
□ Can invite staff members
□ Can change staff roles (except Owner role — cannot promote to Owner)
□ Cannot change the Owner's role
□ Cannot see /hq/* routes (returns 403)
```

### C3 — Manager Role

```
□ Can access: Dashboard, POS, Sales, Purchases, Inventory, Reports (all 38), Stock Adjustments
□ CANNOT access: Staff management (invite/remove)
□ CANNOT access: Billing
□ CANNOT access: Settings (or read-only if settings are split)
□ CANNOT access: /hq/* routes
□ Can open and close POS sessions
□ Can approve discounts above cashier threshold (if implemented)
□ Can view stock levels across all warehouses
□ Can create and edit products
□ Stock adjustment: creates a log entry with reason
□ Reports: all 38 accessible and show correct filtered data (tenant only)
```

### C4 — Cashier Role (Most Restricted Active User)

```
□ Login redirects to /app/{slug}/dashboard with minimal dashboard
□ Dashboard shows: My Session stats, Open POS button, My Attendance
□ Dashboard does NOT show: Revenue figures, staff counts, financial KPIs
□ Can access: POS only
□ CANNOT access: /app/{slug}/sales (list page) — returns 403
□ CANNOT access: /app/{slug}/inventory — returns 403
□ CANNOT access: /app/{slug}/reports — returns 403
□ CANNOT access: /app/{slug}/finance — returns 403
□ CANNOT access: /app/{slug}/staff — returns 403
□ CANNOT access: /app/{slug}/settings — returns 403
□ CANNOT access: /app/{slug}/billing — returns 403
□ CANNOT access: /hq/* — returns 403

POS-specific tests:
□ Can search products by name
□ Can search products by barcode
□ Can add products to cart
□ Can apply pre-approved discounts (within their allowed threshold)
□ CANNOT apply discounts above threshold without Shift Supervisor/Manager approval
□ Can accept cash payment
□ Can accept card/other payment types
□ Sale completes: receipt viewable
□ Stock decremented after sale (verify in database)
□ Journal entry created after sale (verify in journal_entries table)
□ Sale appears in today's sales (visible to Manager/Admin, NOT visible to this cashier outside POS)
□ Can process a return IF owner has enabled this permission
□ CANNOT void a sale without supervisor approval
□ Can clock in and out
□ POS PIN login works on shared device (if PIN set)
□ 5 wrong PIN attempts triggers lockout (if implemented)
```

### C5 — Accountant Role

```
□ Can access: Dashboard (financial), Finance, Reports (all 38)
□ CANNOT access: POS
□ CANNOT access: Staff management
□ CANNOT access: Billing
□ CANNOT access: /hq/* routes
□ Can create journal entries
□ Can edit journal entries (creates reversal, not direct edit)
□ Can reconcile bank accounts
□ Can manage chart of accounts (add/edit accounts)
□ CANNOT create a sale directly (no access to sales creation form)
□ CANNOT modify product prices
□ Reports: P&L, Balance Sheet, Cash Flow all load with correct data
□ Receivables aging report shows correct figures
□ Bank reconciliation marks a transaction as reconciled — persists on reload
```

### C6 — Purchasing Officer Role

```
□ Can access: Dashboard (procurement), Purchases, Supplier Management, Inventory (view levels)
□ CANNOT access: Sales list, Customer list
□ CANNOT access: Finance/Accounting
□ CANNOT access: Staff management, Billing
□ CANNOT access: /hq/* routes
□ Can create a purchase order
□ Can receive stock against a purchase order (marks delivery received, increments stock)
□ Can view supplier list and outstanding payables
□ Can view product cost prices and reorder levels
□ CANNOT approve their own PO above the set limit (needs Manager/Admin sign-off)
□ Stock receipt: creates stock movement record in database
□ Stock receipt: updates stock quantity correctly
```

### C7 — Viewer / Auditor Role

```
□ Can access: Reports only (all 38 — read-only)
□ Dashboard shows: Financial Summary only
□ CANNOT access: POS, Sales (transactional), Inventory CRUD, Finance CRUD
□ CANNOT access: Staff, Settings, Billing
□ CANNOT access: /hq/* routes
□ Reports load correctly: P&L, Balance Sheet, Inventory Valuation fully visible
□ Customer-linked sales reports: customer names aggregated/hashed (e.g., "Customer A") — if implemented
□ Staff performance reports: NOT visible (section blocked)
□ Export to PDF works (read-only — just generating a file)
□ CANNOT click any "Create", "Edit", or "Delete" button anywhere
□ Direct URL access to /app/{slug}/sales/create returns 403
□ Direct URL access to /app/{slug}/inventory/create returns 403
```

---

## PART D — MULTI-TENANT ISOLATION (CRITICAL)

Run this entire section every time the middleware or HasTenant trait changes.

### D1 — Database Isolation Verification

```bash
# After creating Store A and Store B with sample data in each:
php artisan tinker --execute="
\$stores = Tenant::withoutGlobalScope('tenant')->pluck('name', 'id');
echo 'Stores: ' . \$stores->count() . PHP_EOL;

foreach(\$stores as \$id => \$name) {
    \$products = DB::table('products')->where('tenant_id', \$id)->count();
    \$nullProducts = DB::table('products')->whereNull('tenant_id')->count();
    echo \$name . ': ' . \$products . ' products, ' . \$nullProducts . ' unscoped' . PHP_EOL;
}
"
```

```
□ Store A products not visible when logged in as Store B (browser test)
□ Store A sales not visible when logged in as Store B
□ Store A customers not visible when logged in as Store B
□ Store B dashboard revenue shows only Store B figures (not combined)
□ All 38 reports for Store B show only Store B data
□ Zero rows with NULL tenant_id in: products, sales, parties, accounts, journal_entries
□ API endpoint test: Get Store A product UUID, request it while authenticated as Store B user
  → Must return 404, not the product data
□ The {store_slug} middleware correctly resolves slug → tenant and verifies membership
□ User from Store A who guesses Store B's slug gets 403 (not Store B's data)
```

### D2 — Multi-Tab Safety Test

```
Test: Open two browser tabs simultaneously
Tab 1: /app/store-a-slug/pos — begin a sale
Tab 2: /app/store-b-slug/inventory — browse products

□ Completing the sale in Tab 1 records it in Store A (not Store B)
□ Refreshing Store B inventory in Tab 2 shows Store B's products (not Store A's)
□ No cross-contamination between tabs
□ Switching stores in Tab 2 does not affect Tab 1's active context

Why this works with slug-based URLs:
□ Confirm that Tab 1's POS API calls include store-a-slug in the URL
□ Confirm that Tab 2's API calls include store-b-slug in the URL
□ No shared session variable is used to determine store context
```

---

## PART E — STAFF INVITE SYSTEM

### E1 — Email Invite Flow

```
Step 1: Owner invites staff member by email

□ Invite form: email field, role dropdown (V1 roles only visible)
□ Role dropdown shows: Admin, Manager, Cashier, Accountant, Purchasing Officer, Viewer
□ Role dropdown does NOT show: Owner (cannot invite someone as Owner)
□ Submitting with invalid email: blocked
□ Submitting with email of existing staff member: shows "already a member" error
□ Invite submitted: staff_invitations record created in database
□ Invite email sent within 60 seconds
□ Invite email: correct store name, correct role, secure link

Step 2: Invitee receives email and clicks link

□ Link format: venqore.com/invite/{token}
□ Token in database stored as HASH (not plain text)
□ Plain token in email link — constant-time comparison on verification
□ Clicking link when NOT logged in: redirected to login with pending invite preserved in session
□ After login: invite accepted, TenantUser record created
□ After registration (new user): invite accepted, user created + TenantUser created
□ Clicking link when logged in as WRONG email: blocked with "This invite was sent to a different email"
□ Clicking link when logged in as CORRECT email: accepted immediately
□ After acceptance: redirected to /app/{store-slug}/dashboard with success message
□ After acceptance: token invalidated in database (accepted_at set, token nulled)
□ Clicking same link again after acceptance: 404 (token is gone)

Step 3: Expired invite

□ Invite older than 7 days: clicking link shows "This invitation has expired"
□ Expired invite: owner can resend (creates new invite, old one marked expired)
□ Resending invalidates previous token before creating new one
```

### E2 — Join With Code

```
□ Store join code visible in settings: format VQ-XXXX
□ User visits /join, enters correct code → joins as default role (cashier)
□ User enters wrong code → clear error "Invalid code"
□ User who is already a member enters their store's code → "You are already a member" message
□ Join code can be regenerated by Owner (old code immediately invalid)
□ Reserved words cannot be join codes (VQ-ADMIN should never generate)
```

### E3 — Staff Management

```
□ Owner can change a staff member's role (except own role)
□ Owner can suspend a staff member (status → suspended)
□ Suspended staff member cannot log in to that store (middleware blocks)
□ Suspended staff member can still access other stores they belong to
□ Owner can re-activate a suspended staff member
□ Owner can remove a staff member entirely (soft-delete TenantUser record)
□ Removed staff member's historical actions remain in store_activity_log (not deleted)
□ Staff member count respects plan limits: plan_limit reached → invite blocked with upgrade prompt
□ Admin can invite staff but cannot invite at Owner role level
□ Admin cannot change the Owner's role
□ Manager cannot invite or remove staff
```

---

## PART F — CORE ERP FUNCTIONALITY TESTS

### F1 — Complete Sale Flow (The Most Critical Test)

```
Setup: 
- Product "Test Shoes" | Price: $50 | Stock: 10 | Cost: $30
- Customer "Ahmed Ali"

□ Open POS
□ Search "Test Shoes" — appears in results within 300ms
□ Add to cart — quantity 2
□ Cart shows: 2 × $50 = $100
□ Apply 10% discount — cart shows $90
□ Select customer "Ahmed Ali"
□ Select payment method: Cash
□ Enter cash received: $100
□ Change shown: $10
□ Complete sale

POST-SALE VERIFICATION (check these in the database):
□ Sale record created with: correct tenant_id, correct user_id, correct total ($90), correct discount ($10)
□ SaleItem records: 2 items, correct product_id, correct price
□ Stock updated: "Test Shoes" inventory now shows 8 (was 10, sold 2)
□ Stock movement record created: type='sale', quantity=-2
□ Journal entry created:
    □ Debit: Cash/Bank account → $90
    □ Credit: Sales Revenue → $90
    □ Debit: Cost of Goods Sold → $60 (2 × $30 cost)
    □ Credit: Inventory → $60
    □ Total debits = Total credits (balanced)
□ Customer "Ahmed Ali" balance updated if credit sale
□ Receipt viewable and printable
□ Sale appears in Sales report filtered by today
□ Sale appears in P&L report in correct period
□ Cashier's session totals updated

EDGE CASES:
□ Attempt to sell more than stock quantity → blocked with out-of-stock error
□ Sell 0 quantity → blocked
□ Negative price → blocked
□ Sale with no products in cart → cannot complete
```

### F2 — Purchase Order Flow

```
□ Create supplier "Ali Traders" with contact info
□ Create purchase order: 5 units of "Test Shoes" at cost $30 each
□ Purchase order shows status: Ordered
□ Receive partial delivery: 3 units
    □ Stock increases by 3
    □ Stock movement record created: type='purchase', quantity=+3
    □ PO status: Partially Received
    □ Journal entry: Debit Inventory $90, Credit Accounts Payable $90
□ Receive remaining 2 units
    □ Stock increases by 2
    □ PO status: Fully Received
□ Post payment to supplier: $150 total
    □ Journal entry: Debit Accounts Payable $150, Credit Cash $150
    □ Supplier balance updated
□ Purchase appears in purchase reports
□ Payables aging report updated
```

### F3 — Inventory Management

```
□ Create product with all fields: name, SKU, barcode, price, cost, category, image
□ Product image uploads to R2, displays correctly
□ SKU is unique within the store (duplicate blocked)
□ Barcode lookup in POS finds the product instantly
□ Edit product: all changes save and reflect immediately
□ Delete product with NO sales history: succeeds
□ Delete product WITH sales history: blocked with clear error
□ Stock adjustment: manual increase (reason logged)
□ Stock adjustment: manual decrease (reason logged)
□ Stock adjustment: appears in stock movement report
□ Multi-warehouse: create second warehouse (Growth plan)
    □ Transfer stock from Warehouse A to Warehouse B
    □ Warehouse A stock decreases
    □ Warehouse B stock increases
    □ Transfer logged in stock_movements
□ Low stock alert: set reorder point to 5, reduce stock to 4 → alert appears
□ Category creation works
□ Category with products: cannot delete (blocked)
□ Category with no products: can delete
```

### F4 — Accounting & Reports

```
□ Chart of accounts seeded with standard accounts for new store
□ Manual journal entry: create with balanced debits and credits
□ Unbalanced journal entry (debits ≠ credits): blocked with clear error
□ Journal entry edit: creates reversal entry automatically (does not edit original)
□ All 38 reports load without a 500 error (run through each one)
□ P&L report shows correct figures matching known test data
□ Balance Sheet: Assets = Liabilities + Equity (must balance)
□ Trial Balance: total debits = total credits
□ Cash Flow report loads correctly
□ Receivables Aging: shows customer balances by age bracket
□ Payables Aging: shows supplier balances by age bracket
□ Report date range filter works: changing dates changes the data
□ Report warehouse filter works (if multi-warehouse)
□ Export to PDF: queued job runs, PDF downloadable
□ Export to Excel: queued job runs, Excel downloadable
□ Bank reconciliation: mark a transaction as reconciled, persists on reload
```

### F5 — Customer (Party) Management

```
□ Create customer with: name, phone, email, address, credit limit
□ Create supplier with: name, contact, payment terms
□ Customer appears in POS customer search
□ Customer credit sale: balance tracked correctly
□ Customer payment received: balance reduced
□ Customer statement: shows all transactions, correct balance
□ Delete customer with NO transactions: succeeds
□ Delete customer WITH transactions: blocked with clear error
```

---

## PART G — PLATFORM OWNER (HQ) PANEL TESTS

### G1 — Access Control

```bash
# Test that regular store users cannot access HQ
# Log in as a store Owner (platform_role = 'none')
# Then try:
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: your_session_cookie" \
  https://venqore.com/hq/
# Must return 403 — NOT 302 (which would confirm the route exists)
```

```
□ /hq/* routes return 403 for users with platform_role = 'none'
□ /hq/* routes return 403 (not redirect) — so route existence is not leaked
□ Platform Owner can access /hq/dashboard
□ Platform Owner dashboard loads: store count, MRR, ARR, trial count, active count
□ Platform Owner can see all tenants in /hq/stores
□ Platform Owner can suspend a store from the list
□ Platform Owner can activate a suspended store
□ Platform Owner can extend a trial (update trial_ends_at)
□ Platform Owner can change a store's plan
□ Suspended store: owner gets access-blocked page when trying to log in
□ Suspended store: store's cashiers also cannot log in (middleware blocks)
□ Platform Owner impersonates a store user (read-only): see Impersonation section
```

### G2 — Impersonation Safety

```
□ Platform Owner clicks "Impersonate Owner" on a store
□ Impersonation session created: impersonation_session JSON set on session
□ Persistent WARNING BANNER visible at top of every page: "⚠️ You are viewing as [Store Name]. All write actions are blocked."
□ Banner cannot be dismissed
□ While impersonating: attempt a POST request (e.g., create a product)
    □ Request blocked with 403 message "Action blocked during impersonation session"
    □ Blocked attempt logged to platform_activity_log: action='blocked_write_during_impersonation'
□ While impersonating: GET requests work (can browse the store's data)
□ While impersonating: store_activity_log shows actions tagged as impersonation
□ End impersonation: banner disappears, write access restored
□ After impersonation: platform_activity_log entry: who impersonated, which store, duration
□ Platform Owner cannot impersonate another Platform Owner (blocked)
```

---

## PART H — PAYMENT & SUBSCRIPTION TESTS

### H1 — Trial Flow

```bash
# Manually expire a trial to test the expiry flow
php artisan tinker --execute="
Tenant::withoutGlobalScope('tenant')
    ->where('slug', 'test-store')
    ->update(['trial_ends_at' => now()->subMinute()]);
"
```

```
□ Expired trial: owner trying to access /app/{slug}/dashboard redirected to trial expired page
□ Trial expired page: shows upgrade/payment link
□ Trial expired page: does NOT show a 500 error
□ Trial expiry cron job runs: php artisan tenants:process-expired-trials
□ 7-day trial warning email sent at correct time
□ 2-day trial warning email sent at correct time
□ Expired tenant data is preserved (not deleted — just access suspended)
□ Paying after expiry: webhook fires, tenant.status → 'active', access restored
□ Access restored: owner can log in without needing to do anything extra
```

### H2 — Lemon Squeezy Webhook Tests

```bash
# Use Lemon Squeezy test mode with their CLI or Webhook.site
# Simulate each event and verify the result
```

```
□ subscription_created: new tenant created, welcome email sent, owner can log in
□ subscription_updated (plan upgrade): tenant.plan updated, new limits applied immediately
□ subscription_updated (plan downgrade): tenant.plan updated, if over new limits show warning
□ subscription_cancelled: tenant.status → 'cancelled' (not suspended immediately — end of period)
□ subscription_expired: tenant.status → 'suspended', owner sees payment required page
□ subscription_payment_failed: payment failure email sent to store owner's email
□ Webhook signature validation: invalid signature → 401, not processed
□ Webhook is processed asynchronously (job dispatched, not inline)
□ ProvisionTenantJob failure: retried 3 times, then logged with all details for manual fix
□ Double-webhook protection: same order_id processed twice → second is a no-op (idempotent)
```

### H3 — AppSumo Code Redemption

```
□ New user registers, goes to /redeem, enters valid AppSumo code
□ Code redeemed: StoreLicense created with type='ltd', plan='starter'
□ AppSumo code marked as consumed in database
□ Same code cannot be redeemed twice (error: "This code has already been redeemed")
□ Different user trying same code: blocked (code already consumed)
□ Second code from same user: upgrades license to Growth plan
□ Second code: if store already exists, store.plan updated to 'growth' immediately
□ Third code from same user: upgrades to Business plan
□ Fourth code attempt: blocked with "Maximum of 3 codes per account"
□ User with redeemed code creates store: store gets LTD plan type, no trial expiry
□ LTD store: trial_ends_at is NULL (no expiry)
□ LTD store: status = 'active' (not 'trial')
```

---

## PART I — SECURITY TESTS

### I1 — Authentication Boundaries

```bash
# Test 1: Unauthenticated access
curl -s -o /dev/null -w "%{http_code}" https://venqore.com/app/any-slug/dashboard
# Must return 302 (to login) or 401

# Test 2: Wrong store membership
# Log in as user who belongs to store-a only
# Try to access store-b
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: store_a_session" \
  https://venqore.com/app/store-b-slug/dashboard
# Must return 403

# Test 3: Brute force protection
for i in {1..15}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://venqore.com/login \
    -d "email=test@test.com&password=wrongpassword&_token=invalid")
  echo "Attempt $i: $CODE"
done
# Attempts 11+ must return 429
```

```
□ Unauthenticated user accessing /app/* redirected to login
□ Store user cannot access another store (membership check in middleware)
□ Store user cannot access /hq/* (returns 403)
□ Login brute force: blocked after 10 attempts per IP
□ Password reset: token is single-use (second use of same token fails)
□ Password reset: token expires after 60 minutes
□ CSRF: POST requests without CSRF token return 419
□ Invite token: only works for the specific email it was sent to
□ Invite token: expired tokens return 404
□ Invite token: single use (cannot be replayed after acceptance)
```

### I2 — Plan Limit Enforcement at API Level

```bash
# Test that limits are enforced even with direct API calls (not just UI)
# On a Starter plan store with 1,000 products:
curl -s -X POST https://venqore.com/app/starter-store/inventory \
  -H "Cookie: valid_cashier_session" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product 1001","price":10}'
# Must return 403 with plan limit message — NOT 201 (created)
# NOT 422 (validation error — that would mean it got past the limit check)
```

```
□ Starter: 1,001st product attempt returns 403 at API level
□ Starter: 2nd warehouse creation returns 403 at API level
□ Starter: 4th staff invite returns 403 at API level
□ Cashier role: POST to /sales/create returns 403 at API level
□ Viewer role: POST to any create endpoint returns 403
□ Plan limit 403 response includes upgrade URL in JSON body
□ Frontend shows upgrade modal (not generic "error" toast) when limit is hit
```

---

## PART J — PERFORMANCE BASELINE

Before going live, record these baselines. Any regression from these numbers needs investigation.

```bash
# POS page load time (no products in payload)
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  https://venqore.com/app/test-store/pos
# Target: under 1.0 second

# POS product search (test with 1,000 products in the store)
time curl -s "https://venqore.com/app/test-store/pos/products?q=shoe" > /dev/null
# Target: under 300ms

# Dashboard page load
time curl -s https://venqore.com/app/test-store/dashboard > /dev/null
# Target: under 2.0 seconds

# Heaviest report (P&L with 1,000 transactions)
time curl -s "https://venqore.com/app/test-store/reports/profit-loss?from=2024-01-01&to=2024-12-31" > /dev/null
# Target: under 3.0 seconds (acceptable for reports), queue it if over 5 seconds
```

```
□ POS page loads in under 1 second (no full catalog in payload)
□ POS search returns results in under 300ms
□ Dashboard loads in under 2 seconds with 1,000 transactions
□ All 38 reports load without 500 error (even if slow — slowness is a separate issue)
□ No N+1 query issues on main list pages (check query log for repeated similar queries)
□ Horizon shows zero failed jobs after all above tests run
□ No ERROR or CRITICAL log entries after running all tests
```

---

## PART K — CLEANUP BEFORE REAL USERS

```bash
# Remove all test data created during testing
php artisan tinker --execute="
\$testSlugs = ['vq-test-store', 'store-a-test', 'store-b-test', 'starter-store'];
foreach(\$testSlugs as \$slug) {
    \$t = Tenant::withoutGlobalScope('tenant')->where('slug', \$slug)->first();
    if(\$t) {
        \$tables = ['products','sales','sale_items','parties','accounts',
                   'journal_entries','journal_entry_lines','categories',
                   'warehouses','stocks','stock_movements','invoices',
                   'tenant_users','store_activity_log'];
        foreach(\$tables as \$table) {
            DB::table(\$table)->where('tenant_id', \$t->id)->delete();
        }
        \$t->forceDelete();
        echo 'Deleted: ' . \$slug . PHP_EOL;
    }
}
"

# Clear test users created during testing (keep real users)
# Clear queue of any test jobs
php artisan queue:clear --queue=default
php artisan queue:clear --queue=provisioning
php artisan queue:flush  # clear failed jobs

# Reset demo store to clean state
php artisan demo:reset
```

```
□ All test tenant slugs deleted from database
□ No test user accounts with "test@" emails in users table
□ Demo store is the only pre-existing tenant (besides AMD Outlets / your live store)
□ Queue has zero pending jobs
□ Queue has zero failed jobs
□ Application logs cleared of test noise
□ R2 test folders deleted (tenants/{test_tenant_ids}/)
□ AppSumo test codes invalidated
```

---

## PART L — DOCUMENT ANY KNOWN GAPS

Before going live, document every known limitation or incomplete feature so you know what it is and have decided it is acceptable for V1.

```
Write the answer for each of these:

□ Is the store_activity_log actually being written on every action? 
  Test: Create a product, check store_activity_log table.
  Status: ________________

□ Is platform_activity_log written for Platform Owner actions?
  Test: Suspend a store from /hq, check platform_activity_log.
  Status: ________________

□ What happens if a Lemon Squeezy webhook fails to deliver?
  Is there a retry mechanism? Is there a manual re-trigger?
  Status: ________________

□ What is the backup strategy and when was the last backup tested?
  Status: ________________

□ Is there a /health endpoint active and being monitored by UptimeRobot?
  Status: ________________

□ Is there an error alerting channel (Slack/email) for production 500 errors?
  Status: ________________

□ Has the ownership transfer flow been tested end-to-end including the 
  Lemon Squeezy billing contact update?
  Status: ________________
```

---

## FINAL SIGN-OFF

```
Part A — Environment:         ALL PASSED □   Date: ________
Part B — Store Creation:      ALL PASSED □   Date: ________
Part C — Role Isolation:      ALL PASSED □   Date: ________
Part D — Tenant Isolation:    ALL PASSED □   Date: ________
Part E — Staff Invites:       ALL PASSED □   Date: ________
Part F — Core ERP:            ALL PASSED □   Date: ________
Part G — Platform Owner:           ALL PASSED □   Date: ________
Part H — Payments:            ALL PASSED □   Date: ________
Part I — Security:            ALL PASSED □   Date: ________
Part J — Performance:         ALL PASSED □   Date: ________
Part K — Cleanup:             ALL PASSED □   Date: ________
Part L — Known Gaps:          DOCUMENTED □   Date: ________

Known Issues Accepted for V1 Launch:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

System ready for real paying customers: YES □ / NO □

Signed off by: _________________ Date: _____________
```
