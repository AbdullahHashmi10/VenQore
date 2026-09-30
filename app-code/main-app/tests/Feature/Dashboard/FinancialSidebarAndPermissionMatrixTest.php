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
use App\Models\Sale;
use App\Models\RegisterShift;
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
            'timezone' => 'UTC',
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

    public function test_cashier_with_pos_checkout_receives_only_own_session_and_no_store_sales_metrics()
    {
        $cashier = User::factory()->create();
        TenantUser::withoutEvents(function () use ($cashier) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'role' => 'cashier',
                'status' => 'active',
                'permission_override_mode' => 'custom',
                'permissions' => ['pos.open_session', 'pos.checkout', 'pos.close_session', 'inventory.view'],
            ]);
        });

        // Create sale by owner (Store sale: 15000)
        Sale::withoutEvents(function () use ($cashier) {
            Sale::create([
                'tenant_id' => $this->store->id,
                'user_id' => $this->owner->id,
                'reference_number' => 'REF-OWNER-' . uniqid(),
                'status' => 'posted',
                'posted_at' => now(),
                'subtotal' => 15000,
                'total' => 15000,
                'net_sales' => 15000,
            ]);

            // Create sale by cashier (Cashier sale: 3500)
            Sale::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'reference_number' => 'REF-CASHIER-' . uniqid(),
                'status' => 'posted',
                'posted_at' => now(),
                'subtotal' => 3500,
                'total' => 3500,
                'net_sales' => 3500,
            ]);
        });

        $response = $this->actingAs($cashier)
            ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

        $response->assertStatus(200);
        $props = $response->viewData('page')['props'];

        // Cashier MUST NOT receive store-wide sales performance or charts
        $this->assertNull($props['performance'] ?? null, 'Cashier must not receive store-wide sales performance stats');
        $this->assertEmpty($props['salesData'] ?? [], 'Cashier must not receive store-wide sales chart data');
        $this->assertEmpty($props['topSellingItems'] ?? [], 'Cashier must not receive store-wide top selling items');

        // Cashier MUST receive their own session metrics
        $this->assertNotNull($props['session'] ?? null, 'Cashier must receive own session stats');
        $this->assertEquals(1, $props['session']['transaction_count']);
        $this->assertEquals(3500, $props['session']['session_total']);
    }

    public function test_stock_lookup_grant_does_not_receive_inventory_valuation()
    {
        $stockUser = User::factory()->create();
        TenantUser::withoutEvents(function () use ($stockUser) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $stockUser->id,
                'role' => 'stock_keeper',
                'status' => 'active',
                'permission_override_mode' => 'custom',
                'permissions' => ['inventory.view'],
            ]);
        });

        $product = Product::withoutEvents(function () {
            return Product::create([
                'tenant_id' => $this->store->id,
                'name' => 'Valued Product',
                'sku' => 'VP-' . uniqid(),
                'cost_price' => 200,
                'price' => 400,
                'stock_quantity' => 50,
            ]);
        });

        InventoryBatch::create([
            'tenant_id' => $this->store->id,
            'product_id' => $product->id,
            'original_qty' => 50,
            'remaining_qty' => 50,
            'unit_cost' => 200,
        ]);

        $response = $this->actingAs($stockUser)
            ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

        $response->assertStatus(200);
        $props = $response->viewData('page')['props'];

        // Inventory value must be withheld
        $this->assertNull($props['inventoryValue'] ?? null, 'User with only inventory.view must not receive inventoryValue');
    }

    public function test_all_32_staff_presets_end_to_end_permission_and_visibility_contract()
    {
        $presetsPath = resource_path('js/Data/staff_presets.json');
        $this->assertFileExists($presetsPath);
        $presets = json_decode(file_get_contents($presetsPath), true);
        $this->assertCount(32, $presets, 'There must be exactly 32 staff preset templates');

        foreach ($presets as $preset) {
            $user = User::factory()->create();
            $permissions = $preset['permissions'];

            TenantUser::withoutEvents(function () use ($user, $preset, $permissions) {
                return TenantUser::create([
                    'tenant_id' => $this->store->id,
                    'user_id' => $user->id,
                    'role' => 'custom',
                    'status' => 'active',
                    'permission_override_mode' => 'custom',
                    'permissions' => $permissions,
                ]);
            });

            $response = $this->actingAs($user)
                ->get(route('store.dashboard', ['store_slug' => $this->store->slug]));

            $response->assertStatus(200);
            $props = $response->viewData('page')['props'];

            $hasBalancePerm = in_array('finance.balances', $permissions, true) || in_array('*', $permissions, true);
            $hasFinancialPerm = in_array('reports.financial', $permissions, true) || in_array('*', $permissions, true);
            $hasStockValPerm = in_array('reports.stock', $permissions, true) || $hasFinancialPerm || $hasBalancePerm;
            $hasSalesViewPerm = in_array('sales.view', $permissions, true) || in_array('reports.performance', $permissions, true) || in_array('reports.summary', $permissions, true) || in_array('*', $permissions, true);

            if ($hasBalancePerm) {
                $this->assertNotNull($props['cashData'] ?? null, "Preset {$preset['id']} with finance.balances should receive cashData");
            } else {
                $this->assertNull($props['cashData'] ?? null, "Preset {$preset['id']} without finance.balances must not receive cashData");
                $this->assertEmpty($props['bankAccounts'] ?? [], "Preset {$preset['id']} without finance.balances must not receive bankAccounts");
            }

            if (!$hasStockValPerm) {
                $this->assertNull($props['inventoryValue'] ?? null, "Preset {$preset['id']} without stock report/financial perm must not receive inventoryValue");
            }

            if (!$hasSalesViewPerm) {
                $this->assertNull($props['performance'] ?? null, "Preset {$preset['id']} without sales.view must not receive store-wide sales performance");
            }

            $user->delete();
        }
    }

    public function test_access_revocation_immediately_removes_financial_and_sales_access()
    {
        $user = User::factory()->create();
        $membership = TenantUser::withoutEvents(function () use ($user) {
            return TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $user->id,
                'role' => 'custom',
                'status' => 'active',
                'permission_override_mode' => 'custom',
                'permissions' => ['finance.balances', 'sales.view', 'reports.stock'],
            ]);
        });

        Account::firstOrCreate([
            'tenant_id' => $this->store->id,
            'code' => '1000',
        ], [
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 10000,
            'is_active' => true,
        ]);

        // 1. First request with permissions granted
        $res1 = $this->actingAs($user)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
        $res1->assertStatus(200);
        $this->assertNotNull($res1->viewData('page')['props']['cashData'] ?? null);

        // 2. Revoke permissions
        $membership->permissions = ['pos.checkout'];
        $membership->save();

        // 3. Second request immediately respects revoked permissions
        $res2 = $this->actingAs($user)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
        $res2->assertStatus(200);
        $this->assertNull($res2->viewData('page')['props']['cashData'] ?? null);
        $this->assertNull($res2->viewData('page')['props']['performance'] ?? null);
    }

    public function test_denial_overrides_has_no_greyed_placeholders_and_hides_unauthorized_cards()
    {
        $denialOverrides = config('dashboard_access.denial_overrides', []);
        $this->assertEmpty($denialOverrides, 'denial_overrides must be empty to ensure unauthorized cards are hidden rather than greyed');
    }

    public function test_bank_routes_strictly_require_finance_permissions_and_deny_unauthorized_users()
    {
        $bankAccount = BankAccount::create([
            'tenant_id' => $this->store->id,
            'bank_name' => 'Protected Bank',
            'name' => 'Corporate Main Account',
            'account_number' => 'PK-9999-1234',
            'account_type' => 'checking',
            'current_balance' => 500000,
        ]);

        $cashier = User::factory()->create();
        TenantUser::withoutEvents(function () use ($cashier) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'role' => 'cashier',
                'status' => 'active',
                'permissions' => ['pos.checkout', 'pos.open_session'],
            ]);
        });

        // 1. Cashier attempts to access bank accounts page -> 403 Forbidden
        $resIndex = $this->actingAs($cashier)->get(route('store.bank-accounts.index', ['store_slug' => $this->store->slug]));
        $resIndex->assertStatus(403);

        // 2. Cashier attempts to access bank transactions -> 403 Forbidden
        $resTx = $this->actingAs($cashier)->get(route('store.bank-accounts.transactions', ['store_slug' => $this->store->slug, 'bankAccount' => $bankAccount->id]));
        $resTx->assertStatus(403);

        // 3. Cashier attempts to query bank accounts API -> 403 Forbidden
        $resApi = $this->actingAs($cashier)->get(route('store.api.bank-accounts', ['store_slug' => $this->store->slug]));
        $resApi->assertStatus(403);

        // 4. Owner has full access to all bank endpoints -> 200 OK
        $ownerIndex = $this->actingAs($this->owner)->get(route('store.bank-accounts.index', ['store_slug' => $this->store->slug]));
        $ownerIndex->assertStatus(200);

        $ownerTx = $this->actingAs($this->owner)->get(route('store.bank-accounts.transactions', ['store_slug' => $this->store->slug, 'bankAccount' => $bankAccount->id]));
        $ownerTx->assertStatus(200);

        $ownerApi = $this->actingAs($this->owner)->get(route('store.api.bank-accounts', ['store_slug' => $this->store->slug]));
        $ownerApi->assertStatus(200);
        $this->assertNotEmpty($ownerApi->json());
    }

    public function test_cashier_and_pos_only_users_receive_scoped_personal_session_metrics()
    {
        $cashier = User::factory()->create();
        TenantUser::withoutEvents(function () use ($cashier) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'role' => 'cashier',
                'status' => 'active',
                'permissions' => ['pos.checkout', 'pos.open_session'],
            ]);
        });

        // Create a posted sale today for this cashier (no register shift open)
        Sale::withoutEvents(function () use ($cashier) {
            Sale::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashier->id,
                'reference_number' => 'REF-SESSION-' . uniqid(),
                'status' => 'posted',
                'subtotal' => 1500,
                'discount' => 0,
                'tax' => 0,
                'total' => 1500,
                'net_sales' => 1500,
                'posted_at' => now(),
                'created_at' => now(),
            ]);
        });

        $res = $this->actingAs($cashier)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
        $res->assertStatus(200);

        $sessionProp = $res->viewData('page')['props']['session'] ?? null;
        $this->assertNotNull($sessionProp, 'Cashier must receive personal session prop');
        $this->assertFalse($sessionProp['is_shift_open'], 'Session must indicate shift is closed when no shift is active');
        $this->assertEquals(1, $sessionProp['transaction_count']);
        $this->assertEquals(1500.0, (float) $sessionProp['session_total']);
    }

    public function test_cashier_session_with_open_register_shift_isolates_individual_cashier_sales_on_shared_shift()
    {
        $cashierA = User::factory()->create();
        $cashierB = User::factory()->create();

        TenantUser::withoutEvents(function () use ($cashierA, $cashierB) {
            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashierA->id,
                'role' => 'cashier',
                'status' => 'active',
                'permissions' => ['pos.checkout', 'pos.open_session'],
            ]);

            TenantUser::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashierB->id,
                'role' => 'cashier',
                'status' => 'active',
                'permissions' => ['pos.checkout', 'pos.open_session'],
            ]);
        });

        // Open shift for Cashier A
        $shiftA = RegisterShift::create([
            'tenant_id' => $this->store->id,
            'opened_by' => $cashierA->id,
            'opened_at' => now(),
            'opening_float' => 1000,
            'status' => 'open',
        ]);

        Sale::withoutEvents(function () use ($cashierA, $cashierB, $shiftA) {
            // Sale 1 by Cashier A on Shift A ($2500)
            Sale::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashierA->id,
                'register_shift_id' => $shiftA->id,
                'reference_number' => 'REF-SHIFTA-' . uniqid(),
                'status' => 'posted',
                'subtotal' => 2500,
                'discount' => 0,
                'tax' => 0,
                'total' => 2500,
                'net_sales' => 2500,
                'posted_at' => now(),
                'created_at' => now(),
            ]);

            // Sale 2 by Cashier B on the same Shift A ($6000)
            Sale::create([
                'tenant_id' => $this->store->id,
                'user_id' => $cashierB->id,
                'register_shift_id' => $shiftA->id,
                'reference_number' => 'REF-SHIFTB-' . uniqid(),
                'status' => 'posted',
                'subtotal' => 6000,
                'discount' => 0,
                'tax' => 0,
                'total' => 6000,
                'net_sales' => 6000,
                'posted_at' => now(),
                'created_at' => now(),
            ]);
        });

        // Request dashboard as Cashier A (owns the open shift)
        $resA = $this->actingAs($cashierA)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
        $resA->assertStatus(200);
        $sessionA = $resA->viewData('page')['props']['session'];

        $this->assertTrue($sessionA['is_shift_open']);
        $this->assertEquals(1, $sessionA['transaction_count'], 'Cashier A must only count their own sale on the shift');
        $this->assertEquals(2500.0, (float) $sessionA['session_total'], 'Cashier A total must exclude Cashier B sales');

        // Request dashboard as Cashier B (sold on shift, but has no open shift opened_by Cashier B)
        $resB = $this->actingAs($cashierB)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
        $resB->assertStatus(200);
        $sessionB = $resB->viewData('page')['props']['session'];

        $this->assertFalse($sessionB['is_shift_open']);
        $this->assertEquals(1, $sessionB['transaction_count'], 'Cashier B must only count their own sale');
        $this->assertEquals(6000.0, (float) $sessionB['session_total'], 'Cashier B total must reflect only Cashier B sales');
    }

    public function test_staff_preset_application_via_admin_member_update_endpoint()
    {
        $presetsPath = resource_path('js/Data/staff_presets.json');
        $this->assertFileExists($presetsPath);
        $presets = json_decode(file_get_contents($presetsPath), true);
        $presetsById = collect($presets)->keyBy('id');

        // Test representative presets
        $presetsToTest = ['checkout', 'bookkeeper', 'purchasing_clerk', 'warehouse_operator'];

        Account::firstOrCreate([
            'tenant_id' => $this->store->id,
            'code' => '1000',
        ], [
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'balance' => 10000,
            'is_active' => true,
        ]);

        foreach ($presetsToTest as $presetId) {
            $preset = $presetsById->get($presetId);
            $this->assertNotNull($preset, "Preset {$presetId} must exist");

            $staff = User::factory()->create();
            $membership = TenantUser::withoutEvents(function () use ($staff) {
                return TenantUser::create([
                    'tenant_id' => $this->store->id,
                    'user_id' => $staff->id,
                    'role' => 'viewer',
                    'status' => 'active',
                    'permissions' => [],
                ]);
            });

            // Owner applies preset via PATCH /s/{store_slug}/admin/users/{member}
            $updateResponse = $this->actingAs($this->owner)->patch(
                route('store.admin.users.update', ['store_slug' => $this->store->slug, 'member' => $membership->id]),
                [
                    'role' => 'custom',
                    'custom_role_name' => $preset['name'],
                    'permission_override_mode' => 'custom',
                    'permissions' => $preset['permissions'],
                ]
            );

            $this->assertTrue(in_array($updateResponse->getStatusCode(), [200, 302]));

            // Reload membership from DB
            $membership->refresh();
            $this->assertEquals('custom', $membership->role);
            $this->assertEquals($preset['name'], $membership->custom_role_name);
            $this->assertEquals($preset['permissions'], $membership->permissions);

            // Now staff accesses dashboard
            $dashRes = $this->actingAs($staff)->get(route('store.dashboard', ['store_slug' => $this->store->slug]));
            $dashRes->assertStatus(200);
            $props = $dashRes->viewData('page')['props'];

            $hasBalances = in_array('finance.balances', $preset['permissions'], true);
            $hasSalesView = in_array('sales.view', $preset['permissions'], true);

            if ($hasBalances) {
                $this->assertNotNull($props['cashData'] ?? null, "Preset {$presetId} must have cashData");
            } else {
                $this->assertNull($props['cashData'] ?? null, "Preset {$presetId} must NOT have cashData");
                $this->assertEmpty($props['bankAccounts'] ?? [], "Preset {$presetId} must NOT have bankAccounts");
            }

            if (!$hasSalesView) {
                $this->assertNull($props['performance'] ?? null, "Preset {$presetId} must NOT have store-wide performance");
            }
        }
    }

    public function test_preset_definitions_are_strictly_valid_against_canonical_permissions_vocabulary()
    {
        $presetsPath = resource_path('js/Data/staff_presets.json');
        $this->assertFileExists($presetsPath);
        $presets = json_decode(file_get_contents($presetsPath), true);
        $canonicalPerms = config('permissions.owner', []);

        $this->assertCount(32, $presets);

        foreach ($presets as $preset) {
            $this->assertNotEmpty($preset['id']);
            $this->assertNotEmpty($preset['name']);
            $this->assertNotEmpty($preset['group']);
            $this->assertNotEmpty($preset['purpose']);
            $this->assertIsArray($preset['permissions']);

            foreach ($preset['permissions'] as $perm) {
                $this->assertContains($perm, $canonicalPerms, "Preset '{$preset['name']}' contains unknown permission key '{$perm}'");
            }
        }
    }
}

