<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Http\Middleware\TenantMiddleware;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Phase5TruthAndTrustTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);
    }

    /** @test */
    public function it_records_terms_consent_and_version_on_store_creation()
    {
        $tenant = \App\Models\Tenant::query()->create([
            'name'               => 'Consent Test Store',
            'slug'               => 'consent-test-store',
            'plan'               => 'starter',
            'status'             => 'trial',
            'terms_accepted_at'  => now(),
            'terms_version'      => 'v4.0',
        ]);

        $fresh = $tenant->fresh();
        $this->assertNotNull($fresh);
        $this->assertNotNull($fresh->terms_accepted_at);
        $this->assertEquals('v4.0', $fresh->terms_version);
        $this->assertFalse((bool) $fresh->shared_catalog_opt_out);
        $this->assertFalse((bool) $fresh->ai_accuracy_opt_in);
    }

    /** @test */
    public function it_updates_shared_catalog_opt_out_and_ai_accuracy_in_settings()
    {
        $tenant = \App\Models\Tenant::query()->create([
            'name'            => 'Opt Out Store',
            'slug'            => 'opt-out-store',
            'plan'            => 'starter',
            'status'          => 'active',
            'setup_completed' => true,
        ]);

        $user = User::factory()->create(['last_store_id' => $tenant->id]);

        // Manually bind the real tenant before the request so the controller
        // sees it via app('current.tenant') without needing TenantMiddleware.
        // withoutMiddleware() prevents TenantMiddleware from overwriting our binding.
        app()->instance('current.tenant', $tenant);

        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->post("/s/{$tenant->slug}/settings/data-privacy", [
                'shared_catalog_opt_out' => true,
                'ai_accuracy_opt_in'     => true,
            ]);

        $response->assertSessionHasNoErrors();
        $fresh = \App\Models\Tenant::find($tenant->id);
        $this->assertTrue((bool) $fresh->shared_catalog_opt_out);
        $this->assertTrue((bool) $fresh->ai_accuracy_opt_in);
    }

    /** @test */
    public function it_executes_prune_scan_images_command_and_removes_old_files()
    {
        Storage::fake('local');

        // Create an old file (>90 days old)
        $oldFile = 'smart_capture/old_scan.jpg';
        Storage::disk('local')->put($oldFile, 'fake image binary content');

        // Execute prune command with 0 days to prune everything for testing
        $this->artisan('app:prune-scan-images', ['--days' => 0])
            ->assertExitCode(0);

        $this->assertFalse(Storage::disk('local')->exists($oldFile));
    }

    /** @test */
    public function it_verifies_pricing_tech_specs_contain_no_false_claims()
    {
        $pricingFile = file_get_contents(resource_path('js/Pages/Marketing/Pricing.jsx'));

        $this->assertStringNotContainsString('Vision Transformer v2', $pricingFile);
        $this->assertStringNotContainsString('99.9% uptime SLA', $pricingFile);
        $this->assertStringNotContainsString('1,200 requests/min', $pricingFile);
        $this->assertStringNotContainsString('Fine-tuned LayoutLM', $pricingFile);
        $this->assertStringNotContainsString('<450ms', $pricingFile);
        $this->assertStringNotContainsString('Hybrid Router', $pricingFile);

        // Verifies true claims are present
        $this->assertStringContainsString('Review screen first', $pricingFile);
        $this->assertStringContainsString('Handwritten & printed', $pricingFile);
        $this->assertStringContainsString('Auto checks line totals', $pricingFile);
    }

    /** @test */
    public function it_updates_data_privacy_via_fallback_when_current_tenant_not_bound()
    {
        // Exercises the fallback path: all middleware is bypassed so current.tenant is
        // only the fake setUp() tenant (id=null). The controller's null-ID guard detects
        // this and falls back to auth()->user()->last_store_id to find the real tenant.
        // This is the path that would throw "class not found" if the Tenant import
        // was missing from SettingsController.
        $tenant = \App\Models\Tenant::query()->create([
            'name'            => 'Fallback Path Store',
            'slug'            => 'fallback-path-store',
            'plan'            => 'starter',
            'status'          => 'active',
            'setup_completed' => true,
        ]);

        $user = User::factory()->create(['last_store_id' => $tenant->id]);

        // withoutMiddleware() ensures TenantMiddleware never runs, leaving current.tenant
        // as the setUp() fake tenant (id=null) — fallback to last_store_id fires.
        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->post("/s/{$tenant->slug}/settings/data-privacy", [
                'shared_catalog_opt_out' => true,
                'ai_accuracy_opt_in'     => true,
            ]);

        $response->assertSessionHasNoErrors();
        $fresh = \App\Models\Tenant::find($tenant->id);
        $this->assertTrue((bool) $fresh->shared_catalog_opt_out);
        $this->assertTrue((bool) $fresh->ai_accuracy_opt_in);
    }

    /** @test */
    public function it_updates_data_privacy_end_to_end_through_real_middleware_stack()
    {
        // This is the production-path test. No middleware is bypassed.
        // TenantMiddleware resolves the tenant from the DB via slug + membership query,
        // DrmOfflineLockMiddleware passes (last_online_at is null on new installs),
        // and the controller updates the DB. Mirrors the exact Phase3 HTTP test pattern.
        $this->withoutExceptionHandling();

        $tenant = Tenant::create([
            'name'            => 'E2E Settings Store',
            'slug'            => 'e2e-settings-store',
            'plan'            => 'starter',
            'status'          => 'active',
            'setup_completed' => true,
        ]);

        $user = User::factory()->create([
            'is_platform_admin' => true,
            'last_store_id'     => $tenant->id,
        ]);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Pre-bind the real tenant (Phase 3 pattern). TenantMiddleware will confirm
        // via the membership query and re-bind with the DB-loaded instance.
        app()->instance('current.tenant', $tenant);

        $this->actingAs($user);

        $response = $this->post("/s/{$tenant->slug}/settings/data-privacy", [
            'shared_catalog_opt_out' => true,
            'ai_accuracy_opt_in'     => true,
        ]);

        $response->assertSessionHasNoErrors();
        $fresh = Tenant::find($tenant->id);
        $this->assertTrue((bool) $fresh->shared_catalog_opt_out, 'shared_catalog_opt_out not updated through real stack');
        $this->assertTrue((bool) $fresh->ai_accuracy_opt_in, 'ai_accuracy_opt_in not updated through real stack');
    }
}
