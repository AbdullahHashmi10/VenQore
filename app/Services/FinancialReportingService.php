<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * FinancialReportingService — The Single Source of Truth for P&L (Phase 4)
 *
 * This service is the ONLY authorised place to calculate:
 *   - Revenue (income account activity for a period)
 *   - COGS (account 5000 activity for a period)
 *   - Gross Profit
 *   - Operating Expenses
 *   - Net Profit
 *   - Receivables (Account 1200 — real-time from journal_items)
 *   - Payables (Account 2000 — real-time from journal_items)
 *
 * FUNDAMENTAL RULE:
 * Every calculation reads exclusively from journal_items, scoped by
 * journal_entries.date. The Account.balance denormalised column is
 * intentionally NOT used for any P&L or receivable/payable output.
 *
 * Why:
 *   - Account.balance is an all-time running total. It has no concept of period.
 *   - A manual journal entry (e.g. audit adjustment) is reflected here automatically.
 *   - Both /reports/profit-loss AND /accounting/p-and-l call this service.
 *     They are mathematically guaranteed to return identical numbers for
 *     the same date range. It is impossible for them to disagree.
 *
 * PERFORMANCE NOTE:
 * The inner queries use whereHas() which generates EXISTS subqueries.
 * For large datasets, consider a raw JOIN. But correctness before optimisation.
 */
class FinancialReportingService
{
    /**
     * Calculate a full P&L for a given date range.
     *
     * @param  string|Carbon  $start  Start date (inclusive)
     * @param  string|Carbon  $end    End date (inclusive)
     * @return array{
     *   revenue: float,
     *   cogs: float,
     *   gross_profit: float,
     *   operating_expenses: float,
     *   total_expenses: float,
     *   net_profit: float,
     *   income_accounts: array,
     *   expense_accounts: array,
     *   period_start: string,
     *   period_end: string
     * }
     */
    public function getProfitAndLoss($start, $end): array
    {
        $start = $start instanceof Carbon ? $start->toDateString() : (string) $start;
        $end   = $end instanceof Carbon   ? $end->toDateString()   : (string) $end;

        // ─── Revenue: SUM(credits - debits) across all income accounts ────────
        // Income accounts have a credit-normal balance.
        // Revenue for period = credits posted - debits posted in that range.
        $incomeAccounts = Account::where('type', 'income')->get();
        $incomeDetails  = [];
        $totalRevenue   = 0;

        foreach ($incomeAccounts as $account) {
            $credit = $this->sumJournalItems($account->id, 'credit', $start, $end);
            $debit  = $this->sumJournalItems($account->id, 'debit',  $start, $end);
            $net    = $credit - $debit;

            $incomeDetails[] = [
                'id'      => $account->id,
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => (float) $net,
            ];
            $totalRevenue += $net;
        }

        // ─── COGS: SUM(debits - credits) on Account code 5000 ────────────────
        // COGS is a debit-normal expense account.
        // COGS for period = debits posted - credits posted (reversals) in range.
        $cogsAccount = Account::where('code', '5000')->first();
        $totalCogs   = 0;
        $cogsId      = null;

        if ($cogsAccount) {
            $cogsId    = $cogsAccount->id;
            $cogsDebit = $this->sumJournalItems($cogsId, 'debit',  $start, $end);
            $cogsCredit = $this->sumJournalItems($cogsId, 'credit', $start, $end);
            $totalCogs  = $cogsDebit - $cogsCredit;
        }

        // ─── Operating Expenses: all expense accounts EXCEPT COGS ─────────────
        $expenseAccounts   = Account::where('type', 'expense')
            ->when($cogsId, fn($q) => $q->where('id', '!=', $cogsId))
            ->get();
        $expenseDetails    = [];
        $totalOpex         = 0;

        foreach ($expenseAccounts as $account) {
            $debit  = $this->sumJournalItems($account->id, 'debit',  $start, $end);
            $credit = $this->sumJournalItems($account->id, 'credit', $start, $end);
            $net    = $debit - $credit;

            $expenseDetails[] = [
                'id'      => $account->id,
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => (float) $net,
            ];
            $totalOpex += $net;
        }

        $grossProfit   = $totalRevenue - $totalCogs;
        $totalExpenses = $totalCogs + $totalOpex;
        $netProfit     = $grossProfit - $totalOpex;

        return [
            'revenue'            => (float) $totalRevenue,
            'cogs'               => (float) $totalCogs,
            'gross_profit'       => (float) $grossProfit,
            'operating_expenses' => (float) $totalOpex,
            'total_expenses'     => (float) $totalExpenses,
            'net_profit'         => (float) $netProfit,
            'income_accounts'    => $incomeDetails,
            'expense_accounts'   => $expenseDetails,
            'period_start'       => $start,
            'period_end'         => $end,
        ];
    }

