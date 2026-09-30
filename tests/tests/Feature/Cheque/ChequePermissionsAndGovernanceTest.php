<?php

namespace Tests\Feature\Cheque;

use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\ReceivedCheque;
use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\ReckonerContext;
use App\Reckoner\Sources\ChequeSource;
use App\Services\Cheque\ChequeBookService;
use App\Services\Cheque\ChequeDuplicateService;
use Tests\Feature\VenQoreTestCase;

class ChequePermissionsAndGovernanceTest extends VenQoreTestCase
{
    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $ownerA;
    private User $cashierA;
    private BankAccount $bankAccountA;
    private ChequeBookService $bookService;
    private ChequeDuplicateService $duplicateService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = $this->createTenant('gov-test-a-' . uniqid(), 'core');
        $this->tenantB = $this->createTenant('gov-test-b-' . uniqid(), 'core');

        $this->ownerA = $this->createTenantUser($this->tenantA, 'owner');
        $this->cashierA = $this->createTenantUser($this->tenantA, 'cashier');

        $this->actingAsTenantUserModel($this->ownerA, $this->tenantA);
        app()->instance('current.tenant', $this->tenantA);

        $this->bankAccountA = BankAccount::create([
            'tenant_id'       => $this->tenantA->id,
            'name'            => 'Tenant A Bank',
            'bank_name'       => 'Habib Bank',
            'account_number'  => '1111111111',
            'opening_balance' => 200000,
        ]);

