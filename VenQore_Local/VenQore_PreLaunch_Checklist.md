# VenQore — The Complete Pre-Launch Master Checklist
**Purpose:** This document is the final gate before going live. Nothing gets deployed to production until every single checkbox on this list is ticked. Not "I think it works." Not "it worked last time I checked." Run every command, test every scenario, confirm every output.

**How to use:**
- Work through sections in order — they build on each other
- `□` = not done | `✓` = confirmed passing | `✗` = failed (document the failure below the item)
- Every command block must be run and output verified, not just read
- If something fails, fix it and re-run the entire section, not just the failed item

**Environment:** All checks in Sections 1-8 must pass on LOCAL first. Then repeat Sections 6-12 on STAGING. Then Section 13 is production-only.

---

## SECTION 1: Server & Infrastructure Baseline

### 1.1 — Operating System & Runtime
```bash
# Run each and verify output
uname -a                          # Ubuntu 22.04 or 24.04 LTS
php --version                     # PHP 8.2+ required (8.3 preferred)
php -m | grep -E "pdo|mbstring|openssl|tokenizer|xml|ctype|json|bcmath|gd|zip|redis"
# All of these must appear in output
composer --version                # 2.x
node --version                    # 18.x or 20.x LTS
npm --version                     # 9.x or 10.x
redis-cli ping                    # must return PONG
mysql --version                   # MySQL 8.0+
nginx -v                          # Nginx 1.18+
supervisorctl status              # all programs must show RUNNING
```
```
□ PHP 8.2+ confirmed
□ All required PHP extensions present
□ Redis is responding
□ MySQL 8.0+ confirmed
□ Nginx running
□ Supervisor running
```

### 1.2 — PHP Configuration
```bash
php -i | grep -E "memory_limit|upload_max_filesize|post_max_size|max_execution_time|opcache.enable"
```
```
□ memory_limit = 256M or higher
□ upload_max_filesize = 20M or higher (product images)
□ post_max_size = 25M or higher
□ max_execution_time = 120 or higher
□ opcache.enable = 1 (production only)
```

### 1.3 — Disk & Memory
```bash
df -h /                           # root partition
free -h                           # RAM
df -h /var/www/venqore/storage    # storage partition
```
```
□ Root partition at least 60% free before launch
□ RAM: at least 3GB available on a 4GB server (Redis + MySQL + PHP-FPM + Nginx)
□ Storage logs directory is writable: ls -la storage/logs/
□ Storage framework directory is writable: ls -la storage/framework/
```

### 1.4 — SSL Certificate
```bash
# Check wildcard cert covers both root and all subdomains
certbot certificates
# Look for: Domains: venqore.com *.venqore.com
# Look for: VALID: must be 60+ days remaining

openssl s_client -connect venqore.com:443 -servername venqore.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
openssl s_client -connect testshop.venqore.com:443 -servername testshop.venqore.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```
```
□ Wildcard cert covers *.venqore.com
□ Cert expiry is 60+ days from launch date
□ HTTPS works on root domain
□ HTTPS works on a test subdomain
□ HTTP redirects to HTTPS (test: curl -I http://venqore.com)
□ Certbot auto-renewal is configured: systemctl status certbot.timer
```

### 1.5 — DNS Configuration
```bash
# Verify DNS propagation
dig venqore.com A              # must point to your server IP
dig testshop.venqore.com A     # must point to your server IP (wildcard resolving)
dig www.venqore.com A          # must point to your server IP
dig MX venqore.com             # must have MX records for email delivery

# Check from outside (verify it's not just local cache)
curl https://dnschecker.org/all-dns-records-of-domain.php?query=venqore.com
```
```
□ venqore.com A record resolves to correct IP
□ *.venqore.com wildcard A record resolves to correct IP
□ www.venqore.com resolves
□ MX records exist for email
□ Propagation confirmed from external checker
```

### 1.6 — Cloudflare Configuration
```
□ Cloudflare proxy enabled (orange cloud) for both A records
□ SSL/TLS mode set to "Full (Strict)" — NOT "Flexible"
□ "Always Use HTTPS" is ON in Cloudflare SSL settings
□ Minimum TLS version set to 1.2
□ Auto Minify: HTML, CSS, JS enabled
□ Caching level: Standard
□ R2 bucket is created and public access is configured
□ R2 custom domain (assets.venqore.com) is configured and resolving
□ Test R2 upload: upload a test file and confirm it's accessible via public URL
```

---

## SECTION 2: Application Configuration

### 2.1 — Environment File
```bash
# Confirm .env exists and has no placeholder values
grep -E "^APP_KEY=$|your-key-here|CHANGE_ME|example\.com" .env
# Must return zero results — any match means an unconfigured variable

php artisan config:show app | grep -E "name|env|debug|url"
```
```
□ APP_ENV=production
□ APP_DEBUG=false  ← CRITICAL: true in production exposes stack traces to users
□ APP_KEY is set (php artisan key:generate if blank)
□ APP_URL=https://venqore.com (not http, not localhost)
□ APP_DOMAIN=venqore.com
□ SESSION_DOMAIN=.venqore.com (leading dot — critical for subdomains)
□ SESSION_SECURE_COOKIE=true
□ SESSION_DRIVER=redis (not file — file sessions don't work well with multi-tenancy)
□ CACHE_STORE=redis
□ QUEUE_CONNECTION=redis
□ LOG_CHANNEL=daily (not single — single log file grows forever)
□ LOG_LEVEL=error (not debug — debug fills disk fast in production)
```

