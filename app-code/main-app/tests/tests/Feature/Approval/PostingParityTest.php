<?php

namespace Tests\Feature\Approval;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\Account;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\Party;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\CanonicalPostingScope;
use App\Services\CustomerPaymentPostingService;
use App\Services\ExpensePostingService;
use App\Services\SupplierPaymentPostingService;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class PostingParityTest extends VenQoreTestCase
{
    public function test_customer_payment_cash_direct_and_approval_parity(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Parity Customer',
            'type'      => 'customer',
        ]);

        [$saleDirect, $saleApproval] = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer) {
            $s1 = Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'reference_number' => 'INV-PARITY-01',
                'status'           => 'posted',
                'total'            => 1000.00,
                'net_sales'        => 1000.00,
                'invoice_total'    => 1000.00,
                'payment_status'   => 'unpaid',
                'payment_method'   => 'credit',
            ]);

            $s2 = Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'reference_number' => 'INV-PARITY-02',
                'status'           => 'posted',
                'total'            => 1000.00,
                'net_sales'        => 1000.00,
                'invoice_total'    => 1000.00,
                'payment_status'   => 'unpaid',
                'payment_method'   => 'credit',
            ]);

            return [$s1, $s2];
        });

        $accounting = app(AccountingService::class);
        $accounting->createEntry([
            'tenant_id'      => $tenant->id,
            'date'           => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => $saleDirect->id,
            'description'    => 'Sale INV-PARITY-01',
            'party_id'       => $customer->id,
            'user_id'        => $owner->id,
        ], [
            ['account_code' => '1200', 'debit' => 1000.00, 'credit' => 0, 'party_id' => $customer->id],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 1000.00],
        ]);

        $accounting->createEntry([
            'tenant_id'      => $tenant->id,
            'date'           => now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => $saleApproval->id,
            'description'    => 'Sale INV-PARITY-02',
            'party_id'       => $customer->id,
            'user_id'        => $owner->id,
        ], [
            ['account_code' => '1200', 'debit' => 1000.00, 'credit' => 0, 'party_id' => $customer->id],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 1000.00],
        ]);

        $payloadDirect = [
            'customer_id'    => $customer->id,
            'amount'         => 400.00,
            'payment_method' => 'cash',
            'payment_date'   => now()->toDateString(),
            'reference'      => 'PAY-DIRECT-01',
            'allocations'    => [
                ['sale_id' => $saleDirect->id, 'amount' => 400.00],
            ],
        ];

        $payloadApproval = [
            'customer_id'    => $customer->id,
            'amount'         => 400.00,
            'payment_method' => 'cash',
            'payment_date'   => now()->toDateString(),
            'reference'      => 'PAY-APP-01',
            'allocations'    => [
                ['sale_id' => $saleApproval->id, 'amount' => 400.00],
            ],
        ];

        $postingService = app(CustomerPaymentPostingService::class);
        $directResult = $postingService->post($tenant, $payloadDirect, $owner);

        $engine = app(ApprovalExecutionEngine::class);
        $doc = $engine->submit(
            tenant: $tenant,
            maker: $owner,
            documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            payload: $payloadApproval,
            amount: 400.00,
            description: 'Customer payment parity test'
        );

        $reviewer = $this->createTenantUser($tenant, 'manager');
        $approvalResult = $engine->approve(
            tenant: $tenant,
            documentId: $doc->id,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        // Verify Journal Lines Parity
        $directLines = DB::table('journal_items')->where('journal_entry_id', $directResult['journal_entry_id'])->get();
        $approvalLines = DB::table('journal_items')->where('journal_entry_id', $approvalResult['posted_result']['journal_entry_id'])->get();

        $this->assertCount(2, $directLines);
        $this->assertCount(2, $approvalLines);

        $this->assertSame((float)$directLines->where('debit', '>', 0)->first()->debit, (float)$approvalLines->where('debit', '>', 0)->first()->debit);
        $this->assertSame((float)$directLines->where('credit', '>', 0)->first()->credit, (float)$approvalLines->where('credit', '>', 0)->first()->credit);

        // Verify Allocation Parity
        $directAlloc = DB::table('allocations')->where('payment_journal_entry_id', $directResult['journal_entry_id'])->first();
        $approvalAlloc = DB::table('allocations')->where('payment_journal_entry_id', $approvalResult['posted_result']['journal_entry_id'])->first();

        $this->assertEquals(400.00, (float)$directAlloc->allocated_amount);
        $this->assertEquals(400.00, (float)$approvalAlloc->allocated_amount);
    }

    public function test_customer_payment_bank_path_and_multi_allocation_parity(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $bankAccount = BankAccount::create([
            'tenant_id'      => $tenant->id,
            'name'           => 'Main Operations Bank',
            'account_number' => 'ACC-998877',
            'type'           => 'bank',
            'is_active'      => true,
        ]);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Multi Allocation Customer',
            'type'      => 'customer',
        ]);

        [$s1Direct, $s2Direct, $s1App, $s2App] = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer) {
            return [
                Sale::create(['tenant_id' => $tenant->id, 'user_id' => $owner->id, 'party_id' => $customer->id, 'reference_number' => 'INV-D1', 'status' => 'posted', 'total' => 500.00, 'invoice_total' => 500.00, 'net_sales' => 500.00, 'payment_status' => 'unpaid', 'payment_method' => 'credit']),
                Sale::create(['tenant_id' => $tenant->id, 'user_id' => $owner->id, 'party_id' => $customer->id, 'reference_number' => 'INV-D2', 'status' => 'posted', 'total' => 300.00, 'invoice_total' => 300.00, 'net_sales' => 300.00, 'payment_status' => 'unpaid', 'payment_method' => 'credit']),
                Sale::create(['tenant_id' => $tenant->id, 'user_id' => $owner->id, 'party_id' => $customer->id, 'reference_number' => 'INV-A1', 'status' => 'posted', 'total' => 500.00, 'invoice_total' => 500.00, 'net_sales' => 500.00, 'payment_status' => 'unpaid', 'payment_method' => 'credit']),
                Sale::create(['tenant_id' => $tenant->id, 'user_id' => $owner->id, 'party_id' => $customer->id, 'reference_number' => 'INV-A2', 'status' => 'posted', 'total' => 300.00, 'invoice_total' => 300.00, 'net_sales' => 300.00, 'payment_status' => 'unpaid', 'payment_method' => 'credit']),
            ];
        });

        $payloadDirect = [
            'customer_id'     => $customer->id,
            'amount'          => 700.00,
            'payment_method'  => 'bank',
            'bank_account_id' => $bankAccount->id,
            'payment_date'    => now()->toDateString(),
            'reference'       => 'BANK-PAY-D',
            'allocations'     => [
                ['sale_id' => $s1Direct->id, 'amount' => 500.00],
                ['sale_id' => $s2Direct->id, 'amount' => 200.00],
            ],
        ];

        $payloadApp = [
            'customer_id'     => $customer->id,
            'amount'          => 700.00,
            'payment_method'  => 'bank',
            'bank_account_id' => $bankAccount->id,
            'payment_date'    => now()->toDateString(),
            'reference'       => 'BANK-PAY-A',
            'allocations'     => [
                ['sale_id' => $s1App->id, 'amount' => 500.00],
                ['sale_id' => $s2App->id, 'amount' => 200.00],
            ],
        ];

        $postingService = app(CustomerPaymentPostingService::class);
        $directResult = $postingService->post($tenant, $payloadDirect, $owner);

        $engine = app(ApprovalExecutionEngine::class);
        $doc = $engine->submit($tenant, $owner, ApprovalDocument::TYPE_CUSTOMER_RECEIPT, $payloadApp, 700.00, 'Bank multi-allocation parity');
        $reviewer = $this->createTenantUser($tenant, 'manager');
        $appResult = $engine->approve(
            documentId: $doc->id,
            tenant: $tenant,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        // Compare journal debit lines (bank account)
        $dItem = DB::table('journal_items')->where('journal_entry_id', $directResult['journal_entry_id'])->where('debit', '>', 0)->first();
        $aItem = DB::table('journal_items')->where('journal_entry_id', $appResult['posted_result']['journal_entry_id'])->where('debit', '>', 0)->first();

        $this->assertEquals(700.00, (float)$dItem->debit);
        $this->assertEquals(700.00, (float)$aItem->debit);
        $this->assertEquals($bankAccount->id, $dItem->bank_account_id);
        $this->assertEquals($bankAccount->id, $aItem->bank_account_id);

        // Compare allocations count and amounts
        $dAllocs = DB::table('allocations')->where('payment_journal_entry_id', $directResult['journal_entry_id'])->orderBy('allocated_amount', 'desc')->get();
        $aAllocs = DB::table('allocations')->where('payment_journal_entry_id', $appResult['posted_result']['journal_entry_id'])->orderBy('allocated_amount', 'desc')->get();

        $this->assertCount(2, $dAllocs);
        $this->assertCount(2, $aAllocs);
        $this->assertEquals(500.00, (float)$dAllocs[0]->allocated_amount);
        $this->assertEquals(500.00, (float)$aAllocs[0]->allocated_amount);
        $this->assertEquals(200.00, (float)$dAllocs[1]->allocated_amount);
        $this->assertEquals(200.00, (float)$aAllocs[1]->allocated_amount);
    }

    public function test_supplier_payment_direct_and_approval_parity(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $supplier = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Parity Supplier',
            'type'      => 'supplier',
        ]);

        $purchaseDirect = Purchase::create([
            'tenant_id'       => $tenant->id,
            'party_id'        => $supplier->id,
            'total'           => 1200.00,
            'payment_status'  => 'unpaid',
            'payment_method'  => 'credit',
            'purchase_date'   => now()->toDateString(),
        ]);

        $purchaseApproval = Purchase::create([
            'tenant_id'       => $tenant->id,
            'party_id'        => $supplier->id,
            'total'           => 1200.00,
            'payment_status'  => 'unpaid',
            'payment_method'  => 'credit',
            'purchase_date'   => now()->toDateString(),
        ]);

        $payloadDirect = [
            'supplier_id'    => $supplier->id,
            'amount'         => 600.00,
            'payment_method' => 'cash',
            'payment_date'   => now()->toDateString(),
            'reference'      => 'SUP-DIRECT-01',
            'allocations'    => [
                ['purchase_id' => $purchaseDirect->id, 'amount' => 600.00],
            ],
        ];

        $payloadApproval = [
            'supplier_id'    => $supplier->id,
            'amount'         => 600.00,
            'payment_method' => 'cash',
            'payment_date'   => now()->toDateString(),
            'reference'      => 'SUP-APP-01',
            'allocations'    => [
                ['purchase_id' => $purchaseApproval->id, 'amount' => 600.00],
            ],
        ];

        $postingService = app(SupplierPaymentPostingService::class);
        $directResult = $postingService->post($tenant, $payloadDirect, $owner);

        $engine = app(ApprovalExecutionEngine::class);
        $doc = $engine->submit(
            tenant: $tenant,
            maker: $owner,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: $payloadApproval,
            amount: 600.00,
            description: 'Supplier payment parity test'
        );

        $reviewer = $this->createTenantUser($tenant, 'manager');
        $approvalResult = $engine->approve(
            tenant: $tenant,
            documentId: $doc->id,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        // Verify Journal Lines Parity
        $directLines = DB::table('journal_items')->where('journal_entry_id', $directResult['journal_entry_id'])->get();
        $approvalLines = DB::table('journal_items')->where('journal_entry_id', $approvalResult['posted_result']['journal_entry_id'])->get();

        $this->assertCount(2, $directLines);
        $this->assertCount(2, $approvalLines);

        $this->assertSame((float)$directLines->where('debit', '>', 0)->first()->debit, (float)$approvalLines->where('debit', '>', 0)->first()->debit);
        $this->assertSame((float)$directLines->where('credit', '>', 0)->first()->credit, (float)$approvalLines->where('credit', '>', 0)->first()->credit);

        // Verify Allocation Parity
        $directAlloc = DB::table('allocations')->where('payment_journal_entry_id', $directResult['journal_entry_id'])->first();
        $approvalAlloc = DB::table('allocations')->where('payment_journal_entry_id', $approvalResult['posted_result']['journal_entry_id'])->first();

        $this->assertEquals(600.00, (float)$directAlloc->allocated_amount);
        $this->assertEquals(600.00, (float)$approvalAlloc->allocated_amount);
    }

    public function test_operating_expense_direct_and_approval_parity(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $payloadDirect = [
            'amount'         => 350.00,
            'input_tax'      => 35.00,
            'payment_method' => 'cash',
            'expense_date'   => now()->toDateString(),
            'description'    => 'Office Supplies Direct',
        ];

        $payloadApproval = [
            'amount'         => 350.00,
            'input_tax'      => 35.00,
            'payment_method' => 'cash',
            'expense_date'   => now()->toDateString(),
            'description'    => 'Office Supplies Approved',
        ];

        $postingService = app(ExpensePostingService::class);
        $directResult = $postingService->post($tenant, $payloadDirect, $owner);

        $engine = app(ApprovalExecutionEngine::class);
        $doc = $engine->submit(
            tenant: $tenant,
            maker: $owner,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: $payloadApproval,
            amount: 385.00,
            description: 'Expense parity test'
        );

        $reviewer = $this->createTenantUser($tenant, 'manager');
        $approvalResult = $engine->approve(
            tenant: $tenant,
            documentId: $doc->id,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        // Verify Expense Rows Created
        $directExpense = Expense::find($directResult['expense_id']);
        $approvalExpense = Expense::find($approvalResult['posted_result']['id']);

        $this->assertNotNull($directExpense);
        $this->assertNotNull($approvalExpense);
        $this->assertEquals(350.00, (float)$directExpense->amount);
        $this->assertEquals(350.00, (float)$approvalExpense->amount);
        $this->assertEquals(35.00, (float)$directExpense->tax_amount);
        $this->assertEquals(35.00, (float)$approvalExpense->tax_amount);

        // Verify Journal Lines Parity: 3 lines (DR 6000 350, DR 2300 35, CR 1000 385)
        $directLines = DB::table('journal_items')->where('journal_entry_id', $directResult['journal_entry_id'])->get();
        $approvalLines = DB::table('journal_items')->where('journal_entry_id', $approvalResult['posted_result']['journal_entry_id'])->get();

        $this->assertCount(3, $directLines);
        $this->assertCount(3, $approvalLines);
    }

    public function test_customer_payment_over_allocation_rejection_parity(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Over-allocation Customer',
            'type'      => 'customer',
        ]);

        $sale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer) {
            return Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'reference_number' => 'INV-OVER-01',
                'status'           => 'posted',
                'total'            => 100.00,
                'net_sales'        => 100.00,
                'invoice_total'    => 100.00,
                'payment_status'   => 'unpaid',
                'payment_method'   => 'credit',
            ]);
        });

        $postingService = app(CustomerPaymentPostingService::class);

        // Attempt direct post with over-allocation (amount 50 vs allocation 200)
        $this->expectException(\App\Exceptions\OverAllocationException::class);
        $postingService->post($tenant, [
            'customer_id'    => $customer->id,
            'amount'         => 50.00,
            'payment_method' => 'cash',
            'allocations'    => [
                ['sale_id' => $sale->id, 'amount' => 200.00],
            ],
        ], $owner);
    }

    public function test_transaction_failure_rollback_leaves_zero_database_footprint(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $owner);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Rollback Customer',
            'type'      => 'customer',
        ]);

        $postingService = app(CustomerPaymentPostingService::class);

        $initialJournalEntries = DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();
        $initialAllocations = DB::table('allocations')->where('tenant_id', $tenant->id)->count();

        try {
            $postingService->post($tenant, [
                'customer_id'    => $customer->id,
                'amount'         => 100.00,
                'payment_method' => 'cash',
                'allocations'    => [
                    ['sale_id' => '00000000-0000-0000-0000-000000000000', 'amount' => 100.00],
                ],
            ], $owner);
        } catch (\Throwable $e) {
            // Expected failure due to non-existent sale or validation
        }

        $finalJournalEntries = DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();
        $finalAllocations = DB::table('allocations')->where('tenant_id', $tenant->id)->count();

        $this->assertEquals($initialJournalEntries, $finalJournalEntries);
        $this->assertEquals($initialAllocations, $finalAllocations);
    }
}