        $this->bookService = app(ChequeBookService::class);
        $this->duplicateService = app(ChequeDuplicateService::class);
    }

    public function test_owner_holds_all_cheque_permissions(): void
    {
        $ownerPermissions = config('permissions.owner', []);
        $this->assertContains('finance.cheque_books.view', $ownerPermissions);
        $this->assertContains('finance.cheque_books.manage', $ownerPermissions);
        $this->assertContains('finance.cheques.clear', $ownerPermissions);

        $this->assertTrue($this->ownerA->hasPermission('finance.cheque_books.view'));
        $this->assertTrue($this->ownerA->hasPermission('finance.cheque_books.manage'));
        $this->assertTrue($this->ownerA->hasPermission('finance.cheques.clear'));
    }

    public function test_cashier_cannot_manage_or_create_chequebooks(): void
    {
        $this->actingAsTenantUserModel($this->cashierA, $this->tenantA);

        // Attempt to access chequebook creation page
        $url = route('store.banking.cheque-books.create', ['store_slug' => $this->tenantA->slug]);
        $response = $this->get($url);
        $response->assertStatus(403);

        // Attempt to register a chequebook
        $storeUrl = route('store.banking.cheque-books.store', ['store_slug' => $this->tenantA->slug]);
        $postResponse = $this->postJson($storeUrl, [
            'bank_account_id' => $this->bankAccountA->id,
            'start_number'    => 1,
            'end_number'      => 25,
        ]);
        $postResponse->assertStatus(403);
    }

    public function test_multi_tenant_isolation_on_chequebooks_and_leaves(): void
    {
        // Tenant A creates a chequebook
        $bookA = $this->bookService->createChequeBook(
            tenant: $this->tenantA,
            bankAccountId: $this->bankAccountA->id,
            startNumber: 101,
            endNumber: 110,
            seriesPrefix: 'TNA',
            user: $this->ownerA
        );

        // Tenant B setup
        app()->instance('current.tenant', $this->tenantB);
        $bankAccountB = BankAccount::create([
            'tenant_id'       => $this->tenantB->id,
            'name'            => 'Tenant B Bank',
            'bank_name'       => 'Bank Alfalah',
            'account_number'  => '2222222222',
            'opening_balance' => 300000,
        ]);

        $ownerB = $this->createTenantUser($this->tenantB, 'owner');
        $this->actingAsTenantUserModel($ownerB, $this->tenantB);

        $bookB = $this->bookService->createChequeBook(
            tenant: $this->tenantB,
            bankAccountId: $bankAccountB->id,
            startNumber: 201,
            endNumber: 210,
            seriesPrefix: 'TNB',
            user: $ownerB
        );

        // User A cannot view Tenant B's chequebook
        app()->instance('current.tenant', $this->tenantA);
        $this->actingAsTenantUserModel($this->ownerA, $this->tenantA);

        $url = route('store.banking.cheque-books.show', ['store_slug' => $this->tenantA->slug, 'id' => $bookB->id]);
        $response = $this->get($url);
        $this->assertTrue(in_array($response->status(), [403, 404], true));

        // Eloquent queries in Tenant A context never see Tenant B leaves
        $leavesA = ChequeLeaf::where('tenant_id', $this->tenantA->id)->get();
        $this->assertCount(10, $leavesA);
        $this->assertFalse($leavesA->contains('cheque_book_id', $bookB->id));
    }

    public function test_reckoner_cheque_source_readings(): void
    {
        // 1. Create a chequebook with 5 leaves
        $book = $this->bookService->createChequeBook(
            tenant: $this->tenantA,
            bankAccountId: $this->bankAccountA->id,
            startNumber: 1,
            endNumber: 5,
            seriesPrefix: 'RCK',
            user: $this->ownerA
        );

        // Issue leaf 1 for 12,000
        $leaves = $book->leaves()->get();
        $leaves[0]->update([
            'status'      => ChequeLeaf::STATUS_ISSUED,
            'amount'      => 12000.00,
            'issue_date'  => now()->toDateString(),
            'cheque_date' => now()->addDays(2)->toDateString(),
        ]);

        // Stop leaf 2 for 8,000
        $leaves[1]->update([
            'status'        => ChequeLeaf::STATUS_STOPPED,
            'amount'        => 8000.00,
            'stopped_at'    => now(),
            'status_reason' => 'Stopped check',
        ]);

        // Bounce leaf 3 for 5,000
        $leaves[2]->update([
            'status'        => ChequeLeaf::STATUS_BOUNCED,
            'amount'        => 5000.00,
            'bounced_at'    => now(),
            'status_reason' => 'Bounced check',
        ]);

        // Leaves 4 and 5 remain available (count: 2)

        // 2. Record incoming cheques
        // Cheque in hand: 25,000
        $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenantA,
            dataOrChequeNumber: [
                'cheque_number' => 'RCV-001',
                'amount'        => 25000.00,
                'drawer_bank'   => 'FBL',
                'cheque_date'   => now()->addDays(3)->toDateString(),
            ],
            amountOrUser: $this->ownerA
        );

        // Deposited uncleared: 30,000
        $cheque2 = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenantA,
            dataOrChequeNumber: [
                'cheque_number' => 'RCV-002',
                'amount'        => 30000.00,
                'drawer_bank'   => 'MCB',
                'cheque_date'   => now()->addDays(4)->toDateString(),
            ],
            amountOrUser: $this->ownerA
        );
        $this->duplicateService->depositCheque(
            tenant: $this->tenantA,
            cheque: $cheque2,
            depositBankAccountId: $this->bankAccountA->id,
            user: $this->ownerA
        );

        // Bounced incoming cheque: 15,000
        $cheque3 = $this->duplicateService->recordReceivedCheque(
            tenant: $this->tenantA,
            dataOrChequeNumber: [
                'cheque_number' => 'RCV-003',
                'amount'        => 15000.00,
                'drawer_bank'   => 'UBL',
                'cheque_date'   => now()->toDateString(),
            ],
            amountOrUser: $this->ownerA
        );
        $this->duplicateService->bounceCheque(
            tenant: $this->tenantA,
            cheque: $cheque3,
            reason: 'Dishonored',
            user: $this->ownerA
        );

        // 3. Resolve metrics through Reckoner ChequeSource
        $source = new ChequeSource();
        $ctx = new ReckonerContext(tenant: $this->tenantA, user: $this->ownerA);

        $requests = [
            ['id' => 'req_avail',  'key' => 'cheque.available_leaves'],
            ['id' => 'req_issued', 'key' => 'cheque.issued_uncleared'],
            ['id' => 'req_hand',   'key' => 'cheque.cheques_in_hand'],
            ['id' => 'req_dep',    'key' => 'cheque.deposited_uncleared'],
            ['id' => 'req_bounce', 'key' => 'cheque.bounced_total'],
            ['id' => 'req_stop',   'key' => 'cheque.stopped_total'],
            ['id' => 'req_pdc',    'key' => 'cheque.post_dated_due'],
        ];

        $readings = $source->resolveBatch($requests, $ctx);

        // Available leaves: 2 leaves, 1 active book
        $this->assertEquals(2, $readings['req_avail']['count']);
        $this->assertEquals(1, $readings['req_avail']['books_count']);

        // Issued uncleared: 1 cheque, 12,000
        $this->assertEquals(1, $readings['req_issued']['count']);
        $this->assertEquals(12000.00, (float) $readings['req_issued']['amount']);

        // Cheques in hand: 1 cheque, 25,000
        $this->assertEquals(1, $readings['req_hand']['count']);
        $this->assertEquals(25000.00, (float) $readings['req_hand']['amount']);

        // Deposited uncleared: 1 cheque, 30,000
        $this->assertEquals(1, $readings['req_dep']['count']);
        $this->assertEquals(30000.00, (float) $readings['req_dep']['amount']);

        // Bounced total: 1 issued (5,000) + 1 received (15,000) = 2 cheques, 20,000
        $this->assertEquals(2, $readings['req_bounce']['count']);
        $this->assertEquals(20000.00, (float) $readings['req_bounce']['amount']);

        // Stopped total: 1 leaf, 8,000
        $this->assertEquals(1, $readings['req_stop']['count']);
        $this->assertEquals(8000.00, (float) $readings['req_stop']['amount']);

        // Post-dated due within 7 days:
        // Outgoing: leaf 1 (12,000)
        // Incoming: RCV-001 (25,000) + RCV-002 (30,000)
        // Total count: 3, total amount: 67,000
        $this->assertEquals(3, $readings['req_pdc']['count']);
        $this->assertEquals(67000.00, (float) $readings['req_pdc']['amount']);
    }
}
