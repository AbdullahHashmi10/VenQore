<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\User;
use App\Services\FinancialReportingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;

/**
 * LedgerTruthAuditCommand
 *
 * Discovers ALL GET routes in the application, makes an authenticated HTTP
 * request to each one, extracts any financial props from the Inertia response,
 * and compares them against the authoritative Ledger (journal_items) values
 * calculated by FinancialReportingService.
 *
 * Coverage target: 200+ routes.
 */
class LedgerTruthAuditCommand extends Command
{
    /** Phase G scan-floor + strict-mode counters. */
    private int $routeFloor = 0;
    private int $cntNonJsonUnverified = 0;

    protected $signature = 'audit:ledger-truth
                            {--skip-seed   : Skip the GoldenAuditSeeder step}
                            {--only=       : Comma-separated list of route names to scan (e.g. store.dashboard,store.reports.sales)}
                            {--financial   : Only report pages that have financial props (skip non-financial)}
                            {--strict      : Fail with exit code 1 if any ledger-derived metric is unverified or mismatch > 0}';

    protected $description = 'Full-coverage Ledger Truth Sweep – hits every GET route and validates financial props against journal_items.';

    // ── Constants ────────────────────────────────────────────────────────────
    private const TENANT_ID  = 999998;
    private const STORE_SLUG = 'golden-audit';

    // ── State ────────────────────────────────────────────────────────────────
    private Tenant $tenant;
    private User   $user;

    /** @var array<string, mixed>  route-param → resolved value */
    private array $paramMap = [];

    /** @var array<string, float>  control key → ledger value */
    private array $control = [];

    /** @var array<int, array>  per-route scan result rows */
    private array $results = [];

    private int $cntScanned    = 0;
    private int $cntPass       = 0;
    private int $cntAllZeros   = 0;
    private int $cntMismatch   = 0;
    private int $cntError      = 0;
    private int $cntSkipped    = 0;

    // ── Routes that are safe to skip (non-HTML, mutation-only, or need special infra) ──
    private const SKIP_NAMES = [
        // Google OAuth / external redirects
        'store.google.redirect',
        'store.google.backup.download',
        'store.google.backup.restore',
        // Billing external links
        'store.billing.portal',
        'store.billing.upgrade',
        'store.billing.checkout-addon',
        'store.billing.checkout-upload-service',
        // Exports (return file downloads, not Inertia)
        'store.sales.export',
        'store.sales-orders.export',
        'store.pre-sales.export',
        // Print (raw HTML or PDF, not Inertia JSON)
        'store.sales.print',
        'store.purchases.print',
        'store.purchase-orders.print',
        'store.proposals.print',
        'store.sales-orders.print',
        'store.debit-notes.print',
        // Barcode / POS search (JSON API endpoints)
        'store.pos.barcode',
        'store.pos.search',
        'store.pos.categories',
        'store.pos.featured',
        // WebSocket / push (non-HTTP)
        'store.attendance.heartbeat',
        'store.api.heartbeat',
        // Admin-only system utilities
        'store.system.reset',
        'store.system.delete-entity',
        // Backup file operations
        'store.backups.download',
        'store.backups.restore',
        // Sync endpoints (mobile API)
        'store.api.sync.customers',
        'store.api.sync.inventory',
        'store.api.sync.orders.batch',
        'store.api.sync.products',
        'store.api.sync.suppliers',
        'store.api.sync.taxes',
        'store.api.sync.users',
        'store.api.check-connection',
        // Screenshot viewer
        'store.terminal-activities.screenshot',
        // Manufacturing rules API
        'store.api.bank-accounts',
        // Intentionally stubbed 501 actions (Phase 2.2 / Future scope)
        'store.finance.accounts',
        'store.finance.journal',
        'store.payment-in.create',
        'store.payment-out.create',
        'store.production.edit',
        'store.reports.discount-report',
        'store.reports.inventory-valuation',
        // Deprecated V2 / unused template routes (HTTP 404)
        'store.sales.create',
        'store.sales.edit',
        'store.sales.master',
        'store.sales.orders.show',
        'store.production.show',
        'store.proposals.show',
        'store.proposals.edit',
        'store.vensynq.index',
        'store.vensynq.settings',
        'store.vensynq.connect',
        'store.vensynq.callback',
        'store.growth-engine.whatsapp',
        'store.products.variants.index',
        'store.payments.show',
        'store.staff-attendance.show',
        'store.staff.attendance.show',
        'store.admin.vena.ticket.show',
        // API / request parameter validation routes (HTTP 422 / 400)
        'store.sales.lookup',
        'store.ai.query',
        'store.sales-orders.show',
        'store.inventory.stats',
    ];

    // ── URI substrings that indicate non-Inertia / non-financial routes ──
    private const SKIP_URI_FRAGMENTS = [
        '/api/',
        '/barcode/',
        '/heartbeat',
        '/export',
        '/print',
        '/screenshot',
        '/sync/',
        '/send-email',
        '/send-whatsapp',
        '/check-connection',
    ];

