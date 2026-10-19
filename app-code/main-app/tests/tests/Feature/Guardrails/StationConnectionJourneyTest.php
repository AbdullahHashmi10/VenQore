<?php

namespace Tests\Feature\Guardrails;

use App\Models\Terminal;
use App\Models\TerminalPairingToken;
use App\Support\TerminalDeviceAuth;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * End-to-end review of "connect Station to a store" (2026-10-19), following
 * the Station copy-code/re-pair fixes. Covers the rough edges found along the
 * way: a mistyped store name, an expired/used code, two Stations on one
 * store, and reconnecting after a restart or a lost connection.
 */
class StationConnectionJourneyTest extends VenQoreTestCase
{
    private function freshToken($tenant, string $token = null): TerminalPairingToken
    {
        return TerminalPairingToken::withoutTenantScope()->create([
            'tenant_id' => $tenant->id, 'token' => $token ?? TerminalPairingToken::generateToken(), 'expires_at' => now()->addHour(),
        ]);
    }

    public function test_a_mistyped_store_name_says_no_store_was_found_not_enter_a_code(): void
    {
        // Live bug (2026-10-19): the server always answered PAIRING_REQUIRED
        // ("enter the pairing code") even when a code was typed correctly —
        // Station's own UI already branches on a 404 for this, but the server
        // never sent one, so a typo in the store name was never reported.
        $res = $this->postJson('/api/heartbeat', [
            'device_id' => (string) Str::uuid(), 'store_slug' => 'no-such-store-xyz', 'pairing_token' => 'ABCD-2345', 'status' => 'OPEN',
        ]);

        $res->assertStatus(404);
        $res->assertJsonPath('code', 'STORE_NOT_FOUND');
        $this->assertStringNotContainsString('enter the pairing code', (string) $res->json('error'));
    }

