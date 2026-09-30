<?php

namespace Tests\Feature\Approval;

use App\Models\StaffInvitation;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\Feature\VenQoreTestCase;

class R13StaffInvitationModeTest extends VenQoreTestCase
{
    public function test_staff_invitation_stores_and_carries_transaction_approval_mode(): void
    {
        $tenant = $this->createTenant('inv-mode-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);
        $this->withoutExceptionHandling();

        $admin = $this->createTenantUser($tenant, 'admin');
        $this->actingAsTenantUserModel($admin, $tenant);

        // 1. Create invitation with transaction_approval_mode = 'required'
        $email = 'cashier_' . uniqid() . '@example.com';
        $response = $this->post($this->storeUrl($tenant, '/admin/invitations'), [
            'invitee_name'              => 'Jane Doe',
            'invitee_email'             => $email,
            'roles'                     => ['cashier'],
            'transaction_approval_mode' => 'required',
        ]);
        $response->assertSessionHasNoErrors();

        $invitation = StaffInvitation::where('tenant_id', $tenant->id)
            ->where('invitee_email', $email)
            ->first();

        $this->assertNotNull($invitation, 'Invitation should be created');
        $this->assertSame('required', $invitation->transaction_approval_mode, 'Invitation must record transaction_approval_mode');

        // 2. User registers and accepts invite
        $inviteeUser = User::create([
            'name'     => 'Jane Doe',
            'email'    => $email,
            'password' => Hash::make('Secret123!'),
        ]);

        $invitation->update(['status' => 'awaiting_approval']);

        // 3. Admin approves invitation
        $approveResponse = $this->post($this->storeUrl($tenant, "/admin/invitations/{$invitation->id}/approve"));
        $approveResponse->assertSessionHasNoErrors();

        $tenantUser = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $inviteeUser->id)
            ->first();

        $this->assertNotNull($tenantUser, 'TenantUser should be created upon approval');
        $this->assertSame('required', $tenantUser->transaction_approval_mode, 'TenantUser must carry transaction_approval_mode from invitation');
    }
}
