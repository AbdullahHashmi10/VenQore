<?php

namespace Tests\Feature\Security;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Round-2 pre-launch sweep (2026-09-10): route permissions, role maps,
 * destructive-action ownership, injection/SSRF guards, session revocation,
 * terminal pairing and WooSync public endpoints.
 */
class RouteGapSweepTest extends VenQoreTestCase
{
    private function member($tenant, string $role): User
    {
        $u = $this->createTenantUser($tenant, $role);
        $this->actingAsTenantUserModel($u, $tenant);
        return $u;
    }

    // ── Role matrix on newly protected routes ──────────────────────────────

    public function test_cashier_can_reach_checkout_but_not_back_office_writes(): void
    {
        $store = $this->createTenant('sweep-cashier', 'ltd_3', 'active');
        $this->member($store, 'cashier');

        // Checkout: validation errors are fine, authorization must pass.
        $this->assertNotSame(403, $this->postJson($this->storeUrl($store, 'sales'), [])->status(), 'Cashier must be able to ring a sale.');
        $this->assertNotSame(403, $this->postJson($this->storeUrl($store, 'v3/sales'), [])->status());

        foreach ([
            ['post', 'bank-accounts'],
            ['post', 'funds/remove'],
            ['post', 'funds/add'],
            ['post', 'v3/stock-adjustments'],
            ['post', 'v3/products'],
            ['post', 'v3/warehouses'],
            ['post', 'woo/connections'],
            ['post', 'settings/charges'],
            ['post', 'v3/fiscal-year/close'],
            ['post', 'api/system/reset'],
            ['post', 'v3/payroll/pay'],
            ['post', 'v3/supplier-payments'],
            ['post', 'pos/return'],
        ] as [$verb, $path]) {
            $this->{$verb . 'Json'}($this->storeUrl($store, $path), [])->assertForbidden();
        }
    }

    public function test_manager_can_stock_but_not_move_money(): void
    {
        $store = $this->createTenant('sweep-manager', 'ltd_3', 'active');
        $this->member($store, 'manager');

        $this->assertNotSame(403, $this->postJson($this->storeUrl($store, 'v3/stock-adjustments'), [])->status());
        $this->postJson($this->storeUrl($store, 'funds/remove'), [])->assertForbidden();
        $this->postJson($this->storeUrl($store, 'v3/supplier-payments'), [])->assertForbidden();
    }

    public function test_invite_roles_have_least_privilege_maps(): void
    {
        foreach (['franchise_admin', 'shift_supervisor', 'inventory_controller', 'hr_officer', 'production_supervisor', 'kitchen_manager', 'dispenser', 'sales_executive', 'fulfillment_lead', 'delivery_driver'] as $role) {
            $this->assertIsArray(config("permissions.{$role}"), "{$role} has no permission map");
        }
        $this->assertNotContains('finance.send_payment', config('permissions.dispenser'));
        $this->assertContains('pos.checkout', config('permissions.kitchen_manager'));
    }

    // ── Destructive actions ────────────────────────────────────────────────

    public function test_factory_reset_is_owner_only(): void
    {
        $store = $this->createTenant('sweep-reset', 'ltd_3', 'active');
        $admin = $this->member($store, 'admin');
        $this->postJson($this->storeUrl($store, 'api/system/reset'), ['password' => 'password'])->assertForbidden();
        $this->postJson($this->storeUrl($store, 'api/system/reset/products'), ['password' => 'password'])->assertForbidden();
    }

