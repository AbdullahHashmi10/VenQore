<?php

namespace Tests\Feature\Cheque;

use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Cheque\ChequeBookService;
use InvalidArgumentException;
use Tests\Feature\VenQoreTestCase;

class ChequeBookManagementTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $user;
    private BankAccount $bankAccount;
    private ChequeBookService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('cheque-test-' . uniqid(), 'core');
        $this->user = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->user, $this->tenant);
        app()->instance('current.tenant', $this->tenant);

        $this->bankAccount = BankAccount::create([
            'tenant_id'      => $this->tenant->id,
            'name'           => 'HBL Main Account',
            'bank_name'      => 'Habib Bank Limited',
            'account_number' => '1234567890',
            'opening_balance' => 100000,
        ]);

        $this->service = app(ChequeBookService::class);
    }

    public function test_register_chequebook_creates_correct_number_of_leaves_with_padded_serials(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 101,
            endNumber: 125,
            seriesPrefix: 'CHK',
            paddingZeros: 6,
            description: 'Test Chequebook 25 leaves',
            user: $this->user
        );

        $this->assertInstanceOf(ChequeBook::class, $book);
        $this->assertEquals(25, $book->total_leaves);
        $this->assertEquals(ChequeBook::STATUS_ACTIVE, $book->status);
        $this->assertEquals('CHK', $book->series_prefix);

        // Verify leaves count in database
        $leavesCount = ChequeLeaf::where('tenant_id', $this->tenant->id)
            ->where('cheque_book_id', $book->id)
            ->count();
        $this->assertEquals(25, $leavesCount);

        // Verify first and last leaf serials
        $firstLeaf = ChequeLeaf::where('cheque_book_id', $book->id)
            ->where('serial_number', 101)
            ->first();
        $this->assertNotNull($firstLeaf);
        $this->assertEquals('CHK-000101', $firstLeaf->display_serial_number);
        $this->assertEquals('CHK-000101', $firstLeaf->cheque_number);
        $this->assertEquals(ChequeLeaf::STATUS_AVAILABLE, $firstLeaf->status);

        $lastLeaf = ChequeLeaf::where('cheque_book_id', $book->id)
            ->where('serial_number', 125)
            ->first();
        $this->assertNotNull($lastLeaf);
        $this->assertEquals('CHK-000125', $lastLeaf->display_serial_number);
    }

    public function test_single_leaf_chequebook_allowed(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 500,
            endNumber: 500,
            seriesPrefix: null,
            paddingZeros: 4,
            user: $this->user
        );

        $this->assertEquals(1, $book->total_leaves);
        $this->assertEquals(1, $book->leaves()->count());

        $leaf = $book->leaves()->first();
        $this->assertEquals('0500', $leaf->display_serial_number);
    }

    public function test_rejects_when_start_number_greater_than_end_number(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Starting number (200) cannot be greater than ending number (100).");

        $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 200,
            endNumber: 100,
            user: $this->user
        );
    }

    public function test_rejects_when_range_exceeds_500_leaves(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Chequebook range cannot exceed 500 leaves in a single book.");

        $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1,
            endNumber: 501,
            user: $this->user
        );
    }

    public function test_rejects_overlapping_serial_range_on_same_bank_account(): void
    {
        // First book: 100 to 150
        $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 100,
            endNumber: 150,
            user: $this->user
        );

        // Attempt second book with overlap: 140 to 180
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("overlaps with existing chequebook");

        $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 140,
            endNumber: 180,
            user: $this->user
        );
    }

    public function test_allows_same_serial_range_on_different_bank_account(): void
    {
        $bankAccount2 = BankAccount::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Meezan Bank Account',
            'bank_name'       => 'Meezan Bank',
            'account_number'  => '987654321',
            'opening_balance' => 50000,
        ]);

        $book1 = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 100,
            endNumber: 150,
            user: $this->user
        );

        $book2 = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $bankAccount2->id,
            startNumber: 100,
            endNumber: 150,
            user: $this->user
        );

        $this->assertEquals(51, $book1->total_leaves);
        $this->assertEquals(51, $book2->total_leaves);
        $this->assertNotEquals($book1->id, $book2->id);
    }

    public function test_close_chequebook_marks_status_closed(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1,
            endNumber: 10,
            user: $this->user
        );

        $closedBook = $this->service->closeChequeBook($this->tenant, $book->id, $this->user);
        $this->assertEquals(ChequeBook::STATUS_CLOSED, $closedBook->status);
    }

    public function test_delete_completely_unused_chequebook(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1,
            endNumber: 10,
            user: $this->user
        );

        $this->service->deleteChequeBook($this->tenant, $book->id, $this->user);

        $this->assertNull(ChequeBook::find($book->id));
        $this->assertEquals(0, ChequeLeaf::where('cheque_book_id', $book->id)->count());
    }

    public function test_rejects_deleting_chequebook_with_issued_leaves(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1,
            endNumber: 10,
            user: $this->user
        );

        // Mark one leaf as issued
        $book->leaves()->first()->update(['status' => ChequeLeaf::STATUS_ISSUED]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Cannot delete chequebook because 1 leaves have already been used or issued.");

        $this->service->deleteChequeBook($this->tenant, $book->id, $this->user);
    }

    public function test_auto_exhaust_chequebook_when_all_leaves_used(): void
    {
        $book = $this->service->createChequeBook(
            tenant: $this->tenant,
            bankAccountId: $this->bankAccount->id,
            startNumber: 1,
            endNumber: 2,
            user: $this->user
        );

        // Both leaves issued
        $leaves = $book->leaves()->get();
        $leaves[0]->update(['status' => ChequeLeaf::STATUS_ISSUED]);
        $leaves[1]->update(['status' => ChequeLeaf::STATUS_VOID]);

        $this->service->checkAndUpdateExhaustion($this->tenant, $book->id);

        $this->assertEquals(ChequeBook::STATUS_EXHAUSTED, $book->fresh()->status);
    }
}
