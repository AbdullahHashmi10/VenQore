<?php

namespace Tests\Feature\Cheque;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Cheque\ChequeBookService;
use Tests\Feature\VenQoreTestCase;

class ChequeApprovalIntegrationTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $maker;
    private User $reviewer;
    private BankAccount $bankAccount;
    private Party $supplier;
    private ChequeBook $book;
    private ChequeBookService $bookService;
    private ApprovalExecutionEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('appr-test-' . uniqid(), 'core');
        $this->maker = $this->createTenantUser($this->tenant, 'manager');
        $this->reviewer = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->reviewer, $this->tenant);
        app()->instance('current.tenant', $this->tenant);

        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->bankAccount = BankAccount::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'National Bank Operations',
            'bank_name'       => 'National Bank of Pakistan',
            'account_number'  => '1122334455',
            'opening_balance' => 1000000,
        ]);

        $this->supplier = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Apex Industrial Solutions',
            'type'      => 'supplier',
        ]);

        $this->bookService = app(ChequeBookService::class);
        $this->engine = app(ApprovalExecutionEngine::class);

        $this->book = $this->bookService->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 501,
            endNumber: 510,
            seriesPrefix: 'NBP',
            paddingZeros: 6,
            user: $this->reviewer
        );
    }

    public function test_submitting_cheque_payment_for_approval_reserves_cheque_leaf(): void
    {
        $leaf = $this->book->leaves()->first();
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf->status);

        $doc = $this->engine->submit(
            tenant: $this->tenant,
            maker: $this->maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 35000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf->id,
                'cheque_date'     => '2026-10-15',
                'notes'           => 'Advance supplier cheque payment',
            ],
            amount: 35000.00,
            description: 'Advance payment via cheque'
        );

        $this->assertEquals(ApprovalDocument::STATUS_PENDING, $doc->status);

        // Verify cheque leaf is atomically reserved
        $leaf->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf->status);
        $this->assertEquals($doc->id, $leaf->reserved_by_approval_document_id);
        $this->assertEquals(35000.00, (float) $leaf->amount);
    }

    public function test_approving_document_issues_cheque_leaf_and_posts_accounting(): void
    {
        $leaf = $this->book->leaves()->first();

        $doc = $this->engine->submit(
            tenant: $this->tenant,
            maker: $this->maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 40000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf->id,
                'cheque_date'     => '2026-10-15',
            ],
            amount: 40000.00
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf->fresh()->status);

        // Reviewer approves the document
        $result = $this->engine->approve(
            documentId: $doc->id,
            tenant: $this->tenant,
            reviewer: $this->reviewer,
            reviewerNotes: 'Approved for disbursement'
        );

        $this->assertTrue($result['success']);
        $this->assertEquals(ApprovalDocument::STATUS_APPROVED, $result['document']->status);

        // Verify leaf is atomically issued
        $leaf->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_ISSUED, $leaf->status);
        $this->assertNull($leaf->reserved_by_approval_document_id);
        $this->assertNotNull($leaf->payment_id);
        $this->assertEquals(40000.00, (float) $leaf->amount);

        // Verify payment record
        $payment = Payment::find($leaf->payment_id);
        $this->assertNotNull($payment);
        $this->assertEquals('cheque', $payment->payment_method);
        $this->assertEquals(40000.00, (float) $payment->amount);
    }

    public function test_rejecting_document_releases_cheque_leaf_to_available(): void
    {
        $leaf = $this->book->leaves()->first();

        $doc = $this->engine->submit(
            tenant: $this->tenant,
            maker: $this->maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 20000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf->id,
            ],
            amount: 20000.00
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf->fresh()->status);

        // Reviewer rejects the document
        $this->engine->reject(
            documentId: $doc->id,
            tenant: $this->tenant,
            reviewer: $this->reviewer,
            reason: 'Insufficient supporting documentation'
        );

        $leaf->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf->status);
        $this->assertNull($leaf->reserved_by_approval_document_id);
    }

    public function test_withdrawing_document_releases_cheque_leaf_to_available(): void
    {
        $leaf = $this->book->leaves()->first();

        $doc = $this->engine->submit(
            tenant: $this->tenant,
            maker: $this->maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 15000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf->id,
            ],
            amount: 15000.00
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf->fresh()->status);

        // Maker withdraws
        $this->engine->withdraw(
            documentId: $doc->id,
            tenant: $this->tenant,
            maker: $this->maker,
            reason: 'Submitted with wrong supplier by mistake'
        );

        $leaf->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf->status);
        $this->assertNull($leaf->reserved_by_approval_document_id);
    }

    public function test_resubmitting_with_different_cheque_leaf_swaps_reservations_atomically(): void
    {
        $leaves = $this->book->leaves()->take(2)->get();
        $leaf1 = $leaves[0];
        $leaf2 = $leaves[1];

        $doc = $this->engine->submit(
            tenant: $this->tenant,
            maker: $this->maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 50000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf1->id,
            ],
            amount: 50000.00
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf1->fresh()->status);
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf2->fresh()->status);

        // Reviewer returns for correction
        $this->engine->returnDocument(
            documentId: $doc->id,
            tenant: $this->tenant,
            reviewer: $this->reviewer,
            reasonCodes: ['INCORRECT_AMOUNT'],
            notes: 'Please split or change leaf'
        );

        // Maker resubmits with leaf2 and updated amount
        $this->engine->resubmit(
            documentId: $doc->id,
            tenant: $this->tenant,
            maker: $this->maker,
            updatedPayload: [
                'supplier_id'     => $this->supplier->id,
                'amount'          => 45000.00,
                'payment_method'  => 'cheque',
                'bank_account_id' => $this->bankAccount->id,
                'cheque_leaf_id'  => $leaf2->id,
            ],
            updatedAmount: 45000.00,
            notes: 'Corrected cheque leaf and amount'
        );

        // Old leaf 1 freed
        $leaf1->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf1->status);
        $this->assertNull($leaf1->reserved_by_approval_document_id);

        // New leaf 2 reserved
        $leaf2->refresh();
        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf2->status);
        $this->assertEquals($doc->id, $leaf2->reserved_by_approval_document_id);
        $this->assertEquals(45000.00, (float) $leaf2->amount);
    }
}
