<?php

namespace Tests\Feature\Cheque;

use App\Engines\AccountingService;
use App\Models\BankAccount;
use App\Models\Party;
use App\Models\ReceivedCheque;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Cheque\ChequeDuplicateService;
use Illuminate\Validation\ValidationException;
use Tests\Feature\VenQoreTestCase;

class ReceivedChequeLifecycleTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $user;
    private BankAccount $bankAccount;
    private Party $customer;
    private ChequeDuplicateService $duplicateService;
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('rcvd-test-' . uniqid(), 'core');
        $this->user = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->user, $this->tenant);
        app()->instance('current.tenant', $this->tenant);

        $this->bankAccount = BankAccount::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Allied Bank Main',
            'bank_name'       => 'Allied Bank Limited',
            'account_number'  => '5544332211',
            'opening_balance' => 500000,
        ]);

        $this->customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Apex Retailers',
            'type'      => 'customer',
        ]);

        $this->duplicateService = app(ChequeDuplicateService::class);
        $this->accounting = app(AccountingService::class);
    }

    public function test_record_received_cheque_with_normalized_data(): void
    {
        $cheque = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => 'CHQ-009988',
                'amount'        => 45000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'Standard Chartered',
                'cheque_date'   => '2026-10-15',
                'notes'         => 'Payment for invoice #INV-1001',
            ],
            amountOrUser: $this->user
        );

        $this->assertInstanceOf(ReceivedCheque::class, $cheque);
        $this->assertEquals(ReceivedCheque::STATUS_RECEIVED, $cheque->status);
        $this->assertEquals('CHQ009988', $cheque->normalized_cheque_number);
        $this->assertNotEmpty($cheque->duplicate_fingerprint);
        $this->assertEquals(45000.00, (float) $cheque->amount);
    }

    public function test_detects_exact_duplicate_received_cheque(): void
    {
        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '112233',
                'amount'        => 30000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'Faysal Bank',
                'cheque_date'   => '2026-10-10',
            ],
            amountOrUser: $this->user
        );

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("112233");

        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '112233',
                'amount'        => 30000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'Faysal Bank',
                'cheque_date'   => '2026-10-10',
            ],
            amountOrUser: $this->user
        );
    }

    public function test_detects_potential_duplicate_and_allows_override(): void
    {
        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '556677',
                'amount'        => 20000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'Bank Alfalah',
                'cheque_date'   => '2026-10-10',
            ],
            amountOrUser: $this->user
        );

        // Without override -> throws ValidationException
        $thrown = false;
        try {
            $this->duplicateService->recordReceivedCheque(
                tenant: $this->tenant,
                dataOrChequeNumber: [
                    'cheque_number' => '556677',
                    'amount'        => 75000.00, // Different amount
                    'party_id'      => $this->customer->id,
                    'drawer_bank'   => 'Bank Alfalah',
                    'cheque_date'   => '2026-10-20', // Different date
                ],
                amountOrUser: $this->user,
                allowOverride: false
            );
        } catch (ValidationException $e) {
            $thrown = true;
            $this->assertStringContainsString('556677', $e->getMessage());
        }
        $this->assertTrue($thrown, "Expected potential duplicate ValidationException was not thrown.");

        // With allowOverride = true and reason -> succeeds
        $overridden = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number'   => '556677',
                'amount'          => 75000.00,
                'party_id'        => $this->customer->id,
                'drawer_bank'     => 'Bank Alfalah',
                'cheque_date'     => '2026-10-20',
                'override_reason' => 'Authorized customer second replacement cheque',
            ],
            amountOrUser: $this->user,
            allowOverride: true
        );

        $this->assertInstanceOf(ReceivedCheque::class, $overridden);
        $this->assertEquals(75000.00, (float) $overridden->amount);
        $this->assertTrue($overridden->is_duplicate_override);
    }

    public function test_deposit_received_cheque_posts_canonical_accounting(): void
    {
        $cheque = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '889900',
                'amount'        => 50000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'Habib Metro',
                'cheque_date'   => '2026-10-05',
            ],
            amountOrUser: $this->user
        );

        $deposited = $this->duplicateService->depositCheque(
            tenant: $this->tenant,
            cheque: $cheque,
            depositBankAccountId: $this->bankAccount->id,
            depositDate: '2026-10-06',
            user: $this->user
        );

        $this->assertEquals(ReceivedCheque::STATUS_DEPOSITED, $deposited->status);
        $this->assertEquals($this->bankAccount->id, $deposited->deposit_bank_account_id);
        $this->assertNotNull($deposited->deposited_at);
        $this->assertNotNull($deposited->deposit_journal_entry_id);

        // Verify journal entry lines: DR Bank Account (1010), CR Cheques in Hand (1020)
        $items = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_items.journal_entry_id', $deposited->deposit_journal_entry_id)
            ->select('accounts.code', 'journal_items.debit', 'journal_items.credit')
            ->get();

        $this->assertCount(2, $items);
        $debitLine = $items->firstWhere('debit', '>', 0);
        $creditLine = $items->firstWhere('credit', '>', 0);

        $this->assertEquals('1010', $debitLine->code);
        $this->assertEquals(50000.00, (float) $debitLine->debit);
        $this->assertEquals('1020', $creditLine->code);
        $this->assertEquals(50000.00, (float) $creditLine->credit);
    }

    public function test_clear_deposited_cheque(): void
    {
        $cheque = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '443322',
                'amount'        => 18000.00,
                'drawer_bank'   => 'Askari Bank',
                'cheque_date'   => '2026-10-01',
            ],
            amountOrUser: $this->user
        );

        $deposited = $this->duplicateService->depositCheque(
            tenant: $this->tenant,
            cheque: $cheque,
            depositBankAccountId: $this->bankAccount->id,
            user: $this->user
        );

        $cleared = $this->duplicateService->clearCheque(
            tenant: $this->tenant,
            cheque: $deposited,
            user: $this->user
        );

        $this->assertEquals(ReceivedCheque::STATUS_CLEARED, $cleared->status);
        $this->assertNotNull($cleared->cleared_at);
    }

    public function test_bounce_deposited_cheque_reverses_deposit_journal_entry(): void
    {
        $cheque = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '778899',
                'amount'        => 65000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'MCB Bank',
                'cheque_date'   => '2026-10-01',
            ],
            amountOrUser: $this->user
        );

        $deposited = $this->duplicateService->depositCheque(
            tenant: $this->tenant,
            cheque: $cheque,
            depositBankAccountId: $this->bankAccount->id,
            user: $this->user
        );

        $depositEntryId = $deposited->deposit_journal_entry_id;

        $bounced = $this->duplicateService->bounceCheque(
            tenant: $this->tenant,
            cheque: $deposited,
            reason: 'Insufficient funds (NSF)',
            user: $this->user
        );

        $this->assertEquals(ReceivedCheque::STATUS_BOUNCED, $bounced->status);
        $this->assertNotNull($bounced->bounced_at);
        $this->assertEquals('Insufficient funds (NSF)', $bounced->status_reason);

        // Verify deposit journal entry is reversed
        $this->assertEquals(1, \Illuminate\Support\Facades\DB::table('journal_entries')->where('id', $depositEntryId)->value('is_reversed'));

        // Verify reversal entry
        $reversal = \Illuminate\Support\Facades\DB::table('journal_entries')
            ->where('tenant_id', $this->tenant->id)
            ->where('reverses_entry_id', $depositEntryId)
            ->first();

        $this->assertNotNull($reversal);
        $this->assertStringContainsString('Bounced customer cheque deposit', $reversal->description);
    }

    public function test_return_bounced_cheque_to_customer(): void
    {
        $cheque = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => '990011',
                'amount'        => 22000.00,
                'party_id'      => $this->customer->id,
                'drawer_bank'   => 'UBL',
                'cheque_date'   => '2026-10-01',
            ],
            amountOrUser: $this->user
        );

        $bounced = $this->duplicateService->bounceCheque(
            tenant: $this->tenant,
            cheque: $cheque,
            reason: 'Signature mismatch',
            user: $this->user
        );

        $returned = $this->duplicateService->returnReceivedCheque(
            tenant: $this->tenant,
            cheque: $bounced,
            reason: 'Handed back physical cheque to representative',
            user: $this->user
        );

        $this->assertEquals(ReceivedCheque::STATUS_RETURNED, $returned->status);
        $this->assertNotNull($returned->returned_at);
        $this->assertEquals('Handed back physical cheque to representative', $returned->status_reason);
    }

    public function test_post_dated_cheque_query_identification(): void
    {
        // Normal today cheque
        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => 'PDC-001',
                'amount'        => 10000.00,
                'drawer_bank'   => 'Bank A',
                'cheque_date'   => now()->toDateString(),
            ],
            amountOrUser: $this->user
        );

        // Future post-dated cheque
        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenant,
            dataOrChequeNumber: [
                'cheque_number' => 'PDC-002',
                'amount'        => 35000.00,
                'drawer_bank'   => 'Bank B',
                'cheque_date'   => now()->addDays(15)->toDateString(),
            ],
            amountOrUser: $this->user
        );

        $pdcCheques = ReceivedCheque::where('tenant_id', $this->tenant->id)
            ->whereDate('cheque_date', '>', now()->toDateString())
            ->whereIn('status', [ReceivedCheque::STATUS_RECEIVED, ReceivedCheque::STATUS_DEPOSITED])
            ->get();

        $this->assertCount(1, $pdcCheques);
        $this->assertEquals('PDC-002', $pdcCheques->first()->cheque_number);
    }
}
