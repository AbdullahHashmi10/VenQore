<?php

namespace Tests\Feature\Guardrails;

use App\Models\Terminal;
use App\Models\TerminalPairingToken;
use App\Support\TerminalDeviceAuth;
use Tests\Feature\VenQoreTestCase;

/**
 * Live bug (2026-10-18): a PC that had been paired to one store could not be
 * connected to a new store — "Disconnect store" in Station keeps the device
 * key, and the server answered 403 "Terminal does not belong to this store"
 * even with a valid code from the new store.
 */
class StationRepairToNewStoreTest extends VenQoreTestCase
{
    private function pairedTerminal(): array
    {
        $old = $this->createTenant('old-station-store', 'core', 'active');
        app()->instance('current.tenant', $old);
        $terminal = Terminal::create(['name' => 'Counter', 'device_id' => 'pc-moving-001', 'tenant_id' => $old->id, 'status' => 'OPEN']);
        $secret = TerminalDeviceAuth::issue($terminal);

        $new = $this->createTenant('new-station-store', 'core', 'trial');
        $token = TerminalPairingToken::withoutTenantScope()->create([
            'tenant_id' => $new->id, 'token' => TerminalPairingToken::generateToken(), 'expires_at' => now()->addHour(),
        ]);
        app()->forgetInstance('current.tenant');

        return [$terminal, $secret, $new, $token];
    }

    public function test_the_same_pc_moves_to_a_new_store_with_its_key_and_a_new_code(): void
    {
        [$terminal, $secret, $new, $token] = $this->pairedTerminal();

        $res = $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id' => 'pc-moving-001', 'store_slug' => $new->slug, 'pairing_token' => $token->token, 'status' => 'OPEN',
        ]);

        $res->assertOk();
        $this->assertNotEmpty($res->json('device_secret'));
        $this->assertEquals($new->id, Terminal::withoutGlobalScope('tenant')->find($terminal->id)->tenant_id);
        $this->assertNotNull($token->fresh()->used_at);
    }

    public function test_a_valid_code_alone_cannot_take_another_stores_pc(): void
    {
        [$terminal, , $new, $token] = $this->pairedTerminal();

        // Knows the device_id and has its own code, but not the PC's key.
        $res = $this->postJson('/api/heartbeat', [
            'device_id' => 'pc-moving-001', 'store_slug' => $new->slug, 'pairing_token' => $token->token, 'status' => 'OPEN',
        ]);

        $this->assertContains($res->status(), [401, 403]);
        $this->assertNotEquals($new->id, Terminal::withoutGlobalScope('tenant')->find($terminal->id)->tenant_id);
        $this->assertNull($token->fresh()->used_at);
    }

    public function test_a_pc_with_a_fresh_device_id_pairs_to_the_new_store(): void
    {
        [, , $new, $token] = $this->pairedTerminal();

        // What Station does when its old identity is refused.
        $this->postJson('/api/heartbeat', [
            'device_id' => 'pc-moving-002', 'store_slug' => $new->slug, 'pairing_token' => $token->token, 'status' => 'OPEN',
        ])->assertOk();

        $this->assertEquals($new->id, Terminal::withoutGlobalScope('tenant')->where('device_id', 'pc-moving-002')->value('tenant_id'));
    }
}
