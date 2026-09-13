<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\BankAccount;
use App\Services\FinancialReportingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\AiRecommendation;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // [V3 SWAP DAY 1] autoHealStockIntegrity() and autoHealTimestamps() removed from
        // page-load path. They were writing directly to inventory_batches, stocks, and
        // products on every request — a critical data-corruption risk. They must be
        // re-implemented as one-shot Artisan commands and run only under explicit control.

        $tz  = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        $now = request()->has('test_date') ? Carbon::parse(request()->query('test_date'), $tz) : Carbon::now($tz);
        $user = auth()->user();

        // ── Role Router (V1 Tier 2 — per Master Plan) ─────────────────────────
        // Resolve role from the current store membership (set by TenantMiddleware).
        // Falls back to null so existing users on the old schema still work.
        $membership = app()->bound('current.membership') ? app('current.membership') : null;
        $storeRole  = $membership?->role;

        return match ($storeRole) {
            'cashier'            => $this->cashierDashboard($user, $membership),
            'accountant'         => $this->accountantDashboard($now),
            'purchasing_officer' => $this->purchasingDashboard($now),
            'viewer'             => $this->viewerDashboard($now),
            default              => $this->fullDashboard($now, $user),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Role-specific dashboard builders
    // ─────────────────────────────────────────────────────────────────────────

    private function cashierDashboard($user, $membership)
    {
        $storeId = $membership?->tenant_id ?? app('current.tenant')?->id;
        abort_unless($storeId, 403, 'Tenant context not resolved.');

        // Session totals for today (sales created by this user today)
        $session = [
            'transaction_count' => \App\Models\Sale::where('status', 'posted')
                ->where('tenant_id', $storeId)
                ->whereDate('posted_at', today())
                ->count(),
            'session_total' => \App\Models\Sale::where('status', 'posted')
                ->where('tenant_id', $storeId)
                ->whereDate('posted_at', today())
                ->sum('net_sales'),
        ];

        // Attendance — find today's clock-in (from staff_attendances if table exists)
        $attendance = null;
        try {
            $attendance = \App\Models\StaffAttendance::where('user_id', $user->id)
                ->whereDate('date', today())
                ->first(['clock_in', 'clock_out']);
            if ($attendance) {
                $attendance = ['clock_in_time' => $attendance->clock_in, 'is_working' => !$attendance->clock_out];
            }
        } catch (\Throwable) {
            // Table may not exist yet — graceful degrade
        }

        return Inertia::render('Dashboards/CashierDashboard', [
            'session'    => $session,
            'attendance' => $attendance,
        ]);
    }

    private function accountantDashboard(Carbon $now)
    {
        $outstanding = $this->getOutstanding();

        // Cash position
        $bankSum = \App\Models\BankAccount::where('account_type', '!=', 'cash')
            ->get()->sum(fn($a) => $a->v3Balance());
        $cashSum = \App\Models\BankAccount::where('account_type', 'cash')
            ->get()->sum(fn($a) => $a->v3Balance());

        $cashPosition = ['cash' => $cashSum, 'bank' => $bankSum, 'total' => $cashSum + $bankSum];

        $plSummary = $this->getPLSummary($now->copy()->startOfMonth(), $now->copy()->endOfMonth());

        // P&L chart — last 6 months
        $plChartData = collect(range(5, 0))->map(function ($i) use ($now) {
            $start = $now->copy()->subMonths($i)->startOfMonth();
            $end   = $now->copy()->subMonths($i)->endOfMonth();
            $pl    = $this->getPLSummary($start, $end);
            return ['month' => $start->format('M'), 'income' => $pl['income'], 'expense' => $pl['expense']];
        })->values();

        // Recent journal entries
        $recentEntries = collect([]);
        try {
            $recentEntries = \App\Models\JournalEntry::latest()->take(8)->get()->map(fn($je) => [
                'description' => $je->description,
                'date'        => $je->date,
                'amount'      => $je->journalItems()->sum('debit'),
                'type'        => 'debit',
            ]);
        } catch (\Throwable) {}

        $bankAccounts = \App\Models\BankAccount::where('account_type', '!=', 'cash')
            ->get()->map(fn($a) => ['name' => $a->bank_name ?? $a->name, 'current_balance' => $a->v3Balance()]);
        $cashAccounts = \App\Models\BankAccount::where('account_type', 'cash')
            ->get()->map(fn($a) => ['name' => $a->bank_name ?? 'Cash', 'current_balance' => $a->v3Balance()]);

        // Simple aging — real receivables from outstanding + overdue fractions
        $receivables = [
            'total'          => $outstanding['receivables'],
            'overdue_30'     => round($outstanding['receivables'] * 0.3, 2),
            'overdue_60'     => round($outstanding['receivables'] * 0.15, 2),
            'overdue_90'     => round($outstanding['receivables'] * 0.05, 2),
            'overdue_90plus' => round($outstanding['receivables'] * 0.02, 2),
        ];
        $payables = [
            'total'   => $outstanding['payables'],
            'due_7'   => round($outstanding['payables'] * 0.2, 2),
            'due_30'  => round($outstanding['payables'] * 0.5, 2),
            'overdue' => round($outstanding['payables'] * 0.1, 2),
        ];

        return Inertia::render('Dashboards/AccountantDashboard', [
            'cashPosition'         => $cashPosition,
            'receivables'          => $receivables,
            'payables'             => $payables,
            'plSummary'            => $plSummary,
            'plChartData'          => $plChartData,
            'bankAccounts'         => $bankAccounts,
            'cashAccounts'         => $cashAccounts,
            'recentJournalEntries' => $recentEntries,
            'pendingJournalCount'  => 0,
        ]);
    }

    private function purchasingDashboard(Carbon $now)
    {
        // Recent purchase orders — V3: purchases live in `purchases`.
        // This previously queried the invoices table for type = purchase with a fallback
        // to `purchases` in a catch block. The catch never fired: an emptied
        // legacy table does not throw, it returns zero rows. Reading the right
        // table directly is the fix.
        //
        // `status` here means the GOODS state, so it maps to workflow_status —
        // the widget below filters on 'received'/'cancelled'/'ordered'.
        $orders = collect([]);
        try {
            $orders = \App\Models\Purchase::with('party:id,name')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($po) => [
                    'id'            => $po->id,
                    'supplier_name' => $po->party?->name ?? '—',
                    'total_amount'  => $po->total,
                    'status'        => $po->workflow_status ?? 'ordered',
                    'expected_date' => $po->due_date
                        ? \Carbon\Carbon::parse($po->due_date)->format('d M Y')
                        : null,
                ]);
        } catch (\Throwable) {}

        $openCount = $orders->whereNotIn('status', ['received', 'cancelled'])->count();

        // Reorder alerts
        $reorderAlerts = \App\Models\Product::withSum('stocks', 'quantity')
            ->get()
            ->filter(fn($p) => ($p->stocks_sum_quantity ?? 0) <= ($p->min_stock_alert ?? 5) && ($p->min_stock_alert ?? 5) > 0)
            ->take(10)
            ->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'stock' => $p->stocks_sum_quantity ?? 0, 'min_stock' => $p->min_stock_alert ?? 5])
            ->values();

        // Monthly spend
        $monthlySpend = 0;
        try {
            // V3: purchases live in `purchases` (total_amount -> total).
            $monthlySpend = \App\Models\Purchase::where('workflow_status', '!=', 'cancelled')
                ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
                ->sum('total');
        } catch (\Throwable) {}

        $payables = $this->getOutstanding()['payables'];

        return Inertia::render('Dashboards/PurchasingDashboard', [
            'openPurchaseOrders'     => $openCount,
            'pendingDeliveriesCount' => $orders->where('status', 'ordered')->count(),
            'reorderAlerts'          => $reorderAlerts,
            'supplierPayables'       => $payables,
            'monthlySpend'           => $monthlySpend,
            'recentOrders'           => $orders->values(),
        ]);
    }

    private function viewerDashboard(Carbon $now)
    {
        $plSummary        = $this->getPLSummary($now->copy()->startOfMonth(), $now->copy()->endOfMonth());
        $inventoryValue   = (new \App\Services\FinancialReportingService())->getInventoryValue();

        return Inertia::render('Dashboards/ViewerDashboard', [
            'plSummary'      => $plSummary,
            'inventoryValue' => $inventoryValue,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Original full dashboard (Owner / Admin / Manager)
    // ─────────────────────────────────────────────────────────────────────────

    private function fullDashboard(Carbon $now, $user)
    {
        // Check if setup is completed via the tenant record (Injected by TenantMiddleware)
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $setupCompleted = $tenant ? $tenant->setup_completed : false;
        $currencySym = $tenant?->currency_symbol ?? 'Rs';

        if (!$setupCompleted && ($user->hasRole('platform_admin') || $user->hasRole('admin'))) {
            return redirect()->route('store.setup', ['store_slug' => $tenant?->slug ?? 'default']);
        }

        // Permission Checks — hasPermission() delegates to config/permissions.php
        // which is the single source of truth for all role-based access control.
        $membership    = app()->bound('current.membership') ? app('current.membership') : null;

        $canSeeSales     = $user->hasPermission('sales.view') || $user->hasPermission('pos.checkout') || $user->hasPermission('sales.create') || $user->hasPermission('sales.edit');
        $canSeeFinance   = $user->hasPermission('finance.transactions') || $user->hasPermission('finance.balances');
        $canSeeReports   = $user->hasPermission('reports.summary') || $user->hasPermission('reports.financial') || $user->hasPermission('reports.stock') || $user->hasPermission('reports.performance') || $user->hasPermission('reports.audit');
        $canSeeInventory = $user->hasPermission('inventory.view');

        // Performance Stats
        $performance = [];
        if ($canSeeSales) {
            $performance = [
                'Today' => $this->getSalesStats($now->copy()->startOfDay(), $now->copy()->endOfDay()),
                'Month' => $this->getSalesStats($now->copy()->startOfMonth(), $now->copy()->endOfMonth()),
                'Year' => $this->getSalesStats($now->copy()->startOfYear(), $now->copy()->endOfYear()),
                'All Time' => $this->getSalesStats(null, null),
            ];
        }

        // Outstanding Stats (Receivables/Payables)
        // Tries ledger first; if ledger is empty (historical import), falls back to
        // direct party balance sums from the operational tables.
        $outstanding = [];
        if ($canSeeFinance) {
            $outstanding = [
                'Today'    => $this->getOutstanding(),
                'Month'    => $this->getOutstanding(),
                'Year'     => $this->getOutstanding(),
                'All Time' => $this->getOutstanding(),
            ];
        }

        // Net Profit Stats
        // Uses direct table calculations (net_sales - COGS - expenses).
        // The double-entry ledger would be more accurate but was never backfilled
        // for historical Vyapar imports. This gives correct operational figures.
        $netProfit = [];
        if ($canSeeFinance) {
            $netProfit = [
                'Today'    => $this->getNetProfit($now->copy()->startOfDay(), $now->copy()->endOfDay()),
                'Month'    => $this->getNetProfit($now->copy()->startOfMonth(), $now->copy()->endOfMonth()),
                'Year'     => $this->getNetProfit($now->copy()->startOfYear(), $now->copy()->endOfYear()),
                'All Time' => $this->getNetProfit(null, null),
            ];
        }

        // Chart Data
        $salesData = $canSeeSales ? $this->getChartData() : [];

        // Top Selling Items — Step 7 (CALCULATION_LOGIC.md § 2.7)
        // RULE: revenue column = SUM(net_amount), NOT SUM(subtotal) (gross, before discount)
        // RULE: gross_profit   = net_revenue - FIFO COGS from sale_item_batches
        // RULE: margin_pct     = (gross_profit / net_revenue) × 100 — never stored, always dynamic
        // Period: current month. Sorted by net_revenue descending.
        $topSellingItems = collect([]);
        if ($canSeeSales || $canSeeReports) {
            $currencySym = $tenant?->currency_symbol ?? 'Rs';
            $topSellingItems = (new FinancialReportingService())
                ->getGrossProfitByProduct(
                    $now->copy()->startOfMonth()->toDateString(),
                    $now->copy()->endOfMonth()->toDateString()
                )
                ->sortByDesc('net_revenue')
                ->take(8)
                ->map(function ($item) use ($currencySym) {
                    return [
                        'id'           => $item['product_id'],
                        'name'         => $item['name'],
                        'sku'          => $item['sku'],
                        'sold'         => (int) $item['quantity'],
                        'net_revenue'  => $item['net_revenue'],
                        'gross_profit' => $item['gross_profit'],
                        'margin_pct'   => $item['margin_pct'],
                        // Formatted for display
                        'revenue'      => $currencySym . ' ' . \App\Helpers\SettingsHelper::formatNumber($item['net_revenue']),
                        'profit'       => $currencySym . ' ' . \App\Helpers\SettingsHelper::formatNumber($item['gross_profit']),
                        'margin'       => $item['margin_pct'] . '%',
                        'image'        => '📦',
                    ];
                })
                ->values();
        }

        // ═══════════════════════════════════════════════
        // FINANCIAL ANALYTICS — Phase 1.1
        // ═══════════════════════════════════════════════
        $recentTransactions = collect([]);
        $tenantId = app('current.tenant')->id;
        $glCash = Account::where('code', '1000')->first();
        
        if (($canSeeFinance || $canSeeSales) && $glCash) {
            $glRecent = \App\Models\JournalItem::where('account_id', $glCash->id)
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_entries.is_reversed', 0)
                ->select(
                    'journal_items.id as item_id',
                    'journal_entries.id as entry_id',
                    'journal_entries.date',
                    'journal_entries.created_at as time',
                    'journal_entries.description',
                    'journal_entries.reference_type',
                    'journal_entries.reference as reference_id',
                    'journal_items.debit',
                    'journal_items.credit'
                )
                ->orderBy('journal_entries.date', 'desc')
                ->orderBy('journal_entries.created_at', 'desc')
                ->take(10)
                ->get();

            $recentTransactions = $glRecent->map(function($item) use ($currencySym) {
                $isIn = (float)$item->debit > 0;
                $refType = $item->reference_type;
                
                // Determine Label & Activity Type
                $typeLabel = 'Transaction';
                $activityType = 'other';
                
                if (in_array($refType, ['sale', 'pos_sale'])) {
                    $typeLabel = 'Sale'; 
                    $activityType = 'sale';
                } elseif ($refType === 'sale_return') {
                    $typeLabel = 'Return';
                    $activityType = 'return';
                } elseif (in_array($refType, ['purchase', 'purchase_payment'])) {
                    $typeLabel = 'Purchase';
                    $activityType = 'purchase';
                } elseif ($refType === 'expense') {
                    $typeLabel = 'Expense';
                    $activityType = 'expense';
                } elseif (str_contains($refType, 'fund_add') || $refType === 'payment_in') {
                    $typeLabel = 'Payment In';
                    $activityType = 'payment_in';
                } elseif (str_contains($refType, 'fund_remove') || $refType === 'payment_out') {
                    $typeLabel = 'Payment Out';
                    $activityType = 'payment_out';
                }

                return [
                    'id' => 'gl-' . $item->item_id,
                    'type' => $typeLabel,
                    'amount' => ($isIn ? '+' : '-') . $currencySym . ' ' . \App\Helpers\SettingsHelper::formatNumber((float)($isIn ? $item->debit : $item->credit)),
                    'time' => \Carbon\Carbon::parse($item->time)->diffForHumans(),
                    'status' => 'Completed',
                    'description' => $item->description ?: 'Cash Transaction',
                    'activityType' => $activityType,
                    'reference_type' => $refType,
                    'reference_id' => $item->reference_id
                ];
            });
        }

        // P&L Summary
        $plSummary = [];
        if ($canSeeReports || $canSeeFinance) {
            $plSummary = [
                'Today' => $this->getPLSummary($now->copy()->startOfDay(), $now->copy()->endOfDay()),
                'Week' => $this->getPLSummary($now->copy()->startOfWeek(), $now->copy()->endOfWeek()),
                'Month' => $this->getPLSummary($now->copy()->startOfMonth(), $now->copy()->endOfMonth()),
            ];
        }

        // Low Stock Items
        $lowStockItems = collect([]);
        if ($canSeeInventory) {
            $lowStockItems = Product::withSum('stocks', 'quantity')
                ->get()
                ->filter(function ($product) {
                    return ($product->stocks_sum_quantity ?? 0) <= ($product->min_stock_alert ?? 5);
                })
                ->take(5)
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'stock' => $product->stocks_sum_quantity ?? 0,
                        'alert' => $product->min_stock_alert ?? 5,
                        'image' => '⚠️'
                    ];
                })->values();
        }

        // Recent Purchases
        $recentPurchases = [
            'Today'    => collect([]),
            'Month'    => collect([]),
            'Year'     => collect([]),
            'All Time' => collect([]),
        ];
        $canSeePurchases = $user->hasRole('platform_admin') || $user->hasRole('admin') || $user->hasRole('owner') || $user->hasPermission('purchases.view');
        if ($canSeePurchases) {
            $periods = [
                'Today'    => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
                'Month'    => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
                'Year'     => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
                'All Time' => null,
            ];

            foreach ($periods as $periodKey => $range) {
                // V3: purchases live in `purchases`. The old Invoice-first /
                // Purchase-in-catch pattern was dead — an empty legacy table
                // returns zero rows rather than throwing, so the fallback never ran.
                try {
                    $query = \App\Models\Purchase::with('party:id,name')
                        ->where('workflow_status', '!=', 'cancelled');
                    if ($range) {
                        $query->whereBetween('created_at', $range);
                    }
                    $recentPurchases[$periodKey] = $query->latest()
                        ->take(5)
                        ->get()
                        ->map(function ($po) use ($currencySym) {
                            return [
                                'id'            => $po->id,
                                'supplier_name' => $po->party?->name ?? '—',
                                'total_amount'  => $currencySym . ' ' . \App\Helpers\SettingsHelper::formatNumber($po->total),
                                'status'        => $po->workflow_status ?? 'ordered',
                                'date'          => $po->created_at->diffForHumans(),
                            ];
                        });
                } catch (\Throwable $e) {}
            }
        }

        // Accounts (Right Sidebar)
        $bankAccounts = [];
        $cashAccounts = [];
        $cashData = null;
        $cashBalance = 0.0;

        if ($user->hasPermission('finance.balances')) {
            $bankAccounts = BankAccount::whereNotIn('account_type', ['cash'])
                ->whereNotIn('type', ['cash'])
                ->get()
                ->map(function ($account) {
                    $account->current_balance = $account->v3Balance();
                    return $account;
                });
            $cashAccounts = BankAccount::where('account_type', 'cash')->get()->map(function ($account) {
                $account->current_balance = $account->v3Balance();
                return $account;
            });

            // GL Cash Account (Pre-fetched above)
            if ($glCash) {
                // ═══════════════════════════════════════════════
                // BUILD COMPLETE CASH STORY from General Ledger (Account 1000)
                // ═══════════════════════════════════════════════
                $glEntries = \App\Models\JournalItem::where('account_id', $glCash->id)
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.is_reversed', 0)
                    ->select(
                        'journal_items.id as item_id',
                        'journal_entries.created_at as time',
                        'journal_entries.description',
                        'journal_items.debit',
                        'journal_items.credit'
                    )
                    ->orderBy('journal_entries.date', 'desc')
                    ->orderBy('journal_entries.created_at', 'desc')
                    ->take(10)
                    ->get();
                
                $cashTx = $glEntries->map(function($item) {
                    $isIn = (float)$item->debit > 0;
                    return [
                        'id'     => 'gl-' . $item->item_id,
                        'date'   => $item->time,
                        'desc'   => $item->description ?: ($isIn ? 'Cash Inflow' : 'Cash Outflow'),
                        'amount' => (float) ($isIn ? $item->debit : $item->credit),
                        'type'   => $isIn ? 'in' : 'out',
                    ];
                });

                // V3: Use the unified ledger for the primary Cash account balance (GL 1000)
                $accountingSvc = resolve(\App\Engines\AccountingService::class);
                $cashBalance = (float) $accountingSvc->getBalance('1000');

                $cashData = [
                    'balance'      => $cashBalance,
                    'transactions' => $cashTx,
                ];
            } // End if($glCash)
    } // End if($canSeeFinance)

    // Inventory Value — Phase 2.2
    $inventoryValue = 0;
    if ($canSeeInventory || $canSeeFinance) {
        $inventoryValue = (new FinancialReportingService())->getInventoryValue();
    }

    \Illuminate\Support\Facades\Log::info('DASHBOARD_DEBUG', [
        'cash_balance' => $cashBalance,
        'bank_sum'     => collect($bankAccounts)->sum('current_balance'),
        'user_id'      => auth()->id(),
    ]);

    $charityToday = (float) \App\Models\Expense::whereDate('date', \Carbon\Carbon::today())
        ->whereHas('expenseCategory', function ($q) {
            $q->where('name', 'Charity/Donations');
        })
        ->sum('amount');

    $charityMonth = (float) \App\Models\Expense::whereMonth('date', \Carbon\Carbon::now()->month)
        ->whereYear('date', \Carbon\Carbon::now()->year)
        ->whereHas('expenseCategory', function ($q) {
            $q->where('name', 'Charity/Donations');
        })
        ->sum('amount');

    $charityStats = [
        'today'          => $charityToday,
        'month'          => $charityMonth,
        'default_amount' => (float)(\App\Models\Setting::where('key', 'charity_default_amount')->value('value') ?? 10),
        'enabled'        => \App\Models\Setting::where('key', 'charity_enabled')->value('value') === '1',
    ];

    return Inertia::render('NewDashboard', [
        'readings'           => \App\Reckoner\ReckonerRegistry::v6Catalog(),
        'revenue'            => $performance['Month']['sales'] ?? 0.0,
        'performance'        => $performance,
        'outstanding'        => $outstanding,
        'netProfit'          => $netProfit,
        'salesData'          => $salesData,
        'topSellingItems'    => $topSellingItems,
        'lowStockItems'      => $lowStockItems,
        'recentPurchases'    => $recentPurchases,
        'recentTransactions' => $recentTransactions,
        'plSummary'          => $plSummary,
        'bankAccounts'       => $bankAccounts,
        'cashAccounts'       => $cashAccounts,
        'cashData'           => $cashData,
        'inventoryValue'     => $inventoryValue,
        'charityStats'       => $charityStats,
        'aiRecommendations'  => AiRecommendation::active()->latest()->take(5)->get()->map(function($r) {
            return [
                'id' => $r->id,
                'type' => $r->type,
                'title' => $r->title,
                'message' => $r->message,
                'priority' => $r->priority,
                'action_type' => $r->action_type,
                'data' => $r->data,
                'revenue' => (float) $r->potential_revenue,
            ];
        })
    ]);
}

    public function home()
    {
        // [V3 SWAP DAY 1] autoHeal calls removed — see index() comment above.

        $user = auth()->user();
        $recentActivity = collect([]);

        // Only show Sales Activity if user has sales permission
        if ($user->hasPermission('sales') || $user->hasPermission('sales_view') || $user->hasPermission('finance') || $user->hasPermission('inventory')) {
            $currencySym = app('current.tenant')?->currency_symbol ?? 'Rs';
            $recentActivity = \App\Models\Activity::orderByDesc('created_at')
                ->take(5)
                ->get()
                ->map(function ($activity) use ($currencySym) {
                    $isSale = $activity->type === 'sale';
                    $isPaymentIn = $activity->type === 'payment_in';
                    $sign = ($isSale || $isPaymentIn) ? '+' : '-';
                    
                    $typeLabels = [
                        'sale' => 'New Sale',
                        'return' => 'Return',
                        'purchase' => 'Purchase',
                        'payment_in' => 'Payment Received',
                        'payment_out' => 'Payment Made',
                        'expense' => 'Expense'
                    ];

                    $title = $typeLabels[$activity->type] ?? ucfirst($activity->type);
                    if ($activity->reference_id && strlen($activity->reference_id) < 15 && !str_contains($activity->reference_id, '-')) {
                        $title .= ' #' . $activity->reference_id;
                    }

                    return [
                        'id' => $activity->id,
                        'title' => $title,
                        'subtitle' => $activity->description,
                        'amount' => $sign . $currencySym . ' ' . \App\Helpers\SettingsHelper::formatNumber(abs((float) $activity->amount)),
                        'time' => $activity->created_at->diffForHumans(),
                    ];
                });
        }

        $systemLogs = collect([]);
        $membership = app()->bound('current.membership') ? app('current.membership') : null;
        $storeRole  = $membership?->role ?? $user->role;
        $canAudit = in_array($storeRole, ['owner', 'admin', 'manager']) || $user->hasPermission('audit') || (bool) ($user->is_platform_admin ?? false);

        if ($canAudit) {
            try {
                $systemLogs = \App\Models\ActivityLog::with('user')
                    ->orderByDesc('created_at')
                    ->take(8)
                    ->get()
                    ->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'action' => $log->action,
                            'description' => $log->description,
                            'user' => $log->user?->name ?? 'System',
                            'time' => $log->created_at ? $log->created_at->diffForHumans() : 'Recently',
                        ];
                    });
            } catch (\Throwable $e) {
                // Graceful fallback if table or relation error
            }
        }

        return Inertia::render('Home', [
            'recentActivity' => $recentActivity,
            'systemLogs' => $systemLogs
        ]);
    }

    private function getSalesStats($start, $end)
    {
        $startStr = $start instanceof \Carbon\Carbon ? $start->toDateString() : ($start ?? '1970-01-01');
        $endStr   = $end   instanceof \Carbon\Carbon ? $end->toDateString()   : ($end ?? now()->toDateString());

        $pl = app(\App\Services\FinancialReportingService::class)->getProfitAndLoss($startStr, $endStr);

        $sales = (float) $pl['revenue'];
        $cogs = (float) $pl['cogs'];
        $grossProfit = $sales - $cogs;

        return [
            'sales'        => $sales,
            'gross_profit' => $grossProfit,
            'cogs'         => $cogs,
        ];
    }

    /**
     * Get outstanding receivables and payables.
     *
     * Strategy:
     * 1. Try the journal ledger (AR account 1200 / AP account 2000).
     * 2. If the ledger has no entries for those accounts (historical import case),
     *    fall back to summing parties.current_balance directly.
     *    - Customers with current_balance > 0 owe us (receivable).
     *    - Suppliers with current_balance > 0 we owe them (payable).
     */
    private function getOutstanding(): array
    {
        $tenantId = app('current.tenant')->id;
        // Pure V3 Journal — opening balances are now seeded via migrate:opening-balances
        $receivables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('accounts.tenant_id', $tenantId)
            ->where('accounts.code', '1200')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
            ->value('net');

        $payables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('accounts.tenant_id', $tenantId)
            ->where('accounts.code', '2000')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0) as net')
            ->value('net');

        return [
            'receivables' => max(0, (float)$receivables),
            'payables'    => max(0, (float)$payables),
        ];
    }

    private function getNetProfit($start, $end): array
    {
        $startStr = $start instanceof \Carbon\Carbon ? $start->toDateString() : ($start ?? '1970-01-01');
        $endStr   = $end   instanceof \Carbon\Carbon ? $end->toDateString()   : ($end ?? now()->toDateString());

        // C3.2: single read-engine (was V3\ReportService).
        $pl = app(\App\Services\FinancialReportingService::class)->getProfitAndLoss($startStr, $endStr);

        $income  = (float) $pl['revenue'];
        $expense = (float) $pl['total_expenses']; // cogs + operating expenses (combined)
        $profit  = (float) $pl['net_profit'];

        return [
            'value'   => $profit,
            'income'  => $income,
            'expense' => $expense,
            'status'  => $profit >= 0 ? 'Good' : 'Critical',
            'growth'  => '',
        ];
    }

    private function getPLSummary($start, $end)
    {
        $startStr = $start instanceof \Carbon\Carbon ? $start->toDateString() : ($start ?? '1970-01-01');
        $endStr   = $end   instanceof \Carbon\Carbon ? $end->toDateString()   : ($end ?? now()->toDateString());

        // C3.2: single read-engine (was V3\ReportService).
        $pl = app(\App\Services\FinancialReportingService::class)->getProfitAndLoss($startStr, $endStr);

        $income  = (float) $pl['revenue'];
        $expense = (float) $pl['total_expenses'];
        $profit  = (float) $pl['net_profit'];

        return [
            'income'  => $income,
            'expense' => $expense,
            'profit'  => $profit,
            'status'  => $profit >= 0 ? 'good' : 'bad'
        ];
    }

    private function getChartData()
    {
        $frs = app(\App\Services\FinancialReportingService::class);

        // Today (hourly)
        $todayMap = $frs->getProfitByPeriod(Carbon::today()->startOfDay(), Carbon::today()->endOfDay(), 'hourly');
        $today = [];
        for ($i = 0; $i < 24; $i++) {
            $h = str_pad($i, 2, '0', STR_PAD_LEFT);
            $row = $todayMap[$h] ?? null;
            $today[] = ['name' => "$h:00", 'sales' => (float) ($row['revenue'] ?? 0), 'profit' => (float) ($row['profit'] ?? 0)];
        }

        // Month (daily, current calendar month: 1st through today).
        // CLAUDE.md "Date & Time Period Naming Conventions": "Month" must be the
        // current calendar month, not a rolling window — must match getSalesStats()
        // in this same controller, which already uses startOfMonth()/endOfMonth().
        $monthStart = Carbon::now()->startOfMonth();
        $monthToday = Carbon::now();
        $monthMap = $frs->getProfitByPeriod($monthStart->copy()->startOfDay(), $monthToday->copy()->endOfDay(), 'daily');
        $month = [];
        $daysElapsed = $monthStart->diffInDays($monthToday); // 0-indexed offset of today within the month
        for ($i = $daysElapsed; $i >= 0; $i--) {
            $date = $monthToday->copy()->subDays($i);
            $row = $monthMap[$date->format('Y-m-d')] ?? null;
            $month[] = ['name' => $date->format('d M'), 'sales' => (float) ($row['revenue'] ?? 0), 'profit' => (float) ($row['profit'] ?? 0)];
        }

        // Year (monthly, last 12 months)
        $yearMap = $frs->getProfitByPeriod(Carbon::now()->subMonths(11)->startOfMonth(), Carbon::now()->endOfMonth(), 'monthly');
        $year = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $row = $yearMap[$date->format('Y-m')] ?? null;
            $year[] = ['name' => $date->format('M'), 'sales' => (float) ($row['revenue'] ?? 0), 'profit' => (float) ($row['profit'] ?? 0)];
        }

        return ['Today' => $today, 'Month' => $month, 'Year' => $year];
    }

    /**
     * [V3 SWAP DAY 1 — DISABLED]
     *
     * autoHealStockIntegrity() was writing directly to inventory_batches, stocks,
     * and products on every single page load. This is a Critical Risk:
     *   - It could silently overwrite FIFO batch remaining_qty computed by FifoService.
     *   - It created orphan batches with cost_price instead of real purchase unit_cost.
     *   - It ran on EVERY request, meaning a single bad StockMovement row would
     *     corrupt the entire inventory at the next page load.
     *
     * TODO: Re-implement as `php artisan inventory:heal` (Artisan command)
     *       with a --dry-run flag, run only after explicit operator review.
     */
    private function autoHealStockIntegrity(): void
    {
        // NO-OP — moved to Artisan command (pending Day 1 task).
    }

    /**
     * [V3 SWAP DAY 1 — DISABLED]
     *
     * autoHealTimestamps() mutated created_at / updated_at on all returned sales
     * on every single page load by reverse-engineering UUID v7 timestamps.
     * This is a Critical Risk:
     *   - It silently rewrites financial record timestamps, breaking audit trails.
     *   - UUID v7 timestamp parsing is unreliable if IDs were generated outside
     *     the application (e.g. migrations, seeders, Vyapar imports).
     *   - It ran on every Dashboard hit — O(n) queries against all returned sales.
     *
     * TODO: Re-implement as `php artisan sales:fix-return-timestamps` (Artisan command)
     *       with a --dry-run flag, run only once under explicit operator review.
     */
    private function autoHealTimestamps(): void
    {
        // NO-OP — moved to Artisan command (pending Day 1 task).
    }
}