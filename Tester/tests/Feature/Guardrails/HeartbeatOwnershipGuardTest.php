<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Models\Terminal;
use Tests\Feature\VenQoreTestCase;

class HeartbeatOwnershipGuardTest extends VenQoreTestCase
{
    public function test_unauthenticated_caller_cannot_hijack_another_tenants_terminal_via_heartbeat(): void
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

        $response = $this->postJson('/api/heartbeat', [
            'device_id'   => 'attacker-device-999',
            'terminal_id' => $terminal->id,
            'store_slug'  => $attacker->slug,   // attacker's own store
            'status'      => 'OPEN',
        ]);

        // The terminal must STILL belong to the victim.
        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $victim->id,
            $fresh->tenant_id,
            'SECURITY REGRESSION: an unauthenticated caller reassigned another tenant\'s terminal via /api/heartbeat.'
        );

        // The endpoint should reject the cross-tenant attempt outright.
        $response->assertStatus(403);
    }

    public function test_unclaimed_terminal_can_still_be_claimed_on_first_contact_via_heartbeat(): void
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

        $response = $this->postJson('/api/heartbeat', [
            'device_id'   => 'kiosk-device-777',
            'terminal_id' => $terminal->id,
            'store_slug'  => $store->slug,
            'status'      => 'OPEN',
        ]);

        $response->assertOk();

        $fresh = Terminal::withoutGlobalScope('tenant')->find($terminal->id);
        $this->assertEquals(
            $store->id,
            $fresh->tenant_id,
            'A previously unclaimed terminal should be claimable on first contact.'
        );
    }

    public function test_heartbeat_requires_device_id(): void
    {
        $response = $this->postJson('/api/heartbeat', [
            'terminal_id' => 'some-uuid',
            'status'      => 'OPEN',
        ]);
        $response->assertStatus(400);
        $response->assertJsonPath('error', 'Device ID required');
    }
}
