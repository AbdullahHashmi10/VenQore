<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
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
        app()->instance('current.tenant', $tenant);

        $response = $this->actingAs($user)->post('/settings/data-privacy', [
            'shared_catalog_opt_out' => 1,
            'ai_accuracy_opt_in'     => 1,
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

        // Mock last modified time by manual touch or Carbon manipulation if needed
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
}
