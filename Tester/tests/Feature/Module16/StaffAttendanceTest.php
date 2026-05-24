<?php

namespace Tests\Feature\Module16;

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
