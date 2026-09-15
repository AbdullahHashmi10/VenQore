<?php

namespace Tests\Feature\Module19;

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\EcommerceChannel;
use App\Services\VenSynQ\IntegrationHealthService;
use App\Services\VenSynQ\PlatformRegistry;
use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\Platforms\EbayClient;
use App\Services\VenSynQ\Platforms\PlatformClient;
use App\Services\VenSynQ\Platforms\TikTokClient;
use App\Services\VenSynQ\Platforms\WooCommerceClient;

/**
 * Module 19 — T16 regression suite.
 *
 * Every test below pins a SPECIFIC defect found during the T16 audit. They are
 * written to fail loudly against the pre-T16 code, so they stay meaningful
 * rather than merely asserting that the new code calls itself.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 1 — universalCallback() called callbackChannel() with 3 arguments
//            against a 2-argument signature. ArgumentCountError on every single
//            marketplace OAuth callback, so no channel could ever connect via
//            the fixed developer-portal redirect URLs.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_universal_callback_matches_callback_channel_signature', function () {
    $callback = new \ReflectionMethod(\App\Http\Controllers\VenSynQController::class, 'callbackChannel');

    // Two parameters: (string $platform, Request $request).
    expect($callback->getNumberOfParameters())->toBe(2);
    expect($callback->getParameters()[0]->getName())->toBe('platform');
    expect($callback->getParameters()[1]->getName())->toBe('request');
});

test('t16_universal_callback_delegates_to_callback_channel_end_to_end', function () {
    // FIXED 2026-08-02 — REPLACES a source-text file_get_contents()/toContain()
    // check on the literal line "return $this->callbackChannel($platform,
    // $request);". That check passes as long as the exact string exists ANYWHERE
    // in the file (e.g. in a comment, a docblock, or dead code) and is blind to
    // whether the call actually executes correctly at runtime — it does not run
    // the code at all. The pre-T16 defect (ArgumentCountError from passing 3 args
    // against a 2-param signature) is only actually proven fixed by making the
    // real HTTP request and observing the real side effect: a channel record
    // gets created for the resolved tenant. If the delegation still passed the
    // store slug into the platform parameter (the original bug), $platform would
    // be the tenant's slug string, $this->registry->supports($platform) would be
    // false for it, and callbackChannel() would redirect to the "Unsupported
    // marketplace" error path instead of creating a channel — so this test fails
    // loudly against the pre-T16 code exactly as the original intent required,
    // without relying on grepping source text.
    $tenant = $this->createTenant('t16-callback-store');

    session(['vensynq_oauth_store_slug' => $tenant->slug]);

    $response = $this->get('/amazon/callback?code=mock_code_placeholder&selling_partner_id=A1T16TEST');

    $response->assertRedirect(route('store.vensynq.settings', ['store_slug' => $tenant->slug]));
    $response->assertSessionHas('success');
    $response->assertSessionMissing('error');

    $this->assertDatabaseHas('ecommerce_channels', [
        'tenant_id'          => $tenant->id,
        'platform'           => 'amazon',
        'external_seller_id' => 'A1T16TEST',
        'is_connected'       => true,
    ]);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 2 — bare match() with no default arm threw \UnhandledMatchError, an
//            Error that `catch (\Exception)` cannot catch, killing the entire
//            sync run for every tenant.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_platform_registry_resolves_every_supported_platform', function () {
    $registry = new PlatformRegistry();

    expect($registry->supported())->toContain('amazon', 'woocommerce', 'ebay', 'tiktok');

    expect($registry->resolve('amazon'))->toBeInstanceOf(AmazonClient::class);
    expect($registry->resolve('woocommerce'))->toBeInstanceOf(WooCommerceClient::class);
    expect($registry->resolve('ebay'))->toBeInstanceOf(EbayClient::class);
    expect($registry->resolve('tiktok'))->toBeInstanceOf(TikTokClient::class);

    // Case/whitespace tolerant — marketplace payloads are not always tidy.
    expect($registry->resolve('  AMAZON '))->toBeInstanceOf(AmazonClient::class);
});

test('t16_unknown_platform_throws_a_catchable_exception_not_an_error', function () {
    $registry = new PlatformRegistry();

    // The whole point: catch(\Exception) must be able to trap this. Under the
    // old match() this threw \UnhandledMatchError, which extends \Error.
    $caught = null;

    try {
        $registry->resolve('shopify');
    } catch (\Exception $e) {
        $caught = $e;
    }

    expect($caught)->toBeInstanceOf(\InvalidArgumentException::class);
    expect($caught->getMessage())->toContain('shopify');

    // tryResolve() is the loop-safe variant — no throw at all.
    expect($registry->tryResolve('shopify'))->toBeNull();
    expect($registry->supports('shopify'))->toBeFalse();
});

test('t16_every_platform_client_implements_the_shared_contract', function () {
    $registry = new PlatformRegistry();

    foreach ($registry->supported() as $platform) {
        $client = $registry->resolve($platform);

        expect($client)->toBeInstanceOf(PlatformClient::class);
        expect($client->platformKey())->toBe($platform);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 3 — both background jobs queried EcommerceChannel (HasTenant) with no
//            tenant bound. The global scope degrades to whereRaw('1 = 0'), so
//            every scheduled run found zero channels and silently did nothing.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_channel_lookup_without_tenant_scope_finds_rows_in_queue_context', function () {
    $tenant = $this->createTenant('woo-sync-store');
    $this->bindTenantContext($tenant);

    EcommerceChannel::create([
        'tenant_id'                => $tenant->id,
        'name'                     => 'Amazon UK',
        'platform'                 => 'amazon',
        'external_seller_id'       => 'A1TESTSELLER',
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 15.00,
        'is_connected'             => true,
        'sync_status'              => 'idle',
    ]);

    // Simulate a queue worker: no tenant bound, no authenticated user.
    app()->forgetInstance('current.tenant');
    app()->forgetInstance('current.membership');
    auth()->logout();

    // This is the pre-T16 query. It must return 0 — proving the bug was real.
    expect(EcommerceChannel::where('is_connected', true)->count())->toBe(0);

    // This is the T16 query the jobs now use. It must find the channel.
    expect(
        EcommerceChannel::withoutTenantScope()->where('is_connected', true)->count()
    )->toBe(1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 4 — TokenRefreshJob force-disconnected every WooCommerce channel on its
//            first run, because Woo stores no refresh token and its NULL
//            access_token_expires_at matched the "expiring" filter.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_woocommerce_is_excluded_from_token_rotation', function () {
    $registry = new PlatformRegistry();

    expect($registry->rotatesTokens('woocommerce'))->toBeFalse();
    expect($registry->rotatesTokens('amazon'))->toBeTrue();
    expect($registry->rotatesTokens('ebay'))->toBeTrue();
    expect($registry->rotatesTokens('tiktok'))->toBeTrue();

    // The job builds its whereIn() from exactly this filter.
    $rotating = array_values(array_filter(
        $registry->supported(),
        fn (string $p) => $registry->rotatesTokens($p)
    ));

    expect($rotating)->not->toContain('woocommerce');
    expect($rotating)->toContain('amazon');
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 5 — no health signalling existed at all; a broken channel looked
//            identical to a healthy one on the dashboard.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_health_service_flags_a_failing_channel_red', function () {
    $tenant = $this->createTenant('health-store');
    $this->bindTenantContext($tenant);

    $channel = EcommerceChannel::create([
        'tenant_id'                => $tenant->id,
        'name'                     => 'Amazon UK',
        'platform'                 => 'amazon',
        'external_seller_id'       => 'A1HEALTH',
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 15.00,
        'is_connected'             => true,
        'sync_status'              => 'error',
        'sync_error_message'       => 'SP-API returned HTTP 401.',
        'last_synced_at'           => now()->subMinutes(5),
    ]);

    $health = app(IntegrationHealthService::class)->forChannel($channel->fresh());

    expect($health['status'])->toBe(IntegrationHealthService::ERROR);
    expect($health['api']['status'])->toBe(IntegrationHealthService::ERROR);
    expect($health['error_message'])->toContain('401');
});

test('t16_health_service_reports_a_healthy_channel_green', function () {
    $tenant = $this->createTenant('healthy-store');
    $this->bindTenantContext($tenant);

    $channel = EcommerceChannel::create([
        'tenant_id'                => $tenant->id,
        'name'                     => 'Amazon UK',
        'platform'                 => 'amazon',
        'external_seller_id'       => 'A1GREEN',
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 15.00,
        'is_connected'             => true,
        'sync_status'              => 'idle',
        'last_synced_at'           => now()->subMinutes(2),
        'access_token_expires_at'  => now()->addHour(),
        'refresh_token_expires_at' => now()->addYear(),
    ]);

    $health = app(IntegrationHealthService::class)->forChannel($channel->fresh());

    expect($health['status'])->toBe(IntegrationHealthService::OK);
    expect($health['api']['status'])->toBe(IntegrationHealthService::OK);
    expect($health['token']['status'])->toBe(IntegrationHealthService::OK);
});

test('t16_woocommerce_token_signal_is_never_a_false_alarm', function () {
    $tenant = $this->createTenant('woo-health-store');
    $this->bindTenantContext($tenant);

    // Woo channels legitimately carry NO token expiry at all. Pre-T16 logic
    // would have shown a permanent "expired" warning here.
    $channel = EcommerceChannel::create([
        'tenant_id'                => $tenant->id,
        'name'                     => 'My WordPress Shop',
        'platform'                 => 'woocommerce',
        'external_seller_id'       => 'woo-uuid-abc123',
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 0.00,
        'is_connected'             => true,
        'sync_status'              => 'idle',
        'last_synced_at'           => now()->subMinute(),
        'access_token_expires_at'  => null,
        'refresh_token_expires_at' => null,
    ]);

    $health = app(IntegrationHealthService::class)->forChannel($channel->fresh());

    expect($health['token']['status'])->toBe(IntegrationHealthService::OK);
    expect($health['platform_label'])->toBe('WooCommerce');
});

test('t16_overall_health_is_the_worst_channel_not_an_average', function () {
    $tenant = $this->createTenant('mixed-health-store');
    $this->bindTenantContext($tenant);

    EcommerceChannel::create([
        'tenant_id' => $tenant->id, 'name' => 'Good', 'platform' => 'amazon',
        'external_seller_id' => 'A1OK', 'default_fulfillment_type' => 'fbm',
        'fee_percentage' => 15.00, 'is_connected' => true, 'sync_status' => 'idle',
        'last_synced_at' => now(), 'access_token_expires_at' => now()->addHour(),
        'refresh_token_expires_at' => now()->addYear(),
    ]);

    EcommerceChannel::create([
        'tenant_id' => $tenant->id, 'name' => 'Bad', 'platform' => 'ebay',
        'external_seller_id' => 'EBFAIL', 'default_fulfillment_type' => 'fbm',
        'fee_percentage' => 12.00, 'is_connected' => true, 'sync_status' => 'error',
        'sync_error_message' => 'Token revoked.', 'last_synced_at' => now(),
    ]);

    $summary = app(IntegrationHealthService::class)->summarize(
        EcommerceChannel::where('tenant_id', $tenant->id)->get()
    );

    // A merchant must never see "all good" while one channel is broken.
    expect($summary['overall'])->toBe(IntegrationHealthService::ERROR);
    expect($summary['error_count'])->toBe(1);
    expect($summary['connected_count'])->toBe(2);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 6 — WooCommerce was a separate module and could not exist as a channel
//            at all; the platform enum rejected it.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_woocommerce_is_a_valid_ecommerce_channel_platform', function () {
    $tenant = $this->createTenant('woo-enum-store');
    $this->bindTenantContext($tenant);

    $channel = EcommerceChannel::create([
        'tenant_id'                => $tenant->id,
        'name'                     => 'WooCommerce Shop',
        'platform'                 => 'woocommerce',
        'external_seller_id'       => 'woo-uuid-enum',
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 0.00,
        'is_connected'             => true,
    ]);

    // Would have thrown a MySQL truncation error before the enum migration.
    $this->assertDatabaseHas('ecommerce_channels', [
        'id'       => $channel->id,
        'platform' => 'woocommerce',
    ]);
});

test('t16_woocommerce_client_reports_zero_commission', function () {
    $registry = new PlatformRegistry();

    // Woo takes no marketplace cut. Returning null here would make
    // SmartFulfillmentService apply the estimated fee_percentage and invent an
    // expense that does not exist, quietly corrupting margin reporting.
    expect($registry->defaultFeePercentage('woocommerce'))->toBe(0.00);
    expect($registry->defaultFeePercentage('amazon'))->toBe(15.00);
});

test('t16_woocommerce_client_fails_loudly_when_no_connection_is_bound', function () {
    $client = new WooCommerceClient();

    // An unbound uuid must raise a catchable exception that the orchestrator
    // records against the channel — not return [] and look like "no new orders",
    // which is how a broken connection used to masquerade as a healthy one.
    expect(fn () => $client->fetchOrders('no-such-uuid'))
        ->toThrow(\RuntimeException::class);

    // testConnection() is contractually non-throwing — the wizard renders it.
    $result = $client->testConnection('no-such-uuid');

    expect($result['ok'])->toBeFalse();
    expect($result['message'])->toBeString();
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFECT 7 — background jobs had no overlap protection, so a slow marketplace
//            API produced concurrent runs racing on the same channel rows.
// ═══════════════════════════════════════════════════════════════════════════════

test('t16_sync_jobs_are_unique_and_bounded', function () {
    $sync  = new \App\Jobs\VenSynQSyncJob();
    $token = new \App\Jobs\TokenRefreshJob();

    foreach ([$sync, $token] as $job) {
        expect($job)->toBeInstanceOf(\Illuminate\Contracts\Queue\ShouldBeUnique::class);
        expect($job->uniqueId())->toBeString()->not->toBeEmpty();

        // A lock with no ceiling wedges the schedule forever if a worker dies.
        expect($job->uniqueFor)->toBeGreaterThan(0);
        expect($job->timeout)->toBeGreaterThan(0);
        expect($job->tries)->toBeGreaterThan(1);
    }

    // Distinct locks — token rotation must not block order sync.
    expect($sync->uniqueId())->not->toBe($token->uniqueId());
});

test('t16_both_jobs_are_registered_with_the_scheduler', function () {
    // AUDIT FINDING: both job classes existed and looked correct, but neither
    // was ever registered in routes/console.php, so "scheduled sync" was dead
    // code that could not possibly have run in production.
    $console = file_get_contents(base_path('routes/console.php'));

    expect($console)->toContain('VenSynQSyncJob');
    expect($console)->toContain('TokenRefreshJob');
    expect($console)->toContain('withoutOverlapping');
});
