<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Models\Terminal;
use Tests\Feature\VenQoreTestCase;

/**
 * HeartbeatOwnershipGuardTest — cross-tenant terminal-hijack regression guard
 * for the POST /api/heartbeat endpoint.
 *
 * REAL BUG THIS GUARDS (found 2026-07-08, P0-2):
 *   Route: POST /api/heartbeat  (UNAUTHENTICATED — outside auth:sanctum)
 *   Controller: App\Http\Controllers\Api\HeartbeatController@store
 *
 *   Original buggy block:
 *       if ($tenant && $terminal->tenant_id !== $tenant->id) {
 *           $terminal->update(['tenant_id' => $tenant->id]);   // ← hijack
 *       }
 *   An unauthenticated caller supplying a victim device_id/terminal_id and
 *   their own store_slug could silently move that terminal into their tenant.
 *
 * Fix: only allow tenant assignment when terminal.tenant_id IS NULL;
 *      return 403 on any tenant_id mismatch.
 */
class HeartbeatOwnershipGuardTest extends VenQoreTestCase
{
    // ──────────────────────────────────────────────────────────────────────────
    // 1. Attacker using victim's device_id + own store_slug → 403, no hijack
    // ──────────────────────────────────────────────────────────────────────────

    public function test_unauthenticated_caller_cannot_hijack_another_tenants_terminal_via_heartbeat(): void
    {
        // Victim store owns a paired terminal.
        $victim = $this->createTenant('victim-hb-store', 'ltd_3', 'active');
        app()->instance('current.tenant', $victim);

        $terminal = Terminal::create([
            'name'      => 'Front Counter',
            'device_id' => 'victim-hb-device-001',
            'tenant_id' => $victim->id,
            'status'    => 'OPEN',
            'is_active' => true,
        ]);

        $this->assertEquals($victim->id, $terminal->tenant_id);

        // Attacker knows the victim's device_id and supplies their own store_slug.
        $attacker = $this->createTenant('attacker-hb-store', 'ltd_3', 'active');
        app()->forgetInstance('current.tenant');

        $response = $this->postJson('/api/heartbeat', [
            'device_id'  => 'victim-hb-device-001',   // victim's device
            'store_slug' => $attacker->slug,           // attacker's store
            'status'     => 'OPEN',
        ]);

        // Must be rejected.
        $response->assertStatus(403);
        $response->assertJsonPath('error', 'Terminal does not belong to this store.');

        // Terminal must still belong to the victim.
        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $victim->id,
            $fresh->tenant_id,
            'SECURITY REGRESSION: an unauthenticated caller reassigned another tenant\'s terminal via POST /api/heartbeat.'
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Unclaimed terminal can be claimed on first heartbeat (device onboarding)
    // ──────────────────────────────────────────────────────────────────────────

    public function test_unclaimed_terminal_can_still_be_claimed_on_first_contact_via_heartbeat(): void
    {
        app()->forgetInstance('current.tenant');

        $terminal = Terminal::withoutGlobalScope('tenant')->create([
            'name'      => 'Unclaimed Kiosk',
            'device_id' => 'hb-kiosk-device-777',
            'tenant_id' => null,
            'status'    => 'CLOSED',
            'is_active' => true,
        ]);

        $store = $this->createTenant('legit-hb-store', 'ltd_3', 'active');

        $response = $this->postJson('/api/heartbeat', [
            'device_id'  => 'hb-kiosk-device-777',
            'terminal_id' => $terminal->id,
            'store_slug' => $store->slug,
            'status'     => 'OPEN',
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', 'alive');

        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $store->id,
            $fresh->tenant_id,
            'A previously unclaimed terminal should be claimable on first heartbeat.'
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Missing device_id is rejected (400)
    // ──────────────────────────────────────────────────────────────────────────

    public function test_heartbeat_requires_device_id(): void
    {
        $response = $this->postJson('/api/heartbeat', [
            'terminal_id' => 'some-uuid',
            'status'      => 'OPEN',
        ]);
        $response->assertStatus(400);
        $response->assertJsonPath('error', 'Device ID required');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Legitimate heartbeat from the owning store returns 200 + alive
    // ──────────────────────────────────────────────────────────────────────────

    public function test_legitimate_heartbeat_from_owning_store_returns_alive(): void
    {
        $store = $this->createTenant('owner-hb-store', 'ltd_3', 'active');
        app()->instance('current.tenant', $store);

        $terminal = Terminal::create([
            'name'      => 'Owner Terminal',
            'device_id' => 'owner-hb-device-999',
            'tenant_id' => $store->id,
            'status'    => 'OPEN',
            'is_active' => true,
        ]);

        app()->forgetInstance('current.tenant');

        $response = $this->postJson('/api/heartbeat', [
            'device_id'  => 'owner-hb-device-999',
            'store_slug' => $store->slug,
            'status'     => 'OPEN',
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', 'alive');
        $response->assertJsonPath('terminal_id', $terminal->id);
    }
}
