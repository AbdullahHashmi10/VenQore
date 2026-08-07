<?php

namespace Tests\Feature\Monetization;

use App\Jobs\ProvisionTenantJob;
use App\Jobs\ResetAiUsageJob;
use App\Models\Setting;
use App\Services\PlanRepository;
use App\Services\SmartCapture\AiEntitlementService;
use App\Services\VenSynQ\PlatformRegistry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

uses(VenQoreTestCase::class);

/**
 * Monetization gates for SmartCapture (AI Scan) and VenSynQ.
 *
 * These cover the failure modes that would silently take money without
 * delivering the product — the expensive kind of bug:
 *
 *  - a paying Amazon customer who still gets 403 (missing entitlement grant)
 *  - a cancelled customer who keeps access (missing entitlement revoke)
 *  - a disabled marketplace that is still connectable
 *  - a free-tier user who scans past their allowance
 *  - provisioning that dies in the queue on a NOT NULL column
 */

/** Flush every cache these gates read, so tests can't leak into each other. */
function flushEntitlementCaches(?string $tenantId = null): void
{
    Cache::forget('vensynq_enabled_flag');
    Cache::forget('smartcapture_enabled_flag');
    Cache::forget('vensynq_platform_flags');
    Cache::forget('settings:global');

    if ($tenantId) {
        PlanRepository::invalidateTenantCache($tenantId);
    }
}

function setGlobalSetting(string $key, string $value): void
{
    Setting::withoutGlobalScopes()->updateOrCreate(
        ['key' => $key, 'tenant_id' => null],
        ['value' => $value]
    );
    flushEntitlementCaches();
}

// ─────────────────────────────────────────────────────────────────────────────
// Provisioning: buying an add-on must actually grant the entitlement
// ─────────────────────────────────────────────────────────────────────────────

test('amazon sync purchase grants the vensync_command entitlement', function () {
    $tenant = $this->createTenant('amazon-buyer');

    config(['services.lemon_squeezy.amazon_addon_id' => '999001']);

    (new ProvisionTenantJob([
        'email'      => 'buyer@example.com',
        'name'       => 'Buyer',
        'variant_id' => '999001',
        // tenant_id travels in custom_data on the Lemon Squeezy payload, not top level.
        'custom_data' => ['tenant_id' => $tenant->id],
    ]))->handle();

    $tenant->refresh();

    expect($tenant->sync_channels)->toContain('amazon');

    $override = DB::table('tenant_plan_overrides')
        ->where('tenant_id', $tenant->id)
        ->where('override_key', 'vensync_command')
        ->first();

    // Without this row the tenant pays and still 403s on every /vensynq route.
    expect($override)->not->toBeNull()
        ->and($override->override_value)->toBe('1');
});

test('add-on provisioning survives the NOT NULL applied_by column', function () {
    // Regression: tenant_plan_overrides.applied_by was NOT NULL with no default
    // and a queued job has no acting user, so the insert threw and provisioning
    // died silently in the queue. Migration 2026_08_03_120000 made it nullable.
    $tenant = $this->createTenant('applied-by-regression');

    config(['services.lemon_squeezy.ai_lite_addon_id' => '999002']);

    (new ProvisionTenantJob([
        'email'      => 'ai@example.com',
        'name'       => 'AI Buyer',
        'variant_id' => '999002',
        'custom_data' => ['tenant_id' => $tenant->id],
    ]))->handle();

    $tenant->refresh();

    expect($tenant->ai_status)->toBe('managed')
        ->and($tenant->ai_pages_limit)->toBe(150)      // AI Lite — matches Pricing.jsx
        ->and($tenant->ai_queries_limit)->toBe(200);

    expect(DB::table('tenant_plan_overrides')
        ->where('tenant_id', $tenant->id)
        ->where('override_key', 'smart_capture')
        ->exists())->toBeTrue();
});

// ─────────────────────────────────────────────────────────────────────────────
// VenSynQ access gate
// ─────────────────────────────────────────────────────────────────────────────

test('vensynq returns 404 when the platform switch is off', function () {
    $tenant = $this->createTenant('vensynq-off');
    setGlobalSetting('vensynq_enabled', '0');

    $this->actingAsOwner($tenant)
        ->get($this->storeUrl($tenant, '/vensynq'))
        ->assertNotFound();
});

test('vensynq returns 403 when enabled but the tenant has no entitlement', function () {
    $tenant = $this->createTenant('vensynq-unentitled');
    setGlobalSetting('vensynq_enabled', '1');
    flushEntitlementCaches($tenant->id);

    // vensync_command is seeded '0' on every plan — add-on only, never bundled.
    $this->actingAsOwner($tenant)
        ->get($this->storeUrl($tenant, '/vensynq'))
        ->assertForbidden();
});

