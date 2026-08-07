<?php

namespace Tests\Feature\Module16;

uses(\Tests\Feature\VenQoreTestCase::class);

use Tests\Feature\VenQoreTestCase;
use App\Models\StaffAttendance;

/**
 * Module 16 — Staff & Attendance
 *
 * Tests the attendance check-in endpoint and verifies the correct DB row
 * is created with the right user_id and a recent timestamp.
 *
 * Route: POST /s/{slug}/attendance/check-in
 * Controller: App\Http\Controllers\AttendanceController::checkIn
 * Model: App\Models\StaffAttendance (uses HasTenant, HasUuids)
 */
test('check_in_records_timestamp', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $before = now()->subSecond();

    $response = $this->postJson("/s/{$tenant->slug}/attendance/check-in");

    $response->assertOk();
    $response->assertJsonPath('success', true);

    $userId = auth()->id();

    // Assert a StaffAttendance row exists for this user
    $attendance = StaffAttendance::withoutTenantScope()
        ->where('user_id', $userId)
        ->latest()
        ->first();

    $this->assertNotNull($attendance, 'StaffAttendance row must be created on check-in');
    $this->assertEquals($userId, $attendance->user_id);

    // check_in timestamp must be within the last 60 seconds
    $this->assertNotNull($attendance->check_in, 'check_in timestamp must not be null');
    $checkInTime = $attendance->check_in instanceof \Carbon\Carbon
        ? $attendance->check_in
        : \Carbon\Carbon::parse($attendance->check_in);

    $this->assertTrue(
        $checkInTime->greaterThanOrEqualTo($before),
        "check_in ({$checkInTime}) must be >= test start ({$before})"
    );
    $this->assertTrue(
        $checkInTime->diffInSeconds(now()) <= 60,
        "check_in ({$checkInTime}) must be within the last 60 seconds"
    );

    // status must be 'present'
    $this->assertEquals('present', $attendance->status);
});

test('double_check_in_updates_last_active_not_creates_duplicate', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // First check-in
    $this->postJson("/s/{$tenant->slug}/attendance/check-in")->assertOk();
    $userId = auth()->id();

    $countBefore = StaffAttendance::withoutTenantScope()->where('user_id', $userId)->count();

    // Second check-in (same session/day)
    $this->postJson("/s/{$tenant->slug}/attendance/check-in")->assertOk();

    $countAfter = StaffAttendance::withoutTenantScope()->where('user_id', $userId)->count();

    // Must NOT create a duplicate row — returns existing and updates last_active_at
    $this->assertEquals($countBefore, $countAfter, 'Double check-in must not create a duplicate row');
});

test('check_in_concurrency_lock_prevents_duplicates', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $user = auth()->user();

    // Acquire lock manually to simulate concurrent thread in-flight
    $lock = \Illuminate\Support\Facades\Cache::lock("user_{$user->id}_checkin_lock", 10);
    $lock->acquire();

    // Fire a check-in request while lock is held
    $response = $this->postJson("/s/{$tenant->slug}/attendance/check-in");

    // Verify check-in is rejected or returns failure cleanly due to lock
    $response->assertStatus(422);
    $response->assertJsonPath('success', false);
    $response->assertJsonPath('message', 'Check-in is currently processing. Please try again.');

    $lock->release();
});

test('cli_daily_summaries_generation_bypasses_tenant_scope_correctly', function () {
    $tenant = $this->createTenant();
    $owner = $this->createTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    // Seed a check-in for yesterday manually
    $yesterday = \Carbon\Carbon::yesterday();
    $attendance = new \App\Models\StaffAttendance([
        'user_id' => $owner->id,
        'check_in' => $yesterday->copy()->setHour(9)->setMinute(0),
        'check_out' => $yesterday->copy()->setHour(17)->setMinute(0),
        'status' => 'present',
        'total_gap_minutes' => 30,
    ]);
    $attendance->tenant_id = $tenant->id;
    $attendance->created_at = $yesterday;
    $attendance->updated_at = $yesterday;
    $attendance->save();

    // Run daily summaries command
    $this->artisan('staff:generate-daily-summaries', ['--tenant' => $tenant->id])
         ->assertExitCode(0);

    // Assert that a summary row was generated despite CLI environment
    $summary = \App\Models\StaffDailySummary::withoutTenantScope()
        ->where('user_id', $owner->id)
        ->where('tenant_id', $tenant->id)
        ->whereDate('date', $yesterday->toDateString())
        ->first();

    $this->assertNotNull($summary);
    $this->assertEquals(7.5, $summary->total_hours); // 8 hours - 0.5 gap hours
});

