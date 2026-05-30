<?php

namespace Tests\Feature\Module18;

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