### 2.2 — Database Connection
```bash
php artisan db:show
# Must show: Connected successfully

php artisan migrate:status | grep -c "Ran"
# Count of ran migrations — compare with total in database/migrations/

mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
# Should be 150+ for production
```
```
□ Database connection successful
□ All migrations show status "Ran"
□ No pending migrations (php artisan migrate:status | grep "Pending" = 0)
□ MySQL max_connections >= 100
□ Database name, host, port all correct in .env
□ Database user has correct permissions (not root)
```

### 2.3 — Redis Connection
```bash
php artisan tinker --execute="Redis::ping();"    # must return +PONG
redis-cli info memory | grep used_memory_human   # check current usage
redis-cli info clients | grep connected_clients  # check connections
```
```
□ Laravel can connect to Redis
□ Redis memory usage is reasonable (under 80% of maxmemory)
□ Redis maxmemory-policy is set (recommend: allkeys-lru)
□ Redis persistence is configured (appendonly yes OR save snapshots)
```

### 2.4 — Queue & Horizon
```bash
php artisan horizon:status      # must show: Horizon is running
php artisan queue:monitor       # check for stuck jobs

# Check supervisor is running Horizon
supervisorctl status horizon    # must show RUNNING

# Verify queues exist
redis-cli llen queues:default
redis-cli llen queues:provisioning
redis-cli llen queues:emails
```
```
□ Horizon is running via Supervisor
□ Horizon dashboard accessible at /horizon (protected by HorizonServiceProvider)
□ Horizon dashboard access restricted to admin users only (not public)
□ All queue workers show as active in Horizon UI
□ No failed jobs from previous testing (clear before launch: php artisan queue:flush)
□ Supervisor auto-restarts Horizon on crash (autorestart=true in config)
□ Horizon restarts on deploy: php artisan horizon:terminate in deploy script
```

### 2.5 — Storage
```bash
php artisan storage:link        # must complete without error
ls -la public/storage           # must be a symlink
php artisan tinker --execute="Storage::disk('r2')->put('test/ping.txt', 'ok'); echo Storage::disk('r2')->get('test/ping.txt');"
# Must output: ok
```
```
□ public/storage symlink exists and works
□ R2 disk connection tested and working
□ Test file written to and read from R2 successfully
□ R2 credentials in .env are production credentials (not sandbox)
□ Filesystem default disk is set correctly in config/filesystems.php
□ Tenant storage path convention enforced: tenants/{tenant_id}/...
```

---

## SECTION 3: Multi-Tenancy Isolation Tests

**This is the most critical section. Data isolation failure means any customer can see any other customer's data. Run every test.**

### 3.1 — Tenant Zero Integrity
```bash
# Every table that has tenant_id must have ZERO rows without it
php artisan tinker --execute="
\$tables = ['products','sales','sale_items','parties','accounts',
            'journal_entries','journal_entry_lines','categories',
            'warehouses','stocks','invoices','users','expenses'];
foreach(\$tables as \$t) {
    \$count = DB::table(\$t)->whereNull('tenant_id')->count();
    echo \$t . ': ' . (\$count === 0 ? 'CLEAN' : 'FAIL - ' . \$count . ' unassigned rows') . PHP_EOL;
}
"
```
```
□ Zero rows with NULL tenant_id in products
□ Zero rows with NULL tenant_id in sales
□ Zero rows with NULL tenant_id in sale_items
□ Zero rows with NULL tenant_id in parties
□ Zero rows with NULL tenant_id in accounts
□ Zero rows with NULL tenant_id in journal_entries
□ Zero rows with NULL tenant_id in journal_entry_lines
□ Zero rows with NULL tenant_id in categories
□ Zero rows with NULL tenant_id in warehouses
□ Zero rows with NULL tenant_id in stocks
□ Zero rows with NULL tenant_id in invoices
□ Zero rows with NULL tenant_id in users
□ Zero rows with NULL tenant_id in expenses
```

### 3.2 — Cross-Tenant Data Bleed Test (Manual)

Create two test tenants. This test must be done manually in a browser.

```
Setup:
  Tenant A: subdomain = tenant-a-test, plan = starter
  Tenant B: subdomain = tenant-b-test, plan = growth

Test sequence:
1. Log in as Tenant A admin
2. Create 3 products: "A-Product-1", "A-Product-2", "A-Product-3"
3. Create 1 customer: "A-Customer"
4. Create 1 sale for $100
5. Log out

6. Log in as Tenant B admin
7. Check Products list — must show ZERO products (A's products are invisible)
8. Check Customers/Parties list — must show ZERO parties
9. Check Sales — must show ZERO sales
10. Check Dashboard — revenue must show $0, not $100
11. Check all Reports — all must show empty/zero data
12. Log out

13. Log in as Tenant A admin
14. Verify A's 3 products still exist — Tenant B did not corrupt them
```
```
□ Tenant B cannot see Tenant A's products
□ Tenant B cannot see Tenant A's customers
□ Tenant B cannot see Tenant A's sales
□ Tenant B dashboard shows $0, not Tenant A's $100
□ All reports show zero for Tenant B
□ Tenant A data intact after Tenant B logged in
```

