<?php

namespace Tests\Feature\Dashboard;

use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantUser;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Product;
use App\Models\InventoryBatch;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class FinancialSidebarAndPermissionMatrixTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $store;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Tenant::factory()->create([
            'slug' => 'test-financial-store-' . uniqid(),
            'name' => 'Test Financial Store',
            'currency_code' => 'PKR',
            'currency_symbol' => 'Rs',
            'plan' => 'enterprise',
        ]);

        $this->owner = User::factory()->create();
        TenantUser::withoutEvents(function () {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $this->owner->id,
                'role' => 'owner',
                'status' => 'active',
                'permissions' => ['*'],
            ]);
        });
    }

    public function test_total_balance_strictly_sums_cash_in_hand_and_bank_accounts_excluding_stock_value()
    {
        $cashAccount = Account::create([
            'tenant_id' => $this->store->id,
            'code' => '1000',
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 25000,
            'is_active' => true,
        ]);

        $bankGl = Account::create([
            'tenant_id' => $this->store->id,
            'code' => '1010',
            'name' => 'Meezan Bank GL',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 75000,
            'is_active' => true,
        ]);

        $entry = JournalEntry::create([
            'tenant_id' => $this->store->id,
            'user_id' => $this->owner->id,
            'entry_number' => 'JE-' . uniqid(),
            'date' => now()->toDateString(),
            'description' => 'Opening Cash',
            'status' => 'posted',
            'is_reversed' => 0,
        ]);

        JournalItem::create([
            'tenant_id' => $this->store->id,
            'journal_entry_id' => $entry->id,
            'account_id' => $cashAccount->id,
            'debit' => 25000,
            'credit' => 0,
        ]);

        JournalItem::create([
            'tenant_id' => $this->store->id,
            'journal_entry_id' => $entry->id,
            'account_id' => $bankGl->id,
            'debit' => 75000,
            'credit' => 0,
        ]);

        $bankAccount = BankAccount::create([
            'tenant_id' => $this->store->id,
            'bank_name' => 'Meezan Bank',
            'account_name' => 'Meezan Account',
            'account_number' => '1234567890',
            'account_type' => 'bank',
            'opening_balance' => 75000,
            'chart_of_account_id' => $bankGl->id,
            'is_active' => true,
        ]);

        $product = Product::withoutEvents(function () {
            return Product::create([
                'tenant_id' => $this->store->id,
                'name' => 'Test Product',
                'sku' => 'TP-' . uniqid(),
                'cost_price' => 500,
                'price' => 750,
                'stock_quantity' => 100,
            ]);
        });

        InventoryBatch::create([
            'tenant_id' => $this->store->id,
            'product_id' => $product->id,
            'original_qty' => 100,
            'remaining_qty' => 100,
            'unit_cost' => 500,
        ]);

        $response = $this->actingAs($this->owner)
            ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

        $response->assertStatus(200);

        $page = $response->viewData('page');
        $props = $page['props'];

        $cashDataBalance = (float) ($props['cashData']['balance'] ?? 0);
        $bankAccounts = $props['bankAccounts'] ?? [];
        $bankTotal = array_sum(array_map(fn($b) => (float) ($b['current_balance'] ?? 0), $bankAccounts));
        $inventoryValue = (float) ($props['inventoryValue'] ?? 0);

        $this->assertEquals(25000, $cashDataBalance);
        $this->assertEquals(75000, $bankTotal);
        $this->assertGreaterThan(0, $inventoryValue);

        $totalBalance = $cashDataBalance + $bankTotal;
        $this->assertEquals(100000, $totalBalance);
        $this->assertNotEquals($totalBalance + $inventoryValue, $totalBalance);
    }

    public function test_empty_store_returns_zero_financial_data_with_no_demo_or_sample_fallbacks()
    {
        $response = $this->actingAs($this->owner)
            ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

        $response->assertStatus(200);

        $page = $response->viewData('page');
        $props = $page['props'];

        $this->assertEquals(0, (float) ($props['cashData']['balance'] ?? 0));
        $this->assertEmpty($props['cashData']['transactions'] ?? []);
        $this->assertEmpty($props['bankAccounts'] ?? []);
        $this->assertEmpty($props['recentTransactions'] ?? []);
        $this->assertEquals(0, (float) ($props['inventoryValue'] ?? 0));
    }

    public function test_cashier_receives_no_financial_balances_or_transactions()
    {
        $cashier = User::factory()->create();
        TenantUser::withoutEvents(function () use ($cashier) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'role' => 'cashier',
                'status' => 'active',
                'permissions' => ['pos.access', 'pos.sell', 'pos.receipts'],
            ]);
        });

        Account::create([
            'tenant_id' => $this->store->id,
            'code' => '1000',
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 50000,
            'is_active' => true,
        ]);

        $bankGl = Account::create([
            'tenant_id' => $this->store->id,
            'code' => '1010',
            'name' => 'Bank GL',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 150000,
            'is_active' => true,
        ]);

        BankAccount::create([
            'tenant_id' => $this->store->id,
            'bank_name' => 'Bank',
            'account_name' => 'Bank',
            'account_number' => '1234',
            'account_type' => 'bank',
            'chart_of_account_id' => $bankGl->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($cashier)
            ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

        $response->assertStatus(200);

        $page = $response->viewData('page');
        $props = $page['props'];

        $this->assertNull($props['cashData'] ?? null);
        $this->assertEmpty($props['bankAccounts'] ?? []);
        $this->assertEmpty($props['recentTransactions'] ?? []);
        $this->assertNull($props['netProfit'] ?? null);
    }

    public function test_role_permission_matrix_across_all_store_roles()
    {
        $rolesAndExpectedVisibility = [
            'owner' => ['role' => 'owner', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => true],
            'admin' => ['role' => 'admin', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => true],
            'custom_accountant' => ['role' => 'custom', 'mode' => 'custom', 'permissions' => ['finance.balances', 'finance.transactions'], 'can_view_balances' => true],
            'manager' => ['role' => 'manager', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => false],
            'cashier' => ['role' => 'cashier', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => false],
            'stock_keeper' => ['role' => 'stock_keeper', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => false],
            'viewer' => ['role' => 'viewer', 'mode' => 'inherit', 'permissions' => null, 'can_view_balances' => false],
        ];

        Account::firstOrCreate([
            'tenant_id' => $this->store->id,
            'code' => '1000',
        ], [
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 0,
            'is_active' => true,
        ]);

        foreach ($rolesAndExpectedVisibility as $roleKey => $config) {
            $user = User::factory()->create();
            $membership = TenantUser::withoutEvents(function () use ($user, $config) {
                return TenantUser::create([
                    'tenant_id' => $this->store->id,
                    'user_id' => $user->id,
                    'role' => $config['role'],
                    'status' => 'active',
                    'permission_override_mode' => $config['mode'],
                    'permissions' => $config['permissions'],
                ]);
            });

            $response = $this->actingAs($user)
                ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

            $response->assertStatus(200);
            $page = $response->viewData('page');
            $props = $page['props'];

            if ($config['can_view_balances']) {
                $this->assertNotNull($props['cashData'] ?? null, "Role {$roleKey} should receive cashData");
            } else {
                $this->assertNull($props['cashData'] ?? null, "Role {$roleKey} should NOT receive cashData");
                $this->assertEmpty($props['bankAccounts'] ?? [], "Role {$roleKey} should NOT receive bankAccounts");
            }

            $membership->delete();
            $user->delete();
        }
    }
}
