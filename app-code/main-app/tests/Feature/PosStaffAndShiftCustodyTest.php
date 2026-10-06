<?php

namespace Tests\Feature;

use App\Exceptions\PlanLimitException;
use App\Models\RegisterShift;
use App\Models\StaffInvitation;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\SeatAllocationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PosStaffAndShiftCustodyTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $starterTenant;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        // Starter plan: 1 full seat (owner takes it), 1 POS seat
        $this->starterTenant = Tenant::create([
            'name' => 'POS Test Store',
            'slug' => 'pos-test-store-' . uniqid(),
            'status' => 'active',
            'plan' => 'starter',
            'setup_completed' => true,
        ]);
        app()->instance('current.tenant', $this->starterTenant);

        $this->owner = User::factory()->create([
            'email' => 'owner-' . uniqid() . '@example.com',
        ]);
        TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'membership_type' => 'full',
            'status' => 'active',
            'permissions' => ['*'],
        ]);
    }

    public function test_starter_plan_capacity_and_allowances(): void
    {
        $fullCap = SeatAllocationService::getCapacity($this->starterTenant, SeatAllocationService::TYPE_FULL);
        $posCap = SeatAllocationService::getCapacity($this->starterTenant, SeatAllocationService::TYPE_POS);

        // 1 full seat included, owner uses it -> 0 remaining
        $this->assertEquals(1, $fullCap['included']);
        $this->assertEquals(1, $fullCap['used']);
        $this->assertEquals(0, $fullCap['remaining']);
        $this->assertFalse($fullCap['can_allocate']);

        // 1 POS seat included, 0 used -> 1 remaining
        $this->assertEquals(1, $posCap['included']);
        $this->assertEquals(0, $posCap['used']);
        $this->assertEquals(1, $posCap['remaining']);
        $this->assertTrue($posCap['can_allocate']);
    }

    public function test_inviting_pos_staff_reserves_capacity_and_enforces_boundaries(): void
    {
        $this->actingAs($this->owner);

        // Invite 1 POS staff member with 2 capabilities
        $payload = [
            'invitee_name' => 'Order Taker Bob',
            'invitee_email' => 'bob-' . uniqid() . '@example.com',
            'membership_type' => 'pos',
            'pos_capabilities' => ['take_orders', 'take_payments'],
        ];

        $request = \Illuminate\Http\Request::create('/invitations', 'POST', $payload);
        $request->setUserResolver(fn() => $this->owner);

        $controller = app(\App\Http\Controllers\StaffInvitationController::class);
        $response = $controller->store($request);

        $invitation = StaffInvitation::where('tenant_id', $this->starterTenant->id)
            ->where('invitee_name', 'Order Taker Bob')
            ->first();

        $this->assertNotNull($invitation);
        $this->assertEquals('pos', $invitation->membership_type);
        $this->assertEquals(['take_orders', 'take_payments'], $invitation->pos_capabilities);

        // POS capacity is now reserved (1 used / 0 remaining)
        $posCapAfter = SeatAllocationService::getCapacity($this->starterTenant, SeatAllocationService::TYPE_POS);
        $this->assertEquals(1, $posCapAfter['used']);
        $this->assertEquals(0, $posCapAfter['remaining']);
        $this->assertFalse($posCapAfter['can_allocate']);

        // Attempting to invite a second POS staff member exceeds capacity and throws PlanLimitException
        $secondPayload = [
            'invitee_name' => 'Cashier Charlie',
            'invitee_email' => 'charlie-' . uniqid() . '@example.com',
            'membership_type' => 'pos',
            'pos_capabilities' => ['take_orders'],
        ];
        $secondRequest = \Illuminate\Http\Request::create('/invitations', 'POST', $secondPayload);
        $secondRequest->setUserResolver(fn() => $this->owner);

        $this->expectException(PlanLimitException::class);
        $controller->store($secondRequest);
    }

    public function test_pos_staff_post_login_redirect_and_permission_capping(): void
    {
        $posUser = User::factory()->create([
            'email' => 'waiter-' . uniqid() . '@example.com',
        ]);
        $tu = TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id' => $posUser->id,
            'role' => 'cashier',
            'membership_type' => 'pos',
            'pos_capabilities' => ['take_orders'],
            'status' => 'active',
            'permissions' => ['*'], // Attempt broad wildcard
        ]);

        // Post-login redirect sends POS staff directly to /pos
        $redirectResponse = \App\Support\PostLoginRedirect::for($posUser);
        $this->assertEquals(route('store.pos', ['store_slug' => $this->starterTenant->slug]), $redirectResponse->getTargetUrl());

        // Refresh model with relation
        $posUserWithPivot = $this->starterTenant->users()->where('users.id', $posUser->id)->first();

        // Check permission capping - wildcard stripped, only derived POS view/create allowed
        $this->assertTrue($posUserWithPivot->hasPermission('pos.view'));
        $this->assertFalse($posUserWithPivot->hasPermission('pos.checkout')); // Didn't have take_payments
        $this->assertFalse($posUserWithPivot->hasPermission('finance.view'));
        $this->assertFalse($posUserWithPivot->hasPermission('settings.view'));
    }

    public function test_exclusive_cash_drawer_custody_and_shift_modes(): void
    {
        // Core plan has 5 full and 5 POS seats
        $this->starterTenant->update(['plan' => 'core']);

        $cashier1 = User::factory()->create(['email' => 'cashier1-' . uniqid() . '@example.com']);
        $cashier2 = User::factory()->create(['email' => 'cashier2-' . uniqid() . '@example.com']);

        TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id' => $cashier1->id,
            'role' => 'cashier',
            'membership_type' => 'pos',
            'pos_capabilities' => ['take_payments'],
            'status' => 'active',
            'permissions' => ['pos.checkout'],
        ]);

        TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id' => $cashier2->id,
            'role' => 'cashier',
            'membership_type' => 'pos',
            'pos_capabilities' => ['take_payments'],
            'status' => 'active',
            'permissions' => ['pos.checkout'],
        ]);

        // Cashier 1 opens shift on Cashbox Alpha
        $shift1 = RegisterShift::create([
            'tenant_id' => $this->starterTenant->id,
            'register_id' => 'Cashbox Alpha',
            'opened_by' => $cashier1->id,
            'cash_custodian_id' => $cashier1->id,
            'shift_mode' => 'cash_drawer',
            'opening_float' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->assertEquals('cash_drawer', $shift1->shift_mode);
        $this->assertEquals(100.00, (float)$shift1->opening_float);

        // Attempting to open another shift on Cashbox Alpha while shift1 is active must be rejected
        $this->actingAs($cashier2);
        $request = \Illuminate\Http\Request::create('/register-shifts/open', 'POST', [
            'register_id' => 'Cashbox Alpha',
            'opening_float' => 50.00,
        ]);
        $request->setUserResolver(fn() => $cashier2);

        $controller = app(\App\Http\Controllers\RegisterShiftController::class);
        $response = $controller->open($request);

        $this->assertEquals(422, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('currently has an active cash custodian', $data['message']);

        // Reconcile and end shift 1 with physical cash count and handover
        $shift1->update([
            'counted_cash' => 250.00,
            'expected_cash' => 250.00,
            'cash_difference' => 0.00,
            'retained_float' => 100.00,
            'expected_handover' => 150.00,
            'actual_handover' => 150.00,
            'handover_notes' => 'Handed 150 to store manager.',
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $this->assertEquals(150.00, (float)$shift1->expected_handover);
        $this->assertEquals('closed', $shift1->status);

        // Now Cashbox Alpha is available for cashier 2
        $request2 = \Illuminate\Http\Request::create('/register-shifts/open', 'POST', [
            'register_id' => 'Cashbox Alpha',
            'opening_float' => 100.00,
        ]);
        $request2->setUserResolver(fn() => $cashier2);

        $response2 = $controller->open($request2);
        $this->assertEquals(201, $response2->getStatusCode());
    }

    public function test_owner_and_full_staff_excluded_from_personal_shift_flow(): void
    {
        // 1. Owner checking current shift receives is_pos_staff = false and has_open_shift = false
        $this->actingAs($this->owner);
        $controller = app(\App\Http\Controllers\RegisterShiftController::class);
        $reqCurrent = \Illuminate\Http\Request::create('/register-shifts/current', 'GET');
        $reqCurrent->setUserResolver(fn() => $this->owner);

        $resCurrent = $controller->current($reqCurrent);
        $this->assertEquals(200, $resCurrent->getStatusCode());
        $dataCurrent = json_decode($resCurrent->getContent(), true);
        $this->assertFalse($dataCurrent['is_pos_staff']);
        $this->assertFalse($dataCurrent['has_open_shift']);

        // 2. Owner attempting to open a personal shift is rejected with 403 Forbidden
        $reqOpen = \Illuminate\Http\Request::create('/register-shifts/open', 'POST', [
            'register_id' => 'REG-1',
            'opening_float' => 100.00,
        ]);
        $reqOpen->setUserResolver(fn() => $this->owner);

        $resOpen = $controller->open($reqOpen);
        $this->assertEquals(403, $resOpen->getStatusCode());
        $dataOpen = json_decode($resOpen->getContent(), true);
        $this->assertStringContainsString('Work shifts are reserved for POS staff members', $dataOpen['message']);

        // 3. Full staff member (e.g. manager) is also excluded (switch to core plan for 5 full seats)
        $this->starterTenant->update(['plan' => 'core']);
        $manager = User::factory()->create(['email' => 'manager-' . uniqid() . '@example.com']);
        TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id' => $manager->id,
            'role' => 'manager',
            'membership_type' => 'full',
            'status' => 'active',
        ]);

        $this->actingAs($manager);
        $reqOpenManager = \Illuminate\Http\Request::create('/register-shifts/open', 'POST', [
            'register_id' => 'REG-1',
            'opening_float' => 100.00,
        ]);
        $reqOpenManager->setUserResolver(fn() => $manager);

        $resOpenManager = $controller->open($reqOpenManager);
        $this->assertEquals(403, $resOpenManager->getStatusCode());
    }
}