### 3.3 — API Endpoint Isolation Test

```bash
# Get a valid product ID from Tenant A's database
TENANT_A_PRODUCT_ID="uuid-from-tenant-a"
TENANT_B_SESSION_COOKIE="session-cookie-from-tenant-b"

# Attempt to access Tenant A's product while authenticated as Tenant B
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: laravel_session=${TENANT_B_SESSION_COOKIE}" \
  https://tenant-b-test.venqore.com/api/products/${TENANT_A_PRODUCT_ID}
# Must return 404 — NOT 200 (which would mean data leak)
```
```
□ Direct UUID guessing of another tenant's product returns 404
□ Direct UUID guessing of another tenant's sale returns 404
□ Direct UUID guessing of another tenant's invoice returns 404
□ Direct UUID guessing of another tenant's customer returns 404
□ Modifying URL parameters to reference another tenant's warehouse returns 404
```

### 3.4 — Global Query Scope Verification
```bash
# Confirm HasTenant trait is applied to every model that needs it
grep -rL "HasTenant" app/Models/ --include="*.php"
# List any model files that DON'T use HasTenant — investigate each one
```
```
□ Product model uses HasTenant trait
□ Sale model uses HasTenant trait
□ SaleItem model uses HasTenant trait
□ Party model uses HasTenant trait
□ Account model uses HasTenant trait
□ JournalEntry model uses HasTenant trait
□ JournalEntryLine model uses HasTenant trait
□ Category model uses HasTenant trait
□ Warehouse model uses HasTenant trait
□ Stock model uses HasTenant trait
□ Invoice model uses HasTenant trait
□ User model uses HasTenant trait
□ Expense model uses HasTenant trait
```

### 3.5 — Reserved Subdomain Blocklist
```bash
php artisan tinker --execute="
\$reserved = ['admin','app','api','www','mail','demo','test','dev',
              'staging','billing','support','help','docs','dashboard',
              'login','signup','venqore','system'];
foreach(\$reserved as \$word) {
    \$result = App\Services\SubdomainGenerator::generate(\$word);
    echo \$word . ' -> ' . \$result . PHP_EOL;
}
"
# admin -> admin-391 (or similar — must NOT stay as 'admin')
# None of the reserved words should pass through unchanged
```
```
□ "admin" does not become a valid subdomain
□ "api" does not become a valid subdomain
□ "www" does not become a valid subdomain
□ "billing" does not become a valid subdomain
□ "demo" does not become a valid subdomain (reserved for your demo tenant)
□ "support" does not become a valid subdomain
□ Duplicate company names get numbered suffix (test by creating same name twice)
```

---

## SECTION 4: Payment & Provisioning Flow

### 4.1 — Lemon Squeezy Webhook

```bash
# Install the Lemon Squeezy CLI for local webhook testing
# Then simulate each event type

# Test 1: New subscription (most critical)
curl -X POST https://your-local-url/api/webhooks/lemon-squeezy \
  -H "X-Signature: valid-signature" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/lemon_squeezy_subscription_created.json

# Verify in database:
php artisan tinker --execute="echo Tenant::withoutTenantScope()->latest()->first()->toJson(2);"
```
```
□ Webhook endpoint returns 200 (not 500, not 422)
□ Webhook signature validation is working (invalid signature returns 401)
□ subscription_created event: tenant created correctly
□ subscription_created event: admin user created with correct email
□ subscription_created event: welcome email dispatched to queue
□ subscription_updated event: plan change updates tenant->plan correctly
□ subscription_cancelled event: tenant->status becomes 'cancelled'
□ subscription_expired event: tenant->status becomes 'suspended'
□ subscription_payment_failed event: payment failure email dispatched
□ ProvisionTenantJob has retry logic (tries = 3, backoff = 30 seconds)
□ Failed provision attempts are logged with tenant email for manual recovery
□ Webhook processing is asynchronous (dispatched to queue, not processed inline)
```

### 4.2 — Full Sign-Up to Login Flow (End-to-End)

Do this test completely: use a real email, go through the whole flow.

