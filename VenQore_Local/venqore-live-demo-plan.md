# VenQore Live Demo — Architecture & Implementation Plan

> **Goal:** Replace the "book a demo" friction point with a one-click, fully interactive live demo environment. Every visitor instantly walks into a real, running VenQore store — pre-loaded with 5 years of beautiful data — with zero login required.

---

## Table of Contents

1. [Core Architecture Decision](#1-core-architecture-decision)
2. [The Relative Timestamp Engine](#2-the-relative-timestamp-engine)
3. [The Golden Master Dataset](#3-the-golden-master-dataset)
4. [Session Lifecycle](#4-session-lifecycle)
5. [Concurrency & Resource Management](#5-concurrency--resource-management)
6. [The CTA Conversion Layer](#6-the-cta-conversion-layer)
7. [Database Schema Changes](#7-database-schema-changes)
8. [Laravel Implementation Breakdown](#8-laravel-implementation-breakdown)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Rules & Constraints](#10-rules--constraints)

---

## 1. Core Architecture Decision

### Do NOT use a single shared demo store

A single shared demo that resets hourly (the naive approach) has fatal flaws:
- If two users are active at the same time, they corrupt each other's data
- The hourly reset can fire mid-session while a visitor is on a screen share with their client
- One malicious or curious user can delete everything for everyone

### Use Ephemeral Session Sandboxing

Every visitor who clicks **"Try Live Demo"** gets their own fully isolated tenant — a complete clone of a pristine "Golden Master" dataset — spun up in under 2 seconds.

```
Visitor clicks button
      ↓
/demo/start route fires
      ↓
New demo tenant created (clone of golden master)
      ↓
Visitor auto-authenticated as demo_user
      ↓
Redirected to /dashboard of their personal sandbox
      ↓
[2 hours of idle time pass]
      ↓
Tenant wiped, cleanup job removes all traces
```

Since VenQore is already multi-tenant, a demo session is just a regular tenant with three extra flags. The existing tenant isolation handles everything else for free.

---

## 2. The Relative Timestamp Engine

This is the most critical innovation. Without it, demo data goes stale and the dashboard looks dead to anyone visiting more than a day after seeding.

### The Problem

If you seed sales data today and a visitor arrives in 10 days, all "today's sales" are 10 days old. The dashboard shows zero activity today. The graphs are flat. The store looks abandoned.

### The Solution: A Fixed Reference Epoch

All demo data is stored with timestamps **relative to a fixed fictional date** called `DEMO_EPOCH`.

```
DEMO_EPOCH = 2020-01-01 (a constant, never changes)
```

When a sale happened "3 days ago" in the demo story, it is stored as:
```
created_at = DEMO_EPOCH - 3 days = 2019-12-29
```

When a sale happened "5 years ago" in the demo story, it is stored as:
```
created_at = DEMO_EPOCH - 5 years = 2015-01-01
```

### The Time Shift on Read

When a demo tenant is cloned, you record one value:

```php
$demoTenant->demo_epoch = Carbon::parse('2020-01-01');
// The offset is: Carbon::now()->diffInDays('2020-01-01')
```

Every query on a demo tenant applies this offset to timestamp columns:

```
actual_readable_date = stored_date + (TODAY - DEMO_EPOCH)
```

**Result:** A sale stored as `2019-12-29` (which is "3 days before DEMO_EPOCH") will always display as "3 days ago from today" — no matter when "today" is.

### What This Achieves

| When visitor arrives | What they see |
|---|---|
| Day of seeding | Today has sales, yesterday has sales, 5 years of history |
| 10 days later | Today has sales, yesterday has sales, 5 years of history |
| 6 months later | Today has sales, yesterday has sales, 5 years of history |
| 2 years later | Today has sales, yesterday has sales, 5 years of history |

The golden master dataset is **written once and works forever.** You never need to re-seed.

### Laravel Implementation

Add a global query scope to all models when running inside a demo tenant:

```php
// app/Scopes/DemoTimeShiftScope.php

class DemoTimeShiftScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $tenant = currentTenant(); // your tenant helper
        if (!$tenant->is_demo) return;

        $offsetDays = Carbon::parse('2020-01-01')->diffInDays(Carbon::now());

        // Shift all timestamp columns forward by offset
        $table = $model->getTable();
        $builder->selectRaw("*, 
            DATE_ADD(created_at, INTERVAL {$offsetDays} DAY) as created_at,
            DATE_ADD(updated_at, INTERVAL {$offsetDays} DAY) as updated_at"
        );
    }
}
```

> **Important:** Apply this scope carefully. Only activate it for `is_demo = true` tenants. Regular tenants must never be affected.

For dashboard aggregate queries (e.g., "sales today", "revenue this week"), wrap the date filters with the same offset before the query runs. Create a `DemoDateHelper::shiftForDemo($date)` utility that returns the date shifted back by the offset — so when you filter `WHERE created_at >= TODAY`, you rewrite it as `WHERE created_at >= (TODAY - offset_days)`.

---

## 3. The Golden Master Dataset

The golden master is the single pristine dataset that every demo session is cloned from. It is **never touched by visitors.** It lives in its own special tenant (`id = 1`, `slug = 'demo-master'`, `is_golden_master = true`).

### Data Shape (what to seed)

#### Products — 50 items across 8 categories

All prices in USD. Use realistic electronics retail data.

| Category | Count | Price Range |
|---|---|---|
| Smartphones | 10 | $199 – $1,299 |
| Laptops | 8 | $499 – $2,499 |
| Audio (headphones, speakers) | 8 | $29 – $399 |
| Accessories (cables, cases, chargers) | 8 | $9 – $79 |
| Networking (routers, switches) | 5 | $49 – $299 |
| Storage (SSDs, USB drives) | 5 | $19 – $249 |
| Displays & Monitors | 4 | $149 – $899 |
| Peripherals (keyboards, mice) | 4 | $29 – $199 |

Each product must have:
- Realistic product name (e.g., "Samsung Galaxy S24 FE 128GB")
- SKU (e.g., `SAM-GS24FE-128-BLK`)
- Barcode (13-digit EAN format)
- Cost price and sale price (realistic margin: 15–35%)
- Current stock quantity (never zero — demo should look operational)
- Reorder level
- Category assignment
- A real product description (2–3 sentences)

#### Sales Transactions — 5,000+ records over 5 years

Generate algorithmically with these patterns:

```
Year 1 (oldest): ~400 transactions, avg 33/month — small startup phase
Year 2:          ~700 transactions, avg 58/month — growing
Year 3:          ~950 transactions, avg 79/month — established
Year 4:          ~1,300 transactions, avg 108/month — scaling
Year 5 (recent): ~1,700 transactions, avg 141/month — thriving
```

Within each month, apply:
- Weekends: 40% higher volume than weekdays
- Month-end (25th–31st): 20% higher (salary cycle buying behavior)
- December equivalent: 60% seasonal spike
- Each sale has 1–5 line items pulled from the product catalog
- FIFO cost calculation applied correctly per VenQore's financial rules
- Party (customer) assigned — mix of walk-in and registered customers

**Today must always have 4–6 completed sales already.** These are stored as timestamps slightly before `DEMO_EPOCH` (e.g., `DEMO_EPOCH - 4 hours`, `DEMO_EPOCH - 2 hours`). After time-shifting, they will always appear as "earlier today."

#### Customers — 100 records

- 70 registered customers with names, phone numbers, addresses
- 30 "walk-in" / cash customers (no contact details)
- Top 20 customers have 10–40 repeat purchases (so the customer detail page looks meaningful)
- Spread across cities (Lahore, Karachi, Islamabad, etc. — or generic US cities if targeting international)

#### Financial Data

- 3 bank accounts: Main Current Account (~$45,000 balance), Business Savings (~$12,000), Merchant Account (~$8,000)
- Petty cash drawer: ~$340
- Recurring monthly expenses: Rent ($2,200), Utilities ($380), Internet ($95), Staff Salaries ($6,500)
- Ad-hoc expenses seeded realistically across 5 years
- All accounts must balance against the transaction history — run the 27 balance formulas from the Financial Bible to verify before finalizing the seeder

#### Suppliers — 10 records

- Named after realistic electronics distributors
- Each has outstanding purchase orders and payment history

### The `DemoMasterSeeder` class structure

```
database/seeders/
  DemoMasterSeeder.php          ← orchestrates all below
  Demo/
    DemoCategorySeeder.php
    DemoProductSeeder.php
    DemoCustomerSeeder.php
    DemoSupplierSeeder.php
    DemoSalesSeeder.php         ← most complex, handles FIFO + time offsets
    DemoExpenseSeeder.php
    DemoBankAccountSeeder.php
    DemoFinancialVerifier.php   ← runs all 27 balance checks, throws if mismatch
```

Run the full seeder with:
```bash
php artisan demo:seed-master
```

The `DemoFinancialVerifier` must pass before the master is considered ready. It runs every balance formula from the Financial Bible and asserts they all hold. If any assertion fails, the seeder aborts with a clear error message showing which formula broke and why.

---

## 4. Session Lifecycle

### Step 1: Visitor hits the landing page

The landing page has a single prominent button: **"Try Live Demo — No signup needed"**

Clicking it sends a `GET` request to `/demo/start`.

### Step 2: The DemoController spins up a session

```php
// app/Http/Controllers/DemoController.php

public function start()
{
    // 1. Clone the golden master tenant
    $session = DemoSessionService::create();

    // 2. Store session token in cookie (HttpOnly, 2hr expiry)
    $cookie = cookie('demo_session', $session->token, 120); // 120 minutes

    // 3. Redirect to the demo dashboard
    return redirect()
        ->route('dashboard', ['tenant' => $session->slug])
        ->withCookie($cookie);
}
```

### Step 3: DemoSessionService clones the master

```php
// app/Services/DemoSessionService.php

public function create(): DemoTenant
{
    $master = Tenant::where('is_golden_master', true)->firstOrFail();

    // Generate a unique slug like "demo-a3f9k2"
    $slug = 'demo-' . Str::random(6);

    // Clone the master tenant's database schema/data
    // Implementation depends on your tenancy package (Tenancy for Laravel, stancl/tenancy, etc.)
    // This is typically a DB dump + restore or schema copy
    $newTenant = TenantCloner::cloneFrom($master, [
        'slug'             => $slug,
        'is_demo'          => true,
        'is_golden_master' => false,
        'demo_expires_at'  => now()->addHours(2),
        'demo_session_token' => Str::uuid(),
        'demo_created_at'  => now(),
    ]);

    return $newTenant;
}
```

> **Performance target:** Cloning must complete in under 2 seconds. If using MySQL, this means pre-exporting the master as a SQL dump file that gets piped in. If using PostgreSQL, use schema-level `CREATE SCHEMA ... LIKE` or template databases — PostgreSQL handles this natively in milliseconds.

### Step 4: Session ping to reset expiry timer

Every page load in a demo tenant fires a lightweight background request:

```
POST /demo/ping
```

This resets `demo_expires_at = NOW() + 2 hours`. If a user is actively exploring, they will never be cut off. The 2-hour timer is **idle time**, not total session time.

### Step 5: Cleanup job

```php
// app/Console/Commands/CleanExpiredDemoSessions.php

// Runs every 15 minutes via Laravel scheduler
// Finds all tenants where is_demo=true AND demo_expires_at < NOW()
// Drops their database schema/tables
// Deletes the tenant record
```

Register in `Kernel.php`:
```php
$schedule->command('demo:cleanup')->everyFifteenMinutes();
```

---

## 5. Concurrency & Resource Management

### Storage per session

One demo tenant with 5,000 transactions ≈ 15–20 MB of database storage.

| Concurrent sessions | Storage used |
|---|---|
| 100 | ~1.8 GB |
| 500 | ~9 GB |
| 1,000 | ~18 GB |
| 5,000 | ~90 GB |

Plan your database server disk accordingly. Sessions clean up every 15 minutes, so peak storage = peak concurrent users × 20 MB.

### Database connections

Demo sessions only use a connection when the visitor makes a page request. Idle sessions consume zero connections. Laravel's connection pool (`DB_POOL_SIZE`) handles this transparently.

### Clone speed optimization

Pre-generate a binary SQL dump of the golden master after every time you update it:

```bash
php artisan demo:export-master
# Saves to storage/demo/master-snapshot.sql.gz
```

The `TenantCloner` uses this file for fast restore instead of a live dump each time. This is how you guarantee <2s clone times regardless of data size.

### Rate limiting the `/demo/start` route

Protect against bots spinning up thousands of sessions:

```php
Route::get('/demo/start', [DemoController::class, 'start'])
    ->middleware('throttle:10,1'); // max 10 new sessions per minute per IP
```

---

## 6. The CTA Conversion Layer

The demo environment must actively convert visitors into paying customers. This is not optional — it is the entire point of building this feature.

### Persistent header banner (all demo pages)

```
┌────────────────────────────────────────────────────────────────────┐
│  You're exploring a demo store.  [Start your free trial →]         │
└────────────────────────────────────────────────────────────────────┘
```

- Always visible, tasteful — not intrusive
- After 8 minutes in the demo, the button text changes to: "Ready to create your real store? It takes 2 minutes →"
- Track time-in-demo via a JS timestamp stored in localStorage on entry

### Demo watermarks

Subtle "DEMO" watermark on:
- Printed receipts / PDF exports
- Report exports
- Invoice PDFs

This shows the feature works, while making clear the visitor needs a real account to get unbranded outputs.

### Session expiry page

When `demo_expires_at` passes and the visitor makes a request, instead of a 404 or blank screen, show:

```
Your demo session has ended.

During your session you:
✓ Explored the product catalog (50 products)
✓ Viewed 5 years of sales history
✓ Checked the financial dashboard

Your real store is ready in 2 minutes.
[Create your account — Free →]
```

The stats ("explored product catalog", "viewed sales history") come from a simple activity log written during the session. Log page visits to a `demo_activity_log` table.

### Optional: Email capture before demo

Offer (don't require) email capture before entering:

```
Enter your email to save your demo session and get a follow-up guide.
[Email field]  [Skip — explore without saving]
```

If they provide email, you can send a follow-up email 24 hours later: "Your VenQore demo is ready to become your real store."

---

## 7. Database Schema Changes

Add these columns to your `tenants` table:

```sql
ALTER TABLE tenants ADD COLUMN is_demo            BOOLEAN      DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN is_golden_master   BOOLEAN      DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN demo_session_token VARCHAR(64)  NULL;
ALTER TABLE tenants ADD COLUMN demo_expires_at    TIMESTAMP    NULL;
ALTER TABLE tenants ADD COLUMN demo_created_at    TIMESTAMP    NULL;
ALTER TABLE tenants ADD COLUMN demo_cloned_from   BIGINT       NULL; -- FK to master tenant id
```

Add a `demo_activity_log` table:

```sql
CREATE TABLE demo_activity_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    page            VARCHAR(120)    NOT NULL,   -- e.g. 'products.index', 'reports.profit_loss'
    visited_at      TIMESTAMP       NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

---

## 8. Laravel Implementation Breakdown

### New files to create

```
app/
  Http/
    Controllers/
      DemoController.php
  Services/
    DemoSessionService.php
    TenantCloner.php
    DemoDateHelper.php          ← time shift utilities
  Scopes/
    DemoTimeShiftScope.php
  Console/
    Commands/
      SeedDemoMaster.php
      ExportDemoMaster.php
      CleanExpiredDemoSessions.php

database/
  seeders/
    DemoMasterSeeder.php
    Demo/
      DemoCategorySeeder.php
      DemoProductSeeder.php
      DemoCustomerSeeder.php
      DemoSupplierSeeder.php
      DemoSalesSeeder.php
      DemoExpenseSeeder.php
      DemoBankAccountSeeder.php
      DemoFinancialVerifier.php

routes/
  demo.php                      ← add to RouteServiceProvider
```

### New routes

```php
// routes/demo.php

Route::get('/demo/start', [DemoController::class, 'start'])
    ->middleware('throttle:10,1')
    ->name('demo.start');

Route::post('/demo/ping', [DemoController::class, 'ping'])
    ->middleware('demo.session')
    ->name('demo.ping');
```

### New middleware

```
app/Http/Middleware/
  DemoSessionMiddleware.php     ← validates demo_session cookie, resets expiry timer
  DemoBannerMiddleware.php      ← injects the CTA banner into all demo responses
```

### Artisan commands

```bash
# Seed the golden master (run once, or after updating demo data)
php artisan demo:seed-master

# Export master snapshot for fast cloning
php artisan demo:export-master

# Clean expired sessions (runs automatically every 15min via scheduler)
php artisan demo:cleanup

# Force-reset the master to a clean state
php artisan demo:reset-master
```

---

## 9. Implementation Roadmap

Build in this exact order. Each step produces something testable before moving to the next.

### Phase 1 — The Data (most important, do this first)

- [ ] Design the golden master product catalog (spreadsheet first, then code)
- [ ] Write `DemoProductSeeder` with all 50 products and correct FIFO costs
- [ ] Write `DemoSalesSeeder` with 5,000 transactions using relative timestamps anchored to `DEMO_EPOCH = 2020-01-01`
- [ ] Write `DemoFinancialSeeder` (expenses, bank accounts, cash)
- [ ] Write `DemoCustomerSeeder` and `DemoSupplierSeeder`
- [ ] Write `DemoFinancialVerifier` — runs all 27 balance formulas, must pass before master is considered ready
- [ ] Run `php artisan demo:seed-master` and manually walk through every module to verify data looks beautiful
- [ ] Verify that all graphs (daily, weekly, monthly, yearly) show populated, natural-looking data
- [ ] Run `php artisan demo:export-master` to generate the snapshot file

### Phase 2 — The Time Engine

- [ ] Implement `DemoDateHelper` with `shiftDate($date)` and `unshiftDate($date)` utilities
- [ ] Implement `DemoTimeShiftScope` and apply to all models
- [ ] Write unit tests: seed data, advance the clock by 30 days, assert dashboard still shows "today's sales"
- [ ] Test edge cases: month-end, year-end, timezone handling

### Phase 3 — Session Management

- [ ] Implement `TenantCloner::cloneFrom()` — benchmark until clone time is consistently <2s
- [ ] Implement `DemoSessionService::create()`
- [ ] Implement `DemoController::start()` and `DemoController::ping()`
- [ ] Implement `DemoSessionMiddleware`
- [ ] Implement `CleanExpiredDemoSessions` command and register in scheduler
- [ ] Load test: spin up 50 simultaneous demo sessions, verify no interference between them

### Phase 4 — The Frontend Layer

- [ ] Build the landing page "Try Live Demo" button and copy
- [ ] Build `DemoBannerMiddleware` to inject the CTA header banner on all demo pages
- [ ] Implement the time-in-demo tracker (JS, localStorage)
- [ ] Build the session-expired page with activity summary
- [ ] Add "DEMO" watermarks to PDF exports
- [ ] Optional: build the email capture modal before demo entry

### Phase 5 — Polish & QA

- [ ] Full walkthrough of every VenQore module inside a demo session
- [ ] Verify all currency displays as USD ($) in demo
- [ ] Verify no demo data leaks into non-demo tenants
- [ ] Verify cleanup job correctly drops expired schemas
- [ ] Add monitoring alert if clone time exceeds 3 seconds
- [ ] Add monitoring alert if cleanup job fails

---

## 10. Rules & Constraints

These are non-negotiable constraints to enforce throughout implementation.

| Rule | Detail |
|---|---|
| Golden master is read-only | No route or action should ever write to the golden master tenant. Protect with a middleware guard. |
| Demo tenants are fully isolated | A demo tenant must never be able to read data from another tenant, including the golden master, after cloning. |
| Time shift applies only to demo tenants | `is_demo = true` is the only condition that activates `DemoTimeShiftScope`. Test explicitly that regular tenants are unaffected. |
| All demo currency displays as USD | The demo tenant's currency setting is locked to USD ($) and cannot be changed by the visitor. |
| Financial data must balance | `DemoFinancialVerifier` must pass after every seeder run. Never ship a demo with unbalanced books. |
| Clone must be <2 seconds | If clone time exceeds 2 seconds in production, investigate before launch. A slow clone = a spinning loader on the "Try Demo" button = a bad first impression. |
| Cleanup runs every 15 minutes | Do not extend this interval. Orphaned demo tenants accumulate storage quickly. |
| Rate limit demo creation | `/demo/start` must be throttled to prevent bot abuse and runaway storage consumption. |

---

*Document version: 1.0 — VenQore Live Demo System*
*Prepared for: VenQore development team*