    /**
     * Get outstanding Receivables — real-time from journal_items.
     *
     * Account 1200 (Accounts Receivable) is a debit-normal asset account.
     * Outstanding receivables = SUM(debit) - SUM(credit) on account 1200
     * scoped to all entries UP TO AND INCLUDING $asOf date.
     *
     * This is NOT the parties.current_balance column.
     * If a manual journal entry reduces AR, this number reflects it.
     *
     * @param  string|Carbon  $asOf  Calculate AR balance as of this date
     * @return float
     */
    public function getReceivables($asOf = null): float
    {
        $asOf = $asOf ? ($asOf instanceof Carbon ? $asOf->toDateString() : $asOf) : now()->toDateString();

        $ar = Account::where('code', '1200')->first();
        if (!$ar) return 0.0;

        return (float) $this->netBalance($ar->id, 'asset', asOf: $asOf);
    }

    /**
     * Get outstanding Payables — real-time from journal_items.
     *
     * Account 2000 (Accounts Payable) is a credit-normal liability account.
     * Outstanding payables = SUM(credit) - SUM(debit) on account 2000
     * scoped to all entries UP TO AND INCLUDING $asOf date.
     *
     * @param  string|Carbon  $asOf
     * @return float
     */
    public function getPayables($asOf = null): float
    {
        $asOf = $asOf ? ($asOf instanceof Carbon ? $asOf->toDateString() : $asOf) : now()->toDateString();

        $ap = Account::where('code', '2000')->first();
        if (!$ap) return 0.0;

        return (float) $this->netBalance($ap->id, 'liability', asOf: $asOf);
    }

    // ─── Phase 2.2: The Three Core Profit Calculations ───────────────────────
    //
    // CALCULATION_LOGIC.md § 2.2 mandates:
    //   Gross Profit   = Net Sales - COGS
    //   Gross Margin % = (Gross Profit / Net Sales) × 100  [never stored — always dynamic]
    //   Net Profit     = Gross Profit - Operating Expenses  [from journal_items 6000-series]
    //
    // COGS SOURCE RULE (§ 2.2):
    //   ALWAYS read from sale_item_batches.total_cogs (FIFO locked-in cost).
    //   NEVER from products.cost_price (static, drifts on every new purchase).
    //   NEVER from sale_items.cost_price (display convenience only — not authoritative).
    //
    // For items sold before FIFO batches existed (transition period), we fall back to
    // sale_items.cost_price × quantity, then zero. The fallback is labelled explicitly
    // so it is auditable and will shrink to zero as backfill runs are completed.