```
1. Go to venqore.com/register (or your signup page)
2. Enter a business name, email, choose Starter plan
3. Complete Lemon Squeezy checkout (use test card: 4242 4242 4242 4242)
4. Watch the queue: php artisan horizon — verify ProvisionTenantJob runs
5. Check your email inbox — welcome email must arrive within 60 seconds
6. Welcome email must contain: subdomain URL, login email, temporary password
7. Click the link in the email
8. Log in with the provided credentials
9. Must land on the Setup Wizard (not the main dashboard)
10. Complete the wizard: business name, currency, industry
11. Must land on the main dashboard with correct currency symbol
12. Dashboard must show $0 / empty state (not another tenant's data)
```
```
□ Registration form validates required fields
□ Lemon Squeezy checkout opens correctly
□ Test payment processes without error
□ Webhook fires and ProvisionTenantJob completes
□ Tenant record created in database with correct plan and subdomain
□ Welcome email arrives within 60 seconds
□ Email contains correct subdomain URL
□ Email contains login credentials
□ Login works with provided credentials
□ Setup Wizard appears on first login
□ Setup Wizard saves: business name, currency, timezone, industry
□ Currency symbol updates everywhere after wizard (not still showing $)
□ Dashboard shows empty/zero state after wizard completion
□ setup_completed flag set to true in tenants table
□ Wizard does NOT appear on second login
```

### 4.3 — Trial Expiry Flow
```bash
# Manually set trial_ends_at to the past for a test tenant
php artisan tinker --execute="
Tenant::withoutTenantScope()->where('subdomain', 'test-trial')->update([
    'trial_ends_at' => now()->subDay()
]);
"

# Then try to log in to that tenant's subdomain
# Must redirect to trial expired page, not the dashboard
```
```
□ Expired trial tenant is redirected to trial.expired route
□ Trial expiry page shows an upgrade/payment link
□ Trial expiry cron job runs: php artisan tenants:process-expired-trials
□ 7-day trial warning email sends at correct time
□ 2-day trial warning email sends at correct time
□ Expired tenant's data is preserved (not deleted — just access suspended)
□ Paying after trial expiry restores access (subscription_created webhook re-activates)
```

### 4.4 — Plan Gating (Starter Limits)
```bash
# Test on a Starter plan tenant
# 1. Add exactly 1,000 products
# 2. Attempt to add product 1,001

# Expected: 403 response with upgrade prompt in JSON
# NOT: 500 error, NOT: silent failure, NOT: product created anyway
```
```
□ Starter: product 1,001 blocked with HTTP 403 + upgrade message
□ Starter: warehouse 2 creation blocked
□ Starter: 4th staff account creation blocked
□ Starter: WooCommerce sync endpoint returns 403
□ Growth: unlimited products allowed (test with 1,001)
□ Growth: up to 3 warehouses allowed, 4th blocked
□ Business: no limits hit on any feature
□ Frontend shows upgrade modal (not generic error) when limit hit
□ Plan gating enforced at API level, not just UI (test with direct API call)
```

---

## SECTION 5: Security Audit

### 5.1 — Authentication & Authorization
```bash
# Test unauthenticated access
curl -s -o /dev/null -w "%{http_code}" https://testshop.venqore.com/dashboard
# Must return 302 (redirect to login) or 401

# Test CSRF protection
curl -X POST https://testshop.venqore.com/products \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' \
  -s -o /dev/null -w "%{http_code}"
# Must return 419 (CSRF token mismatch) for non-API routes
```
```
□ Unauthenticated requests to /dashboard redirect to login
□ CSRF protection active on all non-API POST routes (returns 419)
□ API routes require Sanctum token (test without token: returns 401)
□ Role-based access: staff user cannot access /admin routes
□ Role-based access: staff user cannot delete products (if that's admin-only)
□ Super-admin routes protected by separate SuperAdmin middleware
□ Super-admin cannot log in via a tenant subdomain (admin panel is on main domain only)
```

### 5.2 — SQL Injection
```bash
# These should return 404 or 422, never a database error
curl "https://testshop.venqore.com/api/products?search='; DROP TABLE products; --"
curl "https://testshop.venqore.com/api/products/1' OR '1'='1"
```
```
□ Search fields use parameterized queries (no raw DB::raw with user input)
□ All route model bindings use UUIDs (not sequential integers — harder to enumerate)
□ SQL injection attempts return safe errors, not database exception details
□ grep -rn "DB::raw" app/ — review every instance; none should accept user input directly
```

### 5.3 — Information Disclosure
```bash
# Must NOT expose internal error details
curl https://testshop.venqore.com/this-route-does-not-exist
# Must return a clean 404, not a Laravel debug page with stack trace

# Must NOT expose .env
curl https://venqore.com/.env
# Must return 403 or 404

# Must NOT expose git history
curl https://venqore.com/.git/config
# Must return 403 or 404
```
```
□ 404 page shows custom error view, not Laravel debug page
□ 500 page shows custom error view, not stack trace
□ .env file not accessible via HTTP (Nginx denies access)
□ .git directory not accessible via HTTP
□ storage/ directory not directly accessible via HTTP
□ APP_DEBUG=false confirmed in production .env
□ Error emails configured so you get notified of 500 errors (LOG_CHANNEL + Slack or email)
```

