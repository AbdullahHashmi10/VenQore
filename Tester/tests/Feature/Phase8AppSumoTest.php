<?php

namespace Tests\Feature;

use App\Http\Middleware\EnforceHostedUntil;
use App\Http\Middleware\EnforceTransactionLimit;
use App\Jobs\CheckHostedUntilExpiryJob;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\PlanRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class Phase8AppSumoTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);

        $this->tenant = Tenant::create([
            'name'            => 'AppSumo LTD Store',
            'slug'            => 'ltd-store',
            'plan'            => 'ltd_tier_1',
            'status'          => 'active',
            'setup_completed' => true,
        ]);

        $this->user = User::factory()->create([
            'last_store_id'     => $this->tenant->id,
            'is_platform_admin' => true,
        ]);

        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        PlanRepository::invalidatePlanCache('ltd_1');
        PlanRepository::invalidatePlanCache('ltd_tier_1');

        // Register dummy routes for middleware testing
        Route::post('/test-transaction-p8', function () {
            return response()->json(['success' => true]);
        })->middleware(EnforceTransactionLimit::class);

        Route::post('/test-hosted-write-p8', function () {
            return response()->json(['success' => true]);
        })->middleware(EnforceHostedUntil::class);
    }

    /** @test */
    public function it_enforces_monthly_transaction_limits_on_ltd_tiers()
    {
        $this->tenant->update([
            'plan'                    => 'ltd_1',
            'transactions_this_month' => 1000,
        ]);

        app()->instance('current.tenant', $this->tenant->fresh());

        $limit = PlanRepository::getEffectiveLimit($this->tenant->id, $this->tenant->plan, 'transactions_per_month');
        $this->assertEquals('1000', (string) $limit);

        $response = $this->actingAs($this->user)->postJson('/test-transaction-p8');

        $response->assertStatus(403)
            ->assertJson(['code' => 'TRANSACTION_LIMIT_REACHED']);
    }

    /** @test */
    public function it_restricts_expired_hosted_until_stores_to_read_only()
    {
        // Set hosted_until 1 day in the past
        $this->tenant->update(['hosted_until' => now()->subDay()]);

        app()->instance('current.tenant', $this->tenant->fresh());

        $response = $this->actingAs($this->user)->postJson('/test-hosted-write-p8');

        $response->assertStatus(403)
            ->assertJson(['code' => 'HOSTING_EXPIRED']);
    }

    /** @test */
    public function it_hard_blocks_managed_platform_ai_on_all_ltd_plans()
    {
        $canUse = PlanRepository::canUseFeature($this->tenant, 'smart_capture');
        $this->assertFalse($canUse, 'Managed AI must be hard-blocked on LTD plans without BYOK');
    }

    /** @test */
    public function it_allows_smart_capture_on_ltd_plans_when_byok_key_is_provided()
    {
        // Add Setting for BYOK
        \App\Models\Setting::create([
            'tenant_id' => $this->tenant->id,
            'key'       => 'smartcapture_api_key',
            'value'     => 'user_provided_gemini_key_123',
        ]);

        $canUse = PlanRepository::canUseFeature($this->tenant, 'smart_capture');
        $this->assertTrue($canUse, 'BYOK AI key must unblock SmartCapture for LTD tenants');
    }

    /** @test */
    public function it_dispatches_check_hosted_until_expiry_job_cleanly()
    {
        $this->tenant->update(['hosted_until' => now()->addDays(30)]);

        (new CheckHostedUntilExpiryJob())->handle();
        $this->assertTrue(true);
    }

    /** @test */
    public function it_serves_help_centre_index_and_article_search()
    {
        $response = $this->get('/help?q=BYOK');
        $response->assertStatus(200);

        $articleResponse = $this->get('/help/articles/ltd-plans-and-byok');
        $articleResponse->assertStatus(200);
    }

    /** @test */
    public function it_executes_load_testing_benchmark_command()
    {
        $exitCode = $this->artisan('venqore:load-test', [
            '--tenants'  => 10,
            '--requests' => 50,
        ])->run();

        $this->assertEquals(0, $exitCode);
    }

    /** @test */
    public function it_serves_known_issues_status_page()
    {
        $response = $this->get('/known-issues');
        $response->assertStatus(200);
    }
}
