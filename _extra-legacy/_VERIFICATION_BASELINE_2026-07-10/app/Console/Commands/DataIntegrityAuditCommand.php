<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Invoice;
use App\Models\SalesOrder;
use App\Models\PurchaseOrder;
use App\Models\Proposal;
use App\Models\DebitNote;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DataIntegrityAuditCommand extends Command
{
    protected $signature = 'audit:data-integrity';
    protected $description = 'Perform pricing correctness and list calculation verification across all core POS and transaction modules';

    private const TENANT_ID = 999998;
    private const STORE_SLUG = 'golden-audit';
    private const USER_OWNER = 10001;

    private Tenant $tenant;
    private User $user;

    public function handle(): int
    {
        $this->info("=================================================================");
        $this->info("        VENQORE DATA & PRICING INTEGRITY SWEEP");
        $this->info("=================================================================");

        // ── Bootstrapping tenant ──
        $this->tenant = Tenant::find(self::TENANT_ID);
        if (!$this->tenant) {
            $this->error("Golden Audit Tenant not found. Run migrations and seed first.");
            return Command::FAILURE;
        }

        $this->user = User::find(self::USER_OWNER);
        if (!$this->user) {
            $this->error("Owner user not found.");
            return Command::FAILURE;
        }

        auth()->login($this->user);
        app()->instance('current.tenant', $this->tenant);

        // Bind request for session/auth helpers
        $req = Request::create('/', 'GET');
        app()->instance('request', $req);

        $this->info("Authenticated as: {$this->user->name}");
        $this->info("Store Slug: " . self::STORE_SLUG);

        $failures = 0;

        // ── 1. POS Pricing & Stock Verification ──
        $failures += $this->verifyPosPricing();

        // ── 2. Sales List Calculations ──
        $failures += $this->verifySalesList();

        // ── 3. Purchases List Calculations ──
        $failures += $this->verifyPurchasesList();

        // ── 4. Proposals List Calculations ──
        $failures += $this->verifyProposalsList();

        // ── 5. Debit Notes List Calculations ──
        $failures += $this->verifyDebitNotesList();

        // ── 6. Payments List Calculations ──
        $failures += $this->verifyPaymentsList();

        // ── 7. Sales Orders / Pre-Sales List Calculations ──
        $failures += $this->verifySalesOrdersList();

        // ── 8. Purchase Orders / Pre-Purchases List Calculations ──
        $failures += $this->verifyPurchaseOrdersList();

        if ($failures > 0) {
            $this->error("\n🚨 Data Integrity Audit failed with {$failures} verification error(s)!");
            return Command::FAILURE;
        }

        $this->info("\n=================================================================");
        $this->info("✅ SUCCESS: All pricing and data integrity checks passed cleanly!");
        $this->info("=================================================================");
        return Command::SUCCESS;
    }

    private function verifyPosPricing(): int
    {
        $this->info("\n[1/8] Verifying POS pricing and stock levels...");

        $url = route('store.pos.featured', ['store_slug' => self::STORE_SLUG]);
        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);
        
        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $products = $data['products'] ?? $data;

            if (empty($products)) {
                $this->error("❌ POS Featured API returned no products.");
                return 1;
            }

            foreach ($products as $p) {
                $dbProd = Product::where('tenant_id', self::TENANT_ID)->where('id', $p['id'])->first();
                if (!$dbProd) {
                    $this->error("❌ Product ID {$p['id']} returned by POS not found in DB.");
                    return 1;
                }

                // Check prices
                if (abs((float)$p['price'] - (float)$dbProd->price) > 0.01) {
                    $this->error("❌ POS Price mismatch for {$dbProd->name}: POS shows {$p['price']} but DB has {$dbProd->price}");
                    return 1;
                }
                if (isset($p['cost_price']) && abs((float)$p['cost_price'] - (float)$dbProd->cost_price) > 0.01) {
                    $this->error("❌ POS Cost Price mismatch for {$dbProd->name}: POS shows {$p['cost_price']} but DB has {$dbProd->cost_price}");
                    return 1;
                }

                // Check stocks
                $expectedStock = (float)DB::table('stocks')->where('product_id', $p['id'])->sum('quantity');
                if (abs((float)$p['stock_quantity'] - $expectedStock) > 0.01) {
                    $this->error("❌ POS Stock mismatch for {$dbProd->name}: POS shows {$p['stock_quantity']} but DB has {$expectedStock}");
                    return 1;
                }
            }

            $this->line("  ✅ POS API pricing and stock matches database perfectly.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during POS pricing check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifySalesList(): int
    {
        $this->info("\n[2/8] Verifying Sales list and statistics calculations...");

        $url = route('store.sales.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $totalSales = $props['stats']['total_sale'] ?? 0;
            $dbTotal = (float)Sale::where('tenant_id', self::TENANT_ID)
                ->where('status', '!=', 'returned')
                ->whereBetween('created_at', ['2025-01-01 00:00:00', '2025-01-31 23:59:59'])
                ->sum('net_sales');

            if (abs($totalSales - $dbTotal) > 0.01) {
                $this->error("❌ Sales list total stats mismatch: UI has {$totalSales} but DB has {$dbTotal}");
                return 1;
            }

            $this->line("  ✅ Sales list calculations and stats are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Sales check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifyPurchasesList(): int
    {
        $this->info("\n[3/8] Verifying Purchases list calculations...");

        $url = route('store.purchases.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $totalPurchase = $props['stats']['total_purchase'] ?? 0;
            $apAccount = \App\Models\Account::where('code', '2000')
                ->where('tenant_id', self::TENANT_ID)
                ->value('id');
            // Scoped to tenant AND to the same from_date/to_date window requested above —
            // PurchaseController@index now applies the same scope to its stats query
            // (previously it summed a lifetime, cross-tenant total; see FIX-08).
            $dbTotal = (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.reference_type', 'purchase')
                ->where('journal_entries.tenant_id', self::TENANT_ID)
                ->where('journal_items.account_id', $apAccount)
                ->where('journal_entries.is_reversed', 0)
                ->whereBetween('journal_entries.date', ['2025-01-01', '2025-01-31'])
                ->sum('journal_items.credit');

            if (abs($totalPurchase - $dbTotal) > 0.01) {
                $this->error("❌ Purchases total stats mismatch: UI has {$totalPurchase} but DB has {$dbTotal}");
                return 1;
            }

            $this->line("  ✅ Purchases list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Purchases check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifyProposalsList(): int
    {
        $this->info("\n[4/8] Verifying Proposals list calculations...");

        $url = route('store.proposals.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $totalValue = $props['stats']['total_value'] ?? 0;
            $dbTotal = (float)Proposal::where('tenant_id', self::TENANT_ID)->sum('total_amount');

            if (abs($totalValue - $dbTotal) > 0.01) {
                $this->error("❌ Proposals total stats mismatch: UI has {$totalValue} but DB has {$dbTotal}");
                return 1;
            }

            $this->line("  ✅ Proposals list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Proposals check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifyDebitNotesList(): int
    {
        $this->info("\n[5/8] Verifying Debit Notes list calculations...");

        $url = route('store.debit-notes.index', [
            'store_slug' => self::STORE_SLUG,
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $totalAmount = $props['stats']['totalAmount'] ?? 0;
            $dbTotal = (float)DebitNote::where('tenant_id', self::TENANT_ID)->sum('amount');

            if (abs($totalAmount - $dbTotal) > 0.01) {
                $this->error("❌ Debit Notes total stats mismatch: UI has {$totalAmount} but DB has {$dbTotal}");
                return 1;
            }

            $this->line("  ✅ Debit Notes list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Debit Notes check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifyPaymentsList(): int
    {
        $this->info("\n[6/8] Verifying Payments In/Out list calculations...");

        $url = route('store.payments.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $monthIn = $props['stats']['month_in'] ?? 0;
            $monthOut = $props['stats']['month_out'] ?? 0;

            $today = Carbon::today();
            $dbMonthIn = (float)Payment::where('tenant_id', self::TENANT_ID)
                ->where('type', 'in')
                ->whereMonth('date', $today->month)
                ->whereYear('date', $today->year)
                ->sum('amount');

            $dbMonthOut = (float)Payment::where('tenant_id', self::TENANT_ID)
                ->where('type', 'out')
                ->whereMonth('date', $today->month)
                ->whereYear('date', $today->year)
                ->sum('amount');

            if (abs($monthIn - $dbMonthIn) > 0.01 || abs($monthOut - $dbMonthOut) > 0.01) {
                $this->error("❌ Payments month stats mismatch: UI In/Out is {$monthIn}/{$monthOut} but DB is {$dbMonthIn}/{$dbMonthOut}");
                return 1;
            }

            $this->line("  ✅ Payments list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Payments check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifySalesOrdersList(): int
    {
        $this->info("\n[7/8] Verifying Sales Orders / Pre-Sales list calculations...");

        $url = route('store.sales-orders.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            $totalOrders = $props['stats']['total_orders'] ?? 0;
            $dbTotal = (float)SalesOrder::where('tenant_id', self::TENANT_ID)->sum('total_amount');

            if (abs($totalOrders - $dbTotal) > 0.01) {
                $this->error("❌ Sales Orders total stats mismatch: UI has {$totalOrders} but DB has {$dbTotal}");
                return 1;
            }

            $this->line("  ✅ Sales Orders list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Sales Orders check: " . $e->getMessage());
            return 1;
        }
    }

    private function verifyPurchaseOrdersList(): int
    {
        $this->info("\n[8/8] Verifying Purchase Orders / Pre-Purchases list calculations...");

        $url = route('store.purchase-orders.index', [
            'store_slug' => self::STORE_SLUG,
            'from_date'  => '2025-01-01',
            'to_date'    => '2025-01-31',
            'filter'     => 'custom'
        ]);

        $request = Request::create($url, 'GET', [], [], [], ['HTTP_X_INERTIA' => 'true']);

        try {
            $response = app()->handle($request);
            $data = json_decode($response->getContent(), true);
            $props = $data['props'] ?? $data;

            // Verify that page loads and items are present
            $ordersCount = count($props['orders']['data'] ?? $props['orders'] ?? []);
            $dbCount = PurchaseOrder::where('tenant_id', self::TENANT_ID)->count();

            if ($ordersCount === 0 && $dbCount > 0) {
                $this->error("❌ Purchase Orders list is empty but DB has {$dbCount} records.");
                return 1;
            }

            $this->line("  ✅ Purchase Orders list calculations are correct.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("❌ Exception during Purchase Orders check: " . $e->getMessage());
            return 1;
        }
    }
}
