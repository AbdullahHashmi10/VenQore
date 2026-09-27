<?php

namespace Tests\Feature\Cheque;

use App\Engines\AccountingService;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Cheque\ChequeBookService;
use App\Services\Cheque\ChequeLifecycleService;
use Illuminate\Database\QueryException;
use RuntimeException;
use Tests\Feature\VenQoreTestCase;

class ChequeLeafLifecycleTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $user;
    private BankAccount $bankAccount;
    private ChequeBookService $bookService;
    private ChequeLifecycleService $lifecycleService;
    private AccountingService $accounting;
    private ChequeBook $book;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('leaf-test-' . uniqid(), 'core');
        $this->user = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->user, $this->tenant);
        app()->instance('current.tenant', $this->tenant);

        $this->bankAccount = BankAccount::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'MBL Operations',
            'bank_name'       => 'Meezan Bank Limited',
            'account_number'  => '9988776655',
            'opening_balance' => 200000,
        ]);

        $this->bookService = app(ChequeBookService::class);
        $this->lifecycleService = app(ChequeLifecycleService::class);
        $this->accounting = app(AccountingService::class);

        $this->book = $this->bookService->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1001,
            endNumber: 1010,
            seriesPrefix: 'MBL',
            paddingZeros: 6,
            user: $this->user
        );
    }

    private function createApprovalDoc(): \App\Models\ApprovalDocument
    {
        return \App\Models\ApprovalDocument::create([
            'tenant_id'     => $this->tenant->id,
            'document_type' => \App\Models\ApprovalDocument::TYPE_OPERATING_EXPENSE,
            'status'        => \App\Models\ApprovalDocument::STATUS_PENDING,
            'maker_id'      => $this->user->id,
            'amount'        => 5000.00,
            'currency'      => 'PKR',
        ]);
    }

    public function test_leaf_lifecycle_available_to_reserved_to_issued(): void
    {
        $leaf = $this->book->leaves()->first();
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf->status);
        $doc = $this->createApprovalDoc();

        // Reserve for approval document
        $reservedLeaf = $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf->id,
            approvalDocId: $doc->id,
            amount: 15000.00,
            partyId: null,
            chequeDate: '2026-10-01',
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $reservedLeaf->status);
        $this->assertEquals($doc->id, $reservedLeaf->reserved_by_approval_document_id);
        $this->assertEquals(15000.00, (float) $reservedLeaf->amount);
        $this->assertEquals('2026-10-01', $reservedLeaf->cheque_date->toDateString());

        // Issue leaf upon approval
        $issuedLeaf = $this->lifecycleService->issueCheque(
            tenant: $this->tenant,
            leafId: $leaf->id,
            paymentId: null,
            amount: 15000.00,
            partyId: null,
            issueDate: '2026-10-01',
            chequeDate: '2026-10-01',
            user: $this->user,
            approvalDocId: $doc->id
        );

        $this->assertEquals(ChequeLeaf::STATUS_ISSUED, $issuedLeaf->status);
        $this->assertNull($issuedLeaf->reserved_by_approval_document_id);
    }

    public function test_cannot_reserve_already_reserved_leaf(): void
    {
        $leaf = $this->book->leaves()->first();
        $doc1 = $this->createApprovalDoc();
        $doc2 = $this->createApprovalDoc();

        $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf->id,
            approvalDocId: $doc1->id,
            amount: 5000,
            user: $this->user
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("is not available");

        $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf->id,
            approvalDocId: $doc2->id,
            amount: 8000,
            user: $this->user
        );
    }

    public function test_cannot_issue_leaf_reserved_by_different_approval_document(): void
    {
        $leaf = $this->book->leaves()->first();
        $doc1 = $this->createApprovalDoc();
        $doc2 = $this->createApprovalDoc();

        $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf->id,
            approvalDocId: $doc1->id,
            amount: 5000,
            user: $this->user
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("cannot be issued. Status is 'reserved'");

        $this->lifecycleService->issueCheque(
            tenant: $this->tenant,
            leafId: $leaf->id,
            paymentId: null,
            amount: 5000,
            partyId: null,
            issueDate: '2026-10-01',
            approvalDocId: $doc2->id // Different document!
        );
    }

    public function test_release_reservation_returns_leaf_to_available(): void
    {
        $leaf = $this->book->leaves()->first();
        $doc = $this->createApprovalDoc();

        $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf->id,
            approvalDocId: $doc->id,
            amount: 25000,
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf->fresh()->status);

        $released = $this->lifecycleService->releaseReservation(
            tenant: $this->tenant,
            approvalDocId: $doc->id,
            reason: 'Payment rejected by finance manager',
            user: $this->user
        );

        $this->assertNotNull($released);
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $released->status);
        $this->assertNull($released->reserved_by_approval_document_id);
        $this->assertNull($released->amount);
    }

    public function test_update_reservation_swaps_leaves_atomically(): void
    {
        $leaves = $this->book->leaves()->take(2)->get();
        $leaf1 = $leaves[0];
        $leaf2 = $leaves[1];
        $doc = $this->createApprovalDoc();

        // Initially doc reserves leaf 1
        $this->lifecycleService->reserveForApproval(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            leafId: $leaf1->id,
            approvalDocId: $doc->id,
            amount: 10000,
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf1->fresh()->status);
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf2->fresh()->status);

        // Correction: replace leaf 1 with leaf 2
        $updated = $this->lifecycleService->updateReservation(
            tenant: $this->tenant,
            approvalDocId: $doc->id,
            bankAccountId: $this->bankAccount->id,
            newLeafId: $leaf2->id,
            amount: 12000,
            user: $this->user
        );

        $this->assertEquals($leaf2->id, $updated->id);
        $this->assertEquals(ChequeLeaf::STATUS_RESERVED, $leaf2->fresh()->status);
        $this->assertEquals($doc->id, $leaf2->fresh()->reserved_by_approval_document_id);

        // Old leaf 1 is back to available
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $leaf1->fresh()->status);
        $this->assertNull($leaf1->fresh()->reserved_by_approval_document_id);
    }

    public function test_clear_issued_cheque(): void
    {
        $leaf = $this->book->leaves()->first();

        // Issue directly
        $issued = $this->lifecycleService->issueCheque(
            tenant: $this->tenant,
            leafId: $leaf->id,
            paymentId: null,
            amount: 7500,
            partyId: null,
            issueDate: '2026-10-02',
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_ISSUED, $issued->status);

        // Mark cleared
        $cleared = $this->lifecycleService->clearIssuedCheque(
            tenant: $this->tenant,
            leaf: $issued,
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_CLEARED, $cleared->status);
        $this->assertNotNull($cleared->cleared_at);
    }

    public function test_stop_issued_cheque_reverses_payment_journal_entry(): void
    {
        $party = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Supplier XYZ',
            'type'      => 'supplier',
        ]);

        $bankLedger = $this->accounting->getAccountByCode('1010', 'Bank Account', 'asset');
        $apLedger   = $this->accounting->getAccountByCode('2000', 'Accounts Payable', 'liability');

        $paymentRef = (string) \Illuminate\Support\Str::uuid();
        $journalEntry = $this->accounting->createEntry([
            'tenant_id'      => $this->tenant->id,
            'date'           => now()->toDateString(),
            'reference_type' => 'supplier_payment',
            'reference'      => $paymentRef,
            'description'    => "Payment to {$party->name}",
            'party_id'       => $party->id,
            'user_id'        => $this->user->id,
        ], [
            ['account_id' => $apLedger->id, 'debit' => 5000, 'credit' => 0, 'description' => 'AP debit'],
            ['account_id' => $bankLedger->id, 'debit' => 0, 'credit' => 5000, 'description' => 'Bank credit'],
        ]);

        $payment = Payment::create([
            'tenant_id'       => $this->tenant->id,
            'party_id'        => $party->id,
            'bank_account_id' => $this->bankAccount->id,
            'payment_type'    => 'supplier_payment',
            'payment_method'  => 'cheque',
            'amount'          => 5000,
            'payment_date'    => now()->toDateString(),
            'reference'       => $paymentRef,
        ]);

        $leaf = $this->book->leaves()->first();
        $issued = $this->lifecycleService->issueCheque(
            tenant: $this->tenant,
            leafId: $leaf->id,
            paymentId: $payment->id,
            amount: 5000,
            partyId: $party->id,
            issueDate: now()->toDateString(),
            user: $this->user
        );

        // Stop the cheque
        $stopped = $this->lifecycleService->stopCheque(
            tenant: $this->tenant,
            leaf: $issued,
            reason: 'Lost in transit',
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_STOPPED, $stopped->status);
        $this->assertNotNull($stopped->stopped_at);

        // Verify original journal entry is marked reversed
        $this->assertEquals(1, \Illuminate\Support\Facades\DB::table('journal_entries')->where('id', $journalEntry->id)->value('is_reversed'));

        // Verify reversal journal entry was created
        $reversal = \Illuminate\Support\Facades\DB::table('journal_entries')
            ->where('tenant_id', $this->tenant->id)
            ->where('reverses_entry_id', $journalEntry->id)
            ->first();

        $this->assertNotNull($reversal);
        $this->assertStringContainsString('Stopped company cheque', $reversal->description);
    }

    public function test_void_unused_cheque(): void
    {
        $leaf = $this->book->leaves()->first();

        $voided = $this->lifecycleService->voidUnusedCheque(
            tenant: $this->tenant,
            leaf: $leaf,
            reason: 'Printer paper jam destroyed the leaf',
            user: $this->user
        );

        $this->assertEquals(ChequeLeaf::STATUS_VOID, $voided->status);
        $this->assertNotNull($voided->voided_at);
        $this->assertEquals('Printer paper jam destroyed the leaf', $voided->status_reason);

        // Cannot void already voided leaf
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Only available, unused cheques can be voided");

        $this->lifecycleService->voidUnusedCheque(
            tenant: $this->tenant,
            leaf: $voided,
            reason: 'Try again',
            user: $this->user
        );
    }

    public function test_database_enforces_unique_normalized_serial_per_bank_account(): void
    {
        $leaf = $this->book->leaves()->first();

        $this->expectException(QueryException::class);

        // Attempt duplicate raw insert with exact same normalized serial and bank account
        \Illuminate\Support\Facades\DB::table('cheque_leaves')->insert([
            'id'                       => (string) \Illuminate\Support\Str::uuid(),
            'tenant_id'                => $this->tenant->id,
            'cheque_book_id'           => $this->book->id,
            'bank_account_id'          => $this->bankAccount->id,
            'normalized_serial_number' => $leaf->normalized_serial_number,
            'display_serial_number'    => $leaf->display_serial_number,
            'numeric_serial'           => $leaf->numeric_serial,
            'status'                   => ChequeLeaf::STATUS_AVAILABLE,
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);
    }
}