### 5.4 — Rate Limiting
```bash
# Test auth rate limit (should block after 10 attempts)
for i in {1..15}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://venqore.com/login \
    -d "email=test@test.com&password=wrongpassword")
  echo "Attempt $i: $STATUS"
done
# Attempts 11-15 must return 429, not 422

# Test API rate limit (should block after 120 requests per minute per tenant)
```
```
□ Login route blocked after 10 failed attempts per IP
□ API routes return 429 after 120 requests per minute per tenant
□ POS search endpoint returns 429 after 300 requests per minute per tenant
□ Rate limit response includes Retry-After header
□ Rate limiting is per-tenant (one tenant's throttle does NOT affect another)
□ Webhook endpoint has separate rate limiting (not counted against tenant API limit)
```

### 5.5 — File Upload Security
```bash
# Attempt to upload a PHP file disguised as an image
# Create a file: <?php echo "hacked"; ?> saved as evil.php.jpg
# Try to upload it as a product image
```
```
□ File upload validates MIME type (not just extension)
□ PHP files cannot be uploaded as images (MIME check blocks it)
□ Uploaded files are stored on R2 (not in public/ web root)
□ Uploaded files cannot be executed as PHP (they're on R2, not the server)
□ File size limit enforced (matches php.ini upload_max_filesize)
□ SVG files blocked from upload (SVG can contain XSS)
```

---

## SECTION 6: Performance & Load

### 6.1 — POS Performance
```bash
# Seed a test tenant with 3,000 products
php artisan db:seed --class=LargeProductCatalogSeeder --tenant=testshop

# Then load the POS page and measure
curl -w "@curl-format.txt" -o /dev/null -s https://testshop.venqore.com/pos
# Time to first byte must be under 500ms
```
```
□ POS page loads in under 1 second (no products in initial Inertia payload)
□ POS product search returns results in under 300ms for any query
□ POS product search works with 3,000+ SKUs in the tenant database
□ POS barcode scan lookup is instant (index on barcode column confirmed)
□ POS page does NOT include full product catalog in page source
□ Debounce delay is 250ms (not 0ms — 0ms would fire on every keystroke)
```

### 6.2 — Database Query Performance
```bash
# Enable query log temporarily and check for N+1 issues
php artisan tinker --execute="
DB::enableQueryLog();
// Make a request to the heaviest page (e.g., sales list)
// Then check:
\$queries = DB::getQueryLog();
echo count(\$queries) . ' queries executed' . PHP_EOL;
foreach(\$queries as \$q) {
    if(\$q['time'] > 100) echo 'SLOW: ' . \$q['time'] . 'ms — ' . substr(\$q['query'],0,100) . PHP_EOL;
}
"

# Check indexes exist
php artisan tinker --execute="
\$indexes = DB::select('SHOW INDEX FROM products');
foreach(\$indexes as \$i) echo \$i->Column_name . ' — ' . \$i->Key_name . PHP_EOL;
"
```
```
□ Sales list page executes under 20 queries (no N+1 on relationships)
□ Dashboard loads in under 2 seconds for a tenant with 1,000+ records
□ No single query takes longer than 200ms
□ Composite index exists on (tenant_id, created_at) for main tables
□ Composite index exists on (tenant_id, id) for lookup queries
□ Index exists on products.barcode
□ Index exists on products.sku
□ Index exists on users.email
□ Index exists on tenants.subdomain
□ EXPLAIN SELECT on the most common queries shows index usage (not full table scan)
```

### 6.3 — Caching
```bash
php artisan config:cache    # must complete without errors
php artisan route:cache     # must complete without errors
php artisan view:cache      # must complete without errors
php artisan event:cache     # must complete without errors
```
```
□ Config cache built successfully
□ Route cache built successfully
□ View cache built successfully
□ SettingsHelper cache is partitioned by tenant_id (not a global cache key)
□ Cache keys include tenant_id: e.g., "settings:{tenant_id}" not "settings"
□ Clearing one tenant's cache does not clear another tenant's cache
□ php artisan optimize runs without errors
```

---

## SECTION 7: Email & Notifications

### 7.1 — Email Delivery
```bash
# Test from production environment
php artisan tinker --execute="
Mail::raw('Test email from VenQore', function(\$m) {
    \$m->to('your-real-email@gmail.com')->subject('VenQore Email Test');
});
echo 'Sent';
"
```
```
□ Email arrives in inbox (not spam) within 60 seconds
□ Email is sent from hello@venqore.com (not a random server email)
□ SPF record exists for venqore.com (check: dig TXT venqore.com | grep spf)
□ DKIM record exists (check Postmark dashboard or dig TXT)
□ DMARC record exists (dig TXT _dmarc.venqore.com)
□ Email does NOT land in spam (test with mail-tester.com — score must be 8/10+)
```

### 7.2 — All Email Templates
Send each email manually and verify rendering on mobile AND desktop.
```
□ Welcome email: correct subdomain URL, correct credentials, no broken links
□ Welcome email: renders correctly on mobile (Gmail app test)
□ Trial Day 7 warning: correct tenant name, correct trial end date, correct upgrade link
□ Trial Day 12 warning: urgency tone, correct dates, upgrade link working
□ Trial expired: correct messaging, upgrade link working, data preservation message
□ Payment failed: clear instructions, billing update link working
□ Payment recovered: confirmation, no action required messaging
□ Cancellation confirmation: cancellation date, data export instructions, data deletion timeline
□ Data deletion notice (30 days before cleanup): export data link working
□ All emails have unsubscribe link (CAN-SPAM compliance)
□ All emails have physical address (CAN-SPAM compliance)
□ No broken images in any email template
□ All links in emails use HTTPS
```

