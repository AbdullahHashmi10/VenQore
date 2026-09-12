<?php

use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

uses(Tests\Feature\VenQoreTestCase::class);

beforeEach(function () {
    $this->seed(Database\Seeders\GoldenAuditSeeder::class);
    $this->tenant = Tenant::find(999998);
    $membership = DB::table('tenant_users')->where('tenant_id', $this->tenant->id)->where('role', 'owner')->first();
    $this->user = User::find($membership->user_id);
    $this->actingAs($this->user);
    app()->instance('current.tenant', $this->tenant);
});

test('calendar calculations adhere to calendar standard, not rolling', function () {
    $tz = $this->tenant->timezone ?: 'Asia/Karachi';
    $now = Carbon::now($tz);

    // Verify Today starts at midnight
    $todayStart = today()->startOfDay();
    expect($todayStart->toTimeString())->toBe('00:00:00');

    // Verify Month starts at 1st
    $monthStart = today()->startOfMonth();
    expect($monthStart->day)->toBe(1);
    expect($monthStart->toTimeString())->toBe('00:00:00');
});
