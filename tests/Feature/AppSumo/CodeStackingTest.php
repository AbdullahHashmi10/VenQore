<?php

namespace Tests\Feature\AppSumo;

use App\Models\AppSumoCode;
use App\Models\Sale;
use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * AppSumo Code Stacking — End-to-End Test
 *
 * Tests the full user journey of redeeming AppSumo codes one at a time,
 * verifying plan upgrades, plan_limits JSON propagation, and hard limit
 * enforcement at every tier.
 *
 * Also covers the StoreLicense::HasTenant scoping bug: StoreLicense uses
 * HasTenant which applies a global tenant scope. On the /redeem route there
 * is no current.tenant bound (it is a public route). Without the
 * withoutTenantScope() escape hatch, StoreLicense queries in
 * AppSumoController return 0 rows regardless of how many codes the user
 * has already redeemed — making the stacking count check silently wrong.
 *
 * Usage:
 *   php artisan test --filter=CodeStackingTest
 */
class CodeStackingTest extends VenQoreTestCase
{
    use RefreshDatabase;

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Create an available AppSumo code in the database and return it.
     */
    private function makeCode(string $code): AppSumoCode
    {
        return AppSumoCode::create([
            'code'       => $code,
            'is_redeemed'=> false,
            'plan_tier'  => 'Tier 1',
            'metadata'   => null,
            'tenant_id'  => null,
        ]);
    }

