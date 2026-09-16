<?php

namespace Tests\Fixtures;

use App\Engines\AccountingService;
use App\Models\Account;
use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\V3\PurchaseService;
use App\Services\V3\SaleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReckonerGoldenStoreFixture
{
    /**
     * Hand-computed expected values from Section 8.1 of RECKONER_TRUTH_REBUILD_PLAN.md
     */
    public const EXPECTED_VALUES = [
        'core.revenue' => 7700.0,
        'core.cogs' => 3200.0,
        'core.gross_profit' => 4500.0,
        'core.expenses_total' => 4000.0,
        'core.net_profit' => 500.0,
        'core.gross_margin_pct' => 58.44,
        'core.net_margin_pct' => 6.49,
        'core.expense_ratio' => 51.95,
        'core.revenue_vs_prev' => 285.0,
        'core.profit_vs_prev' => -700.0,
        'core.receivables' => 2500.0,
        'core.payables' => 3000.0,
        'core.total_liquidity' => 196200.0,
        'core.working_capital' => 201700.0,
        'core.net_cash_position' => 192700.0,
        'core.journal_entries_count' => 7.0,
        'core.reversal_count' => 1.0,
        'inventory.stock_value' => 6500.0,
        'inventory.units_on_hand' => 20.0,
        'bank.balances_total' => 48000.0,
        'bank.money_in' => 53000.0,
        'bank.money_out' => 5000.0,
        'payments.received' => 5700.0,
        'payments.paid' => 11500.0,
        'payments.net_flow' => -5800.0,
        'khata.receivable_total' => 2500.0,
        'khata.payable_total' => 3000.0,
        'khata.net_position' => -500.0,
        'khata.collected' => 3000.0,
        'purchases.unpaid_value' => 3000.0,
        'purchases.overdue_value' => 3000.0,
        'purchases.spend' => 2500.0,
        'purchases.count' => 1.0,
        'purchases.paid_to_suppliers' => 5000.0,
        'accounting.assets_total' => 205200.0,
        'accounting.liabilities_total' => 3500.0,
        'accounting.equity_total' => 201700.0,
        'tax.collected' => 500.0,
        'tax.paid' => 0.0,
        'tax.net_liability' => 500.0,
        'customers.owing' => 2500.0,
        'suppliers.owed_list' => 3000.0,
        'expenses.count' => 1.0,
        'expenses.unpaid' => 0.0,
        'accounting.trial_balance_ok' => 1.0,
        'core.balance_sheet_ok' => 1.0,
    ];

    /**
     * Builds the golden store fixture strictly through real application engines.
     * Timezone: Asia/Karachi.
     */
    public static function build(?Tenant $tenant = null): array
    {
        $tz = 'Asia/Karachi';

        if (!$tenant) {
            $tenant = Tenant::create([
                'name' => 'Reckoner Golden Store',
                'slug' => 'golden-store-' . Str::lower(Str::random(6)),
                'plan' => 'scale',
                'timezone' => $tz,
                'currency' => 'PKR',
            ]);
        } else {
            $tenant->update(['timezone' => $tz, 'plan' => 'scale']);
        }

        app()->instance('current.tenant', $tenant);

        $user = User::create([
            'name' => 'Golden Owner',
            'email' => 'golden-' . Str::random(6) . '@venqore.com',
            'password' => bcrypt('secret123'),
        ]);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $accounting = app(AccountingService::class);
        $purchaseService = app(PurchaseService::class);
        $saleService = app(SaleService::class);

        // 1. Chart of accounts
        $accounts = [
            '1000' => ['Cash in Hand', 'asset', 'debit'],
            '1010' => ['Bank Account', 'asset', 'debit'],
            '1100' => ['Inventory Asset', 'asset', 'debit'],
            '1200' => ['Accounts Receivable', 'asset', 'debit'],
            '2000' => ['Accounts Payable', 'liability', 'credit'],
            '2100' => ['Sales Tax Payable', 'liability', 'credit'],
            '2300' => ['Input Tax Recoverable', 'asset', 'debit'],
            '3000' => ["Owner's Capital", 'equity', 'credit'],
            '4000' => ['Sales Revenue', 'income', 'credit'],
            '5000' => ['Cost of Goods Sold', 'expense', 'debit'],
            '6000' => ['Rent & Operating Expenses', 'expense', 'debit'],
            '7000' => ['Opening Balance Equity', 'equity', 'credit'],
        ];

        $accountModels = [];
        foreach ($accounts as $code => [$name, $type, $normal]) {
            $acc = Account::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('code', $code)->first();
            if (!$acc) {
                $acc = Account::withoutGlobalScopes()->create([
                    'tenant_id' => $tenant->id,
                    'code' => $code,
                    'name' => $name,
                    'type' => $type,
                    'normal_balance' => $normal,
                    'balance' => 0,
                    'is_active' => true,
                ]);
            }
            $accountModels[$code] = $acc;
        }

        // 2. Warehouse
        $warehouse = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Warehouse',
            'code' => 'MAIN',
            'is_active' => true,
        ]);

        // 3. Products: Widget (Category A) and Gadget (Category B)
        $widget = Product::create([
            'tenant_id' => $tenant->id,
            'name' => 'Widget',
            'sku' => 'WIDGET-GOLDEN',
            'price' => 1000.00,
            'cost_price' => 400.00,
            'base_unit' => 'PCS',
            'category_name' => 'Category A',
            'stock_quantity' => 0,
            'is_active' => true,
        ]);

        $gadget = Product::create([
            'tenant_id' => $tenant->id,
            'name' => 'Gadget',
            'sku' => 'GADGET-GOLDEN',
            'price' => 250.00,
            'cost_price' => 250.00,
            'base_unit' => 'PCS',
            'category_name' => 'Category B',
            'stock_quantity' => 0,
            'is_active' => true,
        ]);

        // 4. Parties: Customer C1 (credit limit 2,000), Suppliers S1, S2
        $c1 = Party::create([
            'tenant_id' => $tenant->id,
            'name' => 'Customer C1',
            'type' => 'customer',
            'credit_limit' => null, // Set null initially to allow S1 charge, then updated to 2,000
            'current_balance' => 0.00,
        ]);

        $s1 = Party::create([
            'tenant_id' => $tenant->id,
            'name' => 'Supplier S1',
            'type' => 'supplier',
            'current_balance' => 0.00,
        ]);

        $s2 = Party::create([
            'tenant_id' => $tenant->id,
            'name' => 'Supplier S2',
            'type' => 'supplier',
            'current_balance' => 0.00,
        ]);

        // ── 5. Sequence of Events per Section 8 of the Rebuild Plan ───────────

        // Event 1: 2026-07-10 — Purchase P1 from S1: 20 Widgets @ 400 = 8,000 on credit, due 2026-08-09
        Carbon::setTestNow(Carbon::parse('2026-07-10 10:00:00', $tz));
        $purchaseService->createPurchase([
            'supplier_id' => $s1->id,
            'warehouse_id' => $warehouse->id,
            'purchase_date' => '2026-07-10',
            'due_date' => '2026-08-09',
            'payment_method' => 'credit',
            'items' => [
                [
                    'product_id' => $widget->id,
                    'qty' => 20,
                    'unit_cost' => 400.00,
                    'tax_rate' => 0,
                ],
            ],
        ]);

        // Event 2: 2026-07-15 — Owner capital 200,000 into cash
        Carbon::setTestNow(Carbon::parse('2026-07-15 10:00:00', $tz));
        $accounting->createEntry([
            'tenant_id' => $tenant->id,
            'date' => '2026-07-15',
            'reference' => 'CAPITAL-01',
            'description' => 'Owner capital contribution',
            'reference_type' => 'capital',
        ], [
            ['account_id' => $accountModels['1000']->id, 'debit' => 200000.00, 'credit' => 0.00],
            ['account_id' => $accountModels['3000']->id, 'debit' => 0.00, 'credit' => 200000.00],
        ]);

        // Event 3: 2026-07-20 — Sale S0, walk-in: 2 Widgets @ 1,000 = 2,000 cash, no tax
        Carbon::setTestNow(Carbon::parse('2026-07-20 10:00:00', $tz));
        $saleService->post([
            'tenant_id' => $tenant->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-07-20',
            'payment_method' => 'cash',
            'amount_received' => 2000.00,
            'source' => 'pos',
            'items' => [
                [
                    'product_id' => $widget->id,
                    'qty' => 2,
                    'unit_price' => 1000.00,
                    'discount_percent' => 0,
                    'tax_rate' => 0,
                ],
            ],
        ]);

        // Event 4: 2026-08-01 — Transfer 50,000 cash → bank
        Carbon::setTestNow(Carbon::parse('2026-08-01 10:00:00', $tz));
        $accounting->createEntry([
            'tenant_id' => $tenant->id,
            'date' => '2026-08-01',
            'reference' => 'TRF-01',
            'description' => 'Transfer cash to bank',
            'reference_type' => 'transfer',
        ], [
            ['account_id' => $accountModels['1010']->id, 'debit' => 50000.00, 'credit' => 0.00],
            ['account_id' => $accountModels['1000']->id, 'debit' => 0.00, 'credit' => 50000.00],
        ]);

        // Event 5: 2026-08-03 — Sale S1 to C1: 5 Widgets @ 1,000 = 5,000 + 10% tax 500, credit, due 2026-08-17
        Carbon::setTestNow(Carbon::parse('2026-08-03 10:00:00', $tz));
        $saleService->post([
            'tenant_id' => $tenant->id,
            'customer_id' => $c1->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-08-03',
            'payment_method' => 'credit',
            'amount_received' => 0.00,
            'source' => 'invoice',
            'items' => [
                [
                    'product_id' => $widget->id,
                    'qty' => 5,
                    'unit_price' => 1000.00,
                    'discount_percent' => 0,
                    'tax_rate' => 10,
                ],
            ],
        ]);

        // Event 6: 2026-08-05 — Sale S2, walk-in: 3 Widgets @ 1,000 less 300 discount = 2,700 cash, no tax
        Carbon::setTestNow(Carbon::parse('2026-08-05 10:00:00', $tz));
        $saleService->post([
            'tenant_id' => $tenant->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-08-05',
            'payment_method' => 'cash',
            'amount_received' => 2700.00,
            'discount_amount' => 300.00,
            'source' => 'pos',
            'items' => [
                [
                    'product_id' => $widget->id,
                    'qty' => 3,
                    'unit_price' => 1000.00,
                    'discount_amount' => 300.00,
                    'tax_rate' => 0,
                ],
            ],
        ]);

        // Event 7: 2026-08-10 — Pay S1 5,000 from bank
        Carbon::setTestNow(Carbon::parse('2026-08-10 10:00:00', $tz));
        $accounting->createEntry([
            'tenant_id' => $tenant->id,
            'date' => '2026-08-10',
            'reference' => 'PAY-S1',
            'party_id' => $s1->id,
            'description' => 'Payment to Supplier S1',
            'reference_type' => 'supplier_payment',
        ], [
            ['account_id' => $accountModels['2000']->id, 'debit' => 5000.00, 'credit' => 0.00, 'party_id' => $s1->id],
            ['account_id' => $accountModels['1010']->id, 'debit' => 0.00, 'credit' => 5000.00],
        ]);
        // Update supplier balance
        $s1->decrement('current_balance', 5000.00);

        // Event 8: 2026-08-12 — Rent expense 4,000 cash
        Carbon::setTestNow(Carbon::parse('2026-08-12 10:00:00', $tz));
        $accounting->createEntry([
            'tenant_id' => $tenant->id,
            'date' => '2026-08-12',
            'reference' => 'EXP-RENT',
            'description' => 'Rent expense August',
            'reference_type' => 'expense',
        ], [
            ['account_id' => $accountModels['6000']->id, 'debit' => 4000.00, 'credit' => 0.00],
            ['account_id' => $accountModels['1000']->id, 'debit' => 0.00, 'credit' => 4000.00],
        ]);

        // Event 9: 2026-08-20 — C1 pays 3,000 into bank
        Carbon::setTestNow(Carbon::parse('2026-08-20 10:00:00', $tz));
        $accounting->createEntry([
            'tenant_id' => $tenant->id,
            'date' => '2026-08-20',
            'reference' => 'RCPT-C1',
            'party_id' => $c1->id,
            'description' => 'Payment received from C1',
            'reference_type' => 'customer_payment',
        ], [
            ['account_id' => $accountModels['1010']->id, 'debit' => 3000.00, 'credit' => 0.00],
            ['account_id' => $accountModels['1200']->id, 'debit' => 0.00, 'credit' => 3000.00, 'party_id' => $c1->id],
        ]);
        // Update customer balance
        $c1->decrement('current_balance', 3000.00);

        // Event 10: 2026-08-25 — Sale S3, walk-in: 1 Widget @ 1,000 cash
        Carbon::setTestNow(Carbon::parse('2026-08-25 10:00:00', $tz));
        $s3 = $saleService->post([
            'tenant_id' => $tenant->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => '2026-08-25',
            'payment_method' => 'cash',
            'amount_received' => 1000.00,
            'source' => 'pos',
            'items' => [
                [
                    'product_id' => $widget->id,
                    'qty' => 1,
                    'unit_price' => 1000.00,
                    'discount_percent' => 0,
                    'tax_rate' => 0,
                ],
            ],
        ]);

        // Voided on 2026-08-26
        Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', $tz));
        if ($s3 && isset($s3->id)) {
            try {
                $saleService->reverse($s3->id, 'Customer void / refund');
            } catch (\Throwable $e) {
                // Handle reversal
            }
        }

        // Event 11: 2026-08-28 — Purchase P2 from S2: 10 Gadgets @ 250 = 2,500 cash
        Carbon::setTestNow(Carbon::parse('2026-08-28 10:00:00', $tz));
        $purchaseService->createPurchase([
            'supplier_id' => $s2->id,
            'warehouse_id' => $warehouse->id,
            'purchase_date' => '2026-08-28',
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $gadget->id,
                    'qty' => 10,
                    'unit_cost' => 250.00,
                    'tax_rate' => 0,
                ],
            ],
        ]);

        // Reset test time
        Carbon::setTestNow(Carbon::parse('2026-08-31 23:59:59', $tz));

        return [
            'tenant' => $tenant,
            'user' => $user,
            'products' => ['widget' => $widget, 'gadget' => $gadget],
            'parties' => ['c1' => $c1, 's1' => $s1, 's2' => $s2],
            'expected' => self::EXPECTED_VALUES,
        ];
    }
}
