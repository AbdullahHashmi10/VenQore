<?php

namespace Tests\Fixtures;

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StoreProvisioner;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ReckonerGoldenStoreFixture
{
    /**
     * Hand-computed expected values from Section 8.1 of RECKONER_TRUTH_REBUILD_PLAN.md
     * Window: 2026-08-01 -> 2026-08-31, comparison July 2026, as of 2026-08-31.
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
        'core.receivables_aging' => 2500.0,
        'core.payables_aging' => 3000.0,
        'core.avg_transaction_value' => 3850.0,
        'expenses.by_category' => 4000.0,
        'tax.by_rate' => 500.0,
        // ── Slice 4b: Selling (verified via §8.1 golden fixture) ──
        'pos.revenue'         => 2700.0,   // POS sale net_total = 3000 - 300 discount
        'pos.sale_count'      => 1.0,      // 1 POS sale posted
        'pos.avg_ticket'      => 2700.0,   // net_sales / transaction_count
        'pos.discount_total'  => 300.0,    // discount on POS sale
        'invoicing.count'     => 1.0,      // 1 invoice created
        'invoicing.value'     => 5000.0,   // invoice net_total
        'customers.active'    => 1.0,      // 1 active customer party
        'customers.new'       => 1.0,      // 1 new customer created in period
        'locations.count'     => 1.0,      // 1 warehouse
        'staff.member_count'  => 1.0,      // 1 staff attendance record
        // ── Slice 4c: Stock & Buying (verified via §8.1 golden fixture) ──
        'products.count'      => 2.0,      // 2 products: Widget and Gadget
        'suppliers.count'     => 2.0,      // 2 suppliers: S1 and S2
    ];

    /**
     * Rebuilds the golden store fixture strictly through real application screens / HTTP routes.
     * Timezone: Asia/Karachi.
     *
     * @param Tenant|null $tenant Existing tenant to reuse or null to create fresh via StoreProvisioner
     * @param mixed|null $http TestCase instance for test runner dispatch, or null for direct kernel dispatch
     */
    public static function build(?Tenant $tenant = null, $http = null): array
    {
        $tz = 'Asia/Karachi';

        // 1. Owner User
        $user = User::firstOrCreate(
            ['email' => 'golden-owner@venqore.com'],
            [
                'name'              => 'Golden Owner',
                'password'          => Hash::make('secret123'),
                'role'              => 'owner',
                'email_verified_at' => now(),
            ]
        );
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        // 2. Store Provisioning via StoreProvisioner
        if (!$tenant) {
            $existing = Tenant::where('slug', 'golden-store')->first();
            if ($existing) {
                self::purgeTenant($existing);
                $tenant = $existing;
            }
        }

        if (!$tenant) {
            $allLiveModules = array_keys(config('modules', []));
            $provisioner = app(StoreProvisioner::class);
            $tenant = $provisioner->create($user, [
                'name'            => 'Reckoner Golden Store',
                'business_type'   => 'retail',
                'country'         => 'PK',
                'currency'        => 'PKR',
                'timezone'        => $tz,
                'plan'            => 'scale',
                'setup_completed' => true,
                'modules'         => $allLiveModules,
            ]);

            // Ensure deterministic slug for tests & routes
            $tenant->slug = 'golden-store';
            $tenant->plan = 'scale';
            $tenant->status = 'active';
            $tenant->timezone = $tz;
            $tenant->save();
        } else {
            self::purgeTenant($tenant);
            $tenant->update([
                'name'     => 'Reckoner Golden Store',
                'timezone' => $tz,
                'plan'     => 'scale',
                'status'   => 'active',
            ]);
        }

        // Set up membership & security PIN for manager/passcode actions
        $membership = TenantUser::updateOrCreate(
            ['tenant_id' => $tenant->id, 'user_id' => $user->id],
            [
                'role'         => 'owner',
                'status'       => 'active',
                'security_pin' => Hash::make('123456'),
                'joined_at'    => now(),
            ]
        );

        app()->instance('current.tenant', $tenant);
        app()->instance('current.tenant_user', $membership);

        // 3. Bank Account for transactions
        $bankAccount = BankAccount::firstOrCreate(
            ['tenant_id' => $tenant->id, 'type' => 'bank'],
            [
                'name'            => 'Main Bank',
                'bank_name'       => 'Main Bank',
                'account_number'  => '12345678',
                'account_type'    => 'bank',
                'current_balance' => 0.00,
            ]
        );

        // 4. Warehouse (created by provisioner/seeder or ensured here)
        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();
        if (!$warehouse) {
            $warehouse = Warehouse::create([
                'tenant_id'  => $tenant->id,
                'name'       => 'Main Warehouse',
                'is_default' => true,
            ]);
        }

        // 5. Product Categories (real categories per Review blocker B3)
        $catA = Category::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Category A']
        );
        $catB = Category::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Category B']
        );

        // 6. Products: Widget (Category A) and Gadget (Category B)
        $widget = Product::firstOrCreate(
            ['tenant_id' => $tenant->id, 'sku' => 'WIDGET-GOLDEN'],
            [
                'name'           => 'Widget',
                'price'          => 1000.00,
                'cost_price'     => 400.00,
                'base_unit'      => 'PCS',
                'category_id'    => $catA->id,
                'stock_quantity' => 0,
                'is_active'      => true,
            ]
        );

        $gadget = Product::firstOrCreate(
            ['tenant_id' => $tenant->id, 'sku' => 'GADGET-GOLDEN'],
            [
                'name'           => 'Gadget',
                'price'          => 250.00,
                'cost_price'     => 250.00,
                'base_unit'      => 'PCS',
                'category_id'    => $catB->id,
                'stock_quantity' => 0,
                'is_active'      => true,
            ]
        );

        // 7. Parties: Customer C1, Suppliers S1, S2
        $partyC1 = Party::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Customer C1'],
            [
                'type'            => 'customer',
                'credit_limit'    => null,
                'current_balance' => 0.00,
            ]
        );

        $sup1 = Party::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Supplier S1'],
            [
                'type'            => 'supplier',
                'current_balance' => 0.00,
            ]
        );

        $sup2 = Party::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Supplier S2'],
            [
                'type'            => 'supplier',
                'current_balance' => 0.00,
            ]
        );

        // Ensure Rent expense category exists
        $rentCat = ExpenseCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Rent'],
            ['is_active' => true]
        );

        $slug = $tenant->slug;

        // ── SEQUENCE OF 11 EVENTS PER SECTION 8 OF THE REBUILD PLAN ───────────

        // Event 1: 2026-07-10 — Purchase P1 from S1: 20 Widgets @ 400 = 8,000 on credit, due 2026-08-09
        Carbon::setTestNow(Carbon::parse('2026-07-10 10:00:00', $tz));
        $resP1 = self::request('POST', "/s/{$slug}/purchases", [
            'supplier_id'    => $sup1->id,
            'warehouse_id'   => $warehouse->id,
            'purchase_date'  => '2026-07-10',
            'due_date'       => '2026-08-09',
            'payment_method' => 'credit',
            'items'          => [
                [
                    'product_id' => $widget->id,
                    'qty'        => 20,
                    'unit_cost'  => 400.00,
                    'tax_rate'   => 0,
                ],
            ],
        ], $user, $http);
        $p1 = DB::table('purchases')->where('tenant_id', $tenant->id)->where('party_id', $sup1->id)->first();

        // Event 2: 2026-07-15 — Owner capital 200,000 into cash
        Carbon::setTestNow(Carbon::parse('2026-07-15 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/v3/funds", [
            'type'             => 'injection',
            'payment_method'   => 'cash',
            'amount'           => 200000.00,
            'transaction_date' => '2026-07-15',
            'description'      => 'Owner capital contribution',
            'passcode'         => '123456',
        ], $user, $http);

        // Event 3: 2026-07-20 — Sale S0, walk-in at counter: 2 Widgets @ 1,000 = 2,000 cash, no tax
        Carbon::setTestNow(Carbon::parse('2026-07-20 10:00:00', $tz));
        $resS0 = self::request('POST', "/s/{$slug}/sales", [
            'source'         => 'pos',
            'payment_method' => 'cash',
            'amount_paid'    => 2000.00,
            'sale_date'      => '2026-07-20',
            'tax_exempt'     => true,
            'warehouse_id'   => $warehouse->id,
            'items'          => [
                [
                    'product_id' => $widget->id,
                    'quantity'   => 2,
                    'price'      => 1000.00,
                    'discount'   => 0,
                ],
            ],
        ], $user, $http);
        $s0Id = $resS0->json('sale_id');
        $saleS0 = DB::table('sales')->where('tenant_id', $tenant->id)->where('id', $s0Id)->first();

        // Event 4: 2026-08-01 — Transfer 50,000 cash -> bank (fund-transfer screen)
        Carbon::setTestNow(Carbon::parse('2026-08-01 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/funds/transfer", [
            'from_type'  => 'cash',
            'to_type'    => 'bank',
            'to_bank_id' => $bankAccount->id,
            'amount'     => 50000.00,
            'reason'     => 'Transfer cash to bank',
            'passcode'   => '123456',
        ], $user, $http);

        // Event 5: 2026-08-02 — C1 credit limit set to 10,000
        Carbon::setTestNow(Carbon::parse('2026-08-02 10:00:00', $tz));
        self::request('PUT', "/s/{$slug}/v3/parties/{$partyC1->id}", [
            'name'         => 'Customer C1',
            'type'         => 'customer',
            'credit_limit' => 10000.00,
        ], $user, $http);

        // Event 6: 2026-08-03 — Sale S1 to C1 on invoice screen: 5 Widgets @ 1,000 = 5,000 + 10% tax 500, credit, due 2026-08-17
        Carbon::setTestNow(Carbon::parse('2026-08-03 10:00:00', $tz));
        $resS1 = self::request('POST', "/s/{$slug}/sales", [
            'source'         => 'manual',
            'customer_id'    => $partyC1->id,
            'payment_method' => 'credit',
            'amount_paid'    => 0.00,
            'add_to_ledger'  => true,
            'sale_date'      => '2026-08-03',
            'due_date'       => '2026-08-17',
            'tax_rate'       => 10,
            'warehouse_id'   => $warehouse->id,
            'items'          => [
                [
                    'product_id' => $widget->id,
                    'quantity'   => 5,
                    'price'      => 1000.00,
                    'discount'   => 0,
                    'tax_rate'   => 10,
                ],
            ],
        ], $user, $http);
        $s1Id = $resS1->json('sale_id');
        $saleS1 = DB::table('sales')->where('tenant_id', $tenant->id)->where('id', $s1Id)->first();

        // Event 7: 2026-08-05 — Sale S2, walk-in at counter: 3 Widgets @ 1,000 less one 300 discount (on sale, not line) = 2,700 cash
        Carbon::setTestNow(Carbon::parse('2026-08-05 10:00:00', $tz));
        $resS2 = self::request('POST', "/s/{$slug}/sales", [
            'source'         => 'pos',
            'payment_method' => 'cash',
            'amount_paid'    => 2700.00,
            'discount'       => 300.00,
            'sale_date'      => '2026-08-05',
            'tax_exempt'     => true,
            'warehouse_id'   => $warehouse->id,
            'items'          => [
                [
                    'product_id' => $widget->id,
                    'quantity'   => 3,
                    'price'      => 1000.00,
                    'discount'   => 0,
                ],
            ],
        ], $user, $http);
        $s2Id = $resS2->json('sale_id');
        $saleS2 = DB::table('sales')->where('tenant_id', $tenant->id)->where('id', $s2Id)->first();

        // Event 8: 2026-08-10 — Pay supplier S1 5,000 from bank (allocated to purchase P1)
        Carbon::setTestNow(Carbon::parse('2026-08-10 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/v3/supplier-payments", [
            'supplier_id'     => $sup1->id,
            'payment_date'    => '2026-08-10',
            'payment_method'  => 'bank',
            'amount'          => 5000.00,
            'reference'       => 'PAY-S1',
            'allocations'     => [
                [
                    'purchase_id' => $p1->id,
                    'amount'      => 5000.00,
                ],
            ],
        ], $user, $http);

        // Event 9: 2026-08-12 — Rent expense 4,000 cash (expense screen)
        Carbon::setTestNow(Carbon::parse('2026-08-12 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/expenses", [
            'date'                => '2026-08-12',
            'expense_category_id' => $rentCat->id,
            'amount'              => 4000.00,
            'payment_method'      => 'cash',
            'description'         => 'Rent expense August',
            'reference'           => 'EXP-RENT',
        ], $user, $http);

        // Event 10: 2026-08-20 — C1 pays 3,000 into bank (allocated to sale S1)
        Carbon::setTestNow(Carbon::parse('2026-08-20 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/v3/customer-payments", [
            'customer_id'    => $partyC1->id,
            'payment_date'   => '2026-08-20',
            'payment_method' => 'bank',
            'amount'         => 3000.00,
            'reference'      => 'RCPT-C1',
            'allocations'    => [
                [
                    'sale_id' => $saleS1->id,
                    'amount'  => 3000.00,
                ],
            ],
        ], $user, $http);

        // Event 11: 2026-08-21 — C1 credit limit lowered to 2,000
        Carbon::setTestNow(Carbon::parse('2026-08-21 10:00:00', $tz));
        self::request('PUT', "/s/{$slug}/v3/parties/{$partyC1->id}", [
            'name'         => 'Customer C1',
            'type'         => 'customer',
            'credit_limit' => 2000.00,
        ], $user, $http);

        // Event 12: 2026-08-25 — Sale S3, walk-in at counter: 1 Widget @ 1,000 cash — voided 2026-08-26
        Carbon::setTestNow(Carbon::parse('2026-08-25 10:00:00', $tz));
        $resS3 = self::request('POST', "/s/{$slug}/sales", [
            'source'         => 'pos',
            'payment_method' => 'cash',
            'amount_paid'    => 1000.00,
            'sale_date'      => '2026-08-25',
            'tax_exempt'     => true,
            'warehouse_id'   => $warehouse->id,
            'items'          => [
                [
                    'product_id' => $widget->id,
                    'quantity'   => 1,
                    'price'      => 1000.00,
                    'discount'   => 0,
                ],
            ],
        ], $user, $http);
        $s3Id = $resS3->json('sale_id');
        $saleS3 = DB::table('sales')->where('tenant_id', $tenant->id)->where('id', $s3Id)->first();

        // Voided on 2026-08-26
        Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/sales/{$s3Id}/cancel", [
            'reason' => 'Customer void / refund',
        ], $user, $http);

        // Event 13: 2026-08-28 — Purchase P2 from S2: 10 Gadgets @ 250 = 2,500 cash
        Carbon::setTestNow(Carbon::parse('2026-08-28 10:00:00', $tz));
        self::request('POST', "/s/{$slug}/purchases", [
            'supplier_id'    => $sup2->id,
            'warehouse_id'   => $warehouse->id,
            'purchase_date'  => '2026-08-28',
            'payment_method' => 'cash',
            'amount_paid'    => 2500.00,
            'items'          => [
                [
                    'product_id' => $gadget->id,
                    'qty'        => 10,
                    'unit_cost'  => 250.00,
                    'tax_rate'   => 0,
                ],
            ],
        ], $user, $http);
        $p2 = DB::table('purchases')->where('tenant_id', $tenant->id)->where('party_id', $sup2->id)->first();

        // Reset test clock to 2026-08-31 23:59:59
        Carbon::setTestNow(Carbon::parse('2026-08-31 23:59:59', $tz));

        return [
            'tenant'    => $tenant,
            'user'      => $user,
            'products'  => ['widget' => $widget, 'gadget' => $gadget],
            'parties'   => ['c1' => $partyC1, 's1' => $sup1, 's2' => $sup2],
            'sales'     => ['s0' => $saleS0, 's1' => $saleS1, 's2' => $saleS2, 's3' => $saleS3],
            'purchases' => ['p1' => $p1, 'p2' => $p2],
            'expected'  => self::EXPECTED_VALUES,
        ];
    }

    /**
     * Dispatch an HTTP request through either the test harness ($http) or Laravel's HTTP Kernel.
     */
    protected static function request(string $method, string $uri, array $data, User $user, $http = null)
    {
        $method = strtoupper($method);

        if ($http && method_exists($http, 'actingAs')) {
            $testResponse = match ($method) {
                'POST'   => $http->actingAs($user)->postJson($uri, $data),
                'PUT'    => $http->actingAs($user)->putJson($uri, $data),
                'DELETE' => $http->actingAs($user)->deleteJson($uri, $data),
                'GET'    => $http->actingAs($user)->getJson($uri),
                default  => throw new \InvalidArgumentException("Unsupported HTTP method {$method}"),
            };

            $status = $testResponse->getStatusCode();
            if ($status >= 400) {
                $err = $testResponse->json('message') ?? substr($testResponse->getContent(), 0, 500);
                throw new \RuntimeException("HTTP {$method} to {$uri} failed ({$status}): {$err}");
            }

            return $testResponse;
        }

        // Direct kernel dispatch (e.g. from Artisan command)
        if (class_exists(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)) {
            app()->singleton(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class, fn () => new class extends \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken {
                public function __construct() {}
                public function handle($request, \Closure $next) { return $next($request); }
            });
        }

        Auth::login($user);
        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT'  => 'application/json',
        ];
        $req = \Illuminate\Http\Request::create($uri, $method, [], [], [], $server, json_encode($data));
        $req->setUserResolver(fn () => $user);

        /** @var \Illuminate\Contracts\Http\Kernel $kernel */
        $kernel = app(\Illuminate\Contracts\Http\Kernel::class);
        $response = $kernel->handle($req);
        $kernel->terminate($req, $response);

        $testResponse = new \Illuminate\Testing\TestResponse($response);
        $status = $testResponse->getStatusCode();
        if ($status >= 400) {
            $err = $testResponse->json('message') ?? substr($testResponse->getContent(), 0, 500);
            throw new \RuntimeException("HTTP {$method} to {$uri} failed ({$status}): {$err}");
        }

        return $testResponse;
    }

    /**
     * Purges all tenant activity in foreign-key ordered transaction.
     */
    public static function purgeTenant(Tenant $tenant): void
    {
        DB::transaction(function () use ($tenant) {
            $tid = $tenant->id;

            DB::table('party_snapshots')->whereIn('party_id', function ($q) use ($tid) {
                $q->select('id')->from('parties')->where('tenant_id', $tid);
            })->delete();

            $allocTable = Schema::hasTable('allocations') ? 'allocations' : (Schema::hasTable('payment_allocations') ? 'payment_allocations' : null);
            if ($allocTable) {
                if (Schema::hasColumn($allocTable, 'tenant_id')) {
                    DB::table($allocTable)->where('tenant_id', $tid)->delete();
                } else {
                    DB::table($allocTable)->whereIn('sale_id', function ($q) use ($tid) {
                        $q->select('id')->from('sales')->where('tenant_id', $tid);
                    })->delete();
                    DB::table($allocTable)->whereIn('purchase_id', function ($q) use ($tid) {
                        $q->select('id')->from('purchases')->where('tenant_id', $tid);
                    })->delete();
                }
            }

            DB::table('journal_items')->whereIn('journal_entry_id', function ($q) use ($tid) {
                $q->select('id')->from('journal_entries')->where('tenant_id', $tid);
            })->delete();

            DB::table('journal_entries')->where('tenant_id', $tid)->delete();

            DB::table('sale_item_batches')->where('tenant_id', $tid)->delete();
            DB::table('sale_items')->whereIn('sale_id', function ($q) use ($tid) {
                $q->select('id')->from('sales')->where('tenant_id', $tid);
            })->delete();
            DB::table('payments')->where('tenant_id', $tid)->delete();
            DB::table('sales')->where('tenant_id', $tid)->delete();

            DB::table('purchase_items')->where('tenant_id', $tid)->delete();
            DB::table('purchases')->where('tenant_id', $tid)->delete();

            DB::table('stock_movements')->where('tenant_id', $tid)->delete();
            DB::table('stocks')->where('tenant_id', $tid)->delete();
            DB::table('inventory_batches')->where('tenant_id', $tid)->delete();

            DB::table('expenses')->where('tenant_id', $tid)->delete();
            DB::table('fund_transactions')->whereIn('from_account_id', function ($q) use ($tid) {
                $q->select('id')->from('bank_accounts')->where('tenant_id', $tid);
            })->orWhereIn('to_account_id', function ($q) use ($tid) {
                $q->select('id')->from('bank_accounts')->where('tenant_id', $tid);
            })->delete();

            DB::table('products')->where('tenant_id', $tid)->delete();
            DB::table('categories')->where('tenant_id', $tid)->delete();
            DB::table('suppliers')->whereIn('party_id', function ($q) use ($tid) {
                $q->select('id')->from('parties')->where('tenant_id', $tid);
            })->delete();
            DB::table('parties')->where('tenant_id', $tid)->delete();
        });
    }
}
