<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\ApprovalStateMachine;
use Tests\Feature\VenQoreTestCase;

class ApprovalFoundationTest extends VenQoreTestCase
{
    private ApprovalStateMachine $stateMachine;
    private ApprovalPolicyResolver $policyResolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stateMachine = new ApprovalStateMachine();
        $this->policyResolver = new ApprovalPolicyResolver();
    }

    public function test_submit_new_creates_document_and_first_immutable_revision(): void
    {
        $tenant = $this->createTenant('appr-test-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        ApprovalReturnReason::seedDefaultReasons($tenant->id);

        $payload = [
            'customer_id' => 10,
            'amount' => 1500.00,
            'payment_method' => 'cash',
            'items' => [['id' => 1, 'qty' => 2, 'price' => 750.00]],
        ];

        $doc = $this->stateMachine->submitNew(
            tenantId: $tenant->id,
            documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            maker: $maker,
            payload: $payload,
            amount: 1500.00,
            description: 'Customer advance receipt',
            idempotencyKey: 'idem-rec-1'
        );

        $this->assertInstanceOf(ApprovalDocument::class, $doc);
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(1, (int)$doc->version);
        $this->assertSame(1500.00, (float)$doc->amount);
        $this->assertSame($maker->id, $doc->maker_id);

        // Assert immutable revision 1 exists
        $this->assertCount(1, $doc->revisions);
        $rev = $doc->revisions->first();
        $this->assertSame(1, (int)$rev->revision_number);
        $this->assertEquals($payload, $rev->payload);
        $this->assertSame(hash('sha256', json_encode($payload)), $rev->summary_hash);

        // Assert transition event exists
        $this->assertCount(1, $doc->transitions);
        $trans = $doc->transitions->first();
        $this->assertSame(ApprovalDocument::STATUS_DRAFT, $trans->from_status);
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $trans->to_status);
        $this->assertSame($maker->id, $trans->actor_id);
    }

    public function test_return_and_resubmission_lifecycle(): void
    {
        $tenant = $this->createTenant('appr-return-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');
        ApprovalReturnReason::seedDefaultReasons($tenant->id);

        $initialPayload = ['amount' => 500.00, 'account_id' => 1200];
        $doc = $this->stateMachine->submitNew(
            tenantId: $tenant->id,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            maker: $maker,
            payload: $initialPayload,
            amount: 500.00,
            description: 'Office supplies'
        );

        // 1. Reviewer returns document with reason requiring notes
        $returnedDoc = $this->stateMachine->returnDocument(
            document: $doc,
            reviewer: $reviewer,
            reasonCodes: ['WRONG_ACCOUNT_OR_PARTY'],
            reviewerNotes: 'Please choose operating expense account 5200 instead of 1200',
            expectedVersion: 1
        );

        $this->assertSame(ApprovalDocument::STATUS_RETURNED, $returnedDoc->status);
        $this->assertSame(2, (int)$returnedDoc->version);
        $this->assertSame($reviewer->id, $returnedDoc->reviewer_id);

        // 2. Maker resubmits with updated payload
        $updatedPayload = ['amount' => 500.00, 'account_id' => 5200];
        $resubmittedDoc = $this->stateMachine->resubmit(
            document: $returnedDoc,
            maker: $maker,
            updatedPayload: $updatedPayload,
            updatedAmount: 500.00,
            makerNotes: 'Corrected account to 5200',
            expectedVersion: 2
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $resubmittedDoc->status);
        $this->assertSame(3, (int)$resubmittedDoc->version);
        $this->assertCount(2, $resubmittedDoc->revisions);

        $latestRev = $resubmittedDoc->latestRevision();
        $this->assertSame(2, (int)$latestRev->revision_number);
        $this->assertEquals($updatedPayload, $latestRev->payload);
    }

    public function test_version_optimistic_locking_prevents_stale_transitions(): void
    {
        $tenant = $this->createTenant('appr-ver-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');
        ApprovalReturnReason::seedDefaultReasons($tenant->id);

        $doc = $this->stateMachine->submitNew(
            tenantId: $tenant->id,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            maker: $maker,
            payload: ['amount' => 2000.00],
            amount: 2000.00
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Version conflict');

        // Pass outdated version 999
        $this->stateMachine->returnDocument(
            document: $doc,
            reviewer: $reviewer,
            reasonCodes: ['INCORRECT_AMOUNT'],
            reviewerNotes: 'Notes',
            expectedVersion: 999
        );
    }

    public function test_approval_policy_hierarchy_and_per_employee_modes(): void
    {
        $tenant = $this->createTenant('appr-policy-' . uniqid(), 'ltd_3');
        $owner = $this->createTenantUser($tenant, 'owner');
        $admin = $this->createTenantUser($tenant, 'admin');
        $cashier = $this->createTenantUser($tenant, 'cashier');

        // 1. Default: Owner posts direct
        $resOwner = $this->policyResolver->resolve($tenant, $owner, ApprovalDocument::TYPE_SALES_INVOICE, 5000.00);
        $this->assertFalse($resOwner['requires_approval']);
        $this->assertSame('owner_direct_post', $resOwner['reason']);

        // 2. Default: Cashier requires approval (inherited role default)
        $resCashier = $this->policyResolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_SALES_INVOICE, 5000.00);
        $this->assertTrue($resCashier['requires_approval']);
        $this->assertSame('role_default_approval_required', $resCashier['reason']);

        // 3. Admin posts direct by default
        $resAdmin = $this->policyResolver->resolve($tenant, $admin, ApprovalDocument::TYPE_SALES_INVOICE, 5000.00);
        $this->assertFalse($resAdmin['requires_approval']);
        $this->assertSame('role_default_direct', $resAdmin['reason']);

        // 4. Set Admin mode to 'required' explicitly
        TenantUser::where('tenant_id', $tenant->id)->where('user_id', $admin->id)->update([
            'transaction_approval_mode' => 'required',
        ]);
        $resAdminRequired = $this->policyResolver->resolve($tenant, $admin, ApprovalDocument::TYPE_SALES_INVOICE, 5000.00);
        $this->assertTrue($resAdminRequired['requires_approval']);
        $this->assertSame('user_approval_required', $resAdminRequired['reason']);

        // 5. Set Cashier mode to 'direct' explicitly
        TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->update([
            'transaction_approval_mode' => 'direct',
        ]);
        $resCashierDirect = $this->policyResolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_SALES_INVOICE, 1000.00);
        $this->assertFalse($resCashierDirect['requires_approval']);
        $this->assertSame('user_direct_mode', $resCashierDirect['reason']);

        // 6. Set Store Amount Threshold = 2000.00 -> Cashier with direct mode exceeding threshold requires approval
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '2000.00']
        );
        $resCashierThreshold = $this->policyResolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_SALES_INVOICE, 3500.00);
        $this->assertTrue($resCashierThreshold['requires_approval']);
        $this->assertSame('amount_threshold_exceeded', $resCashierThreshold['reason']);

        // 7. Store disables administrative approval -> All post direct
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => '0']
        );
        $resDisabled = $this->policyResolver->resolve($tenant, $cashier, ApprovalDocument::TYPE_SALES_INVOICE, 10000.00);
        $this->assertFalse($resDisabled['requires_approval']);
        $this->assertSame('store_approval_disabled', $resDisabled['reason']);
    }
}
