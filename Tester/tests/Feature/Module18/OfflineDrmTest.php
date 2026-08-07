<?php

namespace Tests\Feature\Module18;

uses(\Tests\Feature\VenQoreTestCase::class);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Module 18 — Offline DRM (post-launch feature)
 * Hardware fingerprinting, offline license validation, and grace period
 * enforcement for air-gapped POS terminals.
 */
test('drm_license_validated_on_startup', function () {
    $tenant = $this->createTenant();

    $licenseId = Str::uuid()->toString();
    $licenseKey = 'LIC-' . Str::upper(Str::random(12));

    // Register active license without hardware fingerprint initially (virgin install)
    DB::table('drm_licenses')->insert([
        'id'                   => $licenseId,
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => null,
        'last_validated_at'    => null,
        'grace_period_days'    => 30,
        'is_active'            => 1,
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // Perform validation from terminal (sends key & fingerprint)
    $response = $this->postJson('/api/drm/validate', [
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-FINGERPRINT-12345',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'status' => 'success',
        'message' => 'License validated successfully.',
    ]);

    // Assert fingerprint and validation date are locked in
    $this->assertDatabaseHas('drm_licenses', [
        'id'                   => $licenseId,
        'hardware_fingerprint' => 'HW-FINGERPRINT-12345',
    ]);

    $license = DB::table('drm_licenses')->where('id', $licenseId)->first();
    $this->assertNotNull($license->last_validated_at);
});

test('grace_period_expires_after_configured_days', function () {
    $tenant = $this->createTenant();

    $licenseKey = 'LIC-GRACE-CHECK';

    // Last validated 6 days ago, grace period is 5 days (expired)
    DB::table('drm_licenses')->insert([
        'id'                   => Str::uuid()->toString(),
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-GRACE-999',
        'last_validated_at'    => now()->subDays(6),
        'grace_period_days'    => 5,
        'is_active'            => 1,
        'created_at'           => now()->subDays(10),
        'updated_at'           => now()->subDays(10),
    ]);

    // Accessing protected endpoint with expired offline validation
    $response = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-GRACE-999',
    ])->getJson('/api/drm/protected');

    $response->assertStatus(403);
    $response->assertJsonFragment([
        'error' => 'Offline grace period has expired. Please connect to the internet to validate your license.',
    ]);

    // Update validation date to 4 days ago (within grace period of 5 days)
    DB::table('drm_licenses')
        ->where('license_key', $licenseKey)
        ->update(['last_validated_at' => now()->subDays(4)]);

    // Access again
    $goodResponse = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-GRACE-999',
    ])->getJson('/api/drm/protected');

    $goodResponse->assertStatus(200);
    $goodResponse->assertJson(['status' => 'access_granted']);
});

test('hardware_fingerprint_mismatch_blocks_access', function () {
    $tenant = $this->createTenant();

    $licenseKey = 'LIC-FINGERPRINT-CHECK';

    // Locked to HW-FINGERPRINT-A
    DB::table('drm_licenses')->insert([
        'id'                   => Str::uuid()->toString(),
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-FINGERPRINT-A',
        'last_validated_at'    => now(),
        'grace_period_days'    => 30,
        'is_active'            => 1,
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // Attempt access with mismatched fingerprint (HW-FINGERPRINT-B)
    $badResponse = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-FINGERPRINT-B',
    ])->getJson('/api/drm/protected');

    $badResponse->assertStatus(403);
    $badResponse->assertJsonFragment([
        'error' => 'Hardware fingerprint mismatch.',
    ]);

    // Attempt validation endpoint with mismatched fingerprint
    $badValResponse = $this->postJson('/api/drm/validate', [
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-FINGERPRINT-B',
    ]);
    $badValResponse->assertStatus(403);
    $badValResponse->assertJsonFragment([
        'status' => 'error',
        'message' => 'Hardware fingerprint mismatch.',
    ]);

    // Access with matching fingerprint (HW-FINGERPRINT-A)
    $goodResponse = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-FINGERPRINT-A',
    ])->getJson('/api/drm/protected');

    $goodResponse->assertStatus(200);
    $goodResponse->assertJson(['status' => 'access_granted']);
});

// ─────────────────────────────────────────────────────────────
// DATABASE ROW TAMPERING INTEGRITY TESTS
// ─────────────────────────────────────────────────────────────

