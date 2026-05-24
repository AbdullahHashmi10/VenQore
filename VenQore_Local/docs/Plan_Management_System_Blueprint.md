# VenQore — Centralized Plan & Subscription Management System
**Document Type:** Implementation Plan for IDE Execution  
**For:** Abdullah (Platform Owner / Super Admin)  
**Written:** April 2026  
**Status:** Ready for IDE implementation. Verify each phase on completion.

---

## What This Document Is

This is the complete, codebase-accurate implementation plan for building a centralized Plan & Subscription Management System inside the VenQore SuperAdmin dashboard. Every file name, method signature, column name, and relationship in this document is derived from reading the actual codebase — not from assumptions.

After this system is built:
- You change a plan price from the UI and it's live immediately, no deployment needed
- You give a specific tenant extra transactions with a reason note and they get an in-app notification
- You add a new sales platform (Paddle, Gumroad, etc.) and the entire limit/gating system applies automatically
- You create a discount coupon, set its expiry and usage cap, and it works at checkout
- Everything reflects without manual sync

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Design](#2-architecture-design)
3. [Database Schema](#3-database-schema)
4. [Phase 1 — Foundation: PlanRepository & Database Migration](#4-phase-1--foundation)
5. [Phase 2 — Plan Management UI](#5-phase-2--plan-management-ui)
6. [Phase 3 — Tenant Override Panel](#6-phase-3--tenant-override-panel)
7. [Phase 4 — Notification System](#7-phase-4--notification-system)
8. [Phase 5 — Platforms & Coupons](#8-phase-5--platforms--coupons)
9. [Phase 6 — Billing Sync & Cleanup](#9-phase-6--billing-sync--cleanup)
10. [Plan Engine Logic](#10-plan-engine-logic)
11. [Edge Cases & Safety Rules](#11-edge-cases--safety-rules)
12. [Scalability & Caching Strategy](#12-scalability--caching-strategy)
13. [Audit & Security](#13-audit--security)
14. [Complete File Map](#14-complete-file-map)

---

## 1. Current State Analysis

Before building anything new, here is exactly what exists and what needs to change.

### What Exists Today

**Plan definitions** live in `config/plans.php` — a static PHP array. This means any limit or price change requires a code deployment. This is the root problem this system solves.

**The `Tenant` model** has a `plan` string column (values: `trial`, `starter`, `growth`, `business`, `ltd`, `ltd_1`, `ltd_2`, `ltd_3`) and a `plan_limits` JSON column that stores per-tenant overrides. The `getLimit($key)` method on the model checks `plan_limits` first, then falls back to `config/plans.php`. This two-tier override system already exists — we're just moving the fallback from config file to database.

**`PlanGate` service** (`app/Services/PlanGate.php`) is the central enforcement layer. Every limit check in every controller goes through `PlanGate::check()` or `PlanGate::enforce()`. It calls `app('current.tenant')->getLimit($feature)`. This is the single choke point — update it once, and the entire application follows.

**`TenantMiddleware`** reads `plan_limits` via `$tenant->getLimit('transactions_per_month')` to populate the lazy `plan_usage` Inertia prop. This also needs to use `PlanRepository` after migration.

**`BillingController`** currently passes `config('plans')` directly to the Billing page. After this system is built, it reads from the database via `PlanRepository`.

**`SupportController::toggleFeatureFlag()`** already writes per-tenant JSON overrides to `plan_limits`. The new `TenantOverrideController` replaces this with a more complete system while keeping backward compatibility.

**What does NOT exist yet:** database-driven plans, caching, the override panel with history, the notification system, the coupons system, the platforms table, the SuperAdmin Monetization section.

### The Limit Key Inventory

These are the exact keys currently used across the codebase. Any new `plan_limits` table must support all of them:

| Key | Type | Used In |
|---|---|---|
| `transactions_per_month` | int \| null | `V3/SaleController`, `TenantMiddleware` |
| `sku_limit` | int \| null | `V3/ProductController`, `InventoryController` |
| `locations` | int \| null | `V3/WarehouseController` |
| `staff_limit` | int \| null | `StaffController`, `AdminController` |
| `woocommerce` | bool | `WooCommerceController` |
| `api_access` | bool | `Api/PlanUsageController` |
| `growth_engine` | bool | `GrowthEngineController` |
| `multi_branch` | bool | `Api/PlanUsageController` |
| `reports` | string ('basic'\|'advanced') | `Api/PlanUsageController` |

---

## 2. Architecture Design

### The Core Change

```
BEFORE:
  PlanGate::enforce('sku_limit', $count)
    → app('current.tenant')->getLimit('sku_limit')
      → $this->plan_limits['sku_limit'] ?? config("plans.{$this->plan}.sku_limit")
                                                    ↑
                                               STATIC FILE

AFTER:
  PlanGate::enforce('sku_limit', $count)
    → PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan, 'sku_limit')
      → Cache::remember("tenant_override:{$id}:sku_limit")
          → TenantPlanOverride table (if exists)
      → Cache::remember("plan_limits:{$planSlug}")
          → plan_limits table (database)
                 ↑
           DATABASE — LIVE, ADMIN-CONTROLLED
```

The entire application behavior changes by updating two methods: `Tenant::getLimit()` and `PlanGate::getLimit()`. Everything else in the codebase stays exactly the same.

### System Map

```
┌─────────────────────────────────────────────────────────────┐
│               SUPERADMIN — /VenQore/monetization            │
│                                                             │
│  [ Plans ]  [ Platforms ]  [ Coupons ]  [ Tenant Limits ]  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    PlanRepository
                   (cache layer)
                    /         \
          plan_limits DB    tenant_plan_overrides DB
                    \         /
                   PlanGate::enforce()
                           │
              All controllers (unchanged)
```

---

## 3. Database Schema

Run all migrations in this exact order. Each migration is independent and non-destructive to existing data.

---

### Migration 1: `create_platforms_table`

```php
Schema::create('platforms', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100);                                    // "Website", "AppSumo", "Paddle"
    $table->string('slug', 100)->unique();                          // "website", "appsumo", "paddle"
    $table->enum('type', ['subscription', 'ltd', 'hybrid'])->default('subscription');
    $table->boolean('is_active')->default(true);
    $table->json('config')->nullable();                             // Platform-specific checkout config
    $table->timestamps();

    $table->index(['slug', 'is_active']);
});
```

**Seed immediately after:**
```php
DB::table('platforms')->insert([
    ['name' => 'Website',  'slug' => 'website',  'type' => 'subscription', 'is_active' => true],
    ['name' => 'AppSumo',  'slug' => 'appsumo',  'type' => 'ltd',          'is_active' => true],
]);
```

---

### Migration 2: `create_plans_table`

```php
Schema::create('plans', function (Blueprint $table) {
    $table->id();
    $table->foreignId('platform_id')->constrained('platforms')->cascadeOnDelete();
    $table->string('name', 100);                                    // "Starter", "LTD Solo"
    $table->string('slug', 100)->unique();                          // "starter", "ltd_1" — must match tenant.plan values
    $table->enum('type', ['trial', 'subscription', 'ltd', 'enterprise'])->default('subscription');

    // Pricing (managed here for display; actual billing is in Lemon Squeezy/AppSumo)
    $table->decimal('price_monthly', 10, 2)->nullable();            // null for LTD and trial
    $table->decimal('price_annual', 10, 2)->nullable();
    $table->decimal('price_lifetime', 10, 2)->nullable();           // null for subscription
    $table->string('currency', 3)->default('USD');

    // Display
    $table->string('display_name', 150)->nullable();                // Marketing name shown to users
    $table->text('description')->nullable();
    $table->boolean('is_featured')->default(false);                 // "Most Popular" badge
    $table->integer('sort_order')->default(0);

    // Visibility
    $table->boolean('is_active')->default(true);
    $table->boolean('is_visible')->default(true);                   // Show on pricing page

    // LTD-specific
    $table->boolean('is_ltd')->default(false);                      // true for ltd_1/ltd_2/ltd_3
    $table->integer('trial_days')->nullable();

    // Notes (admin-only)
    $table->text('internal_notes')->nullable();
    $table->timestamps();

    $table->index(['platform_id', 'is_active', 'sort_order']);
    $table->index('slug');
});
```

**Seed immediately after — mirrors existing `config/plans.php` exactly:**
```php
// Get platform IDs
$websiteId  = DB::table('platforms')->where('slug', 'website')->value('id');
$appsumoId  = DB::table('platforms')->where('slug', 'appsumo')->value('id');

DB::table('plans')->insert([
    // Website plans
    ['platform_id' => $websiteId,  'slug' => 'trial',    'name' => 'Trial',    'type' => 'trial',        'is_active' => true, 'sort_order' => 0],
    ['platform_id' => $websiteId,  'slug' => 'starter',  'name' => 'Starter',  'type' => 'subscription', 'price_monthly' => 19.00, 'is_active' => true, 'sort_order' => 1],
    ['platform_id' => $websiteId,  'slug' => 'growth',   'name' => 'Growth',   'type' => 'subscription', 'price_monthly' => 39.00, 'is_active' => true, 'sort_order' => 2, 'is_featured' => true],
    ['platform_id' => $websiteId,  'slug' => 'business', 'name' => 'Business', 'type' => 'subscription', 'price_monthly' => 79.00, 'is_active' => true, 'sort_order' => 3],
    // AppSumo LTD plans
    ['platform_id' => $appsumoId,  'slug' => 'ltd_1',    'name' => 'LTD Solo',   'type' => 'ltd', 'price_lifetime' => 49.00,  'is_ltd' => true, 'is_active' => true, 'sort_order' => 1],
    ['platform_id' => $appsumoId,  'slug' => 'ltd_2',    'name' => 'LTD Growth', 'type' => 'ltd', 'price_lifetime' => 99.00,  'is_ltd' => true, 'is_active' => true, 'sort_order' => 2],
    ['platform_id' => $appsumoId,  'slug' => 'ltd_3',    'name' => 'LTD Pro',    'type' => 'ltd', 'price_lifetime' => 179.00, 'is_ltd' => true, 'is_active' => true, 'sort_order' => 3],
]);
```

---

### Migration 3: `create_plan_limits_table`

```php
Schema::create('plan_limits', function (Blueprint $table) {
    $table->id();
    $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
    $table->string('key', 100);                                     // "transactions_per_month", "sku_limit"
    $table->string('value', 255)->nullable();                       // null = unlimited; "false" = disabled; int string for caps
    $table->enum('reset_period', ['never', 'monthly', 'annually'])->default('never');
    $table->timestamps();

    $table->unique(['plan_id', 'key']);
    $table->index('key');
});
```

**Seed immediately after — exact values from `config/plans.php`:**

```php
// Helper: get plan id by slug
$planId = fn(string $slug) => DB::table('plans')->where('slug', $slug)->value('id');

// Limit value encoding:
// null → null (unlimited)
// false → '0' (disabled) — stored as '0', read as falsy
// true → '1' (enabled)
// int → string of int
// 'basic'/'advanced' → stored as-is

$limits = [
    // STARTER
    [$planId('starter'), 'transactions_per_month', '2000',    'monthly'],
    [$planId('starter'), 'locations',              '1',       'never'],
    [$planId('starter'), 'sku_limit',              '1000',    'never'],
    [$planId('starter'), 'staff_limit',            '3',       'never'],
    [$planId('starter'), 'woocommerce',            '0',       'never'],
    [$planId('starter'), 'api_access',             '0',       'never'],
    [$planId('starter'), 'reports',                'basic',   'never'],
    [$planId('starter'), 'growth_engine',          '0',       'never'],
    [$planId('starter'), 'multi_branch',           '0',       'never'],

    // GROWTH
    [$planId('growth'),  'transactions_per_month', '10000',   'monthly'],
    [$planId('growth'),  'locations',              '3',       'never'],
    [$planId('growth'),  'sku_limit',              null,      'never'],
    [$planId('growth'),  'staff_limit',            '10',      'never'],
    [$planId('growth'),  'woocommerce',            '1',       'never'],
    [$planId('growth'),  'api_access',             '0',       'never'],
    [$planId('growth'),  'reports',                'advanced','never'],
    [$planId('growth'),  'growth_engine',          '1',       'never'],
    [$planId('growth'),  'multi_branch',           '1',       'never'],

    // BUSINESS
    [$planId('business'), 'transactions_per_month', null,     'monthly'],
    [$planId('business'), 'locations',              null,     'never'],
    [$planId('business'), 'sku_limit',              null,     'never'],
    [$planId('business'), 'staff_limit',            null,     'never'],
    [$planId('business'), 'woocommerce',            '1',      'never'],
    [$planId('business'), 'api_access',             '1',      'never'],
    [$planId('business'), 'reports',                'advanced','never'],
    [$planId('business'), 'growth_engine',          '1',      'never'],
    [$planId('business'), 'multi_branch',           '1',      'never'],

    // LTD_1
    [$planId('ltd_1'),   'transactions_per_month', '500',    'monthly'],
    [$planId('ltd_1'),   'locations',              '1',      'never'],
    [$planId('ltd_1'),   'sku_limit',              '1000',   'never'],
    [$planId('ltd_1'),   'staff_limit',            '3',      'never'],
    [$planId('ltd_1'),   'woocommerce',            '0',      'never'],
    [$planId('ltd_1'),   'api_access',             '0',      'never'],
    [$planId('ltd_1'),   'reports',                'basic',  'never'],
    [$planId('ltd_1'),   'growth_engine',          '0',      'never'],
    [$planId('ltd_1'),   'multi_branch',           '0',      'never'],

    // LTD_2
    [$planId('ltd_2'),   'transactions_per_month', '2000',   'monthly'],
    [$planId('ltd_2'),   'locations',              '3',      'never'],
    [$planId('ltd_2'),   'sku_limit',              null,     'never'],
    [$planId('ltd_2'),   'staff_limit',            '10',     'never'],
    [$planId('ltd_2'),   'woocommerce',            '1',      'never'],
    [$planId('ltd_2'),   'api_access',             '0',      'never'],
    [$planId('ltd_2'),   'reports',                'advanced','never'],
    [$planId('ltd_2'),   'growth_engine',          '1',      'never'],
    [$planId('ltd_2'),   'multi_branch',           '1',      'never'],

    // LTD_3
    [$planId('ltd_3'),   'transactions_per_month', '6000',   'monthly'],
    [$planId('ltd_3'),   'locations',              null,     'never'],
    [$planId('ltd_3'),   'sku_limit',              null,     'never'],
    [$planId('ltd_3'),   'staff_limit',            null,     'never'],
    [$planId('ltd_3'),   'woocommerce',            '1',      'never'],
    [$planId('ltd_3'),   'api_access',             '1',      'never'],
    [$planId('ltd_3'),   'reports',                'advanced','never'],
    [$planId('ltd_3'),   'growth_engine',          '1',      'never'],
    [$planId('ltd_3'),   'multi_branch',           '1',      'never'],
];

foreach ($limits as [$pid, $key, $value, $reset]) {
    DB::table('plan_limits')->insert([
        'plan_id' => $pid, 'key' => $key, 'value' => $value, 
        'reset_period' => $reset, 'created_at' => now(), 'updated_at' => now()
    ]);
}
```

---

### Migration 4: `create_plan_features_table`

Marketing-facing feature bullets shown on billing/pricing pages. Separate from limits.

```php
Schema::create('plan_features', function (Blueprint $table) {
    $table->id();
    $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
    $table->string('feature', 255);                                 // "Advanced inventory management"
    $table->boolean('is_included')->default(true);
    $table->string('tooltip', 500)->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->index(['plan_id', 'sort_order']);
});
```

---

### Migration 5: `create_tenant_plan_overrides_table`

Per-tenant limit overrides set by you from the admin panel. Replaces the ad-hoc `plan_limits` JSON hacks.

```php
Schema::create('tenant_plan_overrides', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('override_key', 100);                            // "transactions_per_month", "staff_limit"
    $table->string('override_value', 255)->nullable();              // null = unlimited override
    $table->string('original_value', 255)->nullable();              // For audit — what it was before
    $table->text('reason')->nullable();                             // Why you made this override
    $table->unsignedBigInteger('applied_by');                       // Platform admin user_id
    $table->timestamp('expires_at')->nullable();                    // null = permanent override

    $table->timestamps();

    $table->unique(['tenant_id', 'override_key']);
    $table->index(['tenant_id']);
    $table->index(['expires_at']);
});
```

---

### Migration 6: `create_coupons_table`

```php
Schema::create('coupons', function (Blueprint $table) {
    $table->id();
    $table->string('code', 50)->unique();
    $table->string('name', 150);
    $table->text('description')->nullable();

    $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
    $table->decimal('discount_value', 10, 2);
    $table->decimal('max_discount', 10, 2)->nullable();             // Cap for percentage discounts

    $table->enum('applies_to', ['all', 'subscription', 'ltd', 'specific_plans'])->default('all');
    $table->foreignId('platform_id')->nullable()->constrained('platforms')->nullOnDelete();

    $table->unsignedInteger('max_uses')->nullable();                // null = unlimited
    $table->unsignedInteger('used_count')->default(0);
    $table->unsignedInteger('max_uses_per_user')->default(1);

    $table->timestamp('valid_from')->useCurrent();
    $table->timestamp('valid_until')->nullable();

    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index(['code', 'is_active']);
    $table->index(['valid_from', 'valid_until']);
});
```

---

### Migration 7: `create_coupon_plan_restrictions_table`

```php
Schema::create('coupon_plan_restrictions', function (Blueprint $table) {
    $table->foreignId('coupon_id')->constrained('coupons')->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
    $table->primary(['coupon_id', 'plan_id']);
});
```

---

### Migration 8: `create_coupon_redemptions_table`

```php
Schema::create('coupon_redemptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('coupon_id')->constrained('coupons');
    $table->foreignId('user_id')->constrained('users');
    $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
    $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
    $table->decimal('discount_applied', 10, 2);
    $table->timestamp('redeemed_at')->useCurrent();

    $table->index(['coupon_id', 'user_id']);
    $table->index('redeemed_at');
});
```

---

### Migration 9: `create_plan_change_notifications_table`

```php
Schema::create('plan_change_notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->enum('type', [
        'upgrade', 'downgrade', 'limit_increase', 'limit_decrease',
        'feature_added', 'feature_removed', 'extension', 'expiry_warning', 'manual_override'
    ]);
    $table->string('title', 255);
    $table->text('message');
    $table->json('details')->nullable();                            // What specifically changed
    $table->boolean('is_read')->default(false);
    $table->enum('sent_by', ['system', 'admin'])->default('system');
    $table->unsignedBigInteger('admin_user_id')->nullable();

    $table->timestamps();

    $table->index(['tenant_id', 'is_read']);
    $table->index('created_at');
});
```

---

## 4. Phase 1 — Foundation

This phase has no visible UI. It migrates the system's brain from `config/plans.php` to the database while changing nothing about how any feature works. The application must behave identically before and after Phase 1.

### File: `app/Services/PlanRepository.php` (NEW)

```php
<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\TenantPlanOverride;
use Illuminate\Support\Facades\Cache;

class PlanRepository
{
    /**
     * Get all limits for a plan slug as an associative array.
     * Returns: ['transactions_per_month' => '2000', 'sku_limit' => null, 'woocommerce' => '0', ...]
     * 
     * Values are stored as strings in DB. null = unlimited.
     * Callers must cast appropriately (PlanGate handles this).
     */
    public static function getLimits(string $planSlug): array
    {
        return Cache::remember("plan_limits:{$planSlug}", 3600, function () use ($planSlug) {
            $plan = Plan::with('limits')->where('slug', $planSlug)->first();

            if (!$plan) {
                // Fallback to config if plan not in DB yet (safe during migration)
                return config("plans.{$planSlug}", []);
            }

            return $plan->limits->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Get effective limit for a specific tenant and key.
     * Priority: tenant override > plan default > null (unlimited fallback)
     *
     * Returns the raw stored value (string, null, '0', '1', 'basic', etc.)
     * PlanGate::check() handles the type casting.
     */
    public static function getEffectiveLimit(int $tenantId, string $planSlug, string $key): mixed
    {
        // 1. Check for an active, non-expired tenant-level override
        $override = Cache::remember("tenant_override:{$tenantId}:{$key}", 300, function () use ($tenantId, $key) {
            return TenantPlanOverride::where('tenant_id', $tenantId)
                ->where('override_key', $key)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->value('override_value');
        });

        // Distinguish "override not found" (false from Cache) vs "override = unlimited" (null value)
        if ($override !== false) {
            return $override; // null here = unlimited override
        }

        // 2. Fall back to plan default from DB
        $limits = self::getLimits($planSlug);
        return $limits[$key] ?? null;
    }

    /**
     * Invalidate plan limits cache.
     * Call whenever a plan or its limits are edited from SuperAdmin.
     */
    public static function invalidatePlanCache(string $planSlug): void
    {
        Cache::forget("plan_limits:{$planSlug}");
    }

    /**
     * Invalidate all active overrides for a specific tenant.
     * Call whenever a tenant override is applied or removed.
     */
    public static function invalidateTenantCache(int $tenantId): void
    {
        $keys = TenantPlanOverride::where('tenant_id', $tenantId)->pluck('override_key');
        foreach ($keys as $key) {
            Cache::forget("tenant_override:{$tenantId}:{$key}");
        }
    }
}
```

---

### File: `app/Models/Tenant.php` — Update `getLimit()` method

Find the existing `getLimit()` method and replace it entirely:

```php
/**
 * Get the effective limit for a feature key.
 *
 * Priority order:
 * 1. tenant_plan_overrides table (set from SuperAdmin override panel)
 * 2. plan_limits table (set from SuperAdmin plan editor)
 * 3. plan_limits JSON column on this tenant (legacy AppSumo stacking — still supported)
 * 4. config/plans.php (final fallback during transition period)
 */
public function getLimit(string $key): mixed
{
    // Use PlanRepository which handles DB + cache
    $value = \App\Services\PlanRepository::getEffectiveLimit($this->id, $this->plan, $key);

    // Value semantics from DB:
    // null = unlimited
    // '0'  = false/disabled  
    // '1'  = true/enabled
    // numeric string = integer cap
    // 'basic'/'advanced' = feature variant

    if ($value === null)   return null;   // unlimited
    if ($value === '0')    return false;  // disabled
    if ($value === '1')    return true;   // enabled
    if (is_numeric($value)) return (int) $value;
    return $value; // string variant ('basic', 'advanced')
}
```

> **Note:** `PlanGate` does NOT need to change at all. It already calls `app('current.tenant')->getLimit($feature)`. Since `Tenant::getLimit()` is now routing through `PlanRepository`, the entire enforcement layer is automatically database-driven.

---

### File: `app/Models/Plan.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    protected $fillable = [
        'platform_id', 'name', 'slug', 'type',
        'price_monthly', 'price_annual', 'price_lifetime', 'currency',
        'display_name', 'description', 'is_featured', 'sort_order',
        'is_active', 'is_visible', 'is_ltd', 'trial_days', 'internal_notes',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_active'   => 'boolean',
        'is_visible'  => 'boolean',
        'is_ltd'      => 'boolean',
        'price_monthly'  => 'decimal:2',
        'price_annual'   => 'decimal:2',
        'price_lifetime' => 'decimal:2',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function limits(): HasMany
    {
        return $this->hasMany(PlanLimit::class);
    }

    public function features(): HasMany
    {
        return $this->hasMany(PlanFeature::class)->orderBy('sort_order');
    }

    public function coupons(): BelongsToMany
    {
        return $this->belongsToMany(Coupon::class, 'coupon_plan_restrictions');
    }

    /** How many tenants are currently on this plan */
    public function activeTenantCount(): int
    {
        return Tenant::where('plan', $this->slug)->count();
    }
}
```

---

### File: `app/Models/PlanLimit.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanLimit extends Model
{
    protected $fillable = ['plan_id', 'key', 'value', 'reset_period'];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}
```

---

### File: `app/Models/Platform.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Platform extends Model
{
    protected $fillable = ['name', 'slug', 'type', 'is_active', 'config'];

    protected $casts = [
        'is_active' => 'boolean',
        'config'    => 'array',
    ];

    public function plans()
    {
        return $this->hasMany(Plan::class);
    }
}
```

---

### File: `app/Models/TenantPlanOverride.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantPlanOverride extends Model
{
    protected $fillable = [
        'tenant_id', 'override_key', 'override_value',
        'original_value', 'reason', 'applied_by', 'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function appliedByUser()
    {
        return $this->belongsTo(User::class, 'applied_by');
    }

    /** Check if this override is still active */
    public function isActive(): bool
    {
        return is_null($this->expires_at) || $this->expires_at->isFuture();
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
```

---

### Phase 1 Verification Checklist (for IDE)

After Phase 1, run the full test suite. The following must all pass:

- [ ] `php artisan migrate` runs without errors
- [ ] All seeded plan data is in `plans` and `plan_limits` tables
- [ ] `PlanGate::enforce('sku_limit', 999)` still throws `PlanLimitException` on a Starter tenant
- [ ] `PlanGate::check('woocommerce')` returns `false` for starter, `true` for growth
- [ ] `PlanGate::check('transactions_per_month', 499)` returns `true` for ltd_1 (limit is 500)
- [ ] `PlanGate::check('transactions_per_month', 500)` returns `false` for ltd_1
- [ ] `PlanGate::check('sku_limit', 50)` returns `true` for business (unlimited = null)
- [ ] Billing page still renders without errors
- [ ] `TenantMiddleware` still populates `plan_usage` correctly
- [ ] `php artisan test --filter=CodeStackingTest` still passes

---

## 5. Phase 2 — Plan Management UI

### File: `app/Http/Controllers/SuperAdmin/PlanController.php` (NEW)

```php
<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Platform;
use App\Models\Tenant;
use App\Services\PlanRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::with(['platform', 'limits', 'features'])
            ->orderBy('platform_id')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                $plan->active_tenant_count = Tenant::where('plan', $plan->slug)->count();
                return $plan;
            });

        $platforms = Platform::where('is_active', true)->get();

        return Inertia::render('SuperAdmin/Plans/Index', [
            'plans'     => $plans,
            'platforms' => $platforms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform_id'    => 'required|exists:platforms,id',
            'name'           => 'required|string|max:100',
            'slug'           => 'required|string|max:100|unique:plans,slug|regex:/^[a-z0-9_]+$/',
            'type'           => 'required|in:trial,subscription,ltd,enterprise',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'sort_order'     => 'integer|min:0',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string|max:100',
            'limits.*.value' => 'nullable|string|max:255',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        $plan = Plan::create($validated);

        foreach ($validated['limits'] ?? [] as $limit) {
            $plan->limits()->create($limit);
        }

        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan \"{$plan->name}\" created. It is live immediately.");
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name'           => 'string|max:100',
            'display_name'   => 'nullable|string|max:150',
            'description'    => 'nullable|string',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'sort_order'     => 'integer|min:0',
            'internal_notes' => 'nullable|string',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string',
            'limits.*.value' => 'nullable|string',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        $plan->update($validated);

        // Sync limits using upsert
        foreach ($validated['limits'] ?? [] as $limit) {
            $plan->limits()->updateOrCreate(
                ['key' => $limit['key']],
                ['value' => $limit['value'], 'reset_period' => $limit['reset_period'] ?? 'never']
            );
        }

        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan updated. All tenants on \"{$plan->slug}\" see the new limits immediately.");
    }

    public function duplicate(Plan $plan)
    {
        $newPlan = $plan->replicate();
        $newPlan->name      = $plan->name . ' (Copy)';
        $newPlan->slug      = $plan->slug . '_copy_' . time();
        $newPlan->is_active = false; // Start inactive — admin must review before activating
        $newPlan->save();

        foreach ($plan->limits as $limit) {
            $newPlan->limits()->create($limit->only(['key', 'value', 'reset_period']));
        }

        foreach ($plan->features as $feature) {
            $newPlan->features()->create($feature->only(['feature', 'is_included', 'tooltip', 'sort_order']));
        }

        return back()->with('success', "Plan duplicated as \"{$newPlan->name}\". It is inactive — edit and activate when ready.");
    }

    public function destroy(Plan $plan)
    {
        $activeCount = Tenant::where('plan', $plan->slug)->count();

        if ($activeCount > 0) {
            return back()->withErrors([
                'plan' => "Cannot delete — {$activeCount} tenant(s) are currently on this plan. Deactivate it first (new signups are blocked but existing users are unaffected)."
            ]);
        }

        $plan->delete(); // Cascades to plan_limits and plan_features
        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan deleted.");
    }
}
```

---

### File: `app/Http/Controllers/SuperAdmin/PlatformController.php` (NEW)

```php
<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Platform;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlatformController extends Controller
{
    public function index()
    {
        $platforms = Platform::withCount('plans')->get();

        return Inertia::render('SuperAdmin/Platforms/Index', [
            'platforms' => $platforms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'slug'      => 'required|string|unique:platforms,slug|max:100|regex:/^[a-z0-9_]+$/',
            'type'      => 'required|in:subscription,ltd,hybrid',
            'is_active' => 'boolean',
            'config'    => 'nullable|array',
        ]);

        Platform::create($validated);

        return back()->with('success', "Platform \"{$validated['name']}\" added. Create plans for it under Plans → select this platform.");
    }

    public function update(Request $request, Platform $platform)
    {
        // Slug is not updateable — it's used as a reference in plans and redemption logic
        $validated = $request->validate([
            'name'      => 'string|max:100',
            'is_active' => 'boolean',
            'config'    => 'nullable|array',
        ]);

        $platform->update($validated);

        return back()->with('success', "Platform updated.");
    }
}
```

---

### Routes to Add to `routes/web.php` (inside existing `/VenQore` middleware group)

```php
// ── Monetization ────────────────────────────────────────────────────────────
Route::prefix('VenQore/plans')->name('superadmin.plans.')->group(function () {
    Route::get('/',                   [SuperAdmin\PlanController::class, 'index'])->name('index');
    Route::post('/',                  [SuperAdmin\PlanController::class, 'store'])->name('store');
    Route::put('/{plan}',             [SuperAdmin\PlanController::class, 'update'])->name('update');
    Route::post('/{plan}/duplicate',  [SuperAdmin\PlanController::class, 'duplicate'])->name('duplicate');
    Route::delete('/{plan}',          [SuperAdmin\PlanController::class, 'destroy'])->name('destroy');
});

Route::prefix('VenQore/platforms')->name('superadmin.platforms.')->group(function () {
    Route::get('/',           [SuperAdmin\PlatformController::class, 'index'])->name('index');
    Route::post('/',          [SuperAdmin\PlatformController::class, 'store'])->name('store');
    Route::put('/{platform}', [SuperAdmin\PlatformController::class, 'update'])->name('update');
});
```

---

### Frontend: `resources/js/Pages/SuperAdmin/Plans/Index.jsx` (NEW)

Layout structure for IDE to implement. The page has one tab per platform.

```
LAYOUT:
  Page header: "Plan Management"
  Tab row: one tab per platform (Website | AppSumo | + Add Platform)
  
  Per platform tab:
    Stats row: [X plans] [X active tenants on this platform] [X plans active]
    
    Plans table:
      Columns: Name | Type | Price | Tenants | Active | Featured | Actions
      Actions per row: Edit (opens drawer) | Duplicate | Deactivate/Activate | Delete
    
    "New Plan" button → opens create drawer
  
  Edit/Create Drawer (slides in from right):
    Section 1: Basic Info
      - Name, Display Name, Description
      - Type (subscription/ltd/trial/enterprise)
      - Sort Order, Featured toggle, Active toggle, Visible toggle
    
    Section 2: Pricing
      - Monthly Price / Annual Price / Lifetime Price (conditional on type)
      - Currency
    
    Section 3: Limits Table
      - One row per limit key
      - Columns: Feature | Value (input) | Reset Period | Actions
      - Keys: transactions_per_month, sku_limit, locations, staff_limit,
              woocommerce, api_access, growth_engine, multi_branch, reports
      - "Add custom limit" button
    
    Section 4: Internal Notes
      - Textarea (not shown to users)
    
    Footer: [Cancel] [Save Changes]
```

---

## 6. Phase 3 — Tenant Override Panel

### File: `app/Http/Controllers/SuperAdmin/TenantOverrideController.php` (NEW)

```php
<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use App\Services\PlanChangeNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantOverrideController extends Controller
{
    /**
     * List all tenants with override counts and usage context.
     */
    public function index(Request $request)
    {
        $tenants = Tenant::withCount('planOverrides')
            ->with(['planOverrides' => fn($q) => $q->active()])
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('slug', 'like', "%{$request->search}%")
            )
            ->when($request->plan, fn($q) => $q->where('plan', $request->plan))
            ->orderByDesc('plan_overrides_count')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Tenants/Overrides', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'plan']),
        ]);
    }

    /**
     * Show override detail for a single tenant.
     */
    public function show(Tenant $tenant)
    {
        $planLimits = PlanRepository::getLimits($tenant->plan);
        $effectiveLimits = [];

        foreach ($planLimits as $key => $planDefault) {
            $override = $tenant->planOverrides()->where('override_key', $key)->active()->first();
            $effectiveLimits[$key] = [
                'plan_default' => $planDefault,
                'override'     => $override?->override_value,
                'effective'    => PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan, $key),
                'expires_at'   => $override?->expires_at,
                'reason'       => $override?->reason,
                'applied_at'   => $override?->updated_at,
            ];
        }

        return Inertia::render('SuperAdmin/Tenants/OverrideDetail', [
            'tenant'           => $tenant->load('planOverrides'),
            'effective_limits' => $effectiveLimits,
            'override_history' => $tenant->planOverrides()->orderByDesc('created_at')->get(),
            'available_keys'   => array_keys($planLimits),
        ]);
    }

    /**
     * Apply a limit override to a tenant.
     * This is the main action — triggers cache invalidation and optional notification.
     */
    public function apply(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'override_key'         => 'required|string|max:100',
            'override_value'       => 'nullable|string|max:255',
            'reason'               => 'nullable|string|max:500',
            'expires_at'           => 'nullable|date|after:now',
            'notify_user'          => 'boolean',
            'notification_message' => 'nullable|string|max:500',
        ]);

        // Capture current effective value for audit trail
        $originalValue = PlanRepository::getEffectiveLimit(
            $tenant->id, $tenant->plan, $validated['override_key']
        );

        TenantPlanOverride::updateOrCreate(
            [
                'tenant_id'    => $tenant->id,
                'override_key' => $validated['override_key'],
            ],
            [
                'override_value' => $validated['override_value'],
                'original_value' => (string) $originalValue,
                'reason'         => $validated['reason'],
                'applied_by'     => auth()->id(),
                'expires_at'     => $validated['expires_at'] ?? null,
            ]
        );

        PlanRepository::invalidateTenantCache($tenant->id);

        if ($validated['notify_user'] ?? true) {
            PlanChangeNotifier::notifyOverride(
                tenant:          $tenant,
                key:             $validated['override_key'],
                oldValue:        $originalValue,
                newValue:        $validated['override_value'],
                customMessage:   $validated['notification_message'] ?? null,
                adminId:         auth()->id()
            );
        }

        return back()->with('success', "Override applied to \"{$tenant->name}\". Effective immediately.");
    }

    /**
     * Remove a specific override — tenant reverts to plan default.
     */
    public function remove(Tenant $tenant, TenantPlanOverride $override)
    {
        $override->delete();
        PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', "Override removed. \"{$tenant->name}\" now uses the plan default.");
    }
}
```

---

### Add to `Tenant` model — `planOverrides()` relationship

```php
public function planOverrides(): HasMany
{
    return $this->hasMany(\App\Models\TenantPlanOverride::class);
}
```

---

### Routes to Add

```php
Route::prefix('VenQore/tenants')->name('superadmin.tenants.')->group(function () {
    Route::get('/overrides',                      [SuperAdmin\TenantOverrideController::class, 'index'])->name('overrides');
    Route::get('/{tenant}/overrides',             [SuperAdmin\TenantOverrideController::class, 'show'])->name('overrides.show');
    Route::post('/{tenant}/overrides',            [SuperAdmin\TenantOverrideController::class, 'apply'])->name('overrides.apply');
    Route::delete('/{tenant}/overrides/{override}',[SuperAdmin\TenantOverrideController::class, 'remove'])->name('overrides.remove');
});
```

---

### Frontend: `resources/js/Pages/SuperAdmin/Tenants/Overrides.jsx` (NEW)

```
LAYOUT:
  Page header: "Tenant Limit Overrides"
  
  Filters row: [Search by name/slug] [Filter by plan dropdown]
  
  Table:
    Columns: Store Name | Plan | Active Overrides | Usage Summary | Actions
    Usage Summary: show transactions_used/limit as "487/500 ⚠" with color coding
    Actions: [Manage Overrides →]
  
  Each row opens → OverrideDetail page

PAGE: SuperAdmin/Tenants/OverrideDetail.jsx
  Header: Store name, plan badge, status badge
  
  Section: "Current Limits & Overrides"
  Table:
    Columns: Feature | Plan Default | Override | Effective Value | Expires | Actions
    Effective Value highlighted in orange if override is active
    Actions: [Remove Override] button per row
  
  Section: "Apply New Override"
  Form:
    - Feature key (dropdown of known keys + free-text option)
    - New value (input — leave blank for unlimited)
    - Reason (textarea — required, saved for audit)
    - Expires at (date picker — optional, blank = permanent)
    - Notify user (toggle, default ON)
    - Custom notification message (conditional textarea)
    [Apply Override] button

  Section: "Override History"
  Table: key | old | new | reason | applied by | date
```

---

## 7. Phase 4 — Notification System

### File: `app/Models/PlanChangeNotification.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanChangeNotification extends Model
{
    protected $fillable = [
        'tenant_id', 'type', 'title', 'message',
        'details', 'is_read', 'sent_by', 'admin_user_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'details' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
```

---

### File: `app/Services/PlanChangeNotifier.php` (NEW)

```php
<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\PlanChangeNotification;

class PlanChangeNotifier
{
    public static function notifyOverride(
        Tenant $tenant,
        string $key,
        mixed $oldValue,
        mixed $newValue,
        ?string $customMessage,
        int $adminId
    ): void {
        $isIncrease = self::isIncrease($key, $oldValue, $newValue);

        PlanChangeNotification::create([
            'tenant_id'     => $tenant->id,
            'type'          => $isIncrease ? 'limit_increase' : 'limit_decrease',
            'title'         => $isIncrease
                ? 'Your ' . self::keyLabel($key) . ' limit has been increased'
                : 'Your ' . self::keyLabel($key) . ' limit has been adjusted',
            'message'       => $customMessage ?? self::buildMessage($key, $oldValue, $newValue),
            'details'       => ['key' => $key, 'old' => $oldValue, 'new' => $newValue],
            'sent_by'       => 'admin',
            'admin_user_id' => $adminId,
        ]);
    }

    public static function notifyPlanUpgrade(Tenant $tenant, string $from, string $to): void
    {
        PlanChangeNotification::create([
            'tenant_id' => $tenant->id,
            'type'      => 'upgrade',
            'title'     => 'Your plan has been upgraded',
            'message'   => "Your account has been upgraded from {$from} to {$to}. New limits and features are active immediately.",
            'details'   => ['from' => $from, 'to' => $to],
            'sent_by'   => 'admin',
        ]);
    }

    public static function notifyExtension(Tenant $tenant, int $days): void
    {
        PlanChangeNotification::create([
            'tenant_id' => $tenant->id,
            'type'      => 'extension',
            'title'     => 'Your plan access has been extended',
            'message'   => "Your plan access has been extended by {$days} day(s). Your updated expiry is reflected immediately.",
            'sent_by'   => 'admin',
        ]);
    }

    private static function isIncrease(string $key, mixed $old, mixed $new): bool
    {
        if ($new === null) return true;  // null = unlimited = always an increase
        if ($old === null) return false; // was unlimited, now capped = decrease
        return (int) $new > (int) $old;
    }

    private static function keyLabel(string $key): string
    {
        return match($key) {
            'transactions_per_month' => 'monthly transaction',
            'sku_limit'   => 'product (SKU)',
            'locations'   => 'warehouse location',
            'staff_limit' => 'staff seat',
            'storage_gb'  => 'storage',
            default       => str_replace('_', ' ', $key),
        };
    }

    private static function buildMessage(string $key, mixed $old, mixed $new): string
    {
        $label = self::keyLabel($key);
        $oldDisplay = ($old === null || $old === '') ? 'unlimited' : $old;
        $newDisplay = ($new === null || $new === '') ? 'unlimited' : $new;

        return "Your {$label} limit has been changed from {$oldDisplay} to {$newDisplay}. This change is effective immediately.";
    }
}
```

---

### File: `app/Http/Controllers/NotificationController.php` (NEW)

```php
<?php

namespace App\Http\Controllers;

use App\Models\PlanChangeNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Return unread plan change notifications for the current tenant */
    public function unread()
    {
        $tenant = app('current.tenant');

        $notifications = PlanChangeNotification::where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json($notifications);
    }

    /** Mark a single notification as read */
    public function markRead(int $id)
    {
        PlanChangeNotification::where('id', $id)
            ->where('tenant_id', app('current.tenant')->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    /** Mark all as read */
    public function markAllRead()
    {
        PlanChangeNotification::where('tenant_id', app('current.tenant')->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }
}
```

---

### Routes to Add

```php
// Inside tenant middleware group (store routes):
Route::prefix('notifications/plan')->name('notifications.plan.')->group(function () {
    Route::get('/unread',          [NotificationController::class, 'unread'])->name('unread');
    Route::post('/mark-all-read',  [NotificationController::class, 'markAllRead'])->name('markAllRead');
    Route::post('/{id}/read',      [NotificationController::class, 'markRead'])->name('read');
});
```

---

### File: `resources/js/Components/PlanNotificationBell.jsx` (NEW)

```jsx
import React, { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import axios from 'axios';

export default function PlanNotificationBell({ storeSlug }) {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        axios.get(route('notifications.plan.unread', { store_slug: storeSlug }))
            .then(res => setNotifications(res.data))
            .catch(() => {}); // Silently fail — non-critical
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markRead = (id) => {
        axios.post(route('notifications.plan.read', { store_slug: storeSlug, id }));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const getIcon = (type) => {
        const iconMap = {
            upgrade:        <TrendingUp size={14} className="text-green-500" />,
            limit_increase: <TrendingUp size={14} className="text-green-500" />,
            downgrade:      <TrendingDown size={14} className="text-orange-500" />,
            limit_decrease: <TrendingDown size={14} className="text-orange-500" />,
            extension:      <Clock size={14} className="text-blue-500" />,
        };
        return iconMap[type] ?? <Zap size={14} className="text-purple-500" />;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                        <span className="font-semibold text-sm">Plan Updates</span>
                        <button onClick={() => setOpen(false)}><X size={14} /></button>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No plan updates.</div>
                    ) : (
                        <div className="divide-y dark:divide-gray-700 max-h-80 overflow-y-auto">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5">{getIcon(n.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
```

**Mount in `OneGlanceLayout.jsx`:** Import `PlanNotificationBell` and add it to the header bar next to the existing profile/settings icons. Pass `store?.slug` as the `storeSlug` prop.

---

## 8. Phase 5 — Platforms & Coupons

### File: `app/Models/Coupon.php` (NEW)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'discount_type', 'discount_value',
        'max_discount', 'applies_to', 'platform_id', 'max_uses', 'used_count',
        'max_uses_per_user', 'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'valid_from'   => 'datetime',
        'valid_until'  => 'datetime',
    ];

    public function platform()
    {
        return $this->belongsTo(Platform::class);
    }

    public function planRestrictions()
    {
        return $this->belongsToMany(Plan::class, 'coupon_plan_restrictions');
    }

    public function redemptions()
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->valid_from > now()) return false;
        if ($this->valid_until && $this->valid_until < now()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        return true;
    }
}
```

---

### File: `app/Http/Controllers/SuperAdmin/CouponController.php` (NEW)

```php
<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CouponController extends Controller
{
    public function index()
    {
        $coupons = Coupon::with(['platform', 'planRestrictions'])
            ->withCount('redemptions')
            ->orderByDesc('created_at')
            ->get();

        $plans = Plan::where('is_active', true)->with('platform')->get();

        return Inertia::render('SuperAdmin/Coupons/Index', [
            'coupons' => $coupons,
            'plans'   => $plans,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'                => 'required|string|max:50|unique:coupons,code',
            'name'                => 'required|string|max:150',
            'description'         => 'nullable|string',
            'discount_type'       => 'required|in:percentage,fixed',
            'discount_value'      => 'required|numeric|min:0',
            'max_discount'        => 'nullable|numeric|min:0',
            'applies_to'          => 'required|in:all,subscription,ltd,specific_plans',
            'platform_id'         => 'nullable|exists:platforms,id',
            'max_uses'            => 'nullable|integer|min:1',
            'max_uses_per_user'   => 'required|integer|min:1',
            'valid_from'          => 'required|date',
            'valid_until'         => 'nullable|date|after:valid_from',
            'plan_ids'            => 'nullable|array',
            'plan_ids.*'          => 'exists:plans,id',
        ]);

        $coupon = Coupon::create($validated);

        if ($validated['applies_to'] === 'specific_plans' && !empty($validated['plan_ids'])) {
            $coupon->planRestrictions()->attach($validated['plan_ids']);
        }

        return back()->with('success', "Coupon \"{$coupon->code}\" created and active.");
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'is_active'   => 'boolean',
            'valid_until' => 'nullable|date',
            'max_uses'    => 'nullable|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $coupon->update($validated);

        return back()->with('success', "Coupon updated.");
    }

    /**
     * Public-facing validation endpoint — called from checkout/redeem pages.
     */
    public function validate(Request $request)
    {
        $request->validate([
            'code'    => 'required|string',
            'plan_id' => 'required|exists:plans,id',
        ]);

        $coupon = Coupon::where('code', strtoupper(trim($request->code)))->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired coupon code.'], 422);
        }

        // Plan restriction check
        if ($coupon->applies_to === 'specific_plans') {
            $allowed = $coupon->planRestrictions()->where('plan_id', $request->plan_id)->exists();
            if (!$allowed) {
                return response()->json(['valid' => false, 'message' => 'This coupon does not apply to the selected plan.'], 422);
            }
        }

        $discountDisplay = $coupon->discount_type === 'percentage'
            ? "{$coupon->discount_value}% off"
            : "\${$coupon->discount_value} off";

        return response()->json([
            'valid'          => true,
            'discount_type'  => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'message'        => "Coupon applied — {$discountDisplay}",
        ]);
    }
}
```

---

### Routes to Add

```php
Route::prefix('VenQore/coupons')->name('superadmin.coupons.')->group(function () {
    Route::get('/',             [SuperAdmin\CouponController::class, 'index'])->name('index');
    Route::post('/',            [SuperAdmin\CouponController::class, 'store'])->name('store');
    Route::put('/{coupon}',     [SuperAdmin\CouponController::class, 'update'])->name('update');
});

// Public coupon validation (called from checkout — no auth required)
Route::post('/coupons/validate', [SuperAdmin\CouponController::class, 'validate'])->name('coupons.validate');
```

---

## 9. Phase 6 — Billing Sync & Cleanup

### File: `app/Http/Controllers/BillingController.php` — Update `index()`

Find the existing `index()` method. Replace the `config('plans')` call with:

```php
use App\Models\Plan;
use App\Services\PlanRepository;

public function index(): Response
{
    $tenant = app('current.tenant');

    // Read plans from DB (not config) — reflects live SuperAdmin changes
    $availablePlans = Plan::with(['limits', 'features'])
        ->whereHas('platform', fn($q) => $q->where('slug', 'website'))
        ->where('is_active', true)
        ->where('is_visible', true)
        ->orderBy('sort_order')
        ->get();

    // Current effective limits (DB + overrides)
    $limitKeys = ['transactions_per_month', 'sku_limit', 'locations', 'staff_limit',
                  'woocommerce', 'api_access', 'growth_engine', 'multi_branch', 'reports'];

    $currentLimits = [];
    foreach ($limitKeys as $key) {
        $currentLimits[$key] = PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan, $key);
    }

    return Inertia::render('Store/Billing/Index', [
        'tenant'          => $tenant->only(['name', 'plan', 'status', 'trial_ends_at', 'subscription_ends_at']),
        'available_plans' => $availablePlans,
        'current_limits'  => $currentLimits,
        'usage'           => [
            'staff_count'    => $tenant->memberships()->where('status', 'active')->count(),
            'product_count'  => \App\Models\Product::count(),
            'location_count' => \App\Models\Warehouse::count(),
        ],
    ]);
}
```

### Cleanup: Remove `config/plans.php` reads

After all phases are verified working, search for any remaining direct reads of `config('plans')` or `config("plans.{$something}")` across the codebase and replace them with `PlanRepository::getEffectiveLimit()` or `PlanRepository::getLimits()` calls. The one exception is the seeder — it can keep reading from config during the seed process.

Once all direct reads are replaced, `config/plans.php` can be kept as a documentation reference but is no longer functional.

---

## 10. Plan Engine Logic

### How the Limit Resolution Chain Works

Every limit check in the application follows this exact priority order:

```
1. tenant_plan_overrides table  (set by admin from Override Panel)
   ↓ not found
2. plan_limits table           (set by admin from Plan Editor)
   ↓ not found (plan not in DB or key missing)
3. config/plans.php            (legacy fallback during transition)
   ↓ not found
4. null                        (treated as unlimited)
```

The `PlanRepository::getEffectiveLimit()` method implements this chain. `PlanGate` calls `Tenant::getLimit()` which calls `PlanRepository`. Every controller calls `PlanGate`. The chain is one-directional and there are no bypasses.

### Value Encoding

All values in `plan_limits` and `tenant_plan_overrides` are stored as strings. `Tenant::getLimit()` casts them on the way out:

| Stored Value | Returned Type | Meaning |
|---|---|---|
| `null` (DB null) | `null` | Unlimited — PlanGate returns `true` always |
| `'0'` | `false` | Feature disabled — PlanGate returns `false` |
| `'1'` | `true` | Feature enabled |
| `'500'` | `500` (int) | Numeric cap |
| `'basic'` | `'basic'` (string) | Feature variant |
| `'advanced'` | `'advanced'` (string) | Feature variant |

### How Feature Flags Work

Boolean features (`woocommerce`, `api_access`, `growth_engine`, `multi_branch`) are stored as `'0'` or `'1'`. `PlanGate::check('woocommerce')` evaluates them as `false`/`true`. Admin can override any of these per-tenant via the Override Panel — e.g., giving a Starter tenant WooCommerce access by setting override `woocommerce = '1'`.

### How Platform Rules Apply

Plans belong to platforms. A platform's plans are only shown in checkout/billing for that platform's context. AppSumo redemptions always result in `ltd_1`/`ltd_2`/`ltd_3` plan slugs. Website subscriptions result in `starter`/`growth`/`business` slugs. The `PlanRepository` looks up limits by plan slug regardless of which platform originally created the plan — the slug is the universal identifier.

---

## 11. Edge Cases & Safety Rules

### Plan Deletion

`PlanController::destroy()` blocks deletion if any tenant has `plan = $plan->slug`. It returns a specific error: `"Cannot delete — N tenant(s) are on this plan. Deactivate it first."` Deactivating a plan sets `is_active = false` — new signups cannot use it but existing tenants are unaffected. This is the safe operation. Deletion is only permitted when 0 tenants are on the plan.

### Changing Limits Mid-Cycle

When you lower a limit below a tenant's current usage, nothing immediately breaks — existing data is not deleted. The effect is:
- The next time they try to add more (e.g., add a 4th staff when limit is now 3), they'll be blocked
- The `PlanUsageBanner` will show red/orange since they're now at or over the new limit
- The tenant's existing records remain intact

This is intentional. Forced deletions or suspensions would be harmful. The tenant is informed via the notification system that their limit has changed, and the enforcement kicks in only on new additions.

### Expired Overrides

`TenantPlanOverride` has an `expires_at` column. `PlanRepository::getEffectiveLimit()` only returns overrides where `expires_at IS NULL OR expires_at > now()`. Expired overrides are not deleted — they stay in the table for audit history but are silently skipped by the query. A future cron job can clean them up if desired.

### Cache Consistency

When any plan or override is changed, the corresponding cache key is immediately invalidated (not TTL-expired). The next request for that tenant or plan reads fresh from the DB. Cache TTL is 3600s (plan limits) and 300s (tenant overrides) as a safety net, but invalidation means changes are always live within one request cycle of the admin action.

### Coupon Abuse

The `coupon_redemptions` table records every use. Before allowing a coupon to be applied, `CouponController::validate()` checks: total `used_count` against `max_uses`, and the per-user count (`coupon_redemptions` where `user_id = current user`) against `max_uses_per_user`. Setting `max_uses_per_user = 1` (the default) prevents a user from applying the same coupon twice.

### AppSumo + Subscription Conflict

`StoreLicense::withoutTenantScope()` prevents tenant-scope from filtering the count query on the public `/redeem` route. The `AppSumoController` already handles this correctly. If a user upgrades an LTD license to a subscription plan via Lemon Squeezy, their `tenant.plan` will change to `starter`/`growth`/`business` and they lose `ltd_*` status. The `plan_limits` JSON override (written during AppSumo redemption) is still in the DB but `PlanRepository` now reads limits for the new subscription plan slug — it does not carry over AppSumo stacking limits. This is correct intended behavior (subscription supersedes LTD).

---

## 12. Scalability & Caching Strategy

**Redis is required.** The current app uses Laravel's cache but the driver must be Redis for production use. The caching strategy is:

- `plan_limits:{slug}` — cached for 3600s, invalidated on plan edit. One entry per plan slug (7 entries total for current plans). This query loads once per plan per hour regardless of how many tenants are on it.
- `tenant_override:{tenant_id}:{key}` — cached for 300s, invalidated on override change. One entry per tenant per override key. For most tenants this will be 0 entries. For power users with overrides, typically 1-3 entries.

At 10,000 tenants with 3 override keys each, the cache holds 30,000 keys of ~50 bytes each = 1.5MB. Negligible.

**The monthly transaction COUNT query** in `V3/SaleController` and `TenantMiddleware` is an indexed COUNT that runs fresh on every sale POST. This is fine at scale — `sales` table has `(tenant_id, status, created_at)` composite index. At 100,000 sales per tenant-month the query is sub-millisecond.

**Do not cache usage counts.** They must be real-time. Caching a transaction count would mean a user could be blocked earlier or later than their actual limit — both are wrong.

---

## 13. Audit & Security

### All plan changes are audited via:

1. `tenant_plan_overrides.original_value` — stores what the value was before any override
2. `tenant_plan_overrides.applied_by` — stores the admin user ID
3. `tenant_plan_overrides.reason` — required text field (enforced in UI, optional in API)
4. `plan_change_notifications.admin_user_id` — which admin triggered the notification

### Admin access control:

All SuperAdmin routes under `/VenQore/` are guarded by the existing `is_platform_admin` check on the `User` model. The new `SuperAdmin/*` controllers inherit this via the route middleware group. No new access control logic is needed.

### Preventing admin mistakes:

- Plan deletion is blocked if any tenant is on the plan (backend enforcement)
- Duplicated plans start as inactive (must explicitly activate)
- Slug validation enforces `^[a-z0-9_]+$` — no spaces, no uppercase, no special chars
- Override form requires a `reason` field in the UI (recorded for audit)
- Price changes do NOT retroactively affect existing subscriptions (prices only affect new checkouts — Lemon Squeezy controls actual billing amounts)

---

## 14. Complete File Map

```
NEW FILES:
app/
├── Http/Controllers/
│   ├── SuperAdmin/
│   │   ├── PlanController.php
│   │   ├── PlatformController.php
│   │   ├── CouponController.php
│   │   └── TenantOverrideController.php
│   └── NotificationController.php
│
├── Models/
│   ├── Plan.php
│   ├── PlanLimit.php
│   ├── PlanFeature.php
│   ├── Platform.php
│   ├── Coupon.php
│   ├── CouponRedemption.php
│   ├── TenantPlanOverride.php
│   └── PlanChangeNotification.php
│
└── Services/
    ├── PlanRepository.php
    └── PlanChangeNotifier.php

database/migrations/
├── create_platforms_table.php
├── create_plans_table.php
├── create_plan_limits_table.php
├── create_plan_features_table.php
├── create_tenant_plan_overrides_table.php
├── create_coupons_table.php
├── create_coupon_plan_restrictions_table.php
├── create_coupon_redemptions_table.php
└── create_plan_change_notifications_table.php

resources/js/
├── Pages/SuperAdmin/
│   ├── Plans/Index.jsx
│   ├── Platforms/Index.jsx
│   ├── Coupons/Index.jsx
│   └── Tenants/
│       ├── Overrides.jsx
│       └── OverrideDetail.jsx
└── Components/
    └── PlanNotificationBell.jsx

MODIFIED FILES:
app/
├── Models/Tenant.php                     ← Update getLimit(), add planOverrides()
├── Services/PlanGate.php                 ← No change needed (calls Tenant::getLimit())
├── Http/Controllers/BillingController.php ← Update index() to use PlanRepository
└── Http/Middleware/TenantMiddleware.php   ← No change needed (calls getLimit())

routes/web.php                             ← Add SuperAdmin monetization routes + notification routes
resources/js/Layouts/OneGlanceLayout.jsx  ← Mount PlanNotificationBell in header
```

---

## Implementation Order Summary

| Phase | What Gets Built | Dependency | Days |
|---|---|---|---|
| 1 | Migrations + seeds + PlanRepository + Tenant::getLimit() update | Nothing | 1-3 |
| 2 | PlanController + PlatformController + Plans/Index.jsx | Phase 1 | 4-5 |
| 3 | TenantOverrideController + Override pages | Phase 1 | 6-7 |
| 4 | PlanChangeNotifier + NotificationController + PlanNotificationBell | Phase 3 | 8 |
| 5 | CouponController + Coupon pages + validate endpoint | Phase 1 | 9-11 |
| 6 | BillingController update + config/plans.php cleanup | Phase 1 | 12 |

**Phase 1 is the only blocking dependency.** Phases 2-5 can be built in any order after Phase 1 is done and verified. Phase 6 is last because it changes user-facing billing — only run it after all other phases are tested.

---

*VenQore Internal — Plan Management System Blueprint — April 2026*
*Build against this document. Verify each phase against the checklist before proceeding to the next.*
