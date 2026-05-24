<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\PaymentService;
use App\Services\V3\AccountingService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class PaymentServiceTest extends TestCase
{
    use DatabaseTransactions;

    private PaymentService   $payments;
    private AccountingService $accounting;

    private string $customerId;
    private string $saleId;
    private float  $saleTotal = 10000.00;
    private string $paymentJournalEntryId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->payments   = app(PaymentService::class);
        $this->accounting = app(AccountingService::class);

        // Seed necessary accounts that normally come from global seeders for setup methods
        $this->seedAccount('1000', 'Cash in Hand',        'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable', 'asset',     'debit');
        $this->seedAccount('4000', 'Sales Revenue',       'income',    'credit');
        $this->seedAccount('2000', 'Accounts Payable',    'liability', 'credit');

        // Create a user for user_id foreign keys
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        // Create a party (customer)
        $this->customerId = Str::uuid()->toString();
        DB::table('parties')->insertOrIgnore([
            'id'         => $this->customerId,
            'name'       => 'Test Customer',
            'type'       => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create a sale record (the invoice to be paid)
        $this->saleId = Str::uuid()->toString();
        DB::table('sales')->insertOrIgnore([
            'id'             => $this->saleId,
            'reference_number' => 'INV-TEST-' . Str::random(6),
            'party_id'       => $this->customerId,
            //'sale_date'      => now()->toDateString(),
            'subtotal'       => $this->saleTotal,
            'discount'       => 0,
            'tax'            => 0,
            'total'          => $this->saleTotal,
            'invoice_total'  => $this->saleTotal,
            'payment_status' => 'unpaid',
            'warehouse_id'   => $this->seedWarehouse(),
            //'journal_entry_id' => $this->seedJournalEntry(), // the original sale JE
            'user_id'     => $user->id,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // Create the payment journal entry (B4 — the cash receipt)
        $this->paymentJournalEntryId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $this->saleId,
            'description'    => 'Test payment B4',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1000', 'debit'  => 6000.00, 'credit' => 0],
            ['account_code' => '1200', 'debit'  => 0,       'credit' => 6000.00],
        ])->id;
    }

    // ─── TEST 1: Allocation creates payment_allocations row ───────────
    /** @test */
    public function it_creates_a_payment_allocation_row()
    {
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);

        $this->assertDatabaseHas('payment_allocations', [
            'payment_journal_entry_id' => $this->paymentJournalEntryId,
            'sale_id'                  => $this->saleId,
            'allocated_amount'         => 6000.00,
            'status'                   => 'active',
        ]);
    }

    // ─── TEST 2: Badge updates to partial when not fully paid ─────────
    /** @test */
    public function it_sets_payment_status_to_partial_when_underpaid()
    {
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);

        $this->payments->updatePaymentBadge($this->saleId);

        $this->assertDatabaseHas('sales', [
            'id'             => $this->saleId,
            'payment_status' => 'partial',
        ]);
    }

    // ─── TEST 3: Badge updates to paid when fully paid ────────────────
    /** @test */
    public function it_sets_payment_status_to_paid_when_fully_paid()
    {
        // Pay the full amount in two allocations
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);

        // Second payment entry for the remaining 4000
        $secondPaymentId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $this->saleId,
            'description'    => 'Second payment',
        ], [
            ['account_code' => '1000', 'debit'  => 4000.00, 'credit' => 0],
            ['account_code' => '1200', 'debit'  => 0,       'credit' => 4000.00],
        ])->id;

        $this->payments->allocate($secondPaymentId, [
            ['sale_id' => $this->saleId, 'amount' => 4000.00],
        ]);

        $this->payments->updatePaymentBadge($this->saleId);

        $this->assertDatabaseHas('sales', [
            'id'             => $this->saleId,
            'payment_status' => 'paid',
        ]);
    }

    // ─── TEST 4: Over-allocation is blocked ───────────────────────────
    /** @test */
    public function it_blocks_over_allocation_at_app_layer()
    {
        $this->expectException(\App\Exceptions\OverAllocationException::class);

        // Attempt to allocate more than the invoice total
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 15000.00], // invoice is only 10000
        ]);
    }

    // ─── TEST 5: Over-allocation across multiple allocations blocked ───
    /** @test */
    public function it_blocks_over_allocation_when_cumulative_amount_exceeds_total()
    {
        // First allocation: 6000 (fine)
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);

        // Second payment JE
        $secondPaymentId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $this->saleId,
            'description'    => 'Over-payment attempt',
        ], [
            ['account_code' => '1000', 'debit'  => 5000.00, 'credit' => 0],
            ['account_code' => '1200', 'debit'  => 0,       'credit' => 5000.00],
        ])->id;

        // 6000 + 5000 = 11000 > 10000 — must throw
        $this->expectException(\App\Exceptions\OverAllocationException::class);

        $this->payments->allocate($secondPaymentId, [
            ['sale_id' => $this->saleId, 'amount' => 5000.00],
        ]);
    }

    // ─── TEST 6: voidAllocations sets status to reversed ─────────────
    /** @test */
    public function it_voids_all_active_allocations_for_a_journal_entry()
    {
        // Create allocation first
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);

        // Void it
        $this->payments->voidAllocations($this->paymentJournalEntryId);

        $this->assertDatabaseHas('payment_allocations', [
            'payment_journal_entry_id' => $this->paymentJournalEntryId,
            'sale_id'                  => $this->saleId,
            'status'                   => 'reversed',
        ]);
    }

    // ─── TEST 7: Badge reverts to unpaid after void ───────────────────
    /** @test */
    public function it_reverts_badge_to_unpaid_after_void()
    {
        $this->payments->allocate($this->paymentJournalEntryId, [
            ['sale_id' => $this->saleId, 'amount' => 6000.00],
        ]);
        $this->payments->updatePaymentBadge($this->saleId);

        // Confirm partial first
        $this->assertDatabaseHas('sales', ['id' => $this->saleId, 'payment_status' => 'partial']);

        // Now void
        $this->payments->voidAllocations($this->paymentJournalEntryId);

        // Badge must revert
        $this->assertDatabaseHas('sales', ['id' => $this->saleId, 'payment_status' => 'unpaid']);
    }

    // ─── TEST 8: Round-off tolerance auto-closes invoice ─────────────
    /** @test */
    public function it_auto_closes_invoice_within_roundoff_tolerance()
    {
        // Set tolerance to Rs.1 in system_settings
        DB::table('system_settings')
            ->updateOrInsert(['key' => 'roundoff_tolerance'], ['value' => '1.00']);

        // Pay Rs.9999 on a Rs.10000 invoice — within Rs.1 tolerance
        $nearFullPaymentId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $this->saleId,
            'description'    => 'Near-full payment',
        ], [
            ['account_code' => '1000', 'debit'  => 9999.00, 'credit' => 0],
            ['account_code' => '1200', 'debit'  => 0,       'credit' => 9999.00],
        ])->id;

        $this->payments->allocate($nearFullPaymentId, [
            ['sale_id' => $this->saleId, 'amount' => 9999.00],
        ]);

        $this->payments->updatePaymentBadge($this->saleId);

        // Should be marked paid due to round-off
        $this->assertDatabaseHas('sales', [
            'id'             => $this->saleId,
            'payment_status' => 'paid',
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────
    private function seedAccount(string $code, string $name, string $type, string $normalBalance): void
    {
        $exists = DB::table('accounts')->where('code', $code)->exists();
        if (!$exists) {
            DB::table('accounts')->insert([
                'id'             => Str::uuid()->toString(),
                'code'           => $code,
                'name'           => $name,
                'type'           => $type,
                'normal_balance' => $normalBalance,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insertOrIgnore([
            'id'         => $id,
            'name'       => 'Default Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedJournalEntry(): string
    {
        $id = Str::uuid()->toString();
        DB::table('journal_entries')->insert([
            'id'             => $id,
            'date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'   => Str::uuid()->toString(),
            'description'    => 'Seed sale JE',
            'is_reversed'    => 0,
            'user_id'     => auth()->id(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }
}
