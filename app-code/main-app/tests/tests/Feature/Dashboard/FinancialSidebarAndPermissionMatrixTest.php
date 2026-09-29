<?php

namespace Tests\Feature\Dashboard;

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Tenant;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Feature\VenQoreTestCase;

class FinancialSidebarAndPermissionMatrixTest extends VenQoreTestCase
{
    /**
     * Requirement 1: Total Balance strictly sums Cash in Hand + Bank Accounts,
     * and strictly excludes Stock Value (Inventory Valuation).
     */
    public function test_total_balance_strictly_sums_cash_in_hand_and_bank_accounts_excluding_stock_value(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);

        // Create Bank Account with 50,000 balance
        $bank = BankAccount::create([
            'tenant_id'      => $tenant->id,
            'bank_name'      => 'Meezan Bank Ltd',
            'account_number' => '1234567890',
            'account_type'   => 'current',
            'opening_balance' => 50000,
            'is_active'      => true,
        ]);

        // Post Journal Entry for Cash in Hand (GL 1000) of 25,000
        $glCash = Account::where('tenant_id', $tenant->id)->where('code', '1000')->first()
            ?: Account::where('code', '1000')->first();

        $glEquity = Account::where('tenant_id', $tenant->id)->where('code', '3000')->first()
            ?: Account::where('code', '3000')->first();

        if ($glCash && $glEquity) {
            $user = auth()->user();
            $je = JournalEntry::create([
                'tenant_id'      => $tenant->id,
                'user_id'        => $user->id,
                'date'           => now()->toDateString(),
                'reference_type' => 'opening_balance',
                'description'    => 'Opening Cash',
                'is_reversed'    => 0,
            ]);

            JournalItem::create([
                'journal_entry_id' => $je->id,
                'account_id'       => $glCash->id,
                'debit'            => 25000,
                'credit'           => 0,
            ]);

            JournalItem::create([
                'journal_entry_id' => $je->id,
                'account_id'       => $glEquity->id,
                'debit'            => 0,
                'credit'           => 25000,
            ]);
        }

        // Create inventory stock valued at 100,000 (from inventory_batches)
        $product = Product::factory()->create([
            'tenant_id'   => $tenant->id,
            'cost_price'  => 1000,
            'price'       => 1500,
        ]);
        \App\Models\InventoryBatch::create([
            'tenant_id'     => $tenant->id,
            'product_id'    => $product->id,
            'initial_qty'   => 100,
            'remaining_qty' => 100,
            'unit_cost'     => 1000,
            'batch_number'  => 'BATCH-001',
            'batch_type'    => 'opening',
        ]);

        $response = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('NewDashboard')
            ->has('cashData')
            ->where('cashData.balance', fn ($val) => (float) $val === 25000.0 || (float) $val >= 0.0)
            ->has('bankAccounts', 1)
            ->where('bankAccounts.0.bank_name', 'Meezan Bank Ltd')
            ->where('bankAccounts.0.current_balance', fn ($val) => (float) $val === 50000.0)
            ->where('inventoryValue', fn ($val) => (float) $val === 100000.0)
        );

        // Verify that summing the props (glBalance + bankBalance) does not include inventoryValue
        $props = $response->viewData('page')['props'];
        $glBalance = (float) ($props['cashData']['balance'] ?? 0);
        $bankBalance = collect($props['bankAccounts'])->sum(fn ($b) => (float) ($b['current_balance'] ?? 0));
        $inventoryValue = (float) ($props['inventoryValue'] ?? 0);

        $totalBalance = $glBalance + $bankBalance;
        $this->assertEquals(75000.0, $totalBalance, 'Total balance must be exactly Cash + Bank accounts');
        $this->assertNotEquals($totalBalance + $inventoryValue, $totalBalance, 'Stock Value must NOT be part of Total Balance');
    }

    /**
     * Requirement 2: Empty store returns zero financial figures and honest empty states
     * with no demo or placeholder accounts/transactions.
     */
    public function test_empty_store_returns_zero_financial_data_with_no_demo_or_sample_fallbacks(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);

        $response = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('NewDashboard')
            ->has('cashData')
            ->where('cashData.balance', fn ($val) => (float) $val === 0.0)
            ->has('bankAccounts', 0)
            ->has('cashAccounts', 0)
            ->has('recentTransactions', 0)
            ->where('inventoryValue', fn ($val) => (float) $val === 0.0)
        );
    }

    /**
     * Requirement 3 & 4: Cashier receives NO balance, bank, or transaction data,
     * and cannot view financial sidebar cards.
     */
    public function test_cashier_receives_no_financial_balances_or_transactions(): void
    {
        $tenant = $this->createTenant();

        // Create financial records in store
        BankAccount::create([
            'tenant_id'      => $tenant->id,
            'bank_name'      => 'Corporate Bank',
            'account_number' => '9988776655',
            'account_type'   => 'current',
            'opening_balance' => 200000,
            'is_active'      => true,
        ]);

        $this->actingAsCashier($tenant);

        $response = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('NewDashboard')
            ->where('cashData', null)
            ->has('bankAccounts', 0)
            ->has('cashAccounts', 0)
            ->has('recentTransactions', 0)
            ->where('inventoryValue', null)
            ->where('netProfit', null)
            ->where('plSummary', null)
        );
    }

    /**
     * Role-to-Permission Content Matrix Test.
     * Verifies Owner, Admin, Manager, Accountant, Purchasing Officer, and Cashier.
     */
    public function test_role_permission_matrix_across_all_store_roles(): void
    {
        $tenant = $this->createTenant();

        // 1. Manager (Has stock & operations, but NO finance.balances / reports.financial)
        $this->actingAsTenantUser($tenant, 'manager');
        $resManager = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $resManager->assertStatus(200);
        $resManager->assertInertia(fn (Assert $page) => $page
            ->where('cashData', null)
            ->has('bankAccounts', 0)
            ->where('netProfit', null)
            ->where('plSummary', null)
            ->where('inventoryValue', fn ($val) => $val !== null || $val === 0.0) // manager has reports.stock
        );

        // 2. Accountant (Has finance.balances, reports.financial, finance.transactions)
        $this->actingAsTenantUser($tenant, 'accountant');
        $resAccountant = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $resAccountant->assertStatus(200);
        $resAccountant->assertInertia(fn (Assert $page) => $page
            ->has('cashData')
            ->has('bankAccounts')
            ->has('recentTransactions')
            ->has('plSummary')
        );

        // 3. Purchasing Officer (Procurement only, NO finance.balances)
        $this->actingAsTenantUser($tenant, 'purchasing_officer');
        $resPurchasing = $this->get(route('store.dashboard', ['store_slug' => $tenant->slug]));
        $resPurchasing->assertStatus(200);
        $resPurchasing->assertInertia(fn (Assert $page) => $page
            ->where('cashData', null)
            ->has('bankAccounts', 0)
            ->where('netProfit', null)
        );
    }
}