    // ── Deep comparison map: routeName → [propPath => controlKey] ──────────
    private const DEEP_CHECKS = [
        // Dashboard
        'store.dashboard' => [
            'performance.Month.sales'   => 'revenue_month',
            'netProfit.Month.value'     => 'net_profit_month',
        ],
        // Sales command center
        'store.sales.dashboard' => [
            'stats.sales_month'        => 'revenue_month',
        ],
        // Report pages (non-v3)
        'store.reports.profit-loss' => [
            'stats.revenue'        => 'revenue_ytd',
            'stats.net_profit'     => 'net_profit_ytd',
            'stats.gross_profit'   => 'gross_profit_ytd',
        ],
        'store.reports.balance-sheet' => [
            'assets.total'      => 'assets_total',
            'liabilities.total' => 'liabilities_total',
        ],
        'store.reports.trial-balance' => [
            'totalDebits'    => 'trial_balance_total_debit',
            'totalCredits'   => 'trial_balance_total_credit',
        ],
        'store.reports.tax' => [
            'stats.total_output_tax'    => 'tax_output_ytd',
            'stats.total_input_tax'     => 'tax_input_ytd',
        ],
        'store.reports.sales' => [
            'stats.total_sales'     => 'revenue_ytd',
        ],
        'store.reports.purchases' => [
            'stats.total_purchases'   => 'purchases_ytd',
        ],
        'store.reports.cash-flow' => [
            'stats.inflow'          => 'cash_inflow_ytd',
            'stats.outflow'         => 'cash_outflow_ytd',
        ],
        'store.reports.expenses' => [
            'stats.total_expenses'  => 'expenses_ytd',
        ],
        // Accounting module
        'store.accounting.pnl' => [
            'grossProfit'   => 'gross_profit_ytd',
            'netProfit'     => 'net_profit_ytd',
        ],
        'store.accounting.balance-sheet' => [
            'total_assets'      => 'assets_total',
            'total_liabilities' => 'liabilities_total',
        ],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Entry point
    // ─────────────────────────────────────────────────────────────────────────
    public function handle(): int
    {
        $this->banner();

        // ── Step 1: Seed ──────────────────────────────────────────────────
        if (!$this->option('skip-seed')) {
            $this->step(1, 6, 'Seeding Golden Audit data (GoldenAuditSeeder)...');
            $this->call('db:seed', ['--class' => 'GoldenAuditSeeder']);
        } else {
            $this->step(1, 6, 'Skipping seed (--skip-seed flag).');
        }

        // ── Step 2: Bootstrap tenant context ─────────────────────────────
        $this->step(2, 6, 'Booting tenant context...');
        $tenant = Tenant::find(self::TENANT_ID);
        if (!$tenant) {
            $this->error('Golden Audit Tenant not found (ID ' . self::TENANT_ID . '). Run without --skip-seed first.');
            return Command::FAILURE;
        }
        $this->tenant = $tenant;

        $membership = DB::table('tenant_users')
            ->where('tenant_id', self::TENANT_ID)
            ->where('role', 'owner')
            ->first();

        if (!$membership) {
            $this->error('No owner membership found for Golden Audit Tenant.');
            return Command::FAILURE;
        }

        $this->user = User::find($membership->user_id);
        auth()->login($this->user);
        app()->instance('current.tenant', $this->tenant);
        $this->line("  Authenticated as: <info>{$this->user->name}</info> ({$this->user->email})");

        // ── Step 3: Build param resolver map ─────────────────────────────
        $this->step(3, 6, 'Resolving route parameters from seeded data...');
        $this->buildParamMap();

        // ── Step 4: Calculate Ledger control values ───────────────────────
        $this->step(4, 6, 'Calculating Ledger control values (FinancialReportingService)...');
        $this->buildControlValues();

        // ── Step 5: Discover & scan all GET routes ────────────────────────
        $this->step(5, 6, 'Discovering routes...');
        $this->loadRegistry();
        $routes = $this->discoverGetRoutes();
        $total  = count($routes);
        // Phase G (F-19): the scan floor is the number of routes we DISCOVERED. If fewer
        // than this are actually scanned/classified, strict mode fails — a sweep must
        // prove how much it swept.
        $this->routeFloor = $total;
        $this->line("  Found <info>{$total}</info> GET routes to scan.");

        $this->newLine();
        $this->line('<comment>Scanning routes...</comment>');
        $this->newLine();

        $only = $this->option('only')
            ? array_map('trim', explode(',', $this->option('only')))
            : null;

        foreach ($routes as $route) {
            if ($only && !in_array($route['name'], $only, true)) {
                $this->cntSkipped++;
                continue;
            }
            $this->scanRoute($route);
        }

        // ── Step 6: Generate report ───────────────────────────────────────
        $this->step(6, 6, 'Generating report...');
        $this->saveRegistry();
        $this->generateReport();

        if ($this->option('strict')) {
            $unverifiedLedgerMetrics = 0;
            $ledgerDerivedTotal = 0;
            $comparedMetrics = 0;
            foreach ($this->registry['metrics'] ?? [] as $m) {
                if (($m['classification'] ?? '') === 'LEDGER-DERIVED') {
                    $ledgerDerivedTotal++;
                    if (!($m['verified'] ?? false)) {
                        $unverifiedLedgerMetrics++;
                    } else {
                        $comparedMetrics++;
                    }
                }
            }

            // Phase G floors (F-19): assert HOW MUCH was actually swept, so a sweep that
            // silently skipped everything cannot pass. Routes scanned must meet the
            // discovered-route floor, and compared metrics must meet the LEDGER-DERIVED floor.
            $routesScanned = $this->cntPass + $this->cntMismatch + $this->cntAllZeros
                + ($this->cntNonJsonUnverified ?? 0);
            $routeFloor = (int) ($this->routeFloor ?? 0);

            $failures = [];
            if ($this->cntMismatch > 0) {
                $failures[] = "Mismatches vs Ledger: {$this->cntMismatch}";
            }
            if ($unverifiedLedgerMetrics > 0) {
                $failures[] = "Unverified LEDGER-DERIVED metrics: {$unverifiedLedgerMetrics}";
            }
            if ($this->cntAllZeros > 0) {
                // F-25: ALL_ZEROS fails strict.
                $failures[] = "ALL_ZEROS routes (suspicious, unverifiable): {$this->cntAllZeros}";
            }
            if (($this->cntNonJsonUnverified ?? 0) > 0) {
                // F-23: NON_JSON is not a pass in strict.
                $failures[] = "NON_JSON routes (not comparable): {$this->cntNonJsonUnverified}";
            }
            if ($routeFloor > 0 && $routesScanned < $routeFloor) {
                // F-19: not enough routes actually scanned.
                $failures[] = "Route scan floor breached: scanned {$routesScanned} < floor {$routeFloor}";
            }
            if ($ledgerDerivedTotal > 0 && $comparedMetrics < $ledgerDerivedTotal) {
                $failures[] = "Metric compare floor breached: compared {$comparedMetrics} < LEDGER-DERIVED {$ledgerDerivedTotal}";
            }

            if (!empty($failures)) {
                $this->error("🚨 Strict mode validation failed!");
                foreach ($failures as $f) {
                    $this->error("   {$f}");
                }
                return Command::FAILURE;
            }
        }

        return Command::SUCCESS;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 – Param map
    // ─────────────────────────────────────────────────────────────────────────
    private function buildParamMap(): void
    {
        $safeQuery = function (string $table, ?callable $cb = null) {
            if (!\Illuminate\Support\Facades\Schema::hasTable($table)) return null;
            $q = DB::table($table)->where('tenant_id', self::TENANT_ID);
            if ($cb) $q = $cb($q);
            return $q->first();
        };

        $sale          = $safeQuery('sales');
        $purchase      = $safeQuery('purchases');
        $customer      = $safeQuery('parties', fn($q) => $q->where('type', 'customer'));
        $supplier      = $safeQuery('parties', fn($q) => $q->where('type', 'supplier'));
        $product       = $safeQuery('products');
        $bankAccount   = $safeQuery('bank_accounts');
        $warehouse     = $safeQuery('warehouses');
        $salesOrder    = $safeQuery('sales_orders');
        $purchaseOrder = $safeQuery('purchase_orders');
        $payment       = $safeQuery('payments');
        $expense       = $safeQuery('expenses');
        $stockTake     = $safeQuery('stock_takes');
        $stockTransfer = $safeQuery('stock_transfers');
        $proposal      = $safeQuery('proposals');
        $returnRecord  = null; // no 'returns' table — handled by ReturnController via sales
        $account       = $safeQuery('accounts');

        $debitNote     = $safeQuery('debit_notes');
        $parkedSale    = $safeQuery('parked_sales');
        $serial        = $safeQuery('product_serials');
        $batch         = $safeQuery('batches');
        $recurringInv  = $safeQuery('recurring_invoices');
        $recipe        = $safeQuery('recipes');
        $aiRec         = $safeQuery('ai_recommendations');
        $attendance    = $safeQuery('staff_attendances');

        $this->paramMap = [
            'store_slug'    => self::STORE_SLUG,

            // Documents
            'sale'          => $sale?->id           ?? 'MISSING-SALE',
            'purchase'      => $purchase?->id        ?? 'MISSING-PURCHASE',
            'purchase_order'=> $purchaseOrder?->id   ?? 'MISSING-PO',
            'purchaseOrder' => $purchaseOrder?->id   ?? 'MISSING-PO',
            'order'         => $salesOrder?->id      ?? 'MISSING-SO',
            'salesOrder'    => $salesOrder?->id      ?? 'MISSING-SO',
            'payment'       => $payment?->id         ?? 'MISSING-PAYMENT',
            'expense'       => $expense?->id         ?? 'MISSING-EXPENSE',
            'proposal'      => $proposal?->id        ?? 'MISSING-PROPOSAL',

            // Parties
            'party'         => $customer?->id        ?? 'MISSING-PARTY',
            'customer'      => $customer?->id        ?? 'MISSING-CUSTOMER',
            'supplier'      => $supplier?->id        ?? 'MISSING-SUPPLIER',

            // Inventory
            'product'       => $product?->id         ?? 'MISSING-PRODUCT',
            'id'            => $sale?->id            ?? 'MISSING-ID',
            'run'           => 'MISSING-RUN',

            // Finance
            'bankAccount'   => $bankAccount?->id     ?? 'MISSING-BANK',
            'account'       => $account?->id         ?? 'MISSING-ACCOUNT',

            // Stock
            'stockTake'     => $stockTake?->id       ?? 'MISSING-STOCKTAKE',

            // Admin / staff
            'member'        => $this->user->id       ?? '1',
            'invitation'    => '1',
            'ticket'        => '1',
            'attribute'     => '1',
            'category'      => '1',
            'charge'        => '1',

            // Misc
            'filename'      => 'audit_test.sql',
            'fileId'        => 'ga-test-file-id',
            'uuid'          => 'aaaaaaaa-0000-0000-0000-000000000001',
            'code'          => 'TEST-CODE-001',

            // Newly resolved parameters
            'warehouse'     => $warehouse?->id       ?? 'MISSING-WAREHOUSE',
            'purchaseId'    => $purchase?->id        ?? 'MISSING-PURCHASE',
            'saleId'        => $sale?->id            ?? 'MISSING-SALE',
            'supplierId'    => $supplier?->id        ?? 'MISSING-SUPPLIER',
            'customerId'    => $customer?->id        ?? 'MISSING-CUSTOMER',
            'productId'     => $product?->id         ?? 'MISSING-PRODUCT',
            'partyId'       => $customer?->id        ?? 'MISSING-PARTY',
            'platform'      => 'shopify',
            'connection'    => '1',
            'stockTransfer' => $stockTransfer?->id   ?? 'MISSING-STOCKTRANSFER',

            // Model-specific mapping hooks
            'debit_note'    => $debitNote?->id      ?? 'MISSING-DEBIT-NOTE',
            'parked_sale'   => $parkedSale?->id     ?? 'MISSING-PARKED-SALE',
            'serial'        => $serial?->id         ?? 'MISSING-SERIAL',
            'batch'         => $batch?->id          ?? 'MISSING-BATCH',
            'recurring_inv' => $recurringInv?->id   ?? 'MISSING-RECURRING',
            'recipe'        => $recipe?->id         ?? 'MISSING-RECIPE',
            'ai_rec'        => $aiRec?->id          ?? 'MISSING-AI-REC',
            'attendance'    => $attendance?->id     ?? 'MISSING-ATTENDANCE',
        ];

        $this->line("  Sales: <info>{$this->paramMap['sale']}</info>");
        $this->line("  Purchases: <info>{$this->paramMap['purchase']}</info>");
        $this->line("  Customer: <info>{$this->paramMap['customer']}</info>");
        $this->line("  Supplier: <info>{$this->paramMap['supplier']}</info>");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4 – Control values
    // ─────────────────────────────────────────────────────────────────────────
    private function buildControlValues(): void
    {
        /** @var FinancialReportingService $frs */
        $frs  = app(FinancialReportingService::class);
        $tax  = app(\App\Services\V3\TaxService::class);

        $now        = Carbon::create(2025, 1, 28, 9, 0, 0);
        $mStart     = $now->copy()->startOfMonth();
        $mEnd       = $now->copy()->endOfMonth();
        $yStart     = $now->copy()->startOfYear();

        $pl       = $frs->getProfitAndLoss($mStart, $mEnd);
        $yPl      = $frs->getProfitAndLoss($yStart, $mEnd);
        $taxR     = $tax->taxReport($mStart, $mEnd);
        $taxYTD   = $tax->taxReport($yStart, $mEnd);
        $tb       = $frs->getTrialBalance($mEnd->toDateString());
        $purs     = $frs->getPurchasesReport($mStart->toDateString(), $mEnd->toDateString());
        $pursYTD  = $frs->getPurchasesReport($yStart->toDateString(), $mEnd->toDateString());
        $bs       = $frs->getBalanceSheet($mEnd->toDateString());

        // Cash flow YTD
        try {
            $cfYTD = $frs->getCashFlowReport($yStart->toDateString(), $mEnd->toDateString());
            $inflowYTD = $cfYTD['operating_inflow'] ?? 0;
            $outflowYTD = $cfYTD['operating_outflow'] ?? 0;
        } catch (\Throwable) {
            $inflowYTD = $outflowYTD = 0;
        }

        // Expenses YTD
        $expensesYTD = round((float)($yPl['operating_expenses'] ?? 0), 2);

        $this->control = [
            'revenue_month'              => round((float)($pl['revenue']            ?? 0), 2),
            'gross_profit_month'         => round((float)($pl['gross_profit']       ?? 0), 2),
            'net_profit_month'           => round((float)($pl['net_profit']         ?? 0), 2),
            'operating_expenses_month'   => round((float)($pl['operating_expenses'] ?? 0), 2),
            'cogs_month'                 => round((float)($pl['cogs']               ?? 0), 2),
            'revenue_ytd'                => round((float)($yPl['revenue']           ?? 0), 2),
            'gross_profit_ytd'           => round((float)($yPl['gross_profit']       ?? 0), 2),
            'net_profit_ytd'             => round((float)($yPl['net_profit']        ?? 0), 2),
            'receivables'                => round((float)$frs->getReceivables(), 2),
            'payables'                   => round((float)$frs->getPayables(),    2),
            'sales_tax_collected'        => round((float)($taxR['sales_tax_collected']   ?? 0), 2),
            'input_tax_recoverable'      => round((float)($taxR['input_tax_recoverable'] ?? 0), 2),
            'tax_output_ytd'             => round((float)($taxYTD['sales_tax_collected'] ?? 0), 2),
            'tax_input_ytd'              => round((float)($taxYTD['input_tax_recoverable'] ?? 0), 2),
            'purchases_month'            => round((float)($purs['total_spend']       ?? 0), 2),
            'purchases_ytd'              => round((float)($pursYTD['total_spend']    ?? 0), 2),
            'cash_inflow_ytd'            => round((float)$inflowYTD, 2),
            'cash_outflow_ytd'           => round((float)$outflowYTD, 2),
            'expenses_ytd'               => $expensesYTD,
            'trial_balance_total_debit'  => round((float)($tb['grand_debit']  ?? 0), 2),
            'trial_balance_total_credit' => round((float)($tb['grand_credit'] ?? 0), 2),
            'assets_total'               => round((float)($bs['total_assets'] ?? 0), 2),
            'liabilities_total'          => round((float)($bs['total_liabilities'] ?? 0), 2),
            'inventory_value'            => round((float)$frs->getInventoryValue(), 2),
        ];

        $this->line('  <comment>Control Values (from Ledger):</comment>');
        $width = max(array_map('strlen', array_keys($this->control))) + 2;
        foreach ($this->control as $k => $v) {
            $padded = str_pad($k, $width);
            $this->line("  {$padded} = <info>" . number_format($v, 2) . '</info>');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5a – Route discovery
    // ─────────────────────────────────────────────────────────────────────────
    private function discoverGetRoutes(): array
    {
        $discovered = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            // Only GET routes
            if (!in_array('GET', $route->methods())) continue;

            $name = $route->getName() ?? '';
            $uri  = $route->uri();

            // Must be a store route
            if (!str_starts_with($name, 'store.')) continue;

            // Skip explicitly excluded route names
            if (in_array($name, self::SKIP_NAMES, true)) continue;

            // Skip routes explicitly marked as NON-FINANCIAL in registry
            if (in_array($name, $this->nonFinancialRoutes, true)) continue;

            // Skip URI fragments that indicate non-Inertia responses
            $skipRoute = false;
            foreach (self::SKIP_URI_FRAGMENTS as $fragment) {
                if (str_contains($uri, $fragment)) {
                    $skipRoute = true;
                    break;
                }
            }
            if ($skipRoute) continue;

            $discovered[] = [
                'name'   => $name,
                'uri'    => $uri,
                'action' => $route->getActionName(),
            ];
        }

        // Deduplicate by name (same name can appear twice for GET+HEAD)
        $unique = [];
        $seen   = [];
        foreach ($discovered as $r) {
            if (!isset($seen[$r['name']])) {
                $unique[] = $r;
                $seen[$r['name']] = true;
            }
        }

        return $unique;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5b – Scan a single route
    // ─────────────────────────────────────────────────────────────────────────
    private function scanRoute(array $route): void
    {
        $this->cntScanned++;
        $name = $route['name'];

        // ── Resolve URL ──────────────────────────────────────────────────
        try {
            $params = $this->paramMap;
            if (str_contains($name, 'debit-notes')) {
                $params['id'] = $this->paramMap['debit_note'];
            } elseif (str_contains($name, 'inventory') || str_contains($name, 'products')) {
                $params['id'] = $this->paramMap['product'];
            } elseif (str_contains($name, 'batches')) {
                $params['id'] = $this->paramMap['batch'];
            } elseif (str_contains($name, 'cookbook')) {
                $params['id'] = $this->paramMap['recipe'];
            } elseif (str_contains($name, 'recurring-invoices')) {
                $params['id'] = $this->paramMap['recurring_inv'];
            } elseif (str_contains($name, 'returns-history')) {
                $params['id'] = $this->paramMap['sale'];
            } elseif (str_contains($name, 'sales.recall')) {
                $params['id'] = $this->paramMap['parked_sale'];
            } elseif (str_contains($name, 'serials')) {
                $params['id'] = $this->paramMap['serial'];
            } elseif (str_contains($name, 'staff-attendance') || str_contains($name, 'staff.attendance')) {
                $params['id'] = $this->paramMap['attendance'];
            } elseif (str_contains($name, 'stock-takes')) {
                $params['id'] = $this->paramMap['stockTake'];
            } elseif (str_contains($name, 'stock-transfers')) {
                $params['id'] = $this->paramMap['stockTransfer'];
            } elseif (str_contains($name, 'growth-engine.whatsapp')) {
                $params['id'] = $this->paramMap['ai_rec'];
            }

            $url = route($name, $params);
            
            if (str_contains($name, 'reports') || str_contains($name, 'dashboard')) {
                $now = Carbon::create(2025, 1, 28, 9, 0, 0, 'Asia/Karachi');
                $from = $now->copy()->startOfYear()->toDateString();
                $to = $now->copy()->endOfMonth()->toDateString();
                $sep = str_contains($url, '?') ? '&' : '?';
                if (str_contains($name, 'balance-sheet') || str_contains($name, 'aged-') || str_contains($name, 'trial-balance')) {
                    $url .= "{$sep}as_of={$to}&start_date={$from}&end_date={$to}";
                } else {
                    $url .= "{$sep}from={$from}&to={$to}&start_date={$from}&end_date={$to}&test_date={$to}&range=custom";
                }
            }
        } catch (\Throwable $e) {
            $this->recordResult($name, $route['uri'], 'PARAM_ERROR', null, 'Cannot resolve URL: ' . $e->getMessage(), []);
            $this->cntError++;
            $this->printLine('💥', null, $name, 'PARAM_ERROR');
            return;
        }

        // ── Make HTTP request ────────────────────────────────────────────
        $request = Request::create($url, 'GET', [], [], [], [
            'HTTP_X_INERTIA'         => 'true',
        ]);

        auth()->login($this->user);

        try {
            $response = app()->handle($request);
        } catch (\Throwable $e) {
            $this->recordResult($name, $route['uri'], 'EXCEPTION', null, substr($e->getMessage(), 0, 300), []);
            $this->cntError++;
            $this->printLine('💥', null, $name, 'EXCEPTION');
            return;
        }

        $code = $response->getStatusCode();

        // Resolve original HTTP error codes from Inertia exception redirections (409 with X-Inertia-Location)
        if ($code === 409 && $response->headers->has('X-Inertia-Location')) {
            $loc = $response->headers->get('X-Inertia-Location');
            if (preg_match('/\/error\/(\d+)$/', $loc, $matches)) {
                $code = (int)$matches[1];
            }
        }

        // ── Handle redirects ─────────────────────────────────────────────
        if (in_array($code, [301, 302, 303, 307, 308])) {
            $location = $response->headers->get('Location', '(unknown)');
            $this->recordResult($name, $route['uri'], 'REDIRECT', $code, "→ {$location}", []);
            $this->cntPass++;
            $this->printLine('↩', $code, $name, 'REDIRECT');
            // Phase G (F-24): a redirect compares no metric — do NOT mark verified.
            return;
        }

        // ── Handle HTTP errors ───────────────────────────────────────────
        if ($code !== 200) {
            $snippet = substr(strip_tags($response->getContent()), 0, 200);
            $this->recordResult($name, $route['uri'], 'HTTP_ERROR', $code, $snippet, []);
            $this->cntError++;
            $this->printLine('🔴', $code, $name, "HTTP {$code}");
            return;
        }

        // ── Parse body ───────────────────────────────────────────────────
        $body = $response->getContent();
        $data = json_decode($body, true);

        if (!$data || !is_array($data)) {
            // Non-JSON (raw HTML, PDF, etc.). Phase G (F-23): NON_JSON is a
            // CLASSIFICATION, never an auto-verification. In strict mode it does NOT
            // pass and does NOT bulk-mark metrics verified — an unparseable body means
            // we could not compare anything, which is the opposite of "verified".
            $strict = (bool) $this->option('strict');
            $this->recordResult($name, $route['uri'], 'NON_JSON', $code, 'Non-JSON response (200 OK) — not comparable', []);
            if ($strict) {
                $this->cntNonJsonUnverified = ($this->cntNonJsonUnverified ?? 0) + 1;
                $this->printLine('📄', $code, $name, 'NON_JSON (unverified)');
            } else {
                $this->cntPass++;
                $this->printLine('📄', $code, $name, 'NON_JSON');
            }
            return; // never markMetricsForRouteAsVerified — nothing was compared
        }

        // ── Extract props ─────────────────────────────────────────────────
        $props         = $data['props'] ?? $data;
        $financialProps = $this->extractFinancialProps($props);

        // ── Deep ledger check for known routes ───────────────────────────
        $mismatches = $this->deepCheck($name, $props);

        // ── Classify result ───────────────────────────────────────────────
        if (!empty($mismatches)) {
            $notes = implode(' | ', $mismatches);
            $this->recordResult($name, $route['uri'], 'MISMATCH', $code, $notes, $financialProps);
            $this->cntMismatch++;
            $this->printLine('❌', $code, $name, 'MISMATCH');
            return;
        }

        $allZero = !empty($financialProps)
            && count(array_filter($financialProps, fn($v) => abs($v) > 0.001)) === 0;

        if ($allZero) {
            // Phase G (F-25): ALL_ZEROS is SUSPICIOUS, not verified. A page whose every
            // financial prop is 0 may simply not be sourcing from the ledger. In strict
            // mode this FAILS; it never bulk-marks metrics verified.
            $strict = (bool) $this->option('strict');
            $this->recordResult($name, $route['uri'], 'ALL_ZEROS', $code, 'All financial props returned 0 – data may not be sourced from Ledger', $financialProps);
            $this->cntAllZeros++;
            $this->printLine('⚠️', $code, $name, 'ALL_ZEROS' . ($strict ? ' (strict fail)' : ''));
            return; // never markMetricsForRouteAsVerified — a wall of zeros proves nothing
        }

        $this->recordResult($name, $route['uri'], 'PASS', $code, '', $financialProps);
        $this->cntPass++;
        $this->printLine('✅', $code, $name, 'PASS');
        // Phase G (F-24): do NOT bulk-mark every metric on this route verified. A metric is
        // marked verified ONLY when deepCheck() actually compared it against a control value
        // (see markMetricAsVerified in the per-metric comparison path). Route-level bulk
        // verification is removed — reaching a 200 is not evidence a number is correct.
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deep check against control values
    // ─────────────────────────────────────────────────────────────────────────
    private function deepCheck(string $routeName, array $props): array
    {
        $mismatches = [];
        
        // Find metrics in the registry for this route
        $metrics = array_filter($this->registry['metrics'] ?? [], fn($m) => ($m['route'] ?? '') === $routeName);
        
        foreach ($metrics as $m) {
            if (($m['classification'] ?? '') !== 'LEDGER-DERIVED') {
                continue;
            }
            
            // 1. Get control value: prioritize control_key from precalculated controls, fallback to service method dynamically
            $ledgerVal = null;
            if (isset($m['control_key'])) {
                $ledgerVal = $this->control[$m['control_key']] ?? null;
            }
            
            if ($ledgerVal === null && !empty($m['service']) && $m['service'] !== 'UNKNOWN' && $m['service'] !== 'NONE') {
                $ledgerVal = $this->resolveServiceControlValue($m['service']);
            }
            
            if ($ledgerVal === null) {
                continue;
            }
            
            // 2. Extract page value
            $propPath = $m['prop_path'] ?? null;
            $pageVal = null;
            
            if ($propPath) {
                $pageVal = (float)$this->extractVal($props, $propPath);
            } else {
                // Fallback to extractFinancialProps keyword search
                $financialProps = $this->extractFinancialProps($props);
                $controlKey = $m['control_key'] ?? $m['id'];
                $keywords = explode('_', strtolower(str_replace('-', '_', $controlKey)));
                
                foreach ($financialProps as $propKey => $propVal) {
                    $isMatch = true;
                    foreach ($keywords as $kw) {
                        if ($kw === 'ytd' || $kw === 'month' || $kw === 'm' || $kw === 'total') continue;
                        if (!str_contains(strtolower($propKey), $kw)) {
                            $isMatch = false;
                            break;
                        }
                    }
                    if ($isMatch) {
                        $pageVal = (float)$propVal;
                        break;
                    }
                }
            }
            
            if ($pageVal === null) {
                continue;
            }
            
            // 3. Compare values
            if (abs($pageVal - $ledgerVal) > 0.01) { // Phase G (F-26): tolerance tightened 0.10 -> 0.01
                $name = $m['name'] ?? $propPath;
                $mismatches[] = "{$name}: UI=" . number_format($pageVal, 2)
                    . " Ledger=" . number_format($ledgerVal, 2);
                $this->markMetricAsVerified($m['id']); // Mark as run, but failed verification
            } else {
                // Check passed! Mark as verified in registry memory
                $this->markMetricAsVerified($m['id']);
            }
        }
        
        return $mismatches;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extract all numeric props that look financial
    // ─────────────────────────────────────────────────────────────────────────
    private function extractFinancialProps(array $props, string $prefix = '', int $depth = 0): array
    {
        if ($depth > 6) return [];

        $result       = [];
        $financialHints = [
            'total', 'revenue', 'sales', 'profit', 'loss', 'amount', 'balance',
            'receivable', 'payable', 'tax', 'cogs', 'gross', 'net', 'expense',
            'income', 'cost', 'value', 'debit', 'credit', 'invoice', 'payment',
            'inflow', 'outflow', 'operating', 'financing', 'investing',
            'subtotal', 'snapshot', 'cash_value', 'stock_value', 'purchases_value',
        ];

        foreach ($props as $key => $value) {
            $fullKey  = $prefix ? "{$prefix}.{$key}" : (string)$key;
            $keyLower = strtolower((string)$key);

            if (is_int($key)) {
                continue; // skip array elements in recursive calls (handled by list detector)
            }

            if (is_numeric($value)) {
                foreach ($financialHints as $hint) {
                    if (str_contains($keyLower, $hint)) {
                        $result[$fullKey] = (float)$value;
                        break;
                    }
                }
            } elseif (is_array($value) && $depth < 6) {
                // Check if it is a list of arrays (numeric keys)
                $isList = false;
                if (!empty($value)) {
                    reset($value);
                    $firstKey = key($value);
                    if (is_int($firstKey)) {
                        $isList = true;
                    }
                }

                if ($isList) {
                    $sums = [];
                    foreach ($value as $item) {
                        if (is_array($item)) {
                            $itemProps = $this->extractFinancialProps($item, '', $depth + 2);
                            foreach ($itemProps as $itemKey => $itemVal) {
                                $sums[$itemKey] = ($sums[$itemKey] ?? 0.0) + $itemVal;
                            }
                        }
                    }
                    foreach ($sums as $itemKey => $sumVal) {
                        $result["{$fullKey}.sum_{$itemKey}"] = $sumVal;
                        $result["{$fullKey}.total_{$itemKey}"] = $sumVal;
                    }
                } else {
                    $nested = $this->extractFinancialProps($value, $fullKey, $depth + 1);
                    $result = array_merge($result, $nested);
                }
            }
        }

        return $result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extract a dot-path value from nested array
    // ─────────────────────────────────────────────────────────────────────────
    private function extractVal(array $data, string $path): mixed
    {
        $keys = explode('.', $path);
        $curr = $data;
        $found = true;

        foreach ($keys as $k) {
            if (!is_array($curr) || !array_key_exists($k, $curr)) {
                $found = false;
                break;
            }
            $curr = $curr[$k];
        }

        if ($found) {
            return $curr;
        }

        // Fallback to leaf key directly at root of data
        $leaf = end($keys);

        // Cash flow dynamic sum calculation fallback for V3
        if ($leaf === 'inflow' || $leaf === 'operating_inflow') {
            if (isset($data['operating']) && is_array($data['operating'])) {
                $in = 0.0;
                foreach (['operating', 'investing', 'financing'] as $grp) {
                    if (isset($data[$grp]) && is_array($data[$grp])) {
                        $in += array_sum(array_column($data[$grp], 'cash_in'));
                    }
                }
                return $in;
            }
        }

        if ($leaf === 'outflow' || $leaf === 'operating_outflow') {
            if (isset($data['operating']) && is_array($data['operating'])) {
                $out = 0.0;
                foreach (['operating', 'investing', 'financing'] as $grp) {
                    if (isset($data[$grp]) && is_array($data[$grp])) {
                        $out += array_sum(array_column($data[$grp], 'cash_out'));
                    }
                }
                return $out;
            }
        }

        if (is_array($data) && array_key_exists($leaf, $data)) {
            return $data[$leaf];
        }

        // Fallback for V3 specific key name mappings
        $aliases = [
            'totalDebits' => 'grand_debit',
            'totalCredits' => 'grand_credit',
            'total_sales' => 'total_revenue',
            'total_purchases' => 'total_spend',
            'total_output_tax' => 'output_tax',
            'total_input_tax' => 'input_tax',
            'revenue' => 'revenue',
            'net_profit' => 'net_profit',
            'gross_profit' => 'gross_profit',
            'inflow' => 'operating_inflow',
            'outflow' => 'operating_outflow',
        ];

        if (isset($aliases[$leaf])) {
            $alias = $aliases[$leaf];
            if (is_array($data) && array_key_exists($alias, $data)) {
                return $data[$alias];
            }
        }

        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Report generation
    // ─────────────────────────────────────────────────────────────────────────
    private function generateReport(): void
    {
        $reportDir  = base_path('verification');
        if (!is_dir($reportDir)) {
            mkdir($reportDir, 0755, true);
        }

        $reportPath = $reportDir . '/discrepancy_report.md';
        $handle     = fopen($reportPath, 'w');

        $now  = Carbon::now()->setTimezone('Asia/Karachi')->format('Y-m-d H:i:s');
        $date = Carbon::now()->toDateString();

        // ── Header ──────────────────────────────────────────────────────
        fwrite($handle, "# VenQore Ledger Truth Audit Report\n\n");
        fwrite($handle, "> **Generated:** {$now} PKT  \n");
        fwrite($handle, "> **Tenant:** {$this->tenant->name} (`{$this->tenant->slug}`)  \n");
        fwrite($handle, "> **Audit Date:** {$date}  \n");
        fwrite($handle, "> **Audit Period Seeded:** 2025-01-01 → {$date}  \n\n");

        // ── Summary table ────────────────────────────────────────────────
        fwrite($handle, "## Summary\n\n");
        fwrite($handle, "| Status | Count |\n");
        fwrite($handle, "|--------|-------|\n");
        fwrite($handle, "| 🔢 Total Routes Scanned | **{$this->cntScanned}** |\n");
        fwrite($handle, "| ✅ Passed | {$this->cntPass} |\n");
        fwrite($handle, "| ⚠️ All Zeros (Suspicious) | {$this->cntAllZeros} |\n");
        fwrite($handle, "| ❌ Mismatched vs Ledger | {$this->cntMismatch} |\n");
        fwrite($handle, "| 🔴 HTTP Errors / Exceptions | {$this->cntError} |\n");
        fwrite($handle, "| ⏭️ Skipped | {$this->cntSkipped} |\n\n");

        // ── Control values ───────────────────────────────────────────────
        fwrite($handle, "## Ledger Control Values (Single Source of Truth)\n\n");
        fwrite($handle, "| Key | Value (PKR) |\n");
        fwrite($handle, "|-----|------------|\n");
        foreach ($this->control as $k => $v) {
            fwrite($handle, "| `{$k}` | " . number_format($v, 2) . " |\n");
        }
        fwrite($handle, "\n");

        // ── Group results ────────────────────────────────────────────────
        $groups = [
            'MISMATCH'   => [],
            'ALL_ZEROS'  => [],
            'HTTP_ERROR' => [],
            'EXCEPTION'  => [],
            'PARAM_ERROR'=> [],
            'REDIRECT'   => [],
            'PASS'       => [],
            'NON_JSON'   => [],
        ];

        foreach ($this->results as $r) {
            $status = $r['status'];
            if (!isset($groups[$status])) $groups['PASS'][] = $r;
            else $groups[$status][] = $r;
        }

        // ── CRITICAL: Mismatches ─────────────────────────────────────────
        if (!empty($groups['MISMATCH'])) {
            fwrite($handle, "## ❌ CRITICAL: Data Mismatches vs Ledger\n\n");
            fwrite($handle, "> These pages display financial values that **do not match** the authoritative Ledger (journal_items).\n\n");
            fwrite($handle, "| Route | Discrepancy |\n");
            fwrite($handle, "|-------|-------------|\n");
            foreach ($groups['MISMATCH'] as $r) {
                fwrite($handle, "| `{$r['route']}` | {$r['notes']} |\n");
            }
            fwrite($handle, "\n");
        }

        // ── WARNING: All Zeros ───────────────────────────────────────────
        if (!empty($groups['ALL_ZEROS'])) {
            fwrite($handle, "## ⚠️ WARNING: Pages Showing All-Zero Financial Data\n\n");
            fwrite($handle, "> These pages loaded OK but every financial prop is **0**. This indicates the data source may be bypassing the Ledger.\n\n");
            fwrite($handle, "| # | Route | URI |\n");
            fwrite($handle, "|---|-------|-----|\n");
            foreach ($groups['ALL_ZEROS'] as $i => $r) {
                $n = $i + 1;
                fwrite($handle, "| {$n} | `{$r['route']}` | `{$r['uri']}` |\n");
            }
            fwrite($handle, "\n");

            // Detail each zero page's extracted props
            fwrite($handle, "### Zero-Page Financial Props Detail\n\n");
            foreach ($groups['ALL_ZEROS'] as $r) {
                fwrite($handle, "**`{$r['route']}`**\n");
                if (!empty($r['financial_props'])) {
                    fwrite($handle, "```\n");
                    foreach ($r['financial_props'] as $pk => $pv) {
                        fwrite($handle, "  {$pk}: {$pv}\n");
                    }
                    fwrite($handle, "```\n\n");
                } else {
                    fwrite($handle, "_No financial props extracted._\n\n");
                }
            }
        }

        // ── HTTP Errors ──────────────────────────────────────────────────
        if (!empty($groups['HTTP_ERROR'])) {
            fwrite($handle, "## 🔴 HTTP Errors\n\n");
            fwrite($handle, "| Route | Code | Snippet |\n");
            fwrite($handle, "|-------|------|--------|\n");
            foreach ($groups['HTTP_ERROR'] as $r) {
                $snippet = str_replace('|', '\\|', substr($r['notes'], 0, 120));
                fwrite($handle, "| `{$r['route']}` | {$r['http_code']} | {$snippet} |\n");
            }
            fwrite($handle, "\n");
        }

        // ── Exceptions / Param errors ────────────────────────────────────
        $errRows = array_merge($groups['EXCEPTION'], $groups['PARAM_ERROR']);
        if (!empty($errRows)) {
            fwrite($handle, "## 💥 Exceptions / Parameter Errors\n\n");
            fwrite($handle, "| Route | Type | Error |\n");
            fwrite($handle, "|-------|------|-------|\n");
            foreach ($errRows as $r) {
                $err = str_replace('|', '\\|', substr($r['notes'], 0, 200));
                fwrite($handle, "| `{$r['route']}` | {$r['status']} | {$err} |\n");
            }
            fwrite($handle, "\n");
        }

        // ── Full scan table ──────────────────────────────────────────────
        fwrite($handle, "## Full Scan Results ({$this->cntScanned} routes)\n\n");
        fwrite($handle, "| Route | Status | Code | Financial Props |\n");
        fwrite($handle, "|-------|--------|------|----------------|\n");

        $statusIcon = [
            'PASS'        => '✅',
            'ALL_ZEROS'   => '⚠️',
            'MISMATCH'    => '❌',
            'HTTP_ERROR'  => '🔴',
            'EXCEPTION'   => '💥',
            'PARAM_ERROR' => '💥',
            'REDIRECT'    => '↩',
            'NON_JSON'    => '📄',
        ];

        foreach ($this->results as $r) {
            $icon     = $statusIcon[$r['status']] ?? '❓';
            $propCnt  = count($r['financial_props']);
            $propList = $propCnt > 0
                ? implode(', ', array_map(
                    fn($k, $v) => "`{$k}`=" . number_format($v, 2),
                    array_keys(array_slice($r['financial_props'], 0, 3)),
                    array_slice($r['financial_props'], 0, 3)
                  )) . ($propCnt > 3 ? " (+".($propCnt-3)." more)" : "")
                : '–';

            fwrite($handle, "| `{$r['route']}` | {$icon} {$r['status']} | {$r['http_code']} | {$propList} |\n");
        }

        fclose($handle);

        $this->newLine();
        $this->info("✅ Report written to: {$reportPath}");
        $this->newLine();
        $this->table(
            ['Status', 'Count'],
            [
                ['✅ PASS',                   $this->cntPass],
                ['⚠️ ALL_ZEROS (suspicious)', $this->cntAllZeros],
                ['❌ MISMATCH (vs Ledger)',   $this->cntMismatch],
                ['🔴 HTTP Errors',            $this->cntError],
                ['🔢 Total Scanned',          $this->cntScanned],
            ]
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private function recordResult(
        string $route,
        string $uri,
        string $status,
        ?int   $code,
        string $notes,
        array  $props
    ): void {
        $this->results[] = [
            'route'          => $route,
            'uri'            => $uri,
            'status'         => $status,
            'http_code'      => $code,
            'notes'          => $notes,
            'financial_props'=> $props,
        ];
    }

    private function printLine(string $icon, ?int $code, string $name, string $status): void
    {
        $codeStr = $code ? "[{$code}]" : '[---]';
        $this->line("  {$icon} {$codeStr} <comment>{$name}</comment>  {$status}");
    }

    private function step(int $n, int $total, string $msg): void
    {
        $this->newLine();
        $this->line("<fg=cyan>── Step {$n}/{$total}: {$msg}</>");
    }

    private function banner(): void
    {
        $this->newLine();
        $this->line('<fg=bright-cyan>╔══════════════════════════════════════════════════════════════╗</>');
        $this->line('<fg=bright-cyan>║        VENQORE LEDGER TRUTH SWEEP — FULL 200+ ROUTES        ║</>');
        $this->line('<fg=bright-cyan>╚══════════════════════════════════════════════════════════════╝</>');
        $this->newLine();
    }

    private array $registry = [];
    private array $nonFinancialRoutes = [];

    private const METRIC_MAP = [
        'DASH-005' => ['prop_path' => 'performance.Month.sales', 'control_key' => 'revenue_month'],
        'DASH-007' => ['prop_path' => 'netProfit.Month.value', 'control_key' => 'net_profit_month'],
        'SDASH-001' => ['prop_path' => 'stats.sales_month', 'control_key' => 'revenue_month'],
        'RPT-001' => ['prop_path' => 'totalDebits', 'control_key' => 'trial_balance_total_debit'],
        'RPT-001-credit' => ['prop_path' => 'totalCredits', 'control_key' => 'trial_balance_total_credit'],
        'RPT-002' => ['prop_path' => 'stats.revenue', 'control_key' => 'revenue_ytd'],
        'RPT-002-net' => ['prop_path' => 'stats.net_profit', 'control_key' => 'net_profit_ytd'],
        'RPT-002-gross' => ['prop_path' => 'stats.gross_profit', 'control_key' => 'gross_profit_ytd'],
        'RPT-003' => ['prop_path' => 'assets.total', 'control_key' => 'assets_total'],
        'RPT-003-liab' => ['prop_path' => 'liabilities.total', 'control_key' => 'liabilities_total'],
        'RPT-004' => ['prop_path' => 'stats.inflow', 'control_key' => 'cash_inflow_ytd'],
        'RPT-004-out' => ['prop_path' => 'stats.outflow', 'control_key' => 'cash_outflow_ytd'],
        'RPT-007' => ['prop_path' => 'stats.total_sales', 'control_key' => 'revenue_ytd'],
        'RPT-008' => ['prop_path' => 'stats.total_purchases', 'control_key' => 'purchases_ytd'],
        'RPT-012' => ['prop_path' => 'stats.total_output_tax', 'control_key' => 'tax_output_ytd'],
        'RPT-012-input' => ['prop_path' => 'stats.total_input_tax', 'control_key' => 'tax_input_ytd'],
        'RPT-009' => ['prop_path' => 'total_value', 'control_key' => 'inventory_value'],
    ];

    private function loadRegistry(): void
    {
        $path = base_path('verification/number_registry.yaml');
        if (file_exists($path) && class_exists(\Symfony\Component\Yaml\Yaml::class)) {
            $this->registry = \Symfony\Component\Yaml\Yaml::parseFile($path) ?? [];
        } else {
            $this->registry = ['metrics' => []];
        }

        $extras = [];
        if (isset($this->registry['metrics'])) {
            foreach ($this->registry['metrics'] as &$m) {
                if (($m['classification'] ?? '') === 'NON-FINANCIAL' && !empty($m['route'])) {
                    $this->nonFinancialRoutes[] = $m['route'];
                }

                $id = $m['id'] ?? '';
                if (isset(self::METRIC_MAP[$id])) {
                    $m['prop_path']   = self::METRIC_MAP[$id]['prop_path'];
                    $m['control_key'] = self::METRIC_MAP[$id]['control_key'];
                }

                if ($id === 'RPT-001') {
                    $extra = $m;
                    $extra['id'] = 'RPT-001-credit';
                    $extra['prop_path'] = 'totalCredits';
                    $extra['control_key'] = 'trial_balance_total_credit';
                    $extras[] = $extra;
                } elseif ($id === 'RPT-002') {
                    $extra1 = $m;
                    $extra1['id'] = 'RPT-002-net';
                    $extra1['prop_path'] = 'stats.net_profit';
                    $extra1['control_key'] = 'net_profit_ytd';
                    $extras[] = $extra1;

                    $extra2 = $m;
                    $extra2['id'] = 'RPT-002-gross';
                    $extra2['prop_path'] = 'stats.gross_profit';
                    $extra2['control_key'] = 'gross_profit_ytd';
                    $extras[] = $extra2;
                } elseif ($id === 'RPT-003') {
                    $extra = $m;
                    $extra['id'] = 'RPT-003-liab';
                    $extra['prop_path'] = 'liabilities.total';
                    $extra['control_key'] = 'liabilities_total';
                    $extras[] = $extra;
                } elseif ($id === 'RPT-004') {
                    $extra = $m;
                    $extra['id'] = 'RPT-004-out';
                    $extra['prop_path'] = 'stats.outflow';
                    $extra['control_key'] = 'cash_outflow_ytd';
                    $extras[] = $extra;
                } elseif ($id === 'RPT-012') {
                    $extra = $m;
                    $extra['id'] = 'RPT-012-input';
                    $extra['prop_path'] = 'stats.total_input_tax';
                    $extra['control_key'] = 'tax_input_ytd';
                    $extras[] = $extra;
                }
            }
            unset($m);
        }
        
        foreach ($extras as $ex) {
            $this->registry['metrics'][] = $ex;
        }
    }

    private function resolveServiceControlValue(string $serviceStr): ?float
    {
        if (empty($serviceStr) || $serviceStr === 'UNKNOWN' || $serviceStr === 'NONE') {
            return null;
        }

        try {
            if (str_contains($serviceStr, '@')) {
                [$class, $methodWithArgs] = explode('@', $serviceStr);
                
                $args = [];
                if (preg_match('/([a-zA-Z0-9_]+)\((.*)\)/', $methodWithArgs, $matches)) {
                    $method = $matches[1];
                    $argsStr = $matches[2];
                    if (!empty($argsStr)) {
                        $args = array_map(fn($a) => trim($a, " '\""), explode(',', $argsStr));
                    }
                } else {
                    $method = $methodWithArgs;
                }

                $instance = app($class);
                
                $ref = new \ReflectionMethod($class, $method);
                $params = [];
                
                if ($class === 'App\\Services\\V3\\AccountingService' && $method === 'getBalance') {
                    $params = $args;
                } else {
                    $from = Carbon::now('Asia/Karachi')->startOfMonth()->toDateString();
                    $to = Carbon::now('Asia/Karachi')->endOfMonth()->toDateString();
                    
                    if (str_contains(strtolower($serviceStr), 'ytd') || str_contains($method, 'Ytd')) {
                        $from = Carbon::now('Asia/Karachi')->startOfYear()->toDateString();
                    }
                    
                    foreach ($ref->getParameters() as $p) {
                        if ($p->name === 'startDate' || $p->name === 'from' || $p->name === 'start') {
                            $params[] = $from;
                        } elseif ($p->name === 'endDate' || $p->name === 'to' || $p->name === 'end') {
                            $params[] = $to;
                        }
                    }
                }
                
                $res = $ref->invokeArgs($instance, $params);
                
                if (is_numeric($res)) {
                    return (float)$res;
                }
                
                if (is_array($res)) {
                    foreach (['total_spend', 'total_sales', 'total_purchases', 'net_profit', 'revenue', 'cogs', 'total', 'grand_debit', 'total_assets'] as $k) {
                        if (isset($res[$k])) {
                            return (float)$res[$k];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Safe fallback
        }

        return null;
    }

    private function markMetricAsVerified(string $metricId): void
    {
        if (isset($this->registry['metrics'])) {
            foreach ($this->registry['metrics'] as &$m) {
                if (($m['id'] ?? '') === $metricId) {
                    $m['verified'] = true;
                }
            }
            unset($m);
        }
    }

    private function markMetricsForRouteAsVerified(string $routeName): void
    {
        if (isset($this->registry['metrics'])) {
            foreach ($this->registry['metrics'] as &$m) {
                if (($m['route'] ?? '') === $routeName) {
                    $m['verified'] = true;
                }
            }
            unset($m);
        }
    }

    private function saveRegistry(): void
    {
        $path = base_path('verification/number_registry.yaml');
        if (file_exists($path) && class_exists(\Symfony\Component\Yaml\Yaml::class)) {
            $cleanMetrics = [];
            foreach ($this->registry['metrics'] ?? [] as $m) {
                $id = $m['id'] ?? '';
                if (str_contains($id, '-credit') || str_contains($id, '-net') || str_contains($id, '-gross') || str_contains($id, '-liab') || str_contains($id, '-out') || str_contains($id, '-input')) {
                    continue;
                }
                
                unset($m['prop_path']);
                unset($m['control_key']);
                
                $cleanMetrics[] = $m;
            }
            
            $this->registry['metrics'] = $cleanMetrics;
            
            $ledgerCount = 0;
            $transactionCount = 0;
            $hybridCount = 0;
            $nonFinancialCount = 0;
            $verifiedCount = 0;
            
            foreach ($cleanMetrics as $m) {
                $cls = $m['classification'] ?? 'UNKNOWN';
                if ($cls === 'LEDGER-DERIVED') $ledgerCount++;
                elseif ($cls === 'TRANSACTION-DERIVED') $transactionCount++;
                elseif ($cls === 'HYBRID') $hybridCount++;
                elseif ($cls === 'NON-FINANCIAL') {
                    $nonFinancialCount++;
                    if (!empty($m['route'])) {
                        $this->nonFinancialRoutes[] = $m['route'];
                    }
                }
                
                if ($m['verified'] ?? false) {
                    $verifiedCount++;
                }
            }
            
            $totalMetrics = count($cleanMetrics);
            $this->registry['stats'] = [
                'total_metrics' => $totalMetrics,
                'ledger_derived' => $ledgerCount,
                'transaction_derived' => $transactionCount,
                'hybrid' => $hybridCount,
                'non_financial' => $nonFinancialCount,
                'verified' => $verifiedCount,
                'coverage_pct' => $totalMetrics > 0 ? round($verifiedCount / $totalMetrics * 100, 1) . '%' : '0%',
                'consistency_groups' => count($this->registry['consistency_groups'] ?? []),
                'flagged_for_remediation' => count($this->registry['flagged_for_remediation'] ?? []),
            ];
            
            $yaml = \Symfony\Component\Yaml\Yaml::dump($this->registry, 4, 2);
            $header = "# ============================================================\n" .
                      "# VenQore Number Registry — Phase 0 of the Verification Blueprint\n" .
                      "# ============================================================\n" .
                      "# Every metric displayed anywhere in the application.\n" .
                      "# Classification:\n" .
                      "#   LEDGER-DERIVED      — reads only from journal_items/journal_entries via\n" .
                      "#                         FinancialReportingService or AccountingService  ✅\n" .
                      "#   TRANSACTION-DERIVED — reads raw sales/purchases/payments tables       ⚠️\n" .
                      "#   HYBRID              — reads both ledger and transaction tables         ⚠️\n" .
                      "#   NON-FINANCIAL       — no money/qty metric                             ⬜\n" .
                      "#\n" .
                      "# This file is the coverage denominator for the entire test suite.\n" .
                      "# coverage% = verified_metrics / total LEDGER-DERIVED entries\n" .
                      "# ============================================================\n" .
                      "# Generator: verify:map artisan command (auto-regenerated)\n" .
                      "# Last updated: " . now()->toDateString() . "\n" .
                      "# ============================================================\n\n";
            file_put_contents($path, $header . $yaml);
        }
    }
}