test('vensynq is reachable once the override is granted', function () {
    $tenant = $this->createTenant('vensynq-entitled');
    setGlobalSetting('vensynq_enabled', '1');

    DB::table('tenant_plan_overrides')->insert([
        'tenant_id'      => $tenant->id,
        'override_key'   => 'vensync_command',
        'override_value' => '1',
        'reason'         => 'test',
        'applied_by'     => null,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    flushEntitlementCaches($tenant->id);

    $response = $this->actingAsOwner($tenant)
        ->get($this->storeUrl($tenant, '/vensynq'));

    expect($response->status())->not->toBe(403)
        ->and($response->status())->not->toBe(404);
});

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace allowlist — the dashboard switches must actually bite
// ─────────────────────────────────────────────────────────────────────────────

test('platform registry honours the config allowlist', function () {
    config(['vensynq.enabled_platforms' => ['amazon']]);
    flushEntitlementCaches();

    $registry = app(PlatformRegistry::class);

    expect($registry->isEnabled('amazon'))->toBeTrue()
        ->and($registry->isEnabled('ebay'))->toBeFalse()
        ->and($registry->isEnabled('tiktok'))->toBeFalse();

    // supported() must stay complete so the sync/token jobs can still resolve
    // an adapter for a channel on a platform that was switched off.
    expect($registry->supported())->toContain('ebay');
});

test('a dashboard marketplace switch overrides the config allowlist', function () {
    config(['vensynq.enabled_platforms' => ['amazon']]);

    // Turn eBay ON and Amazon OFF purely from the dashboard settings.
    setGlobalSetting('vensynq_platform_ebay', '1');
    setGlobalSetting('vensynq_platform_amazon', '0');

    $registry = app(PlatformRegistry::class);

    expect($registry->isEnabled('ebay'))->toBeTrue()
        ->and($registry->isEnabled('amazon'))->toBeFalse();
});

test('connecting a disabled marketplace is refused', function () {
    $tenant = $this->createTenant('ebay-blocked');
    setGlobalSetting('vensynq_enabled', '1');
    setGlobalSetting('vensynq_platform_ebay', '0');
    config(['vensynq.enabled_platforms' => ['amazon']]);

    DB::table('tenant_plan_overrides')->insert([
        'tenant_id'      => $tenant->id,
        'override_key'   => 'vensync_command',
        'override_value' => '1',
        'reason'         => 'test',
        'applied_by'     => null,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    flushEntitlementCaches($tenant->id);

    $this->actingAsOwner($tenant)
        ->from($this->storeUrl($tenant, '/vensynq/settings'))
        ->get($this->storeUrl($tenant, '/vensynq/connect/ebay'))
        ->assertRedirect($this->storeUrl($tenant, '/vensynq/settings'));

    expect(DB::table('ecommerce_channels')
        ->where('tenant_id', $tenant->id)
        ->where('platform', 'ebay')
        ->exists())->toBeFalse();
});

// ─────────────────────────────────────────────────────────────────────────────
// SmartCapture entitlement
// ─────────────────────────────────────────────────────────────────────────────

test('free tier allowance comes from config, not a hardcoded number', function () {
    config(['smartcapture.free_scan_allowance' => 3]);

    expect(AiEntitlementService::freeScanAllowance())->toBe(3);

    $tenant = $this->createTenant('free-scanner');
    $tenant->update(['ai_status' => 'none', 'ai_pages_used' => 2]);
    $this->bindTenantContext($tenant);

    $check = app(AiEntitlementService::class)->checkScan();
    expect($check['allowed'])->toBeTrue()
        ->and($check['pages_limit'])->toBe(3);

    $tenant->update(['ai_pages_used' => 3]);
    $this->bindTenantContext($tenant->fresh());

    $check = app(AiEntitlementService::class)->checkScan();
    expect($check['allowed'])->toBeFalse()
        ->and($check['reason'])->toBe('free_limit_reached');
});

test('managed tier stops at its monthly quota', function () {
    $tenant = $this->createTenant('managed-scanner');
    $tenant->update([
        'ai_status'       => 'managed',
        'ai_pages_limit'  => 150,
        'ai_pages_used'   => 150,
    ]);
    $this->bindTenantContext($tenant);

    $check = app(AiEntitlementService::class)->checkScan();

    expect($check['allowed'])->toBeFalse()
        ->and($check['reason'])->toBe('limit_reached');
});

test('smart capture routes 404 when the platform switch is off', function () {
    $tenant = $this->createTenant('sc-off');
    setGlobalSetting('smartcapture_enabled', '0');

    $this->actingAsOwner($tenant)
        ->get($this->storeUrl($tenant, '/smart-capture/context'))
        ->assertNotFound();
});

// ─────────────────────────────────────────────────────────────────────────────
// Monthly reset
// ─────────────────────────────────────────────────────────────────────────────

test('monthly reset clears managed usage but never the free lifetime allowance', function () {
    $managed = $this->createTenant('reset-managed');
    $managed->update(['ai_status' => 'managed', 'ai_period_started_at' => now(), 'ai_pages_used' => 120, 'ai_queries_used' => 90]);

    $free = $this->createTenant('reset-free');
    $free->update(['ai_status' => 'none', 'ai_pages_used' => 10]);

    (new ResetAiUsageJob())->handle();

    expect($managed->fresh()->ai_pages_used)->toBe(0)
        ->and($managed->fresh()->ai_queries_used)->toBe(0);

    // The free allowance is LIFETIME. Resetting it would hand out infinite
    // free scans to anyone willing to wait for the 1st of the month.
    expect($free->fresh()->ai_pages_used)->toBe(10);
});
