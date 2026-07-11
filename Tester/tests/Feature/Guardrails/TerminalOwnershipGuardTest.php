<?php

namespace Tests\Feature\Guardrails;

use App\Models\Terminal;
use Tests\Feature\VenQoreTestCase;

/**
 * TerminalOwnershipGuardTest — cross-tenant terminal-hijack regression guard.
 *
 * REAL BUG THIS GUARDS (found 2026-07-08):
 *   Route: POST /api/terminal/activities  (UNAUTHENTICATED — outside the
 *          auth:sanctum group in routes/api.php)
 *   Controller: App\Http\Controllers\Api\TerminalActivityController@store
 *
 *   The controller resolved a terminal with withoutGlobalScope('tenant') and
 *   then did:
 *       if ($tenant && $terminal->tenant_id !== $tenant->id) {
 *           $terminal->update(['tenant_id' => $tenant->id]);   // ← hijack
 *       }
 *   Any unauthenticated caller who knew a victim terminal's UUID (or device_id)
 *   could POST their OWN store_slug and silently move that terminal — and its
 *   activity stream — into their tenant.
 *
 * The first test asserts the SECURE behavior (terminal is NOT reassigned) and
 * therefore fails against the buggy code. The second test ensures the fix does
 * not over-correct: a terminal with no owner yet can still be claimed on first
 * contact (device onboarding must keep working).
 */
class TerminalOwnershipGuardTest extends VenQoreTestCase
{
    public function test_unauthenticated_caller_cannot_hijack_another_tenants_terminal(): void
    {
        // Victim store owns a paired terminal.
        $victim = $this->createTenant('victim-store', 'ltd_3', 'active');
        app()->instance('current.tenant', $victim);

        $terminal = Terminal::create([
            'name'      => 'Front Counter',
            'device_id' => 'victim-device-001',
            'tenant_id' => $victim->id,
            'status'    => 'OPEN',
            'is_active' => true,
        ]);

        $this->assertEquals($victim->id, $terminal->tenant_id);

        // Attacker store exists and the attacker knows the terminal UUID.
        $attacker = $this->createTenant('attacker-store', 'ltd_3', 'active');

        // Simulate the external, unauthenticated POST from the attacker.
        app()->forgetInstance('current.tenant');

        $response = $this->postJson('/api/terminal/activities', [
            'device_id'   => 'attacker-device-999',
            'terminal_id' => $terminal->id,
            'store_slug'  => $attacker->slug,   // attacker's own store
            'activities'  => [[
                'away_at'          => now()->subMinute()->toDateTimeString(),
                'back_at'          => now()->toDateTimeString(),
                'duration_seconds' => 60,
            ]],
        ]);

        // The terminal must STILL belong to the victim.
        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $victim->id,
            $fresh->tenant_id,
            'SECURITY REGRESSION: an unauthenticated caller reassigned another tenant\'s terminal via /api/terminal/activities.'
        );

        // And no activity may be attributed to the attacker's tenant.
        $this->assertDatabaseMissing('terminal_activities', [
            'terminal_id' => $terminal->id,
            'tenant_id'   => $attacker->id,
        ]);

        // The endpoint should reject the cross-tenant attempt outright.
        $response->assertStatus(403);
    }

    public function test_unclaimed_terminal_can_still_be_claimed_on_first_contact(): void
    {
        // A terminal that has not yet been bound to any tenant (device just
        // came online). Onboarding must still be able to claim it.
        app()->forgetInstance('current.tenant');

        $terminal = Terminal::withoutGlobalScope('tenant')->create([
            'name'      => 'Unclaimed Kiosk',
            'device_id' => 'kiosk-device-777',
            'tenant_id' => null,
            'status'    => 'CLOSED',
            'is_active' => true,
        ]);

        $store = $this->createTenant('legit-store', 'ltd_3', 'active');

        $response = $this->postJson('/api/terminal/activities', [
            'device_id'   => 'kiosk-device-777',
            'terminal_id' => $terminal->id,
            'store_slug'  => $store->slug,
            'activities'  => [],
        ]);

        $response->assertOk();

        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $store->id,
            $fresh->tenant_id,
            'A previously unclaimed terminal should be claimable on first contact.'
        );
    }

    public function test_activities_requires_device_id(): void
    {
        $response = $this->postJson('/api/terminal/activities', [
            'terminal_id' => 'some-uuid',
            'activities'  => [],
        ]);
        $response->assertStatus(400);
        $response->assertJsonPath('error', 'Device ID required');
    }

    public function test_upload_screenshot_requires_device_id(): void
    {
        $response = $this->postJson('/api/terminal/screenshot', [
            'file' => null,
        ]);
        $response->assertStatus(400);
        $response->assertJsonPath('error', 'Device ID required');
    }
}