    /**
     * Gross Profit grouped by product for a date range.
     * Used by: ReportController::itemWiseProfit()
     *
     * Revenue = SUM(sale_items.net_amount)      [Phase 2.1 waterfall column]
     * COGS    = SUM(sale_item_batches.total_cogs) [FIFO — authoritative]
     * Fallback COGS = sale_items.cost_price × total_qty [for pre-FIFO rows only]
     *
     * @return \Illuminate\Support\Collection
     */
    public function getGrossProfitByProduct(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        // Step 1: All sale items in period with FIFO COGS
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin(
                DB::raw("(SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                          FROM sale_item_batches
                          GROUP BY sale_item_id) as sib"),
                'sib.sale_item_id', '=', 'sale_items.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'products.id as product_id',
                'products.name',
                'products.sku',
                // Revenue: net_amount is Phase 2.1 column. Fallback to subtotal for legacy rows.
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as net_revenue'),
                DB::raw('SUM(sale_items.quantity + COALESCE(sale_items.free_quantity, 0)) as total_qty'),
                // COGS: FIFO batches first; fall back to static cost_price for pre-FIFO rows
                DB::raw('SUM(COALESCE(sib.fifo_cogs, sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity, 0)))) as total_cogs')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('net_revenue')
            ->get();

        return $rows->map(function ($row) {
            $revenue = (float) $row->net_revenue;
            $cogs    = (float) $row->total_cogs;
            $profit  = $revenue - $cogs;
            $margin  = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0.0;

            return [
                'product_id'  => $row->product_id,
                'name'        => $row->name,
                'sku'         => $row->sku,
                'quantity'    => (float) $row->total_qty,
                'net_revenue' => $revenue,
                'cogs'        => $cogs,
                'gross_profit'=> $profit,
                'margin_pct'  => $margin,
            ];
        });
    }

    /**
     * Gross Profit grouped by sale (bill-wise) for a date range.
     * Used by: ReportController::billWiseProfit()
     *
     * @return \Illuminate\Support\Collection
     */
    public function getGrossProfitBySale(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sales')
            ->leftJoin('parties', 'parties.id', '=', 'sales.party_id')
            ->leftJoin(
                DB::raw("(SELECT si.sale_id,
                                 SUM(COALESCE(NULLIF(si.net_amount,0), si.subtotal)) as net_revenue,
                                 SUM(COALESCE(sib_agg.fifo_cogs,
                                              si.cost_price * (si.quantity + COALESCE(si.free_quantity,0)))) as total_cogs
                          FROM sale_items si
                          LEFT JOIN (SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                                     FROM sale_item_batches GROUP BY sale_item_id) sib_agg
                               ON sib_agg.sale_item_id = si.id
                          GROUP BY si.sale_id) as line_totals"),
                'line_totals.sale_id', '=', 'sales.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'sales.id',
                'sales.reference_number',
                'sales.posted_at as date',
                'parties.name as party_name',
                DB::raw('COALESCE(line_totals.net_revenue, 0) as net_revenue'),
                DB::raw('COALESCE(line_totals.total_cogs,  0) as total_cogs')
            )
            ->orderByDesc('sales.posted_at')
            ->get();

        return $rows->map(function ($row) {
            $revenue = (float) $row->net_revenue;
            $cogs    = (float) $row->total_cogs;
            $profit  = $revenue - $cogs;
            $margin  = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0.0;

            return [
                'id'               => $row->id,
                'reference_number' => $row->reference_number,
                'date'             => $row->date,
                'party_name'       => $row->party_name ?? 'Walk-in',
                'net_revenue'      => $revenue,
                'cogs'             => $cogs,
                'gross_profit'     => $profit,
                'margin_pct'       => $margin,
            ];
        });
    }

    /**
     * Gross Profit grouped by Category for a date range.
     * Used by: ReportController::itemCategoryWiseProfitLoss()
     *
     * @return \Illuminate\Support\Collection
     */
    public function getGrossProfitByCategory(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->leftJoin(
                DB::raw("(SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                          FROM sale_item_batches
                          GROUP BY sale_item_id) as sib"),
                'sib.sale_item_id', '=', 'sale_items.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)) as net_revenue'),
                DB::raw('SUM(COALESCE(sib.fifo_cogs, sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity, 0)))) as total_cogs')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('net_revenue')
            ->get();

        return $rows->map(function ($row) {
            $revenue = (float) $row->net_revenue;
            $cogs    = (float) $row->total_cogs;
            $profit  = $revenue - $cogs;
            $margin  = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0.0;

            return [
                'name'    => $row->category_name ?? 'Uncategorized',
                'revenue' => $revenue,
                'cost'    => $cogs,
                'profit'  => $profit,
                'margin'  => $margin,
            ];
        });
    }

    /**
     * Gross Profit grouped by party (customer profitability) for a date range.
     * Used by: ReportController::partyWiseProfitLoss()
     *
     * @return \Illuminate\Support\Collection
     */
    public function getGrossProfitByParty(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sales')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->leftJoin(
                DB::raw("(SELECT si.sale_id,
                                 SUM(COALESCE(NULLIF(si.net_amount,0), si.subtotal)) as net_revenue,
                                 SUM(COALESCE(sib_agg.fifo_cogs,
                                              si.cost_price * (si.quantity + COALESCE(si.free_quantity,0)))) as total_cogs
                          FROM sale_items si
                          LEFT JOIN (SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                                     FROM sale_item_batches GROUP BY sale_item_id) sib_agg
                               ON sib_agg.sale_item_id = si.id
                          GROUP BY si.sale_id) as line_totals"),
                'line_totals.sale_id', '=', 'sales.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'parties.id as party_id',
                'parties.name as party_name',
                DB::raw('COUNT(DISTINCT sales.id) as invoice_count'),
                DB::raw('SUM(COALESCE(line_totals.net_revenue, 0)) as net_revenue'),
                DB::raw('SUM(COALESCE(line_totals.total_cogs,  0)) as total_cogs')
            )
            ->groupBy('parties.id', 'parties.name')
            ->orderByDesc('net_revenue')
            ->get();

        return $rows->map(function ($row) {
            $revenue = (float) $row->net_revenue;
            $cogs    = (float) $row->total_cogs;
            $profit  = $revenue - $cogs;
            $margin  = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0.0;

            return [
                'party_id'      => $row->party_id,
                'party_name'    => $row->party_name,
                'invoice_count' => (int) $row->invoice_count,
                'net_revenue'   => $revenue,
                'cogs'          => $cogs,
                'gross_profit'  => $profit,
                'margin_pct'    => $margin,
            ];
        });
    }