---

## SECTION 8: Core Functional Testing (The ERP Itself)

### 8.1 — Point of Sale Flow
```
Test: Complete a full sale from start to finish
1. Open POS on testshop.venqore.com/pos
2. Search for a product by name
3. Search for a product by barcode
4. Add 3 different products to cart
5. Apply a discount
6. Select a customer
7. Complete sale with cash payment
8. Print/view receipt
9. Verify stock decreased correctly
10. Verify journal entry created correctly (debit Cash, credit Revenue)
11. Verify sale appears in Sales report
```
```
□ POS loads without spinning loader (fast initial load confirmed)
□ Product search by name returns correct results
□ Product search by barcode returns correct product instantly
□ Out-of-stock products cannot be sold (show warning or block)
□ Cart total calculates correctly with discounts
□ Tax calculation is correct based on tenant tax settings
□ Sale completes and receipt is viewable
□ Stock quantity decremented after sale
□ Journal entry created: correct accounts, correct amounts, balanced (debits = credits)
□ Sale appears in today's sales report
□ Sale appears in profit & loss report
```

### 8.2 — Inventory Flow
```
□ Add new product: all fields save correctly
□ Product image uploads to R2 and displays correctly
□ Edit product: changes save and reflect immediately
□ Delete product WITH no sales history: succeeds
□ Delete product WITH sales history: blocked with clear error message
□ Stock adjustment: quantity changes correctly, movement logged
□ Stock transfer between warehouses: deducts from source, adds to destination
□ Low stock alert triggers at correct threshold
□ Category creation works
□ Delete category WITH products: blocked with clear error
```

### 8.3 — Accounting Flow
```
□ Chart of accounts loads for new tenant (seeded by TenantDefaultSeeder)
□ Manual journal entry: can create, debits equal credits validation works
□ Unbalanced journal entry (debits ≠ credits): blocked with error
□ Journal entry edit creates correct reversal entry
□ Profit & Loss report shows correct figures
□ Balance Sheet balances (Assets = Liabilities + Equity)
□ Cash Flow report loads without error
□ Bank reconciliation: can mark transactions as reconciled
□ Opening balance can be set for existing businesses
□ All 38 reports load without a 500 error
□ Report date range filters work correctly
□ Report export to PDF works (queued job completes)
□ Report export to Excel works (queued job completes)
```

### 8.4 — Multi-Warehouse
```
□ Create a second warehouse (Growth plan tenant)
□ Products show stock per warehouse correctly
□ POS can select which warehouse to sell from
□ Stock transfer between warehouses is logged
□ Warehouse-specific reports filter correctly
□ Starter plan blocked from creating second warehouse
```

### 8.5 — User & Role Management
```
□ Invite new staff member: email received, setup works
□ Staff with limited permissions cannot access restricted routes
□ Staff cannot see admin-only sections (settings, accounting setup)
□ Password reset flow works: email received, link works, password updated
□ Deactivated user cannot log in
□ User count enforced by plan (Starter: max 3 staff)
```

### 8.6 — Settings
```
□ Business name change saves and reflects in header
□ Currency change updates all price displays throughout app
□ Timezone change updates all date/time displays
□ Tax rate change applies to new sales correctly
□ Logo upload saves to R2 and displays on receipts
□ Invoice numbering prefix saves and applies to new invoices
```

---

## SECTION 9: Onboarding & Setup Wizard

```
□ Fresh tenant (setup_completed = false) always lands on wizard
□ Wizard step 1: Business Profile — name, currency, timezone all save
□ Wizard step 2: Industry selection displays all groups correctly
□ Wizard step 3: selecting "Fashion" enables variants feature
□ Wizard step 3: selecting "Electronics" enables serial number tracking
□ Wizard step 3: selecting "Pharmacy" enables batch/expiry tracking
□ Industry-specific categories seeded correctly after selection
□ Wizard completion sets setup_completed = true in database
□ Wizard does not appear again on subsequent logins
□ Skipping wizard (if allowed) still marks setup partially complete
□ driver.js tour launches after wizard completion (if implemented)
□ Tour can be dismissed and does not reappear
□ Empty state screens show "Get Started" prompts (not blank pages)
□ Staff user first login shows simplified tour (not full setup wizard)
```

---

## SECTION 10: Admin Super-Dashboard

```
□ Super-admin dashboard accessible at venqore.com/admin
□ Super-admin dashboard NOT accessible from tenant subdomains
□ Dashboard shows correct MRR calculation
□ Dashboard shows correct tenant counts (total, trial, active, churned)
□ New signups today shows correct count
□ Storage usage reflects actual R2 usage
□ Tenant list loads all tenants with correct status
□ Can suspend a tenant from dashboard
□ Can upgrade a tenant's plan from dashboard
□ Can view a tenant's basic info (name, email, plan, signup date)
□ Horizon dashboard accessible at venqore.com/horizon
□ Horizon dashboard NOT accessible without super-admin authentication
□ Failed jobs visible in Horizon (none should be present at launch)
□ Telescope disabled in production (only use in development)
```