test('cannot_accept_invitation_belonging_to_another_tenant', function () {
    $tenantA = $this->createTenant();
    $ownerA = $this->createTenantUser($tenantA, 'owner');
    
    $tenantB = $this->createTenant();
    $ownerB = $this->createTenantUser($tenantB, 'owner');

    $invite = \App\Models\StaffInvitation::create([
        'tenant_id' => $tenantA->id,
        'invited_by' => $ownerA->id,
        'invitee_name' => 'John Doe',
        'invitee_email' => 'john@example.com',
        'email' => 'john@example.com',
        'roles' => ['cashier'],
        'token' => \App\Models\StaffInvitation::generateToken(),
        'short_code' => \App\Models\StaffInvitation::generateShortCode(),
        'status' => 'pending',
        'expires_at' => now()->addHours(48),
    ]);

    $this->actingAs($ownerB);

    // 1. Attempt to accept invitation with Tenant B's slug parameter
    $response = $this->postJson("/invite/accept", [
        'token' => $invite->token,
        'store_slug' => $tenantB->slug,
    ]);

    $response->assertStatus(403);

    // 2. Attempt to accept invitation while current.tenant is bound to Tenant B
    app()->instance('current.tenant', $tenantB);
    $response2 = $this->postJson("/invite/accept", [
        'token' => $invite->token,
    ]);

    $response2->assertStatus(403);

    // Verify no membership was created for Tenant B on Tenant A
    $this->assertDatabaseMissing('tenant_users', [
        'tenant_id' => $tenantA->id,
        'user_id' => $ownerB->id,
    ]);
});

test('platform_admin_views_scoped_attendance_and_gaps_only', function () {
    $tenantA = $this->createTenant();
    $ownerA = $this->createTenantUser($tenantA, 'owner');
    
    $tenantB = $this->createTenant();
    $ownerB = $this->createTenantUser($tenantB, 'owner');

    // Make Tenant A owner a Platform Admin
    $adminUser = $ownerA;
    $adminUser->update(['is_platform_admin' => true]);

    // Create check-ins for Tenant A and Tenant B using a fixed date to prevent timezone skew
    $dateStr = '2026-06-06';
    $date = \Carbon\Carbon::parse($dateStr);

    $attendanceA = new \App\Models\StaffAttendance([
        'user_id' => $ownerA->id,
        'check_in' => $date->copy()->setHour(10)->setMinute(0),
        'status' => 'present',
    ]);
    $attendanceA->tenant_id = $tenantA->id;
    $attendanceA->save();

    $attendanceB = new \App\Models\StaffAttendance([
        'user_id' => $ownerB->id,
        'check_in' => $date->copy()->setHour(10)->setMinute(0),
        'status' => 'present',
    ]);
    $attendanceB->tenant_id = $tenantB->id;
    $attendanceB->save();

    $this->actingAs($adminUser);

    // Visit Tenant A's attendance dashboard
    $response = $this->getJson("/s/{$tenantA->slug}/staff/attendance?date={$dateStr}");

    $response->assertOk();

    // Assert that ONLY Tenant A's check-ins are returned
    $returnedAttendance = $response->original->getData()['page']['props']['attendance'];
    
    $hasTenantA = collect($returnedAttendance)->contains('id', $attendanceA->id);
    $hasTenantB = collect($returnedAttendance)->contains('id', $attendanceB->id);

    $this->assertTrue($hasTenantA);
    $this->assertFalse($hasTenantB, 'Platform Admin must not see other tenant attendances');
});