    public function test_platform_pin_is_not_a_store_override(): void
    {
        $store = $this->createTenant('sweep-pin', 'ltd_3', 'active');
        $this->member($store, 'cashier');
        User::factory()->create(['is_platform_admin' => true, 'platform_pin' => Hash::make('654321')]);

        $this->postJson($this->storeUrl($store, 'profile/verify-elevated-pin'), ['pin' => '654321'])
            ->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_member_cannot_edit_another_members_dashboard(): void
    {
        $store = $this->createTenant('sweep-dash', 'ltd_3', 'active');
        $other = $this->createTenantUser($store, 'cashier');
        $dash = \App\Models\Dashboard::withoutGlobalScopes()->create([
            'tenant_id' => $store->id, 'user_id' => $other->id, 'name' => 'Mine', 'slug' => 'mine-' . Str::random(4), 'position' => 0,
        ]);
        $this->member($store, 'cashier');

        $this->putJson("/api/dashboards/{$dash->id}/layout", ['cards' => []])->assertForbidden();
    }

    // ── Injection / SSRF ───────────────────────────────────────────────────

    public function test_sort_direction_cannot_inject_sql(): void
    {
        $store = $this->createTenant('sweep-sql', 'ltd_3', 'active');
        $this->member($store, 'owner');

        $this->get($this->storeUrl($store, 'parties?sort_by=balance&sort_dir=' . urlencode('asc, (SELECT SLEEP(3))')))
            ->assertStatus(200);
        $this->get($this->storeUrl($store, 'inventory?sort_by=' . urlencode('name`; DROP TABLE products;--') . '&sort_dir=sideways'))
            ->assertStatus(200);
    }

    public function test_woocommerce_site_url_must_be_public(): void
    {
        $this->assertFalse(\App\Support\OutboundUrlGuard::isPublicHttpUrl('http://127.0.0.1/wp-json'));
        $this->assertFalse(\App\Support\OutboundUrlGuard::isPublicHttpUrl('http://169.254.169.254/latest/meta-data'));
        $this->assertFalse(\App\Support\OutboundUrlGuard::isPublicHttpUrl('http://10.0.0.5'));
        $this->assertFalse(\App\Support\OutboundUrlGuard::isPublicHttpUrl('http://localhost:8000'));
        $this->assertFalse(\App\Support\OutboundUrlGuard::isPublicHttpUrl('file:///etc/passwd'));
        $this->assertTrue(\App\Support\OutboundUrlGuard::isPublicHttpUrl('https://shop.example.com'));
    }

    // ── Sessions ───────────────────────────────────────────────────────────

    public function test_password_change_rotates_remember_token(): void
    {
        $user = User::factory()->create(['remember_token' => 'old-remember-token']);
        $this->actingAs($user)->put('/password', [
            'current_password' => 'password',
            'password' => 'N3w-Str0ng-Passw0rd!',
            'password_confirmation' => 'N3w-Str0ng-Passw0rd!',
        ])->assertSessionHasNoErrors();

        $this->assertNotSame('old-remember-token', $user->fresh()->getRememberToken());
    }

    // ── Legacy unauthenticated route ───────────────────────────────────────

    public function test_legacy_stock_transfer_route_no_longer_runs_a_controller(): void
    {
        $this->post('/stock-transfers', [])->assertStatus(410);
    }

    // ── Terminal pairing ───────────────────────────────────────────────────

    public function test_pairing_codes_are_short_and_terminals_can_be_disconnected(): void
    {
        config(['venqore.terminal_telemetry_enabled' => true]);
        $store = $this->createTenant('sweep-term', 'ltd_3', 'active');
        $this->member($store, 'owner');

        $code = $this->postJson($this->storeUrl($store, 'terminal-pairing-tokens'), ['label' => 'Till 1'])
            ->assertCreated()->json('token');
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{4}-[A-Z2-9]{4}$/', $code);

        // Typed in lower case with a space — still accepted.
        $pair = $this->postJson('/api/heartbeat', [
            'device_id' => 'dev-sweep-1', 'store_slug' => $store->slug, 'pairing_token' => strtolower(str_replace('-', ' -', $code)),
        ])->assertOk();
        $terminalId = $pair->json('terminal_id');
        $secret = $pair->json('device_secret');
        $this->assertNotEmpty($secret);

        $this->getJson($this->storeUrl($store, 'terminals'))->assertOk()->assertJsonCount(1, 'terminals');
        $this->postJson($this->storeUrl($store, "terminals/{$terminalId}/revoke"))->assertOk();

        // The old secret no longer works; the device must pair again.
        $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id' => 'dev-sweep-1', 'store_slug' => $store->slug,
        ])->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');
    }

    // ── WooSync public endpoints (no tenant bound) ─────────────────────────

    public function test_woosync_handshake_and_verify_work_without_a_session(): void
    {
        $store = $this->createTenant('sweep-woo', 'ltd_3', 'active');
        DB::table('tenant_plan_overrides')->insert([
            'tenant_id' => $store->id, 'override_key' => 'woocommerce', 'override_value' => '1',
            'applied_by' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        app()->instance('current.tenant', $store);
        $conn = \App\Models\WooConnection::create([
            'tenant_id' => $store->id, 'name' => 'Shop', 'uuid' => (string) Str::uuid(),
            'status' => 'pending', 'setup_token' => 'setup-' . Str::random(20),
        ]);
        app()->forgetInstance('current.tenant');

        $hs = $this->postJson('/api/woo/handshake', [
            'setup_token' => $conn->setup_token, 'site_url' => 'https://shop.example.com',
            'consumer_key' => 'ck_x', 'consumer_secret' => 'cs_x',
        ]);
        $this->assertContains($hs->status(), [200, 201], 'Handshake must find the pending connection without a tenant session.');

        $fresh = \App\Models\WooConnection::withoutGlobalScopes()->find($conn->id);
        $this->assertNotEmpty($fresh->api_token);
        $this->getJson('/api/woo/verify/' . $fresh->api_token)->assertOk()->assertJsonPath('valid', true);
        $this->getJson('/api/woo/verify/not-a-real-token')->assertStatus(401);

        $this->postJson('/api/woo/handshake', [
            'setup_token' => $conn->setup_token, 'site_url' => 'http://127.0.0.1',
            'consumer_key' => 'ck_x', 'consumer_secret' => 'cs_x',
        ])->assertStatus(422);
    }

    // ── In-browser POS heartbeat ───────────────────────────────────────────

    public function test_signed_in_browser_heartbeat_is_answered_without_pairing(): void
    {
        $store = $this->createTenant('sweep-hb', 'ltd_3', 'active');
        $cashier = $this->member($store, 'cashier');
        $before = \App\Models\Terminal::withoutGlobalScopes()->count();

        $this->postJson($this->storeUrl($store, 'api/heartbeat'), ['device_id' => 'br_abc123'])
            ->assertOk()
            ->assertJsonPath('status', 'alive')
            ->assertJsonPath('is_view_only', false);

        $this->assertSame($before, \App\Models\Terminal::withoutGlobalScopes()->count(),
            'A browser session must not create or claim a terminal row.');

        // The unauthenticated desktop endpoint still requires pairing.
        auth()->logout();
        app()->forgetInstance('current.tenant');
        $this->postJson('/api/heartbeat', ['device_id' => 'dev-unpaired', 'store_slug' => $store->slug])
            ->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');
    }

    // ── Access ends the moment a membership ends ───────────────────────────

    public function test_removed_or_suspended_member_loses_store_access_on_the_next_request(): void
    {
        foreach (['remove', 'suspend'] as $how) {
            $store = $this->createTenant('sweep-leave-' . $how, 'ltd_3', 'active');
            $owner = $this->createTenantUser($store, 'owner');
            $cashier = $this->createTenantUser($store, 'cashier');
            $cashier->forceFill(['last_store_id' => $store->id])->save();

            // Signed in and working.
            $this->actingAsTenantUserModel($cashier, $store);
            $this->get($this->storeUrl($store, 'pos'))->assertOk();

            // The owner ends the membership.
            $member = \App\Models\TenantUser::withoutGlobalScopes()->where('tenant_id', $store->id)->where('user_id', $cashier->id)->first();
            $this->actingAsTenantUserModel($owner, $store);
            if ($how === 'remove') {
                $this->delete($this->storeUrl($store, 'admin/users/' . $member->id));
                $this->assertNull(\App\Models\TenantUser::withoutGlobalScopes()->find($member->id));
            } else {
                $this->patch($this->storeUrl($store, 'admin/users/' . $member->id), ['status' => 'suspended']);
                $this->assertSame('suspended', $member->fresh()->status);
            }

            // Same browser session, next request: no store pages, no sales.
            app()->forgetInstance('current.tenant');
            $this->actingAs($cashier->fresh());
            $page = $this->get($this->storeUrl($store, 'pos'));
            $this->assertContains($page->status(), [302, 403, 404], "{$how}: store page must be refused");
            $this->assertNotSame(200, $this->postJson($this->storeUrl($store, 'sales'), [])->status());

            // Device/API access (sanctum, store.member): refused too.
            app()->forgetInstance('current.tenant');
            $this->actingAs($cashier->fresh(), 'sanctum');
            $this->getJson('/api/sync/products')->assertStatus(403);
        }
    }

    // ── Settings isolation / store clock ───────────────────────────────────

    public function test_store_settings_never_leak_into_requests_outside_that_store(): void
    {
        $store = $this->createTenant('sweep-tz', 'ltd_3', 'active');
        $owner = $this->createTenantUser($store, 'owner');
        \App\Models\Setting::withoutGlobalScopes()->create(['tenant_id' => $store->id, 'key' => 'timezone', 'value' => 'Asia/Karachi']);
        $owner->forceFill(['last_store_id' => $store->id])->save();

        // Outside a store, a signed-in member used to fill the shared
        // 'settings:global' cache with their own store's settings.
        \Illuminate\Support\Facades\Cache::flush();
        app()->forgetInstance('current.tenant');
        $this->actingAs($owner);
        $this->assertArrayNotHasKey('timezone', \App\Helpers\SettingsHelper::all());

        // Inside the store, the store's own clock is used.
        try {
            $this->actingAsTenantUserModel($owner, $store);
            $this->get($this->storeUrl($store, 'dashboard'))->assertOk();
            $this->assertSame('Asia/Karachi', date_default_timezone_get());
        } finally {
            date_default_timezone_set('UTC');
            config(['app.timezone' => 'UTC']);
        }
    }

    // ── Public site ────────────────────────────────────────────────────────

    public function test_sitemap_renders(): void
    {
        $this->get('/sitemap.xml')->assertOk();
    }
}