    public function test_an_already_paired_till_re_pairing_to_a_typo_store_does_not_silently_keep_the_old_store(): void
    {
        $real = $this->createTenant('real-station-store', 'core', 'active');
        app()->instance('current.tenant', $real);
        $terminal = Terminal::create(['name' => 'Counter', 'device_id' => 'pc-typo-001', 'tenant_id' => $real->id, 'status' => 'OPEN']);
        $secret = TerminalDeviceAuth::issue($terminal);
        app()->forgetInstance('current.tenant');

        $res = $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id' => 'pc-typo-001', 'store_slug' => 'real-station-stor', 'pairing_token' => 'WXYZ-9999', 'status' => 'OPEN',
        ]);

        $res->assertStatus(404)->assertJsonPath('code', 'STORE_NOT_FOUND');
        $this->assertEquals($real->id, $terminal->fresh()->tenant_id);
    }

    public function test_a_routine_background_heartbeat_with_no_code_is_unaffected_by_the_store_not_found_check(): void
    {
        $tenant = $this->createTenant('bg-heartbeat-store', 'core', 'active');
        app()->instance('current.tenant', $tenant);
        $terminal = Terminal::create(['name' => 'Counter', 'device_id' => 'pc-bg-001', 'tenant_id' => $tenant->id, 'status' => 'OPEN']);
        $secret = TerminalDeviceAuth::issue($terminal);
        app()->forgetInstance('current.tenant');

        // Ordinary heartbeat: same slug, no pairing code — must keep working.
        $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id' => 'pc-bg-001', 'store_slug' => $tenant->slug, 'status' => 'OPEN',
        ])->assertOk();
    }

    public function test_an_expired_code_is_refused_with_a_clear_message(): void
    {
        $tenant = $this->createTenant('expired-code-store', 'core', 'active');
        TerminalPairingToken::withoutTenantScope()->create([
            'tenant_id' => $tenant->id, 'token' => 'EXPD-0001', 'expires_at' => now()->subMinute(),
        ]);

        $res = $this->postJson('/api/heartbeat', [
            'device_id' => (string) Str::uuid(), 'store_slug' => $tenant->slug, 'pairing_token' => 'EXPD-0001', 'status' => 'OPEN',
        ]);

        $res->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');
        $this->assertStringContainsString('expired', (string) $res->json('error'));
    }

    public function test_an_already_used_code_cannot_pair_a_second_device(): void
    {
        $tenant = $this->createTenant('reused-code-store', 'core', 'active');
        $token = $this->freshToken($tenant, 'ONCE-0001');

        $this->postJson('/api/heartbeat', [
            'device_id' => 'first-pc', 'store_slug' => $tenant->slug, 'pairing_token' => 'ONCE-0001', 'status' => 'OPEN',
        ])->assertOk();

        $res = $this->postJson('/api/heartbeat', [
            'device_id' => 'second-pc', 'store_slug' => $tenant->slug, 'pairing_token' => 'ONCE-0001', 'status' => 'OPEN',
        ]);

        $res->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');
        $this->assertNull(Terminal::withoutGlobalScope('tenant')->where('device_id', 'second-pc')->first());
    }

    public function test_two_stations_pair_to_the_same_store_independently(): void
    {
        $tenant = $this->createTenant('two-stations-store', 'core', 'active');
        $this->freshToken($tenant, 'FRNT-0001');
        $this->freshToken($tenant, 'BACK-0002');

        $front = $this->postJson('/api/heartbeat', [
            'device_id' => 'front-counter', 'store_slug' => $tenant->slug, 'pairing_token' => 'FRNT-0001', 'status' => 'OPEN',
        ])->assertOk();
        $back = $this->postJson('/api/heartbeat', [
            'device_id' => 'back-counter', 'store_slug' => $tenant->slug, 'pairing_token' => 'BACK-0002', 'status' => 'OPEN',
        ])->assertOk();

        $this->assertNotEquals($front->json('terminal_id'), $back->json('terminal_id'));
        $this->assertEquals(2, Terminal::withoutGlobalScope('tenant')->where('tenant_id', $tenant->id)->count());

        // Each keeps heartbeating independently afterwards.
        $this->withHeaders(['X-Device-Secret' => $front->json('device_secret')])->postJson('/api/heartbeat', [
            'device_id' => 'front-counter', 'store_slug' => $tenant->slug, 'status' => 'OPEN',
        ])->assertOk();
        $this->withHeaders(['X-Device-Secret' => $back->json('device_secret')])->postJson('/api/heartbeat', [
            'device_id' => 'back-counter', 'store_slug' => $tenant->slug, 'status' => 'OPEN',
        ])->assertOk();
    }

    public function test_reconnecting_after_a_restart_needs_no_code(): void
    {
        $tenant = $this->createTenant('restart-store', 'core', 'active');
        app()->instance('current.tenant', $tenant);
        $terminal = Terminal::create(['name' => 'Counter', 'device_id' => 'pc-restart-001', 'tenant_id' => $tenant->id, 'status' => 'CLOSED_NORMALLY']);
        $secret = TerminalDeviceAuth::issue($terminal);
        app()->forgetInstance('current.tenant');

        // App restarts and pings again with no explicit status — must come
        // back OPEN on its own, same identity, no pairing code needed.
        $res = $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id' => 'pc-restart-001', 'store_slug' => $tenant->slug,
        ]);

        $res->assertOk();
        $this->assertEquals('OPEN', $terminal->fresh()->status);
    }

    public function test_reconnecting_after_losing_the_device_key_is_refused_until_re_paired(): void
    {
        $tenant = $this->createTenant('lost-key-store', 'core', 'active');
        app()->instance('current.tenant', $tenant);
        $terminal = Terminal::create(['name' => 'Counter', 'device_id' => 'pc-lost-key-001', 'tenant_id' => $tenant->id, 'status' => 'OPEN']);
        TerminalDeviceAuth::issue($terminal);
        app()->forgetInstance('current.tenant');

        // Station lost its stored secret (fresh install, cleared data) and
        // calls back in with no secret header and no code.
        $res = $this->postJson('/api/heartbeat', [
            'device_id' => 'pc-lost-key-001', 'store_slug' => $tenant->slug, 'status' => 'OPEN',
        ]);

        $res->assertStatus(401)->assertJsonPath('code', 'DEVICE_AUTH_FAILED');
    }
}
