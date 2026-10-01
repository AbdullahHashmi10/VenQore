<?php

namespace Tests\Feature;

use App\Models\ApprovalDocument;
use App\Models\Setting;
use App\Models\StaffInvitation;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Policies\ApprovalDocumentPolicy;
use App\Services\Approval\ApprovalPolicyResolver;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class StaffApprovalPolicyEnforcementTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $tenant;
    protected User $owner;
    protected User $manager;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Audit Test Store',
            'slug' => 'audit-test-store-' . uniqid(),
            'status' => 'active',
            'setup_completed' => true,
        ]);
        app()->instance('current.tenant', $this->tenant);

        $this->owner = User::factory()->create([
            'email' => 'owner-' . uniqid() . '@example.com',
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'status' => 'active',
            'permissions' => ['*'],
            'transaction_approval_mode' => 'direct',
        ]);

        $this->manager = User::factory()->create([
            'email' => 'manager-' . uniqid() . '@example.com',
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->manager->id,
            'role' => 'manager',
            'status' => 'active',
            'permissions' => ['approvals.approve', 'approvals.review'],
            'transaction_approval_mode' => 'direct',
        ]);

        $this->cashier = User::factory()->create([
            'email' => 'cashier-' . uniqid() . '@example.com',
        ]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->cashier->id,
            'role' => 'cashier',
            'status' => 'active',
            'permissions' => ['pos.checkout'],
            'transaction_approval_mode' => 'required',
        ]);
    }

    public function test_staff_invitation_stores_and_applies_approval_metadata(): void
    {
        $this->actingAs($this->owner);
        app()->instance('current.tenant', $this->tenant);

        $payload = [
            'invitee_name' => 'Alice Auditor',
            'invitee_email' => 'alice-' . uniqid() . '@example.com',
            'roles' => ['cashier'],
            'transaction_approval_mode' => 'required',
            'assigned_approvers' => [$this->manager->id],
            'approval_threshold_amount' => '1500.50',
            'approval_overrides' => [
                'customer_receipt' => 'direct',
                'operating_expense' => 'required',
            ],
            'designation' => 'Senior Cashier',
        ];

        $request = \Illuminate\Http\Request::create('/invitations', 'POST', $payload);
        $request->setUserResolver(fn() => $this->owner);

        $controller = app(\App\Http\Controllers\StaffInvitationController::class);
        $response = $controller->store($request);

        $invitation = StaffInvitation::where('tenant_id', $this->tenant->id)
            ->where('invitee_name', 'Alice Auditor')
            ->first();

        $this->assertNotNull($invitation);
        $this->assertIsArray($invitation->metadata);
        $this->assertEquals([$this->manager->id], $invitation->metadata['assigned_approvers']);
        $this->assertEquals(1500.50, (float)$invitation->metadata['approval_threshold_amount']);
        $this->assertEquals('direct', $invitation->metadata['approval_overrides']['customer_receipt']);

        // Now test acceptance and metadata application
        $newStaffUser = User::factory()->create(['email' => $payload['invitee_email']]);
        $invitation->accepted_at = now();
        $invitation->status = 'accepted';
        $invitation->save();

        $tu = TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $newStaffUser->id,
            'role' => $invitation->role,
            'status' => 'active',
        ]);

        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('applyInvitationMetadata');
        $method->setAccessible(true);
        $method->invoke($controller, $invitation, $newStaffUser, $tu);

        // Verify applied to TenantUser
        $tu->refresh();
        $this->assertEquals('required', $tu->transaction_approval_mode);

        // Verify applied to Settings
        $supervisorsSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_supervisors_user_{$newStaffUser->id}")
            ->value('value');
        $this->assertEquals([$this->manager->id], json_decode($supervisorsSetting, true));

        $thresholdSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_threshold_user_{$newStaffUser->id}")
            ->value('value');
        $this->assertEquals('1500.5', (string)(float)$thresholdSetting);

        $overrideSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_user_{$newStaffUser->id}_customer_receipt")
            ->value('value');
        $this->assertEquals('direct', $overrideSetting);
    }

    public function test_approval_policy_resolver_strictly_enforces_user_threshold(): void
    {
        $resolver = app(ApprovalPolicyResolver::class);

        // Set user threshold at 2000
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => "approval_threshold_user_{$this->cashier->id}"],
            ['value' => '2000.00']
        );

        // Submitting 1500 with user mode 'required' and override 'direct'
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => "approval_user_{$this->cashier->id}_customer_receipt"],
            ['value' => 'direct']
        );

        // At 1500, override direct takes precedence since amount <= user threshold
        $result = $resolver->resolve($this->tenant, $this->cashier, 'customer_receipt', 1500.00);
        $this->assertFalse($result['requires_approval']);
        $this->assertEquals('direct', $result['effective_mode']);

        // At 2500, user threshold is exceeded, forcing approval
        $resultExceeded = $resolver->resolve($this->tenant, $this->cashier, 'customer_receipt', 2500.00);
        $this->assertTrue($resultExceeded['requires_approval']);
        $this->assertEquals('required_by_threshold', $resultExceeded['effective_mode']);
    }

    public function test_approval_document_policy_restricts_to_assigned_supervisors(): void
    {
        $policy = app(ApprovalDocumentPolicy::class);

        // Create an unassigned other manager
        $otherManager = User::factory()->create();
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $otherManager->id,
            'role' => 'manager',
            'status' => 'active',
            'permissions' => ['approvals.approve'],
        ]);

        // Assign only $this->manager as supervisor for cashier
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => "approval_supervisors_user_{$this->cashier->id}"],
            ['value' => json_encode([$this->manager->id])]
        );

        $doc = new ApprovalDocument([
            'tenant_id' => $this->tenant->id,
            'document_type' => 'customer_receipt',
            'maker_id' => $this->cashier->id,
            'status' => 'pending',
        ]);

        // Store owner can always act
        $this->assertTrue($policy->canActOnSubmission($this->owner, $doc));

        // Assigned manager can act
        $this->assertTrue($policy->canActOnSubmission($this->manager, $doc));

        // Unassigned other manager is blocked
        $this->assertFalse($policy->canActOnSubmission($otherManager, $doc));
    }

    public function test_cannot_turn_off_master_approval_if_members_have_active_approvals(): void
    {
        $this->actingAs($this->owner);
        app()->instance('current.tenant', $this->tenant);

        // $this->cashier has transaction_approval_mode = 'required'
        $request = \Illuminate\Http\Request::create('/settings', 'POST', [
            '_save_section' => 'approvals',
            'approval_admin_enabled' => '0',
        ]);
        $request->setUserResolver(fn() => $this->owner);

        $controller = app(\App\Http\Controllers\AdminController::class);
        $response = $controller->updateSettings($request);

        // Should return back with errors in session
        $this->assertTrue(session()->has('errors'));
        $errors = session('errors')->getBag('default');
        $this->assertTrue($errors->has('approval_admin_enabled'));

        // Verify setting was NOT changed in DB
        $currentValue = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', 'approval_admin_enabled')
            ->value('value');
        $this->assertNotEquals('0', $currentValue);
    }

    public function test_admin_can_update_member_approval_settings_and_assigned_supervisors(): void
    {
        $this->actingAs($this->owner);
        app()->instance('current.tenant', $this->tenant);

        $cashierTu = TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->cashier->id)
            ->first();

        $request = \Illuminate\Http\Request::create("/users/{$cashierTu->id}", 'PATCH', [
            'display_name' => 'Cashier Updated',
            'role' => 'cashier',
            'transaction_approval_mode' => 'custom',
            'assigned_approvers' => [$this->manager->id],
            'approval_threshold_amount' => '3500.00',
            'approval_overrides' => [
                'customer_receipt' => 'direct',
                'supplier_payment' => 'required',
            ],
        ]);
        $request->setUserResolver(fn() => $this->owner);

        $controller = app(\App\Http\Controllers\AdminController::class);
        $response = $controller->updateMember($request, $cashierTu);

        $cashierTu->refresh();
        $this->assertEquals('custom', $cashierTu->transaction_approval_mode);
        $this->assertEquals('Cashier Updated', $cashierTu->display_name);

        // Verify supervisor setting in DB
        $supervisors = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_supervisors_user_{$this->cashier->id}")
            ->value('value');
        $this->assertEquals([$this->manager->id], json_decode($supervisors, true));

        // Verify threshold setting in DB
        $threshold = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_threshold_user_{$this->cashier->id}")
            ->value('value');
        $this->assertEquals('3500', (string)(float)$threshold);

        // Verify override setting in DB
        $overrideReceipt = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_user_{$this->cashier->id}_customer_receipt")
            ->value('value');
        $this->assertEquals('direct', $overrideReceipt);

        $overridePayment = Setting::withoutGlobalScopes()
            ->where('tenant_id', $this->tenant->id)
            ->where('key', "approval_user_{$this->cashier->id}_supplier_payment")
            ->value('value');
        $this->assertEquals('required', $overridePayment);
    }

    public function test_maker_is_redirected_away_from_inbox_and_reviewer_is_redirected_away_from_my_submissions(): void
    {
        // 1. Cashier / Maker (requires approval) accessing inbox is redirected to my-submissions
        $this->actingAs($this->cashier);
        $response = $this->get('/s/' . $this->tenant->slug . '/approvals/inbox');
        $response->assertRedirect('/s/' . $this->tenant->slug . '/approvals/my-submissions');

        // Accessing approvals landing index redirects to my-submissions
        $responseIndex = $this->get('/s/' . $this->tenant->slug . '/approvals');
        $responseIndex->assertRedirect('/s/' . $this->tenant->slug . '/approvals/my-submissions');

        // 2. Owner / Reviewer accessing my-submissions is redirected to inbox
        $this->actingAs($this->owner);
        $responseReviewer = $this->get('/s/' . $this->tenant->slug . '/approvals/my-submissions');
        $responseReviewer->assertRedirect('/s/' . $this->tenant->slug . '/approvals/inbox');

        // Accessing approvals landing index redirects to inbox
        $responseReviewerIndex = $this->get('/s/' . $this->tenant->slug . '/approvals');
        $responseReviewerIndex->assertRedirect('/s/' . $this->tenant->slug . '/approvals/inbox');
    }
}

