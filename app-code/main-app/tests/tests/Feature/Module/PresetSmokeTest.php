<?php

namespace Tests\Feature\Module;

use App\Services\AiBuilder\ApplyConfigurationService;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * PRESET SMOKE TEST — plan item #11's runtime half.
 *
 * ModuleRegistryIntegrityTest::test_presets_only_combine_live_modules() and
 * EnsureModuleTest::every_preset_resolves_to_a_valid_configuration() already
 * prove every preset resolves to a valid, dependency-complete module set on
 * paper. Neither one ever writes that set to a real tenant and opens a real
 * page — so a preset could resolve perfectly and still hand a paying
 * customer a 500 on their very first dashboard load. This is the test that
 * closes that gap: it runs every shippable preset through the exact
 * production write path (ApplyConfigurationService::applyPreset() — the
 * same call WorkspaceBuilderController::provision() makes at real signup)
 * and then requests, as that tenant's owner and through the full HTTP/
 * middleware stack (auth, EnsureModule, permissions, plan features), every
 * screen the resolved module set actually turned on.
 *
 * WHY NOT LOOP /workspace/provision ITSELF: that endpoint is throttled to
 * 5/min (routes/web.php). Looping all ~12 shippable presets through it in
 * one test run would start failing on throttling, not on a real bug.
 * provisioning_through_the_real_signup_endpoint_works_end_to_end() below
 * exercises that HTTP contract once instead (password hashing, the
 * redirect, session login persisting to the next request) — separately from
 * the per-preset loop, which calls the same underlying service directly.
 *
 * UNVERIFIED — written without PHP/artisan access in this environment.
 * Run `php artisan test --filter=PresetSmokeTest` before trusting it. The
 * single most likely first failure: a route that needs tenant defaults
 * (chart of accounts, a default warehouse) beyond what seedTenantDefaults()
 * provides — if so, fix the seeding call below or the controller's empty-
 * state handling, not this test's expectations.
 */
class PresetSmokeTest extends VenQoreTestCase
{
    #[Test]
    public function every_shippable_preset_lands_a_tenant_with_working_screens(): void
    {
        $service = app(ApplyConfigurationService::class);

        // 'business' plan/status, matching EnsureModuleTest's convention —
        // it clears every plan.feature gate (e.g. expense_manager) so a
        // failure here means a MODULE problem, not an unrelated plan-tier one.
        foreach (config('ai_builder.presets') as $key => $preset) {
            if (!empty($preset['blocked_by'])) {
                continue; // not shippable yet — covered by ModuleRegistryIntegrityTest instead
            }

            $tenant = $this->createTenant(
                slug: 'preset-' . str_replace('_', '-', $key) . '-' . Str::random(4),
                plan: 'business',
                status: 'active'
            );
            $this->seedTenantDefaults($tenant);
            $this->actingAsOwner($tenant);

            $applied = $service->applyPreset($tenant, $key);
            $enabled = $applied['enabled'];

            // Always-on regardless of preset (config/qore.php always_on_routes):
            // the two screens a customer can never be locked out of. builder is
            // "the Rulebook's front door" — it must never gate itself.
            $this->get($this->storeUrl($tenant, 'dashboard'))
                ->assertOk("Preset '{$key}': dashboard did not load with modules [" . implode(',', $enabled) . '].');
            $this->get($this->storeUrl($tenant, 'builder'))
                ->assertOk("Preset '{$key}': builder screen did not load.");

            // Module -> a real GET path that module owns, deliberately narrow:
            // one safe, index-level screen per module, never a create/store
            // action, so this test proves reachability, not full workflows.
            $moduleToPath = [
                'pos'       => 'pos',
                'inventory' => 'inventory/list',
                'reports'   => 'reports',
                'expenses'  => 'expenses',
            ];

            foreach ($moduleToPath as $module => $path) {
                if (!in_array($module, $enabled, true)) {
                    continue;
                }
                $this->get($this->storeUrl($tenant, $path))
                    ->assertOk("Preset '{$key}': enabled module '{$module}' owns '{$path}', which did not load.");
            }
        }
    }

    #[Test]
    public function provisioning_through_the_real_signup_endpoint_works_end_to_end(): void
    {
        $response = $this->postJson('/workspace/provision', [
            'business_name' => 'Smoke Test Cafe',
            'email'         => 'smoke-test-' . Str::random(8) . '@example.test',
            'password'      => 'password123',
            'modules'       => config('ai_builder.presets.cafe.modules'),
            'preset_key'    => 'cafe',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $slug = $response->json('tenant_slug');
        $this->assertNotEmpty($slug, 'provision() did not return a tenant_slug.');

        // provision() already called Auth::login() — the session from that
        // response carries over to this next request in the same test,
        // exactly as it does for a real signed-up owner's next page load.
        $this->get("/s/{$slug}/dashboard")->assertOk();
    }
}