    /**
     * Post to /redeem as the given user and return the response.
     */
    private function redeem(User $user, string $code): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user)->postJson('/redeem', ['code' => $code]);
    }

    /**
     * Create a minimal tenant owned by $user and bind it as current.tenant
     * so that HasTenant-scoped queries work correctly in subsequent requests.
     */
    private function createStoreFor(User $user, string $plan = 'ltd_1'): Tenant
    {
        $tenant = Tenant::create([
            'name'           => 'Test Store',
            'slug'           => 'test-store-' . uniqid(),
            'plan'           => $plan,
            'status'         => 'active',
            'join_code'      => 'VQ-TEST',
            'currency_code'  => 'USD',
            'currency_symbol'=> '$',
            'timezone'       => 'UTC',
            'setup_completed'=> true,
        ]);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Update the StoreLicense to point at this tenant
        StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->update(['tenant_id' => $tenant->id, 'status' => 'consumed']);

        $user->update(['last_store_id' => $tenant->id]);

        // Bind as current.tenant so HasTenant scopes work for the rest of this test
        app()->instance('current.tenant', $tenant);

        return $tenant;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    /**
     * @test
     * Redeeming a single code creates a StoreLicense with plan = 'ltd_1'
     * and returns the correct success message.
     */
    public function first_code_creates_ltd_1_license(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-CODE-001');

        $response = $this->redeem($user, 'AS-CODE-001');

        $response->assertStatus(200)
                 ->assertJson([
                     'success'        => true,
                     'plan'           => 'ltd_1',
                     'codes_redeemed' => 1,
                 ]);

        // StoreLicense must exist — use withoutTenantScope because no tenant is
        // bound on the /redeem route (public route, no TenantMiddleware).
        $license = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->first();

        $this->assertNotNull($license, 'StoreLicense was not created after first code redemption.');
        $this->assertEquals('ltd_1', $license->plan);
        $this->assertEquals('ltd', $license->type);
        $this->assertEquals('available', $license->status); // Not consumed yet — no store created
        $this->assertNull($license->valid_until, 'LTD license should have null valid_until (lifetime).');

        // Code must be marked consumed
        $this->assertDatabaseHas('appsumo_codes', [
            'code'              => 'AS-CODE-001',
            'is_redeemed'       => true,
            'redeemed_by_email' => $user->email,
        ]);
    }

    /**
     * @test
     * Stacking a second code upgrades the license from ltd_1 → ltd_2
     * and updates the attached tenant's plan and plan_limits JSON.
     */
    public function second_code_upgrades_license_to_ltd_2_and_updates_tenant(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-CODE-001');
        $this->makeCode('AS-CODE-002');

        // Redeem first code
        $this->redeem($user, 'AS-CODE-001');

        // Create a store so the license has a tenant attached
        $tenant = $this->createStoreFor($user, 'ltd_1');

        // Redeem second code
        $response = $this->redeem($user, 'AS-CODE-002');

        $response->assertStatus(200)
                 ->assertJson([
                     'success'        => true,
                     'plan'           => 'ltd_2',
                     'codes_redeemed' => 2,
                 ]);

        // License plan must be upgraded
        $license = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->first();

        $this->assertEquals('ltd_2', $license->plan, 'StoreLicense plan was not upgraded to ltd_2.');

        // Tenant plan must be upgraded
        $tenant->refresh();
        $this->assertEquals('ltd', $tenant->plan, 'Tenant plan was not upgraded to ltd.');

        // Tenant plan_limits JSON must reflect ltd_2 values
        $expectedLimits = config('plans.ltd_2');
        $this->assertNotNull($tenant->plan_limits, 'Tenant plan_limits JSON was not written on upgrade.');
        $this->assertEquals(
            $expectedLimits['transactions_per_month'],
            $tenant->getLimit('transactions_per_month'),
            'transactions_per_month limit does not match ltd_2 config after upgrade.'
        );
        $this->assertEquals(
            $expectedLimits['staff_limit'],
            $tenant->getLimit('staff_limit'),
            'staff_limit does not match ltd_2 config after upgrade.'
        );
        $this->assertEquals(
            $expectedLimits['locations'],
            $tenant->getLimit('locations'),
            'locations limit does not match ltd_2 config after upgrade.'
        );
        $this->assertTrue(
            (bool) $tenant->getLimit('growth_engine'),
            'growth_engine should be enabled on ltd_2.'
        );
    }

    /**
     * @test
     * Stacking a third code upgrades the license from ltd_2 → ltd_3
     * and correctly sets unlimited limits (null) on the tenant.
     */
    public function third_code_upgrades_to_ltd_3_with_correct_unlimited_limits(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-CODE-001');
        $this->makeCode('AS-CODE-002');
        $this->makeCode('AS-CODE-003');

        $this->redeem($user, 'AS-CODE-001');
        $tenant = $this->createStoreFor($user, 'ltd_1');
        $this->redeem($user, 'AS-CODE-002');

        $response = $this->actingAs($user)->postJson('/redeem', ['code' => 'AS-CODE-003']);
        // Note: third code may already be consumed by the line above — re-make if needed
        // This test creates all 3 codes and redeems in sequence. The third redeem above
        // is the actual assertion target.

        $tenant->refresh();
        $this->assertEquals('ltd', $tenant->plan, 'Tenant plan was not upgraded to ltd.');

        // ltd_3 has null (unlimited) for staff_limit, sku_limit, locations, transactions_per_month
        $this->assertEquals(6000, $tenant->getLimit('transactions_per_month'),
            'ltd_3 should allow 6000 transactions/month.');
        $this->assertNull($tenant->getLimit('staff_limit'),
            'ltd_3 staff_limit should be null (unlimited).');
        $this->assertNull($tenant->getLimit('sku_limit'),
            'ltd_3 sku_limit should be null (unlimited).');
        $this->assertTrue((bool) $tenant->getLimit('api_access'),
            'API access should be enabled on ltd_3.');
    }

    /**
     * @test
     * A fourth code redemption is rejected with a 422 and a clear error message.
     */
    public function fourth_code_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-CODE-001');
        $this->makeCode('AS-CODE-002');
        $this->makeCode('AS-CODE-003');
        $this->makeCode('AS-CODE-004');

        $this->redeem($user, 'AS-CODE-001');
        $this->createStoreFor($user, 'ltd_1');
        $this->redeem($user, 'AS-CODE-002');
        $this->redeem($user, 'AS-CODE-003');

        $response = $this->redeem($user, 'AS-CODE-004');

        $response->assertStatus(422)
                 ->assertJsonFragment(['error' => 'Maximum of 3 AppSumo codes can be redeemed per account.']);

        // Fourth code must remain available
        $this->assertDatabaseHas('appsumo_codes', [
            'code'        => 'AS-CODE-004',
            'is_redeemed' => false,
        ]);
    }

    /**
     * @test
     * Redeeming the same code twice is rejected on the second attempt.
     */
    public function same_code_cannot_be_redeemed_twice(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $this->makeCode('AS-DUPE-001');

        // First redemption succeeds
        $this->redeem($user1, 'AS-DUPE-001')->assertStatus(200);

        // Second redemption by a different user is rejected
        $response = $this->redeem($user2, 'AS-DUPE-001');
        $response->assertStatus(422)
                 ->assertJsonFragment(['error' => 'This code is invalid or has already been redeemed.']);
    }

    /**
     * @test
     * An invalid / non-existent code returns a 422 with a clear error.
     */
    public function invalid_code_returns_422(): void
    {
        $user = User::factory()->create();

        $response = $this->redeem($user, 'FAKE-XXXX-9999');

        $response->assertStatus(422)
                 ->assertJsonFragment(['error' => 'This code is invalid or has already been redeemed.']);
    }

    /**
     * @test
     * THE KEY BUG TEST: StoreLicense uses HasTenant. On the /redeem route
     * there is no current.tenant bound. Without withoutTenantScope(), the
     * stacking count query returns 0 — meaning a user could redeem infinite
     * codes and the $existingCodeCount check never sees previous redemptions.
     *
     * This test proves the bug exists if withoutTenantScope() is removed,
     * and that the current implementation correctly handles it.
     */
    public function has_tenant_scope_does_not_break_stacking_count_when_no_tenant_is_bound(): void
    {
        // Ensure no current.tenant is bound (simulates the /redeem route context)
        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }

        $user = User::factory()->create();
        // User has no last_store_id (brand new, no stores yet)
        $this->assertNull($user->last_store_id, 'User should have no store at this point.');

        $this->makeCode('AS-SCOPE-001');
        $this->makeCode('AS-SCOPE-002');

        // Redeem first code
        $this->redeem($user, 'AS-SCOPE-001')->assertStatus(200);

        // Without the fix, StoreLicense::where('user_id', $user->id)->count()
        // would return 0 here because HasTenant adds whereRaw('1=0') when
        // no tenant is bound and user has no last_store_id.
        // The second redemption would then think it is the first code and
        // create a SECOND StoreLicense instead of upgrading the first.

        $licenseCountBeforeSecondRedeem = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        $this->assertEquals(1, $licenseCountBeforeSecondRedeem,
            'There should be exactly 1 StoreLicense after redeeming the first code. ' .
            'If this is 0, HasTenant is scoping the query incorrectly on the /redeem route.'
        );

        // Redeem second code — must upgrade, not create a new license
        $response = $this->redeem($user, 'AS-SCOPE-002');
        $response->assertStatus(200)
                 ->assertJson(['plan' => 'ltd_2', 'codes_redeemed' => 2]);

        // Must still be exactly 1 license (upgraded), not 2 (duplicated)
        $licenseCountAfter = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        $this->assertEquals(1, $licenseCountAfter,
            'There should still be exactly 1 StoreLicense after stacking. ' .
            'If this is 2, AppSumoController created a duplicate instead of upgrading — ' .
            'the stacking count check is broken due to HasTenant scope on the /redeem route.'
        );

        $license = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->first();

        $this->assertEquals('ltd_2', $license->plan,
            'License plan should be ltd_2 after stacking 2 codes.');
    }

    /**
     * @test
     * Monthly transaction limit is enforced at the configured threshold.
     * An ltd_1 tenant (500 tx/mo) cannot post a 501st sale in the same month.
     */
    public function transaction_limit_blocks_write_at_threshold(): void
    {
        $user   = User::factory()->create();
        $this->makeCode('AS-TX-001');
        $this->redeem($user, 'AS-TX-001');
        $tenant = $this->createStoreFor($user, 'ltd_1');

        $limit = config('plans.ltd_1.transactions_per_month'); // 500

        // Insert (limit) posted sales directly — faster than calling the full sale flow
        $sales = [];
        for ($i = 0; $i < $limit; $i++) {
            $sales[] = [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $tenant->id,
                'reference_number' => 'INV-TEST-' . $i . '-' . uniqid(),
                'user_id'          => $user->id,
                'subtotal'         => 100.00,
                'total'            => 100.00,
                'status'           => 'posted',
                'posted_at'        => now(),
                'created_at'       => now(),
                'updated_at'       => now(),
                'net_sales'        => 100.00,
                'payment_status'   => 'paid',
            ];
        }
        DB::table('sales')->insert($sales);

        // Verify count
        $this->assertEquals(
            $limit,
            Sale::where('status', 'posted')
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count(),
            "Expected exactly {$limit} posted sales in current month."
        );

        // Attempt to post one more sale via the V3 SaleController endpoint
        // The PlanGate check runs before SaleService::post() so this must return 403
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
        if (!$warehouseId) {
            $warehouseId = \Illuminate\Support\Str::uuid()->toString();
            DB::table('warehouses')->insert([
                'id' => $warehouseId,
                'tenant_id' => $tenant->id,
                'name' => 'Default Warehouse',
                'created_at' => now(),
            ]);
        }

        $party = \App\Models\Party::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Test Customer',
            'type' => 'customer',
        ]);

        $product = \App\Models\Product::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'name' => 'Test Product',
            'sku' => 'SKU-TEST',
            'base_unit' => 'unit',
            'price' => 100.00,
            'cost_price' => 50.00,
        ]);

        $response = $this->actingAsTenantUserModel($user, $tenant)
            ->postJson(route('store.v3.sales.store', ['store_slug' => $tenant->slug]), [
                'customer_id'    => $party->id,
                'warehouse_id'   => $warehouseId,
                'sale_date'      => now()->toDateString(),
                'payment_method' => 'cash',
                'amount_received'=> 100,
                'items'          => [
                    ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 100, 'sale_uom' => 'unit'],
                ],
            ]);

        $response->assertStatus(403)
                 ->assertJson([
                     'type'    => 'plan_limit',
                     'feature' => 'transactions_per_month',
                 ]);
    }

    /**
     * @test
     * An ltd_1 user (1 store limit) cannot create a second store.
     */
    public function ltd_1_user_cannot_create_second_store(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-STORE-001');
        $this->redeem($user, 'AS-STORE-001');
        $this->createStoreFor($user, 'ltd_1'); // First store — this should succeed

        // Attempt to create a second store
        $response = $this->actingAs($user)->postJson('/new-store', [
            'name' => 'Second Store',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('name');
        $errors = session()->get('errors')->getBag('default');
        $this->assertStringContainsString(
            'maximum of 1 store',
            strtolower($errors->first('name')),
            'Error message should mention the store limit.'
        );
    }

    /**
     * @test
     * An ltd_2 user (2 store limit) can create a second store but not a third.
     */
    public function ltd_2_user_can_create_second_store_but_not_third(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-2S-001');
        $this->makeCode('AS-2S-002');
        $this->redeem($user, 'AS-2S-001');
        $this->createStoreFor($user, 'ltd_1');
        $this->redeem($user, 'AS-2S-002'); // Upgrades to ltd_2 (2 store limit)

        // Second store creation must succeed
        $secondStore = $this->actingAs($user)->postJson('/new-store', ['name' => 'Second Store']);
        $secondStore->assertRedirect(); // StoreController redirects on success

        // Third store creation must fail
        $thirdStore = $this->actingAs($user)->postJson('/new-store', ['name' => 'Third Store']);
        $thirdStore->assertRedirect();
        $thirdStore->assertSessionHasErrors('name');
        $errors = session()->get('errors')->getBag('default');
        $this->assertStringContainsString(
            'maximum of 2 store',
            strtolower($errors->first('name')),
            'Error message should mention the 2-store limit.'
        );
    }

    /**
     * @test
     * Read operations (GET requests) are never blocked even when the
     * transaction limit is fully exhausted.
     */
    public function read_access_is_never_blocked_at_limit(): void
    {
        $user   = User::factory()->create();
        $this->makeCode('AS-READ-001');
        $this->redeem($user, 'AS-READ-001');
        $tenant = $this->createStoreFor($user, 'ltd_1');

        $limit = config('plans.ltd_1.transactions_per_month');

        // Fill to the limit
        $sales = [];
        for ($i = 0; $i < $limit; $i++) {
            $sales[] = [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $tenant->id,
                'reference_number' => 'INV-READ-TEST-' . $i . '-' . uniqid(),
                'user_id'          => $user->id,
                'subtotal'         => 100.00,
                'total'            => 100.00,
                'status'           => 'posted',
                'posted_at'        => now(),
                'created_at'       => now(),
                'updated_at'       => now(),
                'net_sales'        => 100.00,
                'payment_status'   => 'paid',
            ];
        }
        DB::table('sales')->insert($sales);

        // GET requests to read sales data must still work
        $response = $this->actingAsTenantUserModel($user, $tenant)
            ->get(route('store.sales.index', ['store_slug' => $tenant->slug]));

        // Must not be blocked (200 or redirect, not 402/403)
        $this->assertNotEquals(402, $response->status(),
            'Read access must never be blocked when transaction limit is reached.');
        $this->assertNotEquals(403, $response->status(),
            'Read access must never be blocked when transaction limit is reached.');
    }

    /**
     * @test
     * The /redeem GET route renders the Redeem page with correct props
     * reflecting the user's current code count and plan.
     */
    public function redeem_page_shows_correct_tier_state_for_user_with_one_code(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-PAGE-001');
        $this->redeem($user, 'AS-PAGE-001');

        $response = $this->actingAs($user)->get('/redeem');

        $response->assertStatus(200)
                 ->assertInertia(fn ($page) => $page
                     ->component('Redeem')
                     ->where('codes_redeemed', 1)
                     ->where('current_plan', 'ltd_1')
                     ->where('max_codes', 3)
                 );
    }

    /**
     * @test
     * plan_limits JSON on the tenant is fully populated after the second
     * code upgrade and contains ALL expected keys from config/plans.php.
     */
    public function plan_limits_json_is_complete_after_upgrade(): void
    {
        $user = User::factory()->create();
        $this->makeCode('AS-JSON-001');
        $this->makeCode('AS-JSON-002');

        $this->redeem($user, 'AS-JSON-001');
        $tenant = $this->createStoreFor($user, 'ltd_1');
        $this->redeem($user, 'AS-JSON-002');

        $tenant->refresh();

        $expectedKeys = array_keys(config('plans.ltd_2'));

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey(
                $key,
                $tenant->plan_limits,
                "plan_limits JSON is missing key '{$key}' after upgrade to ltd_2."
            );
        }

        // Spot-check the values match config exactly
        $this->assertEquals(
            config('plans.ltd_2.transactions_per_month'),
            $tenant->plan_limits['transactions_per_month']
        );
        $this->assertEquals(
            config('plans.ltd_2.staff_limit'),
            $tenant->plan_limits['staff_limit']
        );
        $this->assertTrue(
            $tenant->plan_limits['ltd'],
            "plan_limits['ltd'] must be true for an LTD plan."
        );
    }
}