test('blocks access if the local license row signature has been tampered with', function () {
    $tenant = $this->createTenant();
    $licenseKey = 'LIC-SIG-CHECK';

    // 1. Create a valid, signed license key row
    $licenseId = \Illuminate\Support\Str::uuid()->toString();
    $graceDays = 30;
    $isActive = 1;
    
    // Generate valid HMAC signature of the critical fields using app key
    $dataToSign = $licenseId . $tenant->id . $licenseKey . 'HW-SIG-999' . $graceDays . $isActive;
    $validSignature = hash_hmac('sha256', $dataToSign, config('app.key'));

    DB::table('drm_licenses')->insert([
        'id'                   => $licenseId,
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-SIG-999',
        'last_validated_at'    => now(),
        'grace_period_days'    => $graceDays,
        'is_active'            => $isActive,
        'signature'            => $validSignature, // Cryptographic row signature
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // 2. Perform access - should be granted (status 200)
    $responseGood = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-SIG-999',
    ])->getJson('/api/drm/protected');
    $responseGood->assertStatus(200);

    // 3. Simulate local database tampering (updating is_active and grace_period without updating signature)
    DB::table('drm_licenses')
        ->where('license_key', $licenseKey)
        ->update([
            'grace_period_days' => 999999, // tampered value
            'is_active'         => 1,
        ]);

    // 4. Access again - should fail with 403 because signature check fails
    $responseTampered = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-SIG-999',
    ])->getJson('/api/drm/protected');
    
    $responseTampered->assertStatus(403);
    $responseTampered->assertJsonFragment([
        'error' => 'Cryptographic integrity check failed. License file has been tampered with.',
    ]);
});

// ─────────────────────────────────────────────────────────────
// CRYPTOGRAPHIC CHALLENGE-RESPONSE VERIFICATION TESTS
// ─────────────────────────────────────────────────────────────

test('rejects spoofed hardware fingerprints using signed client nonces or cryptographic device challenge', function () {
    $tenant = $this->createTenant();
    $licenseKey = 'LIC-CRYPT-CHALLENGE';

    // Seed valid license row
    DB::table('drm_licenses')->insert([
        'id'                   => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-KEY-MATCH',
        'last_validated_at'    => now(),
        'grace_period_days'    => 30,
        'is_active'            => 1,
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // Attempting access with plain headers (representing simple string match) should fail if challenge verification is required
    $responsePlain = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-KEY-MATCH',
    ])->getJson('/api/drm/protected');

    // Missing signed challenge token / signature header
    $responsePlain->assertStatus(403);
    $responsePlain->assertJsonFragment([
        'error' => 'Cryptographic device verification failed. Hardware signature token is missing.',
    ]);
});

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE TENANT CONTEXT TESTS
// ─────────────────────────────────────────────────────────────

test('binds the resolved license tenant to the DI container if current.tenant is not bound', function () {
    $tenant = $this->createTenant('drm-di-bind-test');
    $licenseKey = 'LIC-DI-BIND';

    DB::table('drm_licenses')->insert([
        'id'                   => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id'            => $tenant->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-DI-FINGERPRINT',
        'last_validated_at'    => now(),
        'grace_period_days'    => 30,
        'is_active'            => 1,
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // Ensure current.tenant is not bound
    app()->forgetInstance('current.tenant');
    expect(app()->bound('current.tenant'))->toBeFalse();

    // Hit endpoint
    $response = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-DI-FINGERPRINT',
    ])->getJson('/api/drm/protected');

    $response->assertStatus(200);

    // Verify middleware bound the correct tenant into the container
    expect(app()->bound('current.tenant'))->toBeTrue();
    expect(app('current.tenant')->id)->toBe($tenant->id);
});

test('prevents tenant isolation mismatch when authenticated user store does not match license store', function () {
    // Tenant A owns the license, Tenant B is the user's active session
    $tenantA = $this->createTenant('store-owns-license');
    $tenantB = $this->createTenant('user-active-session');
    
    $licenseKey = 'LIC-CROSS-ISOLATION';

    DB::table('drm_licenses')->insert([
        'id'                   => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id'            => $tenantA->id,
        'license_key'          => $licenseKey,
        'hardware_fingerprint' => 'HW-ISO-FINGERPRINT',
        'last_validated_at'    => now(),
        'grace_period_days'    => 30,
        'is_active'            => 1,
        'created_at'           => now(),
        'updated_at'           => now(),
    ]);

    // Log in as cashier under Tenant B
    $this->actingAsCashier($tenantB);

    // Request with Tenant A's license key - must reject or strictly override container context to Tenant A
    $response = $this->withHeaders([
        'X-DRM-License-Key'          => $licenseKey,
        'X-DRM-Hardware-Fingerprint' => 'HW-ISO-FINGERPRINT',
    ])->getJson('/api/drm/protected');

    // Mismatched tenant session and license must fail with 403 Forbidden
    $response->assertStatus(403);
    $response->assertJsonFragment([
        'error' => 'DRM License context mismatch. Request store session does not match license owner.',
    ]);
});
