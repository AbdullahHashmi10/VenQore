<?php

namespace Tests\Feature;

use App\Models\Terminal;
use App\Models\TerminalActivity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * VenQore Station ↔ cloud terminal API contract.
 *
 * Updated 2026-09-10 (SEC-04): terminals exist only after pairing with a
 * one-time pairing token; pairing returns a device secret exactly once; every
 * later terminal call must present it (X-Device-Secret). Activity/screenshot
 * endpoints are behind the venqore.terminal_telemetry_enabled switch.
 */
class TerminalAppIntegrationTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['venqore.terminal_telemetry_enabled' => true]);
    }

    /** @return array{0:string,1:string} [terminalId, deviceSecret] */
    private function pair($tenant, string $deviceId, string $token): array
    {
        \App\Models\TerminalPairingToken::create([
            'tenant_id'  => $tenant->id,
            'token'      => $token,
            'expires_at' => now()->addHour(),
        ]);

        $response = $this->postJson('/api/heartbeat', [
            'device_id'     => $deviceId,
            'store_slug'    => $tenant->slug,
            'pairing_token' => $token,
        ])->assertOk();

        $secret = $response->json('device_secret');
        $this->assertIsString($secret);
        $this->assertSame(64, strlen($secret));

        return [$response->json('terminal_id'), $secret];
    }

    public function test_heartbeat_can_register_new_terminal_and_scope_to_tenant(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        [$terminalId] = $this->pair($tenant, $deviceId, 'PAIR-TOKEN-1');
        $this->assertTrue(Str::isUuid($terminalId));

        $terminal = Terminal::withoutGlobalScope('tenant')->find($terminalId);
        $this->assertNotNull($terminal);
        $this->assertEquals($deviceId, $terminal->device_id);
        $this->assertEquals($tenant->id, $terminal->tenant_id);
        $this->assertNotEmpty($terminal->device_secret_hash);
    }

    public function test_unpaired_device_cannot_create_a_terminal(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        $this->postJson('/api/heartbeat', [
            'device_id'  => $deviceId,
            'store_slug' => $tenant->slug,
        ])->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');

        $this->assertNull(Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first());
    }

    public function test_heartbeat_returns_existing_terminal_id_and_requires_secret(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();
        [$terminalId1, $secret] = $this->pair($tenant, $deviceId, 'PAIR-TOKEN-2');

        // Without the secret: refused.
        $this->postJson('/api/heartbeat', [
            'device_id'  => $deviceId,
            'store_slug' => $tenant->slug,
        ])->assertStatus(401);

        // With the secret: same terminal, and the secret is not re-sent.
        $response2 = $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/heartbeat', [
            'device_id'  => $deviceId,
            'store_slug' => $tenant->slug,
        ])->assertOk();

        $this->assertEquals($terminalId1, $response2->json('terminal_id'));
        $this->assertNull($response2->json('device_secret'));
    }

    public function test_legacy_paired_terminal_must_re_pair_with_a_code(): void
    {
        $tenant = $this->createTenant('store-legacy');
        app()->instance('current.tenant', $tenant);
        Terminal::create([
            'name' => 'Old Station', 'device_id' => 'legacy-dev-1',
            'tenant_id' => $tenant->id, 'status' => 'OPEN', 'is_active' => true,
        ]);
        app()->forgetInstance('current.tenant');

        // Knowing the device ID alone gets nothing (recheck SEC-04: no trust on first use).
        $this->postJson('/api/heartbeat', ['device_id' => 'legacy-dev-1', 'store_slug' => $tenant->slug])
            ->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED')->assertJsonMissingPath('device_secret');

        // A code from ANOTHER store does not work.
        $other = $this->createTenant('store-legacy-other');
        \App\Models\TerminalPairingToken::create(['tenant_id' => $other->id, 'token' => 'OTHR-2345', 'expires_at' => now()->addHour()]);
        $this->postJson('/api/heartbeat', ['device_id' => 'legacy-dev-1', 'store_slug' => $tenant->slug, 'pairing_token' => 'OTHR-2345'])
            ->assertStatus(403);

        // The store's own code re-pairs it and returns the secret once.
        \App\Models\TerminalPairingToken::create(['tenant_id' => $tenant->id, 'token' => 'LEGA-2345', 'expires_at' => now()->addHour()]);
        $first = $this->postJson('/api/heartbeat', ['device_id' => 'legacy-dev-1', 'store_slug' => $tenant->slug, 'pairing_token' => 'lega 2345'])->assertOk();
        $secret = $first->json('device_secret');
        $this->assertNotEmpty($secret);

        // Without the secret: refused. With it: fine. The code is spent.
        $this->postJson('/api/heartbeat', ['device_id' => 'legacy-dev-1', 'store_slug' => $tenant->slug])->assertStatus(401);
        $this->withHeaders(['X-Device-Secret' => $secret])
            ->postJson('/api/heartbeat', ['device_id' => 'legacy-dev-1', 'store_slug' => $tenant->slug])->assertOk()->assertJsonMissingPath('device_secret');
        $this->assertNotNull(\App\Models\TerminalPairingToken::withoutTenantScope()->where('token', 'LEGA-2345')->value('used_at'));
    }

    public function test_a_pairing_code_pairs_only_one_device(): void
    {
        $tenant = $this->createTenant('store-once');
        \App\Models\TerminalPairingToken::create(['tenant_id' => $tenant->id, 'token' => 'ONCE-2345', 'expires_at' => now()->addHour()]);

        $this->postJson('/api/heartbeat', ['device_id' => 'dev-a', 'store_slug' => $tenant->slug, 'pairing_token' => 'ONCE-2345'])->assertOk();
        $this->postJson('/api/heartbeat', ['device_id' => 'dev-b', 'store_slug' => $tenant->slug, 'pairing_token' => 'ONCE-2345'])
            ->assertStatus(403)->assertJsonPath('code', 'PAIRING_REQUIRED');
        $this->assertSame(1, Terminal::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count());
    }

    public function test_terminal_activities_logging(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();
        [$terminalId, $secret] = $this->pair($tenant, $deviceId, 'PAIR-TOKEN-3');

        $activities = [
            [
                'away_at' => '2026-06-05 10:00:00',
                'back_at' => '2026-06-05 10:05:00',
                'duration_seconds' => 300,
                'screenshot_filename' => '../../evil.bin', // ignored by the server
            ],
            [
                'away_at' => '2026-06-05 10:15:00',
                'back_at' => '2026-06-05 10:17:00',
                'duration_seconds' => 120,
            ],
        ];

        // Without the device secret → 401
        $this->postJson('/api/terminal/activities', [
            'device_id' => $deviceId, 'store_slug' => $tenant->slug, 'activities' => $activities,
        ])->assertStatus(401);

        $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/terminal/activities', [
            'device_id'  => $deviceId,
            'terminal_id' => $terminalId,
            'store_slug' => $tenant->slug,
            'activities' => $activities,
        ])->assertStatus(200)->assertJson(['success' => true]);

        $saved = TerminalActivity::withoutGlobalScope('tenant')
            ->where('device_id', $deviceId)->orderBy('away_at', 'asc')->get();

        $this->assertCount(2, $saved);
        $this->assertEquals(300, $saved[0]->duration_seconds);
        $this->assertNull($saved[0]->screenshot_path);
        $this->assertEquals($tenant->id, $saved[0]->tenant_id);
    }

    public function test_terminal_screenshot_upload_decryption_and_security(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();
        [$terminalId, $secret] = $this->pair($tenant, $deviceId, 'PAIR-TOKEN-4');
        $headers = ['X-Device-Secret' => $secret];

        $this->withHeaders($headers)->postJson('/api/terminal/activities', [
            'device_id' => $deviceId, 'store_slug' => $tenant->slug,
            'activities' => [['away_at' => '2026-06-05 10:00:00', 'back_at' => '2026-06-05 10:05:00', 'duration_seconds' => 300]],
        ])->assertOk();

        $activity = TerminalActivity::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        $this->assertNotNull($activity);
        $this->assertNull($activity->screenshot_path);

        // The station sends the PNG over TLS; the server encrypts it at rest.
        $plainText = "\x89PNG\r\n\x1a\n" . 'Dummy screenshot PNG bytes';
        $file = UploadedFile::fake()->createWithContent('../../../screenshot_test.bin', $plainText);

        $upload = $this->withHeaders($headers)->postJson('/api/terminal/screenshot', [
            'device_id' => $deviceId,
            'file'      => $file,
        ])->assertStatus(200)->assertJson(['success' => true]);

        $filename = $upload->json('filename');
        $this->assertStringStartsWith($tenant->id . '/' . $terminalId . '/', $filename);
        $this->assertStringNotContainsString('..', $filename);
        Storage::disk('local')->assertExists('terminal_screenshots/' . $filename);
        $atRest = Storage::disk('local')->get('terminal_screenshots/' . $filename);
        $this->assertStringNotContainsString('Dummy screenshot', $atRest, 'Screenshots must be encrypted at rest.');
        $this->assertStringNotContainsString($deviceId, $atRest);

        $activity->refresh();
        $this->assertEquals($filename, $activity->screenshot_path);

        $owner = $this->createTenantUser($tenant, 'owner');
        $view = $this->actingAs($owner)->get($this->storeUrl($tenant, "terminal-activities/screenshot/{$activity->id}"));
        $view->assertStatus(200);
        $this->assertEquals('image/png', $view->headers->get('Content-Type'));
        $this->assertEquals($plainText, $view->getContent());
    }

    public function test_tenant_isolation_on_screenshot_viewing(): void
    {
        $tenantA = $this->createTenant('store-a');
        $tenantB = $this->createTenant('store-b');
        $deviceId = (string) Str::uuid();
        [, $secret] = $this->pair($tenantA, $deviceId, 'PAIR-TOKEN-5');
        $headers = ['X-Device-Secret' => $secret];

        $this->withHeaders($headers)->postJson('/api/terminal/activities', [
            'device_id' => $deviceId, 'store_slug' => $tenantA->slug,
            'activities' => [['away_at' => '2026-06-05 10:00:00', 'back_at' => '2026-06-05 10:05:00', 'duration_seconds' => 300]],
        ])->assertOk();

        $activity = TerminalActivity::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();

        // Old station format (device-ID key) is still accepted and re-encrypted.
        $iv = random_bytes(16);
        $ciphertext = openssl_encrypt("\x89PNG\r\n\x1a\n" . 'A-only image data', 'aes-256-cbc', hash('sha256', $deviceId, true), OPENSSL_RAW_DATA, $iv);
        $this->withHeaders($headers)->postJson('/api/terminal/screenshot', [
            'device_id' => $deviceId,
            'file'      => UploadedFile::fake()->createWithContent('screen_a.bin', $iv . $ciphertext),
        ])->assertOk();

        $ownerB = $this->createTenantUser($tenantB, 'owner');
        $this->actingAs($ownerB)
            ->get($this->storeUrl($tenantB, "terminal-activities/screenshot/{$activity->id}"))
            ->assertStatus(404);
    }

    public function test_screenshots_stored_in_the_old_format_still_open(): void
    {
        $tenant = $this->createTenant('store-legacy-shot');
        $deviceId = (string) Str::uuid();
        [$terminalId] = $this->pair($tenant, $deviceId, 'PAIR-TOKEN-7');

        $png = "\x89PNG\r\n\x1a\n" . 'stored before at-rest encryption';
        $iv = random_bytes(16);
        $legacy = $iv . openssl_encrypt($png, 'aes-256-cbc', hash('sha256', $deviceId, true), OPENSSL_RAW_DATA, $iv);
        $relative = $tenant->id . '/' . $terminalId . '/old.bin';
        Storage::put('terminal_screenshots/' . $relative, $legacy);

        app()->instance('current.tenant', $tenant);
        $activity = TerminalActivity::create([
            'terminal_id' => $terminalId, 'device_id' => $deviceId, 'tenant_id' => $tenant->id,
            'away_at' => now()->subMinutes(10), 'back_at' => now(), 'duration_seconds' => 600,
            'screenshot_path' => $relative,
        ]);
        app()->forgetInstance('current.tenant');

        $owner = $this->createTenantUser($tenant, 'owner');
        $view = $this->actingAs($owner)->get($this->storeUrl($tenant, "terminal-activities/screenshot/{$activity->id}"))->assertOk();
        $this->assertSame($png, $view->getContent());
    }

    public function test_terminal_screenshot_upload_security_boundaries(): void
    {
        $file = UploadedFile::fake()->create('hacker_screen.bin', 100);
        $this->postJson('/api/terminal/screenshot', [
            'device_id' => (string) Str::uuid(),
            'file'      => $file,
        ])->assertStatus(401)->assertJson(['error' => 'Unauthorized device']);

        $tenant = $this->createTenant('store-secure-test');
        $validDeviceId = (string) Str::uuid();
        [, $secret] = $this->pair($tenant, $validDeviceId, 'PAIR-TOKEN-6');

        // Wrong secret → 401
        $this->withHeaders(['X-Device-Secret' => str_repeat('x', 64)])->postJson('/api/terminal/screenshot', [
            'device_id' => $validDeviceId,
            'file'      => UploadedFile::fake()->create('s.bin', 10),
        ])->assertStatus(401);

        // Not a PNG (and not the old format) → 422
        $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/terminal/screenshot', [
            'device_id' => $validDeviceId,
            'file'      => UploadedFile::fake()->createWithContent('x.bin', '<?php echo 1;'),
        ])->assertStatus(422);

        // Oversized file → 422
        $this->withHeaders(['X-Device-Secret' => $secret])->postJson('/api/terminal/screenshot', [
            'device_id' => $validDeviceId,
            'file'      => UploadedFile::fake()->create('huge_screen.bin', 11264),
        ])->assertStatus(422);
    }
}