---

## SECTION 11: The demo.venqore.com Environment

```
□ demo.venqore.com is live and accessible
□ Demo login credentials work: demo@venqore.com / demo1234
□ Demo is pre-seeded with realistic data (products, customers, sales, reports)
□ Demo shows data for a realistic business (not empty, not test gibberish)
□ All reports have data to display in the demo tenant
□ Nightly reset command is scheduled and working
□ After reset, demo data is repopulated correctly
□ Demo tenant plan is 'business' (shows all features to prospects)
□ Demo credentials are displayed on the venqore.com landing page
□ Demo tenant is in the reserved subdomain blocklist (cannot be claimed by a signup)
□ Demo user cannot change the business name or currency permanently (resets nightly)
□ Changes made in demo reset within 24 hours (test by making a change, checking next day)
```

---

## SECTION 12: Legal & Compliance

```
□ Terms of Service page exists at venqore.com/terms
□ Privacy Policy page exists at venqore.com/privacy
□ Terms of Service link shown at registration
□ User must accept Terms of Service before signing up
□ Privacy Policy covers: data collected, how it's used, data retention, deletion rights
□ GDPR: users can request data export (even if manual process for now)
□ GDPR: users can request account deletion (triggers the cleanup process)
□ Cancellation policy is clear (what happens to data after cancellation)
□ AppSumo deal terms are written and reviewed: "lifetime license + 2 years hosting"
□ Refund policy is clear and displayed (AppSumo requires 60-day refund window)
□ Email footer contains: company name, physical address (required by CAN-SPAM)
□ Cookie consent banner on venqore.com (if using analytics)
□ No sensitive data in application logs (no passwords, no full card numbers, no tokens)
```

---

## SECTION 13: Pre-Launch Deployment Sequence (Production Only)

Run these in exact order on the day of launch. Do not skip steps.

```bash
# Step 1: Final backup
mysqldump -u root -p venqore_production > pre_launch_backup_$(date +%Y%m%d_%H%M%S).sql
echo "Backup size: $(du -sh pre_launch_backup_*.sql | tail -1)"

# Step 2: Pull latest code
cd /var/www/venqore
git pull origin main

# Step 3: Install dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Step 4: Run migrations
php artisan migrate --force
# Verify: php artisan migrate:status | grep Pending (must be 0)

# Step 5: Clear and rebuild caches
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache
php artisan view:clear && php artisan view:cache
php artisan event:clear && php artisan event:cache

# Step 6: Restart queue workers
php artisan horizon:terminate
sleep 5
supervisorctl restart horizon

# Step 7: Restart PHP-FPM
sudo systemctl reload php8.3-fpm

# Step 8: Verify application is running
curl -s -o /dev/null -w "%{http_code}" https://venqore.com
# Must return 200

curl -s -o /dev/null -w "%{http_code}" https://demo.venqore.com
# Must return 200 or 302 (redirect to login)

# Step 9: Check logs for errors (first 5 minutes after deploy)
tail -f storage/logs/laravel-$(date +Y-m-d).log | grep -E "ERROR|CRITICAL|emergency"
# Should show nothing. If you see errors, investigate immediately.

# Step 10: Verify Horizon is processing jobs
php artisan horizon:status
# Must show: Horizon is running
```

```
□ Backup created and size confirmed (not 0 bytes)
□ composer install completed without errors
□ npm run build completed without errors
□ All pending migrations ran successfully
□ Zero pending migrations after migrate
□ Config cache rebuilt
□ Route cache rebuilt
□ View cache rebuilt
□ Horizon terminated and restarted
□ PHP-FPM reloaded
□ venqore.com returns 200
□ demo.venqore.com returns 200 or 302
□ No ERROR or CRITICAL log entries in first 5 minutes
□ Horizon status shows running
□ Send a test email from production and confirm delivery
□ Complete one full test purchase with Lemon Squeezy test card
□ Confirm welcome email arrives and login works
□ Monitor Horizon for 15 minutes — confirm jobs processing normally
```

---

## SECTION 14: Monitoring & Alerting (Must Be Active Before Launch)

```
□ UptimeRobot (free): monitoring venqore.com every 5 minutes
□ UptimeRobot: monitoring demo.venqore.com every 5 minutes
□ UptimeRobot: alert goes to your phone number AND email
□ Horizon configured to alert on failed jobs: config/horizon.php notification channel
□ Laravel log: ERROR level entries send a notification (Slack or email)
□ Set up a /health endpoint that checks: DB connection, Redis connection, storage write
□ UptimeRobot monitoring the /health endpoint
□ Server disk usage alert at 80% (set up via cron or DigitalOcean alerts)
□ Server RAM usage alert at 85%
□ MySQL slow query log enabled (queries over 1 second logged)
□ Redis memory alert if usage exceeds 80% of maxmemory
```