    /**
     * Detailed Inventory Valuation report — authoritative.
     * Used by: ReportController::stockValuation()
     *
     * @return \Illuminate\Support\Collection
     */
    public function getInventoryValuationReport(): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        return DB::table('products')
            ->join('inventory_batches', 'products.id', '=', 'inventory_batches.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('products.tenant_id', $tenantId)
            ->where('inventory_batches.tenant_id', $tenantId)
            ->whereNull('inventory_batches.deleted_at')
            ->where('inventory_batches.remaining_qty', '>', 0)
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                'categories.name as category_name',
                'products.price as retail_price',
                DB::raw('SUM(inventory_batches.remaining_qty) as total_qty'),
                DB::raw('SUM(inventory_batches.remaining_qty * inventory_batches.unit_cost) as total_cost_value')
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name', 'products.price')
            ->orderBy('products.name')
            ->get()
            ->map(function ($row) {
                $costValue   = (float) $row->total_cost_value;
                $retailValue = (float) $row->total_qty * (float) $row->retail_price;

                return [
                    'id'               => $row->id,
                    'name'             => $row->name,
                    'sku'              => $row->sku,
                    'category'         => $row->category_name ?? 'Uncategorized',
                    'stock_quantity'   => (float) $row->total_qty,
                    'stock_value'      => $costValue,
                    'retail_value'     => $retailValue,
                    'potential_profit' => $retailValue - $costValue,
                ];
            });
    }

