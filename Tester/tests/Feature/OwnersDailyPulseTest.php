<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;
use Tests\Feature\VenQoreTestCase;

/**
 * OwnersDailyPulseTest
 *
 * Tests the secure vault feature (Owner's Daily Pulse) end-to-end via HTTP.
 * Covers: route registration, passcode lock/unlock, setup, note saving.
 *
 * HOW TO RUN:
 *   vendor/bin/pest --configuration=Tester/phpunit.xml --testsuite=Routing
 */
class OwnersDailyPulseTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        // 'active' is a tenant STATUS, not a plan slug — it doesn't exist in
        // PlanFeatureMatrixSeeder, so owners_daily_pulse fail-closed to locked.
        // 'business' genuinely has owners_daily_pulse enabled (see seeder).
        $this->tenant = $this->createTenant(plan: 'business', status: 'active');
        $this->owner  = $this->createTenantUser($this->tenant, 'owner');
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Write a setting directly to DB (bypassing SettingsHelper which is read-only).
     */
    private function putSetting(string $key, string $value): void
    {
        Setting::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Make a JSON-accepting POST in the store context.
     * Web middleware redirects on validation failure; Accept:json returns 422 instead.
     */
    private function jsonPost(string $path, array $data = []): \Illuminate\Testing\TestResponse
    {
        return $this->withHeader('Accept', 'application/json')
                    ->post($this->storeUrl($this->tenant, $path), $data);
    }

    // ─── Route Registration ────────────────────────────────────────────────────

    /** @test */
    public function all_pulse_routes_are_registered(): void
    {
        $routes = [
            'store.reports.owner-daily-pulse',
            'store.reports.owner-daily-pulse.verify',
            'store.reports.owner-daily-pulse.setup',
            'store.reports.owner-daily-pulse.lock',
            'store.reports.owner-daily-pulse.note',
        ];

        foreach ($routes as $name) {
            $this->assertNotNull(
                \Illuminate\Support\Facades\Route::getRoutes()->getByName($name),
                "Route '{$name}' is not registered in web.php."
            );
        }
    }

    // ─── Access Control ───────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_access_pulse_dashboard(): void
    {
        $response = $this->get($this->storeUrl($this->tenant, 'reports/owner-daily-pulse'));
        $response->assertRedirect(); // Redirects to login
    }

    /** @test */
    public function authenticated_owner_can_access_pulse_dashboard(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $response = $this->get($this->storeUrl($this->tenant, 'reports/owner-daily-pulse'));

        // Should render Inertia page (200) — may be locked but page loads OK
        $response->assertStatus(200);
    }

    // ─── Passcode Verify ──────────────────────────────────────────────────────

    /** @test */
    public function verify_endpoint_returns_success_for_valid_passcode(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $passcode = '1234';
        $this->putSetting('owner_pulse_passcode_' . $this->tenant->id, Hash::make($passcode));
        $this->putSetting('owner_pulse_setup_status_' . $this->tenant->id, 'enabled');

        $response = $this->jsonPost('reports/owner-daily-pulse/verify', ['passcode' => $passcode]);

        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    /** @test */
    public function verify_endpoint_returns_403_for_invalid_passcode(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $this->putSetting('owner_pulse_passcode_' . $this->tenant->id, Hash::make('correct-pass'));
        $this->putSetting('owner_pulse_setup_status_' . $this->tenant->id, 'enabled');

        $response = $this->jsonPost('reports/owner-daily-pulse/verify', ['passcode' => 'wrong-pass']);

        $response->assertStatus(403)->assertJson(['success' => false]);
    }

    /** @test */
    public function verify_endpoint_validates_passcode_is_required(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $response = $this->jsonPost('reports/owner-daily-pulse/verify', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['passcode']);
    }

    // ─── Setup ────────────────────────────────────────────────────────────────

    /** @test */
    public function setup_endpoint_can_enable_passcode(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $response = $this->jsonPost('reports/owner-daily-pulse/setup', [
            'action'   => 'set',
            'passcode' => '9999',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        // Verify the passcode hash was stored in DB
        $stored = Setting::where('key', 'owner_pulse_passcode_' . $this->tenant->id)->value('value');
        $this->assertNotNull($stored, 'Passcode setting was not saved to DB.');
        $this->assertTrue(Hash::check('9999', $stored), 'Stored passcode hash does not match.');
    }

    /** @test */
    public function setup_endpoint_can_disable_passcode(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $response = $this->jsonPost('reports/owner-daily-pulse/setup', [
            'action' => 'disable',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $status = Setting::where('key', 'owner_pulse_setup_status_' . $this->tenant->id)->value('value');
        $this->assertEquals('disabled', $status);
    }

    /** @test */
    public function setup_requires_passcode_when_action_is_set(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        // Missing passcode when action=set
        $response = $this->jsonPost('reports/owner-daily-pulse/setup', ['action' => 'set']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['passcode']);
    }

    // ─── Lock ─────────────────────────────────────────────────────────────────

    /** @test */
    public function lock_endpoint_clears_session_and_redirects(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        // Simulate the session is authorized
        session()->put('owner_pulse_authorized_' . $this->tenant->id, true);
        $this->assertTrue(session()->has('owner_pulse_authorized_' . $this->tenant->id));

        $response = $this->post($this->storeUrl($this->tenant, 'reports/owner-daily-pulse/lock'));

        // Should redirect back to the daily pulse page
        $response->assertRedirect();

        // Session key should be cleared
        $this->assertFalse(session()->has('owner_pulse_authorized_' . $this->tenant->id));
    }

    // ─── Note Saving ──────────────────────────────────────────────────────────

    /** @test */
    public function note_endpoint_saves_memo_when_authorized(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        session()->put('owner_pulse_authorized_' . $this->tenant->id, true);

        $today = now()->toDateString();
        $memo  = 'Revenue was strong today, pushed extra sale.';

        $response = $this->jsonPost('reports/owner-daily-pulse/note', [
            'date' => $today,
            'note' => $memo,
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('daily_snapshots', [
            'tenant_id' => $this->tenant->id,
            'date'      => $today,
            'note'      => $memo,
        ]);
    }

    /** @test */
    public function note_endpoint_rejects_unauthorized_access(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        // No session authorization — should get 403
        $response = $this->jsonPost('reports/owner-daily-pulse/note', [
            'date' => now()->toDateString(),
            'note' => 'Unauthorized note',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function note_endpoint_validates_date_format(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        session()->put('owner_pulse_authorized_' . $this->tenant->id, true);

        $response = $this->jsonPost('reports/owner-daily-pulse/note', [
            'date' => 'not-a-date',
            'note' => 'Test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['date']);
    }
}