```bash
# Create a health check endpoint that verifies all dependencies
# GET /health should return:
{
    "status": "ok",
    "database": "ok",
    "redis": "ok",
    "storage": "ok",
    "queue": "ok",
    "timestamp": "2026-04-10T09:00:00Z"
}
# If any component is "fail", the endpoint returns HTTP 503
```

---

## SECTION 15: Cleanup Before Launch (Remove All Test Data)

```bash
# Remove all test tenants created during development
php artisan tinker --execute="
\$testSlugs = ['tenant-a-test', 'tenant-b-test', 'test-trial', 'test-gating'];
foreach(\$testSlugs as \$slug) {
    \$t = Tenant::withoutTenantScope()->where('subdomain', \$slug)->first();
    if(\$t) {
        // Delete all rows for this tenant
        \$tables = ['products','sales','sale_items','parties','accounts',
                   'journal_entries','categories','warehouses','users'];
        foreach(\$tables as \$table) {
            DB::table(\$table)->where('tenant_id', \$t->id)->delete();
        }
        \$t->forceDelete();
        echo 'Deleted: ' . \$slug . PHP_EOL;
    }
}
"

# Clear all test jobs from queues
php artisan queue:clear --queue=default
php artisan queue:clear --queue=provisioning
php artisan queue:clear --queue=emails

# Clear failed job history
php artisan queue:flush

# Clear application logs
> storage/logs/laravel-$(date +Y-m-d).log

# Reset demo tenant to clean state
php artisan demo:reset
```

```
□ All test tenant subdomains deleted from database
□ Test tenant data deleted from all tables
□ Demo tenant is the ONLY non-AMD-Outlets tenant in production database
□ All test queue jobs cleared
□ Failed jobs table empty
□ Application logs cleared
□ No test email addresses in the users table
□ No test products/sales from development in AMD Outlets tenant
□ R2 test folders deleted
```

---

## SECTION 16: The 30-Minute Post-Launch Watch

After deploying, do not close your laptop. Watch for 30 minutes.

```bash
# Terminal 1: Watch application logs
tail -f storage/logs/laravel-$(date +Y-%m-%d).log

# Terminal 2: Watch Horizon
php artisan horizon

# Terminal 3: Watch server resources
watch -n 5 'echo "=== CPU ===" && top -bn1 | head -5 && echo "=== MEM ===" && free -h && echo "=== DISK ===" && df -h / && echo "=== MYSQL CONNECTIONS ===" && mysql -u root -p -e "SHOW STATUS LIKE \"Threads_connected\";"'
```

```
□ No 500 errors in logs for first 30 minutes
□ No failed queue jobs in Horizon for first 30 minutes
□ CPU stays under 70% at idle
□ Memory stays under 80% usage
□ Disk I/O normal
□ venqore.com landing page loads correctly from your phone (not desktop, not dev machine)
□ demo.venqore.com works from your phone
□ Sign up for a real account yourself as a fresh user and complete the full flow
□ Tweet / post about the launch (you earned it)
```

---

## Quick Reference: Critical Commands

```bash
# Check everything is running
supervisorctl status
php artisan horizon:status
redis-cli ping
php artisan about

# Check for errors right now
tail -100 storage/logs/laravel-$(date +Y-%m-%d).log | grep ERROR

# Check failed jobs
php artisan queue:failed

# Check pending migrations
php artisan migrate:status | grep Pending

# Test email
php artisan tinker --execute="Mail::raw('test', fn(\$m) => \$m->to('you@email.com')->subject('test')); echo 'sent';"

# Check tenant isolation (must all be 0)
php artisan tinker --execute="foreach(['products','sales','accounts','users'] as \$t) { echo \$t.': '.DB::table(\$t)->whereNull('tenant_id')->count().PHP_EOL; }"

# Emergency: suspend a misbehaving tenant
php artisan tinker --execute="Tenant::withoutTenantScope()->where('subdomain','bad-tenant')->update(['status'=>'suspended']);"

# Emergency: clear all caches
php artisan optimize:clear

# Full restart sequence
php artisan horizon:terminate && supervisorctl restart horizon && sudo systemctl reload php8.3-fpm
```

---

## Sign-Off

This checklist was completed by: ___________________

Date: ___________________

Section 1 — Infrastructure: ALL PASSED □  
Section 2 — Configuration: ALL PASSED □  
Section 3 — Multi-Tenancy: ALL PASSED □  
Section 4 — Payments: ALL PASSED □  
Section 5 — Security: ALL PASSED □  
Section 6 — Performance: ALL PASSED □  
Section 7 — Email: ALL PASSED □  
Section 8 — Core ERP Functions: ALL PASSED □  
Section 9 — Onboarding: ALL PASSED □  
Section 10 — Admin Dashboard: ALL PASSED □  
Section 11 — Demo Environment: ALL PASSED □  
Section 12 — Legal: ALL PASSED □  
Section 13 — Deployment: ALL PASSED □  
Section 14 — Monitoring: ALL PASSED □  
Section 15 — Cleanup: ALL PASSED □  

**Product is ready to receive paying customers: YES □ / NO □**

*If any section has an unchecked item: do not launch. Fix it, re-run the entire section, then re-sign.*
