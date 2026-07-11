<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Terminal;
use App\Models\TerminalActivity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TerminalAppIntegrationTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    /**
     * Test that a new device can pair with a store via the heartbeat endpoint.
     */
    public function test_heartbeat_can_register_new_terminal_and_scope_to_tenant(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        $token = \App\Models\TerminalPairingToken::create([
            'tenant_id' => $tenant->id,
            'token'     => 'PAIR-TOKEN-1',
            'expires_at'=> now()->addHour(),
        ]);

        $response = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenant->slug,
            'name' => 'POS Desktop Terminal',
            'pairing_token' => 'PAIR-TOKEN-1',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['terminal_id']);

        $terminalId = $response->json('terminal_id');
        $this->assertTrue(Str::isUuid($terminalId));

        // Bypass global tenant scope to verify the database record
        $terminal = Terminal::withoutGlobalScope('tenant')->find($terminalId);

        $this->assertNotNull($terminal);
        $this->assertEquals($deviceId, $terminal->device_id);
        $this->assertEquals($tenant->id, $terminal->tenant_id);
    }

    /**
     * Test that subsequent heartbeats for the same device ID return the same terminal ID.
     */
    public function test_heartbeat_returns_existing_terminal_id_for_same_device_id(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        $token = \App\Models\TerminalPairingToken::create([
            'tenant_id' => $tenant->id,
            'token'     => 'PAIR-TOKEN-2',
            'expires_at'=> now()->addHour(),
        ]);

        // First heartbeat
        $response1 = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenant->slug,
            'pairing_token' => 'PAIR-TOKEN-2',
        ]);
        $terminalId1 = $response1->json('terminal_id');

        // Second heartbeat
        $response2 = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenant->slug,
        ]);
        $terminalId2 = $response2->json('terminal_id');

        $this->assertEquals($terminalId1, $terminalId2);
    }

    /**
     * Test that terminal activities can be reported and associated correctly.
     */
    public function test_terminal_activities_logging(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        $token = \App\Models\TerminalPairingToken::create([
            'tenant_id' => $tenant->id,
            'token'     => 'PAIR-TOKEN-3',
            'expires_at'=> now()->addHour(),
        ]);

        // Register terminal
        $response = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenant->slug,
            'pairing_token' => 'PAIR-TOKEN-3',
        ]);
        $terminalId = $response->json('terminal_id');

        $activities = [
            [
                'away_at' => '2026-06-05 10:00:00',
                'back_at' => '2026-06-05 10:05:00',
                'duration_seconds' => 300,
                'screenshot_filename' => 'screen_1.bin',
            ],
            [
                'away_at' => '2026-06-05 10:15:00',
                'back_at' => '2026-06-05 10:17:00',
                'duration_seconds' => 120,
            ]
        ];

        $logResponse = $this->postJson('/api/terminal/activities', [
            'device_id' => $deviceId,
            'terminal_id' => $terminalId,
            'store_slug' => $tenant->slug,
            'activities' => $activities,
        ]);

        $logResponse->assertStatus(200)->assertJson(['success' => true]);

        // Verify activities in database
        $savedActivities = TerminalActivity::withoutGlobalScope('tenant')
            ->where('device_id', $deviceId)
            ->orderBy('away_at', 'asc')
            ->get();

        $this->assertCount(2, $savedActivities);
        $this->assertEquals(300, $savedActivities[0]->duration_seconds);
        $this->assertEquals('screen_1.bin', $savedActivities[0]->screenshot_path);
        $this->assertEquals($tenant->id, $savedActivities[0]->tenant_id);
    }

    /**
     * Test uploading an encrypted screenshot, associating it with activities, and viewing it.
     */
    public function test_terminal_screenshot_upload_decryption_and_security(): void
    {
        $tenant = $this->createTenant('store-test-123');
        $deviceId = (string) Str::uuid();

        // 1. Setup terminal & activity log
        $response = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenant->slug,
        ]);
        $terminalId = $response->json('terminal_id');

        $this->postJson('/api/terminal/activities', [
            'device_id' => $deviceId,
            'terminal_id' => $terminalId,
            'store_slug' => $tenant->slug,
            'activities' => [
                [
                    'away_at' => '2026-06-05 10:00:00',
                    'back_at' => '2026-06-05 10:05:00',
                    'duration_seconds' => 300,
                ]
            ],
        ]);

        // Get the saved activity log
        $activity = TerminalActivity::withoutGlobalScope('tenant')
            ->where('device_id', $deviceId)
            ->first();
        $this->assertNotNull($activity);
        $this->assertNull($activity->screenshot_path);

        // 2. Prepare mock encrypted screenshot
        // AES-256-CBC Encryption matching TerminalActivityController decryption
        $plainText = 'Dummy screenshot PNG bytes';
        $iv = random_bytes(16);
        $key = hash('sha256', $deviceId, true);
        $ciphertext = openssl_encrypt($plainText, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        $encryptedData = $iv . $ciphertext;

        $file = UploadedFile::fake()->createWithContent('screenshot_test.bin', $encryptedData);

        // 3. Upload screenshot
        $uploadResponse = $this->postJson('/api/terminal/screenshot', [
            'device_id' => $deviceId,
            'file' => $file,
        ]);

        $uploadResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $filename = $uploadResponse->json('filename');
        $this->assertNotEmpty($filename);

        // 4. Verify file was saved and associated in database
        Storage::disk('local')->assertExists('terminal_screenshots/' . $filename);

        $activity->refresh();
        $this->assertEquals($filename, $activity->screenshot_path);

        // 5. Verify the tenant owner can decrypt and view the screenshot
        $owner = $this->createTenantUser($tenant, 'owner');
        $viewResponse = $this->actingAs($owner)
            ->get($this->storeUrl($tenant, "terminal-activities/screenshot/{$activity->id}"));

        $viewResponse->assertStatus(200);
        $this->assertEquals('image/png', $viewResponse->headers->get('Content-Type'));
        $this->assertEquals($plainText, $viewResponse->getContent());
    }

    /**
     * Test tenant isolation for screenshot viewing.
     */
    public function test_tenant_isolation_on_screenshot_viewing(): void
    {
        $tenantA = $this->createTenant('store-a');
        $tenantB = $this->createTenant('store-b');
        $deviceId = (string) Str::uuid();

        // Setup terminal & activity log under Tenant A
        $response = $this->postJson('/api/heartbeat', [
            'device_id' => $deviceId,
            'store_slug' => $tenantA->slug,
        ]);
        $terminalId = $response->json('terminal_id');

        $this->postJson('/api/terminal/activities', [
            'device_id' => $deviceId,
            'terminal_id' => $terminalId,
            'store_slug' => $tenantA->slug,
            'activities' => [
                [
                    'away_at' => '2026-06-05 10:00:00',
                    'back_at' => '2026-06-05 10:05:00',
                    'duration_seconds' => 300,
                ]
            ],
        ]);

        $activity = TerminalActivity::withoutGlobalScope('tenant')
            ->where('device_id', $deviceId)
            ->first();

        // Upload and associate mock file
        $plainText = 'A-only image data';
        $iv = random_bytes(16);
        $key = hash('sha256', $deviceId, true);
        $ciphertext = openssl_encrypt($plainText, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        $encryptedData = $iv . $ciphertext;
        $file = UploadedFile::fake()->createWithContent('screen_a.bin', $encryptedData);

        $this->postJson('/api/terminal/screenshot', [
            'device_id' => $deviceId,
            'file' => $file,
        ]);

        // Attempt to view from Tenant B Owner (via Tenant B store prefix URL)
        $ownerB = $this->createTenantUser($tenantB, 'owner');
        
        // When routing to Tenant A's activity ID using Tenant B's store context,
        // it should abort or fail validation due to tenant global scoping
        $viewResponse = $this->actingAs($ownerB)
            ->get($this->storeUrl($tenantB, "terminal-activities/screenshot/{$activity->id}"));

        // Since the activity has tenant_id = Tenant A, querying it under Tenant B's session
        // will throw a ModelNotFoundException (404) because of the HasTenant global scope.
        $viewResponse->assertStatus(404);
    }

    /**
     * Verify security boundaries on the terminal screenshot upload endpoint (L028).
     */
    public function test_terminal_screenshot_upload_security_boundaries(): void
    {
        // 1. Attempt upload with an unauthorized/non-existent device_id -> should return 401 Unauthorized
        $invalidDeviceId = (string) Str::uuid();
        $file = UploadedFile::fake()->create('hacker_screen.bin', 100); // 100 bytes
        
        $response1 = $this->postJson('/api/terminal/screenshot', [
            'device_id' => $invalidDeviceId,
            'file' => $file,
        ]);
        $response1->assertStatus(401);
        $response1->assertJson(['error' => 'Unauthorized device']);

        // 2. Setup a valid terminal device
        $tenant = $this->createTenant('store-secure-test');
        $validDeviceId = (string) Str::uuid();
        $this->postJson('/api/heartbeat', [
            'device_id' => $validDeviceId,
            'store_slug' => $tenant->slug,
        ]);

        // 3. Attempt upload of a file that is too large (11MB = 11264 KB) -> should fail validation (422)
        $largeFile = UploadedFile::fake()->create('huge_screen.bin', 11264); // 11MB
        $response2 = $this->postJson('/api/terminal/screenshot', [
            'device_id' => $validDeviceId,
            'file' => $largeFile,
        ]);
        $response2->assertStatus(422);
    }
}
