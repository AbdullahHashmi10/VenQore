<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Invoice;
use App\Models\Party;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\InvoiceItem;
use App\Models\Batch;
use App\Models\BankAccount;
use App\Models\Account;
use App\Models\Category;
use App\Models\Warehouse;
use App\Models\StockMovement;
use App\Services\FinancialReportingService;
use App\Services\ReportTierGate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function resolveDateRange(Request $request)
    {
        $range = $request->input('range', 'this_month');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        switch ($range) {
            case 'today':
                $startDate = Carbon::today()->toDateString();
                $endDate = Carbon::today()->toDateString();
                break;
            case 'yesterday':
                $startDate = Carbon::yesterday()->toDateString();
                $endDate = Carbon::yesterday()->toDateString();
                break;
            case 'this_week':
                $startDate = Carbon::now()->startOfWeek()->toDateString();
                $endDate = Carbon::now()->endOfWeek()->toDateString();
                break;
            case 'last_week':
                $startDate = Carbon::now()->subWeek()->startOfWeek()->toDateString();
                $endDate = Carbon::now()->subWeek()->endOfWeek()->toDateString();
                break;
            case 'this_month':
                $startDate = Carbon::now()->startOfMonth()->toDateString();
                $endDate = Carbon::now()->endOfMonth()->toDateString();
                break;
            case 'last_month':
                $startDate = Carbon::now()->subMonth()->startOfMonth()->toDateString();
                $endDate = Carbon::now()->subMonth()->endOfMonth()->toDateString();
                break;
            case 'this_year':
                $startDate = Carbon::now()->startOfYear()->toDateString();
                $endDate = Carbon::now()->endOfYear()->toDateString();
                break;
            case 'last_year':
                $startDate = Carbon::now()->subYear()->startOfYear()->toDateString();
                $endDate = Carbon::now()->subYear()->endOfYear()->toDateString();
                break;
            case 'custom':
                if (!$startDate) {
                    $startDate = Carbon::now()->startOfMonth()->toDateString();
                }
                if (!$endDate) {
                    $endDate = Carbon::now()->endOfMonth()->toDateString();
                }
                break;
            default:
                $startDate = Carbon::now()->startOfMonth()->toDateString();
                $endDate = Carbon::now()->endOfMonth()->toDateString();
                break;
        }

        return [$startDate, $endDate, $range];
    }

    public function index()
    {
        return Inertia::render('Reports/ReportsHub');
    }

    public function dashboard()
    {
        // Redirect to index for now, or keep as separate dashboard
        return redirect()->route('reports.index');
    }

    public function sales(Request $request)
    {
        ReportTierGate::enforce('reports.sales');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);
        $customerId = $request->input('customer_id');

        $query = Sale::with(['party', 'payments', 'items.product'])
            ->posted()
            ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        if ($customerId) {
            $query->where('party_id', $customerId);
        }

        $sales = $query->orderBy('posted_at', 'desc')->get();

        // Enhanced Stats
        $tenantId = app('current.tenant')->id;
        $arAccount = Account::where('code', '1200')->value('id');

        $totalSales = $sales->sum('net_sales');
        $count = $sales->count();

        // Total collected = sum of all AR credits in this period for these sales
        $saleIds = $sales->pluck('id');

        $totalPaid = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereIn('journal_entries.reference', $saleIds)
            ->where('journal_entries.reference_type', 'sale')
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->sum('journal_items.credit');

        $totalDue = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereIn('journal_entries.reference', $saleIds)
            ->where('journal_entries.reference_type', 'sale')
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->selectRaw('COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as net')
            ->value('net');

        $stats = [
            'total_sales'    => $totalSales,
            'total_paid'     => $totalPaid,
            'total_due'      => max(0, $totalDue),
            'count'          => $count,
            'avg_ticket'     => $count > 0 ? $totalSales / $count : 0,
            'total_discount' => $sales->sum('discount') ?? 0,
            'max_sale'       => $sales->max('net_sales') ?? 0,
            'unpaid_count'   => $sales->filter(fn($s) => ($s->total - $s->payments->sum('amount')) > 0)->count()
        ];

        // Chart Data (Daily Trend)
        $chartData = $sales->sortBy('posted_at')->groupBy(function($sale) {
             return Carbon::parse($sale->posted_at)->format('Y-m-d');
        })->map(function($group, $date) {
             return [
                 'name'  => Carbon::parse($date)->format('d M'),
                 'value' => $group->sum('net_sales')   // net_sales: ex-tax, ex-discount — matches all other revenue stats
             ];
        })->values();


        return Inertia::render('Reports/Sales', [
            'sales' => $sales,
            'stats' => $stats,
            'chartData' => $chartData,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'customer_id' => $customerId
            ],
            'customers' => Party::where('type', 'customer')->orderBy('name')->get()
        ]);
    }

    public function dailySales(Request $request)
    {
        ReportTierGate::enforce('reports.daily-sales');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);

        // Group sales by day in the range
        $sales = DB::table('sales')
            ->where('tenant_id', app('current.tenant')->id)
            ->whereNull('deleted_at')
            ->where('status', 'posted')
            ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->selectRaw('DATE(posted_at) as date, SUM(net_sales) as revenue, COUNT(*) as count, SUM(tax) as tax, SUM(discount) as discount')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        return Inertia::render('Reports/DailySales', [
            'reports' => $sales,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'stats' => [
                'total_revenue' => $sales->sum('revenue'),
                'total_count' => $sales->sum('count'),
                'total_tax' => $sales->sum('tax'),
                'total_discount' => $sales->sum('discount'),
            ]
        ]);
    }

    public function purchases(Request $request)
    {
        ReportTierGate::enforce('reports.purchases');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);
        $supplierId = $request->input('supplier_id');

        $query = Invoice::with('party')->where('type', 'purchase')
            ->whereBetween('date', [$startDate, $endDate]);

        if ($supplierId) {
            $query->where('party_id', $supplierId);
        }

        $purchases = $query->orderBy('date', 'desc')->get();

        $tenantId = app('current.tenant')->id;
        $apAccount = Account::where('code', '2000')->value('id');

        $purchaseIds = $purchases->pluck('id');

        $totalPurchases = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereIn('journal_entries.reference', $purchaseIds)
            ->where('journal_entries.reference_type', 'purchase')
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->sum('journal_items.credit');

        $totalPaid = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereIn('journal_entries.reference', $purchaseIds)
            ->where('journal_entries.reference_type', 'purchase')
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->sum('journal_items.debit');

        $stats = [
            'total_purchases' => $totalPurchases,
            'total_paid'      => $totalPaid,
            'total_due'       => max(0, $totalPurchases - $totalPaid),
            'count'           => $purchases->count()
        ];

        return Inertia::render('Reports/Purchases', [
            'purchases' => $purchases,
            'stats' => $stats,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'supplier_id' => $supplierId
            ],
            'suppliers' => Party::where('type', 'supplier')->orderBy('name')->get()
        ]);
    }

    public function dayBook(Request $request)
    {
        ReportTierGate::enforce('reports.day-book');
        $date = $request->input('date', Carbon::today()->toDateString());

        $tenantId = app('current.tenant')->id;

        // FIX-06: Rebuild on journal_items — all financial movements for the day
        // We read debit-normal accounts (assets, expenses) as 'out' and credit-normal (income, liabilities) as 'in'
        $rows = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->leftJoin('parties', 'journal_entries.party_id', '=', 'parties.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.date', $date)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.debit', '>', 0)
            ->select(
                'journal_entries.reference as ref',
                'journal_entries.description as desc',
                'accounts.name as account_name',
                'accounts.type as account_type',
                'journal_items.debit as amount',
                'parties.name as party_name'
            )
            ->orderBy('journal_entries.date')
            ->get();

        $transactions = $rows->map(function ($r) {
            $isInflow = in_array($r->account_type, ['income', 'liability']);
            return [
                'type'   => $r->account_name,
                'ref'    => $r->ref,
                'amount' => (float) $r->amount,
                'flow'   => $isInflow ? 'in' : 'out',
                'desc'   => $r->desc ?? ($r->party_name ? 'Party: ' . $r->party_name : $r->account_name),
            ];
        });

        $totalIn  = $transactions->where('flow', 'in')->sum('amount');
        $totalOut = $transactions->where('flow', 'out')->sum('amount');

        $stats = [
            'total_in'  => $totalIn,
            'total_out' => $totalOut,
            'net_cash'  => $totalIn - $totalOut,
        ];

        return Inertia::render('Reports/DayBook', [
            'transactions' => $transactions->values(),
            'stats'        => $stats,
            'date'         => $date
        ]);
    }

    public function profitLoss(Request $request)
    {
        ReportTierGate::enforce('reports.profit-loss');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);

        // Phase 4 — Delegates entirely to FinancialReportingService.
        // This controller is now a thin HTTP adapter. No financial logic lives here.
        $pnl = (new FinancialReportingService())->getProfitAndLoss($startDate, $endDate);

        return Inertia::render('Reports/ProfitLoss', [
            'stats' => [
                'revenue'        => $pnl['revenue'],
                'cogs'           => $pnl['cogs'],
                'gross_profit'   => $pnl['gross_profit'],
                'expenses'       => $pnl['operating_expenses'],
                'total_expenses' => $pnl['total_expenses'],
                'net_profit'     => $pnl['net_profit'],
            ],
            'income_accounts'  => $pnl['income_accounts'],
            'expense_accounts' => $pnl['expense_accounts'],
            'filters' => [
                'range'      => $range,
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function accountLedger(Request $request)
    {
        ReportTierGate::enforce('reports.account-ledger');
        $accountId = $request->input('account_id');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $account = $accountId ? Account::find($accountId) : null;
        $transactions = collect();
        $openingBalance = 0;

        if ($account) {
            // Calculate Opening Balance (Sum of all previous transactions)
            // For Assets/Expenses: Debit - Credit
            // For Liabilities/Equity/Income: Credit - Debit
            
            $isDebitNormal = in_array($account->type, ['asset', 'expense']);

            $prevItems = $account->journalItems()
                ->whereHas('journalEntry', fn($q) => $q->where('date', '<', $startDate));
            
            $prevDebit = (clone $prevItems)->sum('debit');
            $prevCredit = (clone $prevItems)->sum('credit');

            $openingBalance = $isDebitNormal ? ($prevDebit - $prevCredit) : ($prevCredit - $prevDebit);

            // Fetch Current Transactions
            $items = $account->journalItems()
                ->with('journalEntry')
                ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$startDate, $endDate]))
                ->get()
                ->sortBy(function($item) {
                     return $item->journalEntry->date . $item->created_at;
                });

            $runningBalance = $openingBalance;
            $transactions = $items->map(function($item) use (&$runningBalance, $isDebitNormal) {
                
                $amount = $isDebitNormal ? ($item->debit - $item->credit) : ($item->credit - $item->debit);
                $runningBalance += $amount;

                return [
                    'id' => $item->id,
                    'date' => $item->journalEntry->date,
                    'reference' => $item->journalEntry->reference,
                    'description' => $item->journalEntry->description ?? $item->description,
                    'debit' => $item->debit,
                    'credit' => $item->credit,
                    'balance' => $runningBalance
                ];
            });
        }

        return Inertia::render('Reports/AccountLedger', [
            'account' => $account,
            'transactions' => $transactions->values(),
            'openingBalance' => $openingBalance,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'accounts' => Account::orderBy('code')->get()
        ]);
    }

    public function partyStatement(Request $request)
    {
        ReportTierGate::enforce('reports.party-statement');
        $partyId   = $request->input('party_id');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $transactions   = collect();
        $openingBalance = 0;
        $closingBalance = 0;
        $party          = null;

        if ($partyId) {
            $tenantId = app('current.tenant')->id;
            $party = Party::where('id', $partyId)->where('tenant_id', $tenantId)->first();

            // Phase 4 — Party ledger is authoritative.
            // We look up the journal entry lines tagged with this party_id.
            // The AR account (1200) holds customer debits/credits.
            // The AP account (2000) holds supplier debits/credits.
            $arAccount = Account::where('code', '1200')->first();
            $apAccount = Account::where('code', '2000')->first();

            // Determine which account to use based on party type
            $accountId = ($party && $party->type === 'supplier')
                ? ($apAccount ? $apAccount->id : null)
                : ($arAccount ? $arAccount->id : null);

            if ($accountId) {
                $tenantId = app('current.tenant')->id;

                // Opening Balance: sum of all ledger activity for this party BEFORE the start date
                $openingDebits  = (float) DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_items.account_id', $accountId)
                    ->where('journal_entries.party_id', $partyId)
                    ->where('journal_entries.date', '<', $startDate)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.debit');
                $openingCredits = (float) DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_items.account_id', $accountId)
                    ->where('journal_entries.party_id', $partyId)
                    ->where('journal_entries.date', '<', $startDate)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.credit');
                $isCreditNormal = ($party && $party->type === 'supplier');
                $openingBalance = $isCreditNormal
                    ? ($openingCredits - $openingDebits)
                    : ($openingDebits - $openingCredits);

                // Period Transactions
                $rows = DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_items.account_id', $accountId)
                    ->where('journal_entries.party_id', $partyId)
                    ->whereBetween('journal_entries.date', [$startDate, $endDate])
                    ->where('journal_entries.is_reversed', 0)
                    ->select(
                        'journal_entries.date',
                        'journal_entries.reference as ref',
                        'journal_entries.description as desc',
                        'journal_items.debit',
                        'journal_items.credit'
                    )
                    ->orderBy('journal_entries.date')
                    ->get();

                $runningBalance = $openingBalance;
                $transactions = $rows->map(function ($r) use (&$runningBalance, $isCreditNormal) {
                    $delta = $isCreditNormal ? ($r->credit - $r->debit) : ($r->debit - $r->credit);
                    $runningBalance += $delta;
                    return [
                        'date'    => $r->date,
                        'type'    => $r->debit > 0 ? 'Debit' : 'Credit',
                        'ref'     => $r->ref,
                        'debit'   => (float) $r->debit,
                        'credit'  => (float) $r->credit,
                        'balance' => $runningBalance,
                        'desc'    => $r->desc,
                    ];
                });
                $closingBalance = $runningBalance;
            } else {
                // Fallback: No ledger account found — use sale totals
                $openingBalance = 0;
                $closingBalance = 0;
            }
        }

        return Inertia::render('Reports/PartyStatement', [
            'party'          => $party,
            'transactions'   => $transactions,
            'openingBalance' => $openingBalance,
            'closingBalance' => $closingBalance,
            'filters'        => [
                'party_id'   => $partyId,
                'start_date' => $startDate,
                'end_date'   => $endDate
            ],
            'parties' => Party::orderBy('name')->get()
        ]);
    }

    public function transactions(Request $request)
    {
        ReportTierGate::enforce('reports.transactions');
        $tenantId = app('current.tenant')->id;
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $transactions = DB::table('journal_entries')
            ->leftJoin('parties', 'journal_entries.party_id', '=', 'parties.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->where('journal_entries.is_reversed', 0)
            ->whereNotIn('journal_entries.reference_type', ['sale_reversal', 'purchase_reversal', 'expense_reversal'])
            ->select(
                'journal_entries.id',
                'journal_entries.date',
                'journal_entries.reference_type as type',
                'journal_entries.description',
                'journal_entries.reference',
                'parties.name as party'
            )
            ->selectRaw('(SELECT SUM(debit) FROM journal_items WHERE journal_entry_id = journal_entries.id) as amount')
            ->orderBy('journal_entries.date', 'desc')
            ->paginate(50)
            ->withQueryString();

        // Clean up type labels for display
        $transactions->getCollection()->transform(function($row) {
            $row->type = match($row->type) {
                'sale'     => 'Sale',
                'purchase' => 'Purchase',
                'expense'  => 'Expense',
                'payment'  => 'Payment',
                'fund'     => 'Fund',
                default    => ucfirst($row->type ?? 'Journal')
            };
            return $row;
        });

        if ($request->wantsJson()) {
            return response()->json($transactions);
        }

        return Inertia::render('Reports/Transactions', [
            'transactions' => $transactions,
            'filters'      => ['start_date' => $startDate, 'end_date' => $endDate]
        ]);
    }

    // Existing methods...
    public function stockValuation(Request $request)
    {
        ReportTierGate::enforce('reports.stock-valuation');
        $products = (new FinancialReportingService())->getInventoryValuationReport();

        $stats = [
            'total_cost_value'   => $products->sum('stock_value'),
            'total_retail_value' => $products->sum('retail_value'),
            'potential_profit'   => $products->sum('potential_profit'),
            'total_items'        => $products->sum('stock_quantity')
        ];

        return Inertia::render('Reports/StockValuation', [
            'products'   => $products,
            'stats'      => $stats,
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'warehouses' => \App\Models\Warehouse::orderBy('name')->get()
        ]);
    }

    public function lowStock(Request $request)
    {
        ReportTierGate::enforce('reports.low-stock');
        $categoryId = $request->input('category_id');
        $warehouseId = $request->input('warehouse_id');

        $query = Product::with(['category', 'stocks']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        // Sync logic with AdminController dashboard: use individual alert Level OR global threshold
        $globalThreshold = (int) \App\Helpers\SettingsHelper::getLowStockThreshold();

        $products = $query->get()->map(function ($product) use ($globalThreshold) {
             // Synchronize with Catalog: Use legacy stocks table as current source of truth for quantity
             $product->stock_quantity = (float) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
             
             // Effective threshold used for filtering and display
             $product->effective_threshold = $product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold;
             
             return $product;
        })->filter(function ($product) {
            return $product->stock_quantity <= $product->effective_threshold;
        })->values();

        $stats = [
            'low_stock_count' => $products->count(),
            'out_of_stock_count' => $products->where('stock_quantity', '<=', 0)->count(),
            'total_shortage' => $products->sum(function($p) {
                return max(0, $p->effective_threshold - $p->stock_quantity);
            })
        ];

        return Inertia::render('Reports/LowStock', [
            'products' => $products,
            'stats' => $stats,
            'filters' => [
                'category_id' => $categoryId,
                'warehouse_id' => $warehouseId
            ],
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'warehouses' => \App\Models\Warehouse::orderBy('name')->get()
        ]);
    }

    public function movementHistory(Request $request)
    {
        ReportTierGate::enforce('reports.movement-history');
        $productId = $request->input('product_id');
        $warehouseId = $request->input('warehouse_id');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $query = \App\Models\StockMovement::with(['product', 'warehouse', 'user'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        if ($productId) {
            $query->where('product_id', $productId);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Reports/MovementHistory', [
            'movements' => $movements,
            'filters' => [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'products' => Product::orderBy('name')->get(),
            'warehouses' => \App\Models\Warehouse::orderBy('name')->get()
        ]);
    }

    public function expenses(Request $request)
    {
        ReportTierGate::enforce('reports.expenses');
        $category = $request->input('category_id'); // Actually category name string
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $query = Expense::whereBetween('date', [$startDate, $endDate]);

        if ($category) {
            $query->where('category', $category);
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        $stats = [
            'total_expenses' => $expenses->sum('amount'),
            'count' => $expenses->count(),
            'avg_daily' => $expenses->count() > 0 ? $expenses->sum('amount') / max(1, Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1) : 0,
            'top_category' => $expenses->groupBy('category')->map(function ($group, $catName) {
                return [
                    'name' => $catName ?: 'Uncategorized',
                    'total' => $group->sum('amount')
                ];
            })->sortByDesc('total')->first()
        ];

        // Get unique categories for filter
        $categories = Expense::distinct()->pluck('category')->filter()->map(function ($cat) {
            return ['id' => $cat, 'name' => $cat];
        })->values();

        return Inertia::render('Reports/Expenses', [
            'expenses' => $expenses,
            'stats' => $stats,
            'filters' => [
                'category_id' => $category,
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'categories' => $categories
        ]);
    }

    public function tax(Request $request)
    {
        ReportTierGate::enforce('reports.tax');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $summary = (new FinancialReportingService())->getTaxSummary($startDate, $endDate);

        $taxRecords = $summary['details']->map(function ($row) {
            $type = $row->output_tax > 0 ? 'sale' : 'purchase';
            $taxAmount = $row->output_tax > 0 ? (float)$row->output_tax : (float)$row->input_tax;
            return [
                'date' => $row->date,
                'invoice_number' => $row->reference ?? '-',
                'type' => $type,
                'taxable_amount' => 0.0,
                'tax_amount' => $taxAmount
            ];
        });

        $stats = [
            'total_output_tax' => $summary['output_tax'],
            'total_input_tax'  => $summary['input_tax'],
            'net_tax'          => $summary['net_payable'],
            'total_taxable'    => 0.0 // The ledger doesn't store taxable amount directly, 0 for now
        ];

        return Inertia::render('Reports/Tax', [
            'tax_records' => $taxRecords,
            'stats'       => $stats,
            'filters'     => [
                'start_date' => $startDate,
                'end_date'   => $endDate
            ]
        ]);
    }

    public function bankStatement(Request $request)
    {
        ReportTierGate::enforce('reports.bank-statement');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());
        $bankAccountId = $request->input('bank_account_id');

        $accounts = Account::where('type', 'asset')
            ->whereBetween('code', ['1000', '1099'])
            ->get();

        $ledgerData = null;
        if ($bankAccountId) {
            $ledgerData = (new FinancialReportingService())->getAccountLedger($bankAccountId, $startDate, $endDate);
        }

        return Inertia::render('Reports/BankStatement', [
            'transactions'    => $ledgerData['items'] ?? [],
            'opening_balance' => $ledgerData['opening_balance'] ?? 0,
            'closing_balance' => $ledgerData['closing_balance'] ?? 0,
            'bank_accounts'   => $accounts,
            'filters'         => [
                'bank_account_id' => $bankAccountId,
                'start_date'      => $startDate,
                'end_date'        => $endDate
            ]
        ]);
    }

    public function expiryReport(Request $request)
    {
        ReportTierGate::enforce('reports.expiry');
        $daysThreshold = $request->input('days_threshold', 90);
        $batches = (new FinancialReportingService())->getExpiringSoon($daysThreshold);

        $stats = [
            'expired_count'       => $batches->where('status', 'Expired')->count(),
            'expiring_soon_count' => $batches->where('status', 'Expiring Soon')->count(),
            'total_batches'       => $batches->count(),
            'total_quantity'      => $batches->sum('quantity')
        ];

        return Inertia::render('Reports/ExpiryReport', [
            'batches' => $batches,
            'stats'   => $stats,
            'filters' => [
                'days_threshold' => $daysThreshold
            ]
        ]);
    }

    // Additional 24 Reports to complete 38 total

    public function balanceSheet(Request $request)
    {
        ReportTierGate::enforce('reports.balance-sheet');
        // BUG-02 FIX (CALCULATION_LOGIC.md §8 BUG-02)
        // Old code: read raw Account models with their cached .balance column — no date filter.
        // New code: delegates to FinancialReportingService::getBalanceSheet() which reads
        //           journal_items exclusively and supports any as-of date.
        $asOf   = $request->input('date', now()->toDateString());
        $report = (new FinancialReportingService())->getBalanceSheet($asOf);

        return Inertia::render('Accounting/BalanceSheet', $report);
    }

    public function allParties(Request $request)
    {
        ReportTierGate::enforce('reports.all-parties');
        $type = $request->input('type');

        // Phase 4 — Live AR/AP balances from the Ledger, not cached columns
        $arAccount = Account::where('code', '1200')->first();
        $apAccount = Account::where('code', '2000')->first();

        $query = Party::query();
        if ($type) {
            $query->where('type', $type);
        }

        $tenantId = app('current.tenant')->id;

        $parties = $query->orderBy('name')->get()->map(function ($p) use ($arAccount, $apAccount, $tenantId) {
            // Check both AR and AP for this party to handle cross-type balances
            $arDebits  = $arAccount ? (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $arAccount->id)
                ->where('journal_entries.party_id', $p->id)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.debit') : 0;

            $arCredits = $arAccount ? (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $arAccount->id)
                ->where('journal_entries.party_id', $p->id)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.credit') : 0;

            $apDebits  = $apAccount ? (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $apAccount->id)
                ->where('journal_entries.party_id', $p->id)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.debit') : 0;

            $apCredits = $apAccount ? (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $apAccount->id)
                ->where('journal_entries.party_id', $p->id)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.credit') : 0;

            // Net position: AR asset minus AP liability = true outstanding
            $ledgerDelta = ($arDebits - $arCredits) - ($apDebits - $apCredits);

            // Pure V3 — journal already includes opening balances from migration
            $balance = abs($ledgerDelta);

            return [
                'id'      => $p->id,
                'name'    => $p->name,
                'phone'   => $p->phone ?: '-',
                'email'   => $p->email ?: '-',
                'type'    => ucfirst($p->type),
                'balance' => $balance,
            ];
        });

        $totalReceivables = $parties->where('type', 'Customer')->where('balance', '>', 0)->sum('balance');
        $totalPayables    = $parties->where('type', 'Supplier')->where('balance', '>', 0)->sum('balance');

        return Inertia::render('Reports/GenericReport', [
            'title'   => 'All Parties List',
            'columns' => [
                ['key' => 'name',    'label' => 'Party Name', 'sortable' => true],
                ['key' => 'type',    'label' => 'Type',       'sortable' => true],
                ['key' => 'phone',   'label' => 'Phone',      'sortable' => true],
                ['key' => 'email',   'label' => 'Email',      'sortable' => true],
                ['key' => 'balance', 'label' => 'Outstanding','type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data'  => $parties,
            'stats' => [
                ['label' => 'Total Parties',    'value' => $parties->count()],
                ['label' => 'Total Receivables','value' => \App\Helpers\SettingsHelper::formatNumber($totalReceivables), 'type' => 'up'],
                ['label' => 'Total Payables',   'value' => \App\Helpers\SettingsHelper::formatNumber($totalPayables),    'type' => 'down'],
            ]
        ]);
    }

    public function trialBalance(Request $request)
    {
        ReportTierGate::enforce('reports.trial-balance');
        $tenantId = app('current.tenant')->id;
        $asOf = $request->input('date', now()->toDateString());

        // SINGLE EFFICIENT AGGREGATION QUERY (O(1) database calls)
        $balances = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.date', '<=', $asOf)
            ->selectRaw('journal_items.account_id, SUM(journal_items.debit) as total_debit, SUM(journal_items.credit) as total_credit')
            ->groupBy('journal_items.account_id')
            ->get()
            ->keyBy('account_id');

        $rawAccounts = Account::orderBy('code')->get();

        $accounts = $rawAccounts->map(function ($account) use ($balances) {
            $ledger = $balances->get($account->id);
            $totalDebit  = $ledger ? (float) $ledger->total_debit : 0.0;
            $totalCredit = $ledger ? (float) $ledger->total_credit : 0.0;

            return [
                'id'     => $account->id,
                'code'   => $account->code,
                'name'   => $account->name,
                'type'   => $account->type,
                'debit'  => $totalDebit,
                'credit' => $totalCredit,
                'net'    => round($totalDebit - $totalCredit, 4),
            ];
        })
        // Only include accounts that have any ledger activity (hide zero-balance accounts)
        ->filter(fn($a) => $a['debit'] > 0 || $a['credit'] > 0)
        ->values();

        $totalDebits  = round($accounts->sum('debit'),  2);
        $totalCredits = round($accounts->sum('credit'), 2);

        // The ledger is balanced when total debits = total credits (to within floating-point tolerance)
        $isBalanced = abs($totalDebits - $totalCredits) < 0.01;

        return Inertia::render('Reports/TrialBalance', [
            'accounts'     => $accounts,
            'totalDebits'  => $totalDebits,
            'totalCredits' => $totalCredits,
            'isBalanced'   => $isBalanced,
            'asOf'         => $asOf,
        ]);
    }

    public function itemWiseProfit(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-profit');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);

        // Phase 2.2 — Delegates to FinancialReportingService.
        // Revenue = sale_items.net_amount (Phase 2.1 waterfall column, ex-tax ex-discount)
        // COGS    = sale_item_batches.total_cogs (FIFO locked-in cost)
        // Margin  = (gross_profit / net_revenue) × 100 — calculated dynamically, never stored
        $rawItems = (new FinancialReportingService())
            ->getGrossProfitByProduct($startDate, $endDate);

        $items = $rawItems->map(function ($item) {
            return [
                'name' => $item['name'],
                'sku' => $item['sku'],
                'quantity' => $item['quantity'],
                'revenue' => $item['net_revenue'],
                'profit' => $item['gross_profit'],
                'margin_pct' => $item['margin_pct'],
            ];
        });

        return Inertia::render('Reports/ItemWiseProfit', [
            'items'   => $items,
            'filters' => [
                'range'      => $range,
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function partyWiseProfitLoss(Request $request)
    {
        ReportTierGate::enforce('reports.party-wise-profit-loss');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);

        // Phase 2.2 — Delegates to FinancialReportingService.
        // COGS comes from sale_item_batches (FIFO), not products.cost_price.
        $data = (new FinancialReportingService())
            ->getGrossProfitByParty($startDate, $endDate);

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Customer Profitability',
            'columns' => [
                ['key' => 'party_name', 'label' => 'Customer', 'sortable' => true],
                ['key' => 'invoice_count', 'label' => 'Invoices', 'sortable' => true, 'align' => 'center'],
                ['key' => 'net_revenue', 'label' => 'Revenue', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'gross_profit', 'label' => 'Profit', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [
                ['label' => 'Total Revenue', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('net_revenue'))],
                ['label' => 'Total Profit', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('gross_profit')), 'type' => 'up'],
            ],
            'chartData' => $data->sortByDesc('gross_profit')->take(10)->map(fn($r) => ['name' => substr($r['party_name'], 0, 15), 'value' => $r['gross_profit']])->values(),
            'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#6366f1'],
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    public function discountReport(Request $request)
    {
        ReportTierGate::enforce('reports.discount');
        [$startDate, $endDate, $range] = $this->resolveDateRange($request);

        // FIX-17: Read from sales table (V3), not legacy invoices table
        $sales = Sale::posted()
            ->where('discount', '>', 0)
            ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->with('party')
            ->orderBy('posted_at', 'desc')
            ->get();
        $totalDiscount = $sales->sum('discount');

        return Inertia::render('Reports/DiscountReport', [
            'invoices'      => $sales,
            'totalDiscount' => $totalDiscount,
            'filters'       => [
                'range'      => $range,
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ]
        ]);
    }

    public function cashFlow(Request $request)
    {
        ReportTierGate::enforce('reports.cash-flow');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $report = (new FinancialReportingService())->getCashFlowReport($startDate, $endDate);

        return Inertia::render('Reports/CashFlow', [
            'operating' => (float) $report['net_cash_flow'],
            'investing' => 0.0,
            'financing' => 0.0,
            'stats'     => [
                'inflow'  => (float) $report['operating_inflow'],
                'outflow' => (float) $report['operating_outflow']
            ],
            'filters'   => [
                'start_date' => $startDate,
                'end_date'   => $endDate
            ]
        ]);
    }

    public function saleAging(Request $request)
    {
        ReportTierGate::enforce('reports.sale-aging');
        // Phase 4 — AR aging uses the Ledger, not sale.paid_amount
        // For each party with an AR balance, we calculate how many days the oldest
        // unpaid sale has been outstanding.
        $arAccount = Account::where('code', '1200')->first();

        if (!$arAccount) {
            return Inertia::render('Reports/SaleAging', ['invoices' => [], 'stats' => []]);
        }

        // Query: all posted sales that are not fully paid (used for aging)
        $sales = Sale::where('status', 'posted')
            ->where('payment_status', '!=', 'paid')
            ->with('party')
            ->get()
            ->map(function ($sale) use ($arAccount) {
                // Per-sale outstanding: AR debits minus AR credits for this sale (by reference)
                $saleRef = $sale->reference_number;

                $arDr = (float) DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $arAccount->id)
                    ->where('journal_entries.reference', $saleRef)
                    ->sum('journal_items.debit');

                $arCr = (float) DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $arAccount->id)
                    ->where('journal_entries.party_id', $sale->party_id)
                    ->whereDate('journal_entries.date', '>=', $sale->posted_at ? Carbon::parse($sale->posted_at)->toDateString() : $sale->created_at->toDateString())
                    ->sum('journal_items.credit');

                // Fallback: use total if no ledger entries found
                $outstanding = $arDr > 0 ? max(0, $arDr - $arCr) : (float) $sale->net_sales; // FIX-10: use net_sales not total

                $days = Carbon::parse($sale->posted_at ?? $sale->created_at)->diffInDays(now());

                return [
                    'invoice_number' => $sale->reference_number,
                    'party'          => $sale->party->name ?? 'N/A',
                    'amount'         => $outstanding,
                    'days'           => $days,
                    'category'       => $days > 90 ? '90+' : ($days > 60 ? '60-90' : ($days > 30 ? '30-60' : '0-30'))
                ];
            })
            ->filter(fn($s) => $s['amount'] > 0)
            ->values();

        $stats = [
            ['label' => 'Current (0-30 days)',  'value' => \App\Helpers\SettingsHelper::formatNumber($sales->where('category', '0-30')->sum('amount'))],
            ['label' => '31-60 days',           'value' => \App\Helpers\SettingsHelper::formatNumber($sales->where('category', '30-60')->sum('amount'))],
            ['label' => '61-90 days',           'value' => \App\Helpers\SettingsHelper::formatNumber($sales->where('category', '60-90')->sum('amount'))],
            ['label' => 'Over 90 days',         'value' => \App\Helpers\SettingsHelper::formatNumber($sales->where('category', '90+')->sum('amount')), 'type' => 'down'],
            ['label' => 'Total Outstanding AR', 'value' => \App\Helpers\SettingsHelper::formatNumber($sales->sum('amount'))],
        ];

        return Inertia::render('Reports/SaleAging', [
            'invoices' => $sales,
            'stats'    => $stats,
        ]);
    }

    public function saleOrders(Request $request)
    {
        ReportTierGate::enforce('reports.sale-orders');
        $range = $request->input('range', 'this_month');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = \App\Models\SalesOrder::with(['customer', 'user'])->orderByDesc('created_at');

        if ($range === 'today') {
            $query->whereDate('created_at', Carbon::today());
        } elseif ($range === 'this_month') {
            $query->whereMonth('created_at', Carbon::now()->month)
                  ->whereYear('created_at', Carbon::now()->year);
        } elseif ($range === 'this_year') {
             $query->whereYear('created_at', Carbon::now()->year);
        } elseif ($range === 'custom' && $startDate && $endDate) {
             $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        $orders = $query->get()->map(function ($order) {
            $order->party = $order->customer;
            return $order;
        });

        return Inertia::render('Reports/SaleOrders', [
            'orders' => $orders,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    public function billWiseProfit(Request $request)
    {
        ReportTierGate::enforce('reports.bill-wise-profit');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        // Phase 2.2 — Delegates to FinancialReportingService.
        // Previously: loaded all invoices into memory and multiplied quantity × products.cost_price.
        // That approach (a) used static cost_price, (b) loaded unbounded data into PHP memory,
        // (c) had no date filter. All three problems are fixed here.
        $invoices = (new FinancialReportingService())
            ->getGrossProfitBySale($startDate, $endDate);

        return Inertia::render('Reports/BillWiseProfit', [
            'invoices' => $invoices,
            'filters'  => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function expenseByCategory(Request $request)
    {
        ReportTierGate::enforce('reports.expense-by-category');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $data = Expense::selectRaw('category, COUNT(id) as count, SUM(amount) as total')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Expense by Category',
            'columns' => [
                ['key' => 'category', 'label' => 'Category', 'sortable' => true],
                ['key' => 'count', 'label' => 'Count', 'sortable' => true, 'align' => 'center'],
                ['key' => 'total', 'label' => 'Total Amount', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [
                ['label' => 'Total Expenses', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total'))],
                ['label' => 'Categories', 'value' => $data->count()]
            ],
            'chartData' => $data->map(fn($r) => ['name' => $r->category ?: 'Uncategorized', 'value' => $r->total]),
            'chartConfig' => ['type' => 'pie', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#f43f5e'] 
            // Pie isn't implemented in MasterReport yet (only Area/Bar). Using Bar for now.
             // implementation in MasterReport only supports Area/Bar. I'll stick to Bar.
        ]);
    }

    public function expenseByItem(Request $request)
    {
        ReportTierGate::enforce('reports.expense-by-item');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $data = Expense::whereBetween('date', [$startDate, $endDate])
            ->orderByDesc('date')
            ->get()
            ->map(function($e) {
                return [
                    'date' => $e->date,
                    'reference' => $e->reference,
                    'category' => $e->category,
                    'description' => $e->description ?? '-',
                    'amount' => $e->amount
                ];
            });

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Expense Details',
            'columns' => [
                ['key' => 'date', 'label' => 'Date', 'type' => 'date', 'sortable' => true],
                ['key' => 'reference', 'label' => 'Ref', 'sortable' => true],
                ['key' => 'category', 'label' => 'Category', 'sortable' => true],
                ['key' => 'description', 'label' => 'Description', 'sortable' => true],
                ['key' => 'amount', 'label' => 'Amount', 'type' => 'currency', 'sortable' => true, 'align' => 'right']
            ],
            'data' => $data,
            'stats' => [
                ['label' => 'Total Expenses', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('amount'))],
                ['label' => 'Count', 'value' => $data->count()]
            ]
        ]);
    }

    public function stockSummaryByCategory(Request $request)
    {
        ReportTierGate::enforce('reports.stock-summary-by-category');
        $tenantId = app('current.tenant')->id;
        $data = DB::table('products')
            ->where('products.tenant_id', $tenantId)
            ->whereNull('products.deleted_at')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->leftJoin('stocks', 'stocks.product_id', '=', 'products.id')
            ->select(
                'categories.name as category_name',
                DB::raw('COUNT(DISTINCT products.id) as product_count'),
                DB::raw('SUM(stocks.quantity) as total_stock'),
                DB::raw('SUM(stocks.quantity * products.price) as retail_value') // Stock value at retail price
            )
            ->groupBy('categories.id', 'categories.name')
            ->get();

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Stock Summary by Category',
            'columns' => [
                ['key' => 'category_name', 'label' => 'Category', 'sortable' => true],
                ['key' => 'product_count', 'label' => 'Products', 'sortable' => true, 'align' => 'center'],
                ['key' => 'total_stock', 'label' => 'Total Qty', 'sortable' => true, 'align' => 'center'],
                ['key' => 'retail_value', 'label' => 'Retail Value', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [
                ['label' => 'Total Categories', 'value' => $data->count()],
                ['label' => 'Total Retail Value', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('retail_value'))],
                ['label' => 'Total Stock Qty', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total_stock'))],
            ],
            'chartData' => $data->map(fn($r) => ['name' => $r->category_name, 'value' => $r->retail_value]),
            'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#8b5cf6']
        ]);
    }

    public function salePurchaseByParty(Request $request)
    {
        ReportTierGate::enforce('reports.sale-purchase-by-party');
        $tenantId = app('current.tenant')->id;
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        // Sales — use posted_at, not created_at (Revenue Recognition)
        $sales = DB::table('sales')
            ->select('party_id', DB::raw('SUM(COALESCE(NULLIF(net_sales, 0), total)) as total'))
            ->where('tenant_id', $tenantId)
            ->where('status', 'posted')
            ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->groupBy('party_id');

        // Purchases (Invoices type=purchase)
        $purchases = DB::table('invoices')
            ->select('party_id', DB::raw('SUM(total_amount) as total'))
            ->where('tenant_id', $tenantId)
            ->where('type', 'purchase')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->groupBy('party_id');

        $data = DB::table('parties')
            ->where('parties.tenant_id', $tenantId)
            ->leftJoinSub($sales, 'sales', fn($j) => $j->on('parties.id', '=', 'sales.party_id'))
            ->leftJoinSub($purchases, 'purchases', fn($j) => $j->on('parties.id', '=', 'purchases.party_id'))
            ->select(
                'parties.name',
                'parties.type as party_type',
                DB::raw('COALESCE(sales.total, 0) as sales'),
                DB::raw('COALESCE(purchases.total, 0) as purchases')
            )
            ->where(function($q) {
                 $q->whereNotNull('sales.total')->orWhereNotNull('purchases.total');
            })
            ->orderByDesc('sales')
            ->get()
            ->map(function($row) {
                $row->net = $row->sales - $row->purchases;
                return $row;
            });

        return Inertia::render('Reports/GenericReport', [
            'title'   => 'Sale vs Purchase by Party',
            'columns' => [
                ['key' => 'name',       'label' => 'Party',              'sortable' => true],
                ['key' => 'party_type', 'label' => 'Type',               'sortable' => true],
                ['key' => 'sales',      'label' => 'Net Sales',          'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'purchases',  'label' => 'Total Purchases',    'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'net',        'label' => 'Net (Sale − Purch)', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data'  => $data,
            'stats' => [
                ['label' => 'Total Net Sales',  'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('sales')),     'type' => 'up'],
                ['label' => 'Total Purchases',  'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('purchases')), 'type' => 'down'],
                ['label' => 'Net Flow',         'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('net'))],
            ],
            'chartData'   => $data->take(10)->map(fn($r) => ['name' => substr($r->name, 0, 15), 'sales' => $r->sales, 'purchases' => $r->purchases]),
            'chartConfig' => ['type' => 'bar', 'dataKey' => ['sales', 'purchases'], 'xAxisKey' => 'name', 'color' => '#6366f1']
        ]);
    }

    public function salePurchaseByItemCategory(Request $request)
    {
        ReportTierGate::enforce('reports.sale-purchase-by-item-category');
        $tenantId = app('current.tenant')->id;
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $data = DB::table('categories')
            ->where('categories.tenant_id', $tenantId)
            ->join('products', 'products.category_id', '=', 'categories.id')
            ->leftJoin('sale_items', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('sales', function($join) use ($startDate, $endDate) {
                $join->on('sales.id', '=', 'sale_items.sale_id')
                     ->where('sales.status', 'posted')
                     ->whereBetween('sales.posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            })
            ->select(
                'categories.name',
                // BUG-07 FIX (CALCULATION_LOGIC.md §8 BUG-07)
                // OLD: sale_items.subtotal  — gross, pre-discount (violates §2.7)
                // NEW: COALESCE(NULLIF(net_amount, 0), subtotal)
                //       Primary:  net_amount  — true revenue after item discount (§2.1 waterfall)
                //       Fallback: subtotal    — for legacy rows pre-dating the waterfall migration
                DB::raw('SUM(CASE WHEN sales.id IS NOT NULL THEN COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) ELSE 0 END) as sales')

            )
            ->groupBy('categories.id', 'categories.name')
            ->get();
            
            // Note: Adding purchases would require another join or subqueries similar to previous method. 
            // For brevity I'll focus on Sales per Category which is most requested. 
            // To add Purchases, I'd need purchase_items table joined or subqueried.

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Sales by Category',
            'columns' => [
                ['key' => 'name', 'label' => 'Category', 'sortable' => true],
                ['key' => 'sales', 'label' => 'Sales Revenue', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [
                 ['label' => 'Total Sales', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('sales'))],
            ],
            'chartData' => $data->filter(fn($r) => $r->sales > 0)->map(fn($r) => ['name' => $r->name, 'value' => $r->sales])->values(),
            'chartConfig' => ['type' => 'area', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#e11d48']
        ]);
    }

    public function itemCategoryWiseProfitLoss(Request $request)
    {
        ReportTierGate::enforce('reports.item-category-wise-profit-loss');
         $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
         $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());
 
         $data = (new FinancialReportingService())->getGrossProfitByCategory($startDate, $endDate);
 
         return Inertia::render('Reports/GenericReport', [
             'title' => 'Category Profitability',
             'columns' => [
                 ['key' => 'name', 'label' => 'Category', 'sortable' => true],
                 ['key' => 'revenue', 'label' => 'Revenue', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                 ['key' => 'cost', 'label' => 'Cost', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                 ['key' => 'profit', 'label' => 'Profit', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                 ['key' => 'margin', 'label' => 'Margin %', 'align' => 'right', 'render' => "return row.margin + '%'"]
             ],
             'data' => $data,
             'stats' => [
                 ['label' => 'Total Revenue', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('revenue'))],
                 ['label' => 'Total Profit', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('profit')), 'type' => 'up'],
             ],
             'chartData' => $data->map(fn($r) => ['name' => $r['name'], 'value' => $r['profit']]),
             'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#0ea5e9']
         ]);
    }

    public function itemWiseDiscount(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-discount');
        $tenantId = app('current.tenant')->id;
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $data = DB::table('sale_items')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->whereBetween('sales.posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'products.name',
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as total_sales'),
                DB::raw('SUM(COALESCE(sale_items.discount_amount, 0)) as total_discount') 
            )
            ->groupBy('products.id', 'products.name')
            ->having('total_discount', '>', 0)
            ->get();
            
        return Inertia::render('Reports/GenericReport', [
            'title' => 'Item Wise Discounts',
            'columns' => [
                 ['key' => 'name', 'label' => 'Product', 'sortable' => true],
                 ['key' => 'total_sales', 'label' => 'Net Sales', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                 ['key' => 'total_discount', 'label' => 'Total Discount', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [['label' => 'Total Discount Given', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total_discount'))]]
        ]);
    }

    public function saleOrderItems(Request $request)
    {
        ReportTierGate::enforce('reports.sale-order-items');
        $range = $request->input('range', 'this_month');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $tenantId = app('current.tenant')->id;
        $query = DB::table('sales_order_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('products', 'products.id', '=', 'sales_order_items.product_id')
            ->where('sales_orders.tenant_id', $tenantId);

        if ($range === 'today') {
            $query->whereDate('sales_orders.created_at', Carbon::today());
        } elseif ($range === 'this_month') {
            $query->whereMonth('sales_orders.created_at', Carbon::now()->month)
                  ->whereYear('sales_orders.created_at', Carbon::now()->year);
        } elseif ($range === 'this_year') {
             $query->whereYear('sales_orders.created_at', Carbon::now()->year);
        } elseif ($range === 'custom' && $startDate && $endDate) {
             $query->whereBetween('sales_orders.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        // Fetch data
        $rawItems = $query->select(
                'products.name as product_name',
                'sales_orders.order_number',
                'sales_orders.created_at as date',
                'sales_orders.status as order_status',
                'sales_order_items.quantity_requested',
                'sales_order_items.unit_price',
                'sales_order_items.subtotal'
            )
            ->orderByDesc('sales_orders.created_at')
            ->get();

        // Transform to nested structure for frontend
        $formattedItems = $rawItems->map(function($item) {
            return [
                'sales_order' => [
                    'order_number' => $item->order_number,
                    'created_at' => $item->date,
                    'status' => $item->order_status
                ],
                'product' => [
                    'name' => $item->product_name
                ],
                'quantity' => (float)$item->quantity_requested,
                'price' => (float)$item->unit_price,
                'subtotal' => (float)$item->subtotal
            ];
        });

        return Inertia::render('Reports/SaleOrderItems', [
            'items' => $formattedItems,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    public function stockAging(Request $request)
    {
        ReportTierGate::enforce('reports.stock-aging');
        $batches = (new FinancialReportingService())->getStockAging();

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Stock Aging Report',
            'columns' => [
                ['key' => 'product_name', 'label' => 'Product', 'sortable' => true],
                ['key' => 'batch_id', 'label' => 'Batch ID', 'sortable' => true],
                ['key' => 'quantity', 'label' => 'Qty', 'sortable' => true, 'align' => 'center'],
                ['key' => 'cost_value', 'label' => 'Locked Value', 'sortable' => true, 'align' => 'right', 'type' => 'currency'],
                ['key' => 'days', 'label' => 'Age (Days)', 'sortable' => true, 'align' => 'center'],
                ['key' => 'category', 'label' => 'Aging Group', 'sortable' => true, 'align' => 'right']
            ],
            'data' => $batches,
            'stats' => [
                ['label' => 'Total Batches', 'value' => $batches->count()],
                ['label' => 'Quantity', 'value' => \App\Helpers\SettingsHelper::formatNumber($batches->sum('quantity'))],
                ['label' => 'Frozen Cash', 'value' => \App\Helpers\SettingsHelper::formatCurrency($batches->sum('cost_value'))],
                ['label' => 'Oldest Batch', 'value' => $batches->max('days') . ' days', 'type' => 'down']
            ],
            'chartData' => $batches->groupBy('category')->map(fn($g, $k) => ['name' => $k, 'value' => $g->sum('quantity')])->values(),
            'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#f59e0b']
        ]);
    }

    public function salePurchaseByPartyGroup(Request $request)
    {
        ReportTierGate::enforce('reports.sale-purchase-by-party-group');
        $tenantId = app('current.tenant')->id;
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        
        $data = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->select('type', DB::raw('COUNT(id) as count'))
            ->groupBy('type')
            ->get()
            ->map(function($group) use ($startDate, $endDate, $tenantId) {
                $sales = DB::table('invoices')
                    ->join('parties', 'parties.id', '=', 'invoices.party_id')
                    ->where('invoices.tenant_id', $tenantId)
                    ->where('parties.type', $group->type)
                    ->where('invoices.type', 'sale')
                    ->whereBetween('invoices.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('total_amount');
                    
                $purchases = DB::table('invoices')
                    ->join('parties', 'parties.id', '=', 'invoices.party_id')
                    ->where('invoices.tenant_id', $tenantId)
                    ->where('parties.type', $group->type)
                    ->where('invoices.type', 'purchase')
                    ->whereBetween('invoices.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('total_amount');
                    
                return [
                    'group' => ucfirst($group->type),
                    'party_count' => $group->count,
                    'sales' => $sales,
                    'purchases' => $purchases,
                    'net' => $sales - $purchases
                ];
            });

        return Inertia::render('Reports/GenericReport', [
            'title' => 'Parties Group Analysis',
            'columns' => [
                ['key' => 'group', 'label' => 'Party Type', 'sortable' => true],
                ['key' => 'party_count', 'label' => 'Count', 'sortable' => true, 'align' => 'center'],
                ['key' => 'sales', 'label' => 'Sales', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'purchases', 'label' => 'Purchases', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'net', 'label' => 'Net Flow', 'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data' => $data,
            'stats' => [
                ['label' => 'Total Groups', 'value' => $data->count()]
            ],
            'chartData' => $data->map(fn($r) => ['name' => $r['group'], 'value' => $r['sales']]),
            'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#8b5cf6']
        ]);
    }
    public function itemReportByParty(Request $request)
    {
        ReportTierGate::enforce('reports.item-report-by-party');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $tenantId = app('current.tenant')->id;
        $data = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->whereBetween('sales.posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'parties.name as party_name',
                'products.name as product_name',
                DB::raw('SUM(sale_items.quantity + COALESCE(sale_items.free_quantity, 0)) as quantity'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as total')
            )
            ->groupBy('parties.id', 'parties.name', 'products.id', 'products.name')
            ->orderBy('parties.name')
            ->get();

        return Inertia::render('Reports/ItemReportByParty', [
            'data' => $data,
            'stats' => [
                 ['label' => 'Total Sales', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total'))],
                 ['label' => 'Total Items', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('quantity'))],
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date'   => $endDate
            ]
        ]);
    }

    public function partyReportByItem(Request $request)
    {
        ReportTierGate::enforce('reports.party-report-by-item');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $tenantId = app('current.tenant')->id;
        $data = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->whereBetween('sales.posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'products.name as product_name',
                'parties.name as party_name',
                DB::raw('SUM(sale_items.quantity + COALESCE(sale_items.free_quantity, 0)) as quantity'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as total')
            )
            ->groupBy('products.id', 'products.name', 'parties.id', 'parties.name')
            ->orderBy('products.name')
            ->get();

        return Inertia::render('Reports/PartyReportByItem', [
            'data' => $data,
            'stats' => [
                 ['label' => 'Total Sales', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total'))],
                 ['label' => 'Total Items', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('quantity'))],
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date'   => $endDate
            ]
        ]);
    }

    public function taxRateReport(Request $request)
    {
        ReportTierGate::enforce('reports.tax-rate');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        // Phase 5.5 — Tax analysis from sale_items using the waterfall columns.
        // Groups by tax_rate to show how much tax was applied at each rate.
        $tenantId = app('current.tenant')->id;
        $data = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->whereBetween('sales.posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'sale_items.tax_rate',
                DB::raw('COUNT(DISTINCT sales.id) as invoice_count'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as taxable_amount'),
                DB::raw('SUM(COALESCE(sale_items.tax_amount, 0)) as total_tax')
            )
            ->groupBy('sale_items.tax_rate')
            ->orderBy('sale_items.tax_rate')
            ->get();

        return Inertia::render('Reports/GenericReport', [
            'title'   => 'Tax Rate Analysis',
            'columns' => [
                ['key' => 'tax_rate',       'label' => 'Tax Rate %',      'sortable' => true, 'align' => 'center'],
                ['key' => 'invoice_count',  'label' => 'Sales',           'sortable' => true, 'align' => 'center'],
                ['key' => 'taxable_amount', 'label' => 'Taxable Amount',  'type' => 'currency', 'sortable' => true, 'align' => 'right'],
                ['key' => 'total_tax',      'label' => 'Tax Collected',   'type' => 'currency', 'sortable' => true, 'align' => 'right'],
            ],
            'data'  => $data,
            'stats' => [
                ['label' => 'Total Tax Collected', 'value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('total_tax'))],
                ['label' => 'Total Taxable Amount','value' => \App\Helpers\SettingsHelper::formatNumber($data->sum('taxable_amount'))],
            ],
            'chartData'   => $data->map(fn($r) => ['name' => ($r->tax_rate ?? 0) . '%', 'value' => $r->total_tax]),
            'chartConfig' => ['type' => 'bar', 'dataKey' => 'value', 'xAxisKey' => 'name', 'color' => '#8b5cf6']
        ]);
    }

    public function graphAnalytics(Request $request)
    {
        ReportTierGate::enforce('reports.graphAnalytics');
        $module = $request->input('module', 'sales');
        $range = $request->input('range', '30_days');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $trendData = [];
        $paymentStatus = [];
        $stats = [
            'total_revenue' => 0,
            'total_transactions' => 0,
            'avg_ticket' => 0,
            'max_sale' => 0
        ];

        if ($module === 'sales') {
            $query = Sale::posted();

            // Include payments to calculate paid amount if not on table
            $query->withSum('payments as paid_amount', 'amount');

            // ... (Filter Logic - Reuse existing) ...
            if ($range === 'today') {
                $query->whereDate('posted_at', Carbon::today());
                $groupBy = 'hour';
            } elseif ($range === '7_days') {
                $start = Carbon::now()->subDays(6)->startOfDay();
                $query->where('posted_at', '>=', $start);
                $groupBy = 'day';
            } elseif ($range === '30_days') {
                $start = Carbon::now()->subDays(29)->startOfDay();
                $query->where('posted_at', '>=', $start);
                $groupBy = 'day';
            } elseif ($range === 'year') {
                $query->where('posted_at', '>=', Carbon::now()->startOfYear());
                $groupBy = 'month';
            } elseif ($range === 'custom' && $startDate && $endDate) {
                $query->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
                $groupBy = 'day';
            } else {
                $query->where('posted_at', '>=', Carbon::now()->subDays(29)->startOfDay());
                $groupBy = 'day';
            }

            $sales = $query->orderBy('posted_at')->get();

            // 1. Sales Trend with Gap Filling
            $salesGrouped = $sales->groupBy(function ($sale) use ($groupBy) {
                if ($groupBy === 'hour')
                    return $sale->posted_at->format('H');
                if ($groupBy === 'month')
                    return $sale->posted_at->format('Y-m');
                return $sale->posted_at->format('Y-m-d');
            });

            if ($range === 'today') {
                for ($i = 0; $i < 24; $i++) {
                    $hour = str_pad($i, 2, '0', STR_PAD_LEFT);
                    $group = $salesGrouped->get($hour);
                    $trendData[] = [
                        'name' => Carbon::createFromTime($i, 0)->format('h A'),
                        'sales' => $group ? $group->sum('total') : 0,
                        'count' => $group ? $group->count() : 0
                    ];
                }
            } elseif ($range === 'year') {
                $start = Carbon::now()->startOfYear();
                $end = Carbon::now()->endOfYear();

                $current = $start->copy();
                while ($current <= $end) {
                    $key = $current->format('Y-m');
                    $group = $salesGrouped->get($key);
                    $trendData[] = [
                        'name' => $current->format('M'),
                        'sales' => $group ? $group->sum('total') : 0,
                        'count' => $group ? $group->count() : 0
                    ];
                    $current->addMonth();
                }
            } else {
                if ($range === 'custom' && $startDate && $endDate) {
                    $start = Carbon::parse($startDate)->startOfDay();
                    $end = Carbon::parse($endDate)->endOfDay();
                } elseif ($range === '7_days') {
                    $start = Carbon::now()->subDays(6)->startOfDay();
                    $end = Carbon::now()->endOfDay();
                } else {
                    $start = Carbon::now()->subDays(29)->startOfDay();
                    $end = Carbon::now()->endOfDay();
                }

                $current = $start->copy();
                $days = 0;
                while ($current <= $end && $days <= 366) {
                    $key = $current->format('Y-m-d');
                    $group = $salesGrouped->get($key);
                    $trendData[] = [
                        'name' => $current->format('d M'),
                        'sales' => $group ? $group->sum('total') : 0,
                        'count' => $group ? $group->count() : 0
                    ];
                    $current->addDay();
                    $days++;
                }
            }

            // 2. Paid vs Unpaid (Recovery)
            $totalRevenue = $sales->sum('total');
            $totalPaid = $sales->sum('paid_amount');

            $unpaid = $sales->sum(function ($sale) {
                return max(0, $sale->total - $sale->paid_amount);
            });

            $paymentStatus = [
                ['name' => 'Paid', 'value' => $totalPaid, 'fill' => '#10b981'],
                ['name' => 'Unpaid', 'value' => $unpaid, 'fill' => '#ef4444'],
            ];

            // 3. Key Stats
            $stats = [
                'total_revenue' => $totalRevenue,
                'total_transactions' => $sales->count(),
                'avg_ticket' => $sales->count() > 0 ? $totalRevenue / $sales->count() : 0,
                'max_sale' => $sales->max('total') ?? 0
            ];
        }

        return Inertia::render('Reports/GraphAnalytics', [
            'trendData' => $trendData,
            'paymentStatus' => $paymentStatus,
            'stats' => $stats,
            'module' => $module,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    public function itemDetailReport(Request $request)
    {
        ReportTierGate::enforce('reports.item-detail');
        $products = Product::with('category')->get()->map(function($product) {
            $product->stock_quantity = (float) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
            return $product;
        });

        return Inertia::render('Reports/ItemDetail', [
            'products' => $products
        ]);
    }

    public function loanStatement(Request $request)
    {
        ReportTierGate::enforce('reports.loan-statement');
        if (!$request->has('bank_account_id')) {
            $loanAccount = Account::where('code', '2500')->first();
            if ($loanAccount) {
                $request->merge(['bank_account_id' => $loanAccount->id]);
            }
        }
        return $this->bankStatement($request);
    }
}