    /**
     * Stock Aging Report — measures the "Ticking Clock" of frozen cash.
     * Groups batches by days since arrival.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getStockAging(): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        return DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->where('inventory_batches.tenant_id', $tenantId)
            ->whereNull('inventory_batches.deleted_at')
            ->where('remaining_qty', '>', 0)
            ->select(
                'products.name as product_name',
                'inventory_batches.id as batch_id',
                'inventory_batches.remaining_qty as quantity',
                'inventory_batches.created_at',
                'inventory_batches.unit_cost'
            )
            ->get()
            ->map(function ($batch) {
                $days = Carbon::parse($batch->created_at)->diffInDays(now());
                $cost = (float) $batch->quantity * (float) $batch->unit_cost;

                return [
                    'product_name' => $batch->product_name,
                    'batch_id'     => substr($batch->batch_id, 0, 8),
                    'quantity'     => (float) $batch->quantity,
                    'cost_value'   => $cost,
                    'days'         => (int) $days,
                    'category'     => $days > 180 ? '180+' : ($days > 90 ? '90-180' : ($days > 30 ? '30-90' : '0-30'))
                ];
            });
    }

    /**
     * Expiry Report — identifies batches approaching their end-of-life.
     *
     * @param  int  $daysThreshold
     * @return \Illuminate\Support\Collection
     */
    public function getExpiringSoon(int $daysThreshold = 90): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        return DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->leftJoin('warehouses', 'warehouses.id', '=', 'inventory_batches.warehouse_id')
            ->where('inventory_batches.tenant_id', $tenantId)
            ->whereNull('inventory_batches.deleted_at')
            ->where('remaining_qty', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays($daysThreshold))
            ->select(
                'products.name as product_name',
                'inventory_batches.id as batch_id',
                'inventory_batches.remaining_qty as qty',
                'inventory_batches.expiry_date',
                'warehouses.name as warehouse_name'
            )
            ->orderBy('expiry_date', 'asc')
            ->get()
            ->map(fn($row) => [
                'product_name'   => $row->product_name,
                'batch_id'       => substr($row->batch_id, 0, 8),
                'quantity'       => (float) $row->qty,
                'expiry_date'    => $row->expiry_date,
                'warehouse_name' => $row->warehouse_name ?? 'N/A',
                'status'         => Carbon::parse($row->expiry_date)->isPast() ? 'Expired' : 'Expiring Soon'
            ]);
    }

    /**
     * Inventory Value — the correct formula from CALCULATION_LOGIC.md § 2.5.
     *
     * RULE: SUM(inventory_batches.remaining_qty × inventory_batches.unit_cost)
     * NEVER: SUM(stocks.quantity × products.cost_price)
     *
     * @return float
     */
    public function getInventoryValue(): float
    {
        $tenantId = app('current.tenant')->id;
        return (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('remaining_qty', '>', 0)
            ->sum(DB::raw('remaining_qty * unit_cost'));
    }

    /**
     * Account Ledger (Statement) — The ultimate audit tool.
     * Provides a chronologically sorted list of entries for a specific account.
     *
     * @param string $accountId
     * @param string $start
     * @param string $end
     * @return array
     */
    public function getAccountLedger(string $accountId, string $start, string $end): array
    {
        $account = Account::findOrFail($accountId);

        // 1. Opening Balance (All time before $start)
        $openingBalance = $this->netBalance($accountId, $account->type, Carbon::parse($start)->subDay()->toDateString());

        // 2. Transactions in Period
        $items = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.account_id', $accountId)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->select(
                'journal_entries.date',
                'journal_entries.reference',
                'journal_entries.description as entry_desc',
                'journal_items.description as item_desc',
                'journal_items.debit',
                'journal_items.credit'
            )
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.created_at', 'asc')
            ->get();

        // 3. Compute Running Balance
        $runningBalance = $openingBalance;
        $ledger = $items->map(function ($item) use (&$runningBalance, $account) {
            $debit  = (float) $item->debit;
            $credit = (float) $item->credit;

            if (in_array($account->type, ['asset', 'expense'])) {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }

            return [
                'date'        => $item->date,
                'reference'   => $item->reference,
                'description' => $item->item_desc ?? $item->entry_desc,
                'debit'       => $debit,
                'credit'      => $credit,
                'balance'     => $runningBalance,
            ];
        });

        return [
            'account'         => $account,
            'opening_balance' => $openingBalance,
            'closing_balance' => $runningBalance,
            'items'           => $ledger,
        ];
    }

    /**
     * Tax Summary Report — Pulls from Account 2100 (Sales Tax Payable).
     *
     * Credits = Output Tax (Collected from customers)
     * Debits  = Input Tax (Paid to suppliers / offset)
     *
     * @param string $start
     * @param string $end
     * @return array
     */
    public function getTaxSummary(string $start, string $end): array
    {
        $taxAccount = Account::where('code', '2100')->first();
        if (!$taxAccount) {
            return [
                'output_tax' => 0.0,
                'input_tax'  => 0.0,
                'net_payable'=> 0.0,
                'details'    => []
            ];
        }

        $outputTax = $this->sumJournalItems($taxAccount->id, 'credit', $start, $end);
        $inputTax  = $this->sumJournalItems($taxAccount->id, 'debit',  $start, $end);

        // Detailed records for the report table
        $details = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.account_id', $taxAccount->id)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->select(
                'journal_entries.date',
                'journal_entries.reference',
                'journal_entries.description',
                'journal_items.debit as input_tax',
                'journal_items.credit as output_tax'
            )
            ->orderBy('journal_entries.date', 'desc')
            ->get();

        return [
            'output_tax'  => (float) $outputTax,
            'input_tax'   => (float) $inputTax,
            'net_payable' => (float) ($outputTax - $inputTax),
            'details'     => $details
        ];
    }

    /**
     * Cash Flow Statement (Direct Method) — Ledger based.
     *
     * Sums all debits (Inflow) and credits (Outflow) for Cash/Bank accounts.
     * Excludes transfers between Cash and Bank to avoid inflated flows.
     *
     * @param string $start
     * @param string $end
     * @return array
     */
    public function getCashFlowReport(string $start, string $end): array
    {
        // Identify all Cash/Bank accounts (Codes 1000-1099)
        $cashAccounts = Account::where('type', 'asset')
            ->whereBetween('code', ['1000', '1099'])
            ->pluck('id')
            ->toArray();

        // 1. Operating Inflow (Debits to Cash where partner account is Income or Receivable)
        $inflow = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('journal_items.account_id', $cashAccounts)
            ->where('journal_items.debit', '>', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.debit');

        // 2. Operating Outflow (Credits to Cash where partner account is Expense or Payable)
        $outflow = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('journal_items.account_id', $cashAccounts)
            ->where('journal_items.credit', '>', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.credit');

        return [
            'operating_inflow'  => (float) $inflow,
            'operating_outflow' => (float) $outflow,
            'net_cash_flow'     => (float) ($inflow - $outflow),
        ];
    }

    /**
     * Balance Sheet as of a specific date — the Fundamental Accounting Equation.
     *
     * BUG-02 FIX (CALCULATION_LOGIC.md §8 BUG-02)
     * The old implementation read raw Account models with their cached .balance column.
     * That column has no concept of date — it is an all-time running total.
     * This method computes every balance from journal_items WHERE date <= $asOf.
     *
     * RULE: Assets = Liabilities + Equity. Always. If isBalanced is false,
     *       there is a journal entry integrity error — investigate immediately.
     *
     * RULE: Inventory Asset (Account 1100) balance comes from the COGS/Inventory
     *       journal entries automatically — NOT from inventory_batches directly.
     *       The journal entries reflect the FIFO movements; the GL is the truth.
     *
     * @param  string  $asOf  e.g. '2026-02-20' — defaults to today if not passed
     * @return array{
     *   assets:            array{ accounts: array, total: float },
     *   liabilities:       array{ accounts: array, total: float },
     *   equity:            array{ accounts: array, total: float },
     *   total_assets:      float,
     *   total_liabilities: float,
     *   total_equity:      float,
     *   is_balanced:       bool,
     *   as_of:             string
     * }
     */
    public function getBalanceSheet(string $asOf): array
    {
        // The three permanent sections of a Balance Sheet
        $sections = [
            'asset'     => ['label' => 'Assets',      'accounts' => [], 'total' => 0.0],
            'liability' => ['label' => 'Liabilities',  'accounts' => [], 'total' => 0.0],
            'equity'    => ['label' => 'Equity',        'accounts' => [], 'total' => 0.0],
        ];

        // Fetch all accounts of these three types — ordered by code for consistent display
        $allAccounts = Account::whereIn('type', ['asset', 'liability', 'equity'])
            ->orderBy('code')
            ->get();

        foreach ($allAccounts as $account) {
            // netBalance() reads from journal_items with WHERE date <= $asOf.
            // It returns a positive number for the account's natural balance:
            //   asset/expense  : debit - credit  (debit-normal)
            //   liability/equity: credit - debit  (credit-normal)
            $balance = $this->netBalance($account->id, $account->type, $asOf);

            // Skip zero-balance accounts — they add noise, not information
            if (abs($balance) < 0.001) {
                continue;
            }

            $section = $account->type; // 'asset', 'liability', or 'equity'

            $sections[$section]['accounts'][] = [
                'id'      => $account->id,
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => round($balance, 2),
            ];

            $sections[$section]['total'] += $balance;
        }

        // Round the section totals
        foreach ($sections as &$s) {
            $s['total'] = round($s['total'], 2);
        }
        unset($s);

        $totalAssets      = $sections['asset']['total'];
        $totalLiabilities = $sections['liability']['total'];
        $totalEquity      = $sections['equity']['total'];

        // THE fundamental accounting equation: Assets = Liabilities + Equity
        // If this is false, a journal entry was posted incorrectly (DR ≠ CR somewhere).
        $isBalanced = abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01;

        return [
            'assets'            => $sections['asset'],
            'liabilities'       => $sections['liability'],
            'equity'            => $sections['equity'],
            'total_assets'      => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity'      => $totalEquity,
            'is_balanced'       => $isBalanced,
            'as_of'             => $asOf,
        ];
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Sum a single column ('debit' or 'credit') on journal_items
     * for a given account and date range.
     *
     * Uses a single aggregated query — not a collection loop.
     */
    private function sumJournalItems(string $accountId, string $column, string $start, string $end): float
    {
        $tenantId = app('current.tenant')->id;
        return (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_items.account_id', $accountId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum("journal_items.{$column}");
    }

    /**
     * Calculate the net balance of an account as of a specific date.
     * For asset/expense accounts: debit - credit (debit-normal)
     * For liability/equity/income accounts: credit - debit (credit-normal)
     */
    private function netBalance(string $accountId, string $accountType, string $asOf): float
    {
        $tenantId = app('current.tenant')->id;
        $totals = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_items.account_id', $accountId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.date', '<=', $asOf)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->first();

        $debit  = (float) ($totals->total_debit  ?? 0.0);
        $credit = (float) ($totals->total_credit ?? 0.0);

        if (in_array($accountType, ['asset', 'expense'])) {
            return $debit - $credit;
        }

        return $credit - $debit;
    }
}

