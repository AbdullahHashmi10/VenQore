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

        $tenantId = app('current.tenant')->id;
        $sums = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->selectRaw('account_id, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        // ─── Revenue: SUM(credits - debits) across all income accounts ────────
        // Income accounts have a credit-normal balance.
        // Revenue for period = credits posted - debits posted in that range.
        $incomeAccounts = Account::where('type', 'income')->get();
        $incomeDetails  = [];
        $totalRevenue   = 0;

        foreach ($incomeAccounts as $account) {
            $sum = $sums->get($account->id);
            $credit = $sum ? (float) $sum->total_credit : 0.0;
            $debit  = $sum ? (float) $sum->total_debit  : 0.0;
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
            $sum       = $sums->get($cogsId);
            $cogsDebit = $sum ? (float) $sum->total_debit  : 0.0;
            $cogsCredit = $sum ? (float) $sum->total_credit : 0.0;
            $totalCogs  = $cogsDebit - $cogsCredit;
        }

        // ─── Operating Expenses: all expense accounts EXCEPT COGS ─────────────
        $expenseAccounts   = Account::where('type', 'expense')
            ->when($cogsId, fn($q) => $q->where('id', '!=', $cogsId))
            ->get();
        $expenseDetails    = [];
        $totalOpex         = 0;

        foreach ($expenseAccounts as $account) {
            $sum    = $sums->get($account->id);
            $debit  = $sum ? (float) $sum->total_debit  : 0.0;
            $credit = $sum ? (float) $sum->total_credit : 0.0;
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

        // Round once, here, at the single read-engine every dashboard card and
        // report ultimately calls. This is a defensive final settlement point:
        // SUM(debit)/SUM(credit) over many journal_items rows can carry float
        // noise past the 2dp mark even when each row was written at 2dp. Rounding
        // every consumer-facing total at this one choke point — rather than in
        // each caller — guarantees Sales, Net Profit "In", Monthly Revenue, and
        // every report built on this method can never disagree by a fraction of
        // a cent again.
        return [
            'revenue'            => round((float) $totalRevenue, 2),
            'cogs'               => round((float) $totalCogs, 2),
            'gross_profit'       => round((float) $grossProfit, 2),
            'operating_expenses' => round((float) $totalOpex, 2),
            'total_expenses'     => round((float) $totalExpenses, 2),
            'net_profit'         => round((float) $netProfit, 2),
            'income_accounts'    => $incomeDetails,
            'expense_accounts'   => $expenseDetails,
            'period_start'       => $start,
            'period_end'         => $end,
        ];
    }

    /**
     * Per-period revenue/cogs/profit, grouped by BUSINESS DATE (je.date).
     * One conditional-aggregation query (no N+1). Mirrors getProfitAndLoss definitions.
     * $granularity: 'hourly' | 'daily' | 'monthly'.
     * Returns [ periodKey => ['revenue'=>float,'cogs'=>float,'profit'=>float] ].
     */
    public function getProfitByPeriod($start, $end, string $granularity = 'daily'): array
    {
        $startStr = $start instanceof Carbon ? $start->toDateString() : (string) $start;
        $endStr   = $end   instanceof Carbon ? $end->toDateString()   : (string) $end;
        $tenantId = app('current.tenant')->id;

        $incomeIds = Account::where('type', 'income')->pluck('id')->all();
        if (empty($incomeIds)) { $incomeIds = ['00000000-0000-0000-0000-000000000000']; }
        $cogsId = Account::where('code', '5000')->value('id') ?? '00000000-0000-0000-0000-000000000000';

        // je.date is a DATE (no time). Hourly is only meaningful for the same-day "Today" view,
        // so hourly buckets by the hour of je.created_at; daily/monthly bucket by je.date.
        $periodExpr = match ($granularity) {
            'hourly'  => "DATE_FORMAT(je.created_at, '%H')",
            'monthly' => "DATE_FORMAT(je.date, '%Y-%m')",
            default   => "DATE_FORMAT(je.date, '%Y-%m-%d')",
        };

        $incomePh = implode(',', array_fill(0, count($incomeIds), '?'));

        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$startStr, $endStr])
            ->selectRaw(
                "$periodExpr as period, "
                . "SUM(CASE WHEN ji.account_id IN ($incomePh) THEN ji.credit - ji.debit ELSE 0 END) as revenue, "
                . "SUM(CASE WHEN ji.account_id = ? THEN ji.debit - ji.credit ELSE 0 END) as cogs",
                array_merge($incomeIds, [$cogsId])
            )
            ->groupBy('period')
            ->get();

        $out = [];
        foreach ($rows as $r) {
            // Round at this choke point too — see getProfitAndLoss() above for why.
            $rev  = round((float) $r->revenue, 2);
            $cogs = round((float) $r->cogs, 2);
            $out[(string) $r->period] = ['revenue' => $rev, 'cogs' => $cogs, 'profit' => round($rev - $cogs, 2)];
        }
        return $out;
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
                          WHERE tenant_id = '{$tenantId}'
                          AND is_reversed = 0
                          GROUP BY sale_item_id) as sib"),
                'sib.sale_item_id', '=', 'sale_items.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'products.id as product_id',
                'products.name',
                'products.sku',
                'products.category_id as category_id',
                // Revenue: net_amount is Phase 2.1 column. Fallback to subtotal for legacy rows.
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as net_revenue'),
                DB::raw('SUM((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) + COALESCE(sale_items.free_quantity, 0)) as total_qty'),
                // COGS: FIFO batches first; fall back to static cost_price for pre-FIFO rows (prorated for returns)
                DB::raw('SUM(COALESCE(sib.fifo_cogs, sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity, 0)) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0)))) as total_cogs')
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.category_id')
            ->orderByDesc('net_revenue')
            ->get();

        return $rows->map(function ($row) {
            $revenue = (float) $row->net_revenue;
            $cogs    = (float) $row->total_cogs;
            $profit  = $revenue - $cogs;
            $margin  = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0.0;

            return [
                'product_id'  => $row->product_id,
                'category_id' => $row->category_id,
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
     * Net revenue (ex-tax, returns-netted) attributed to each cashier (sales.user_id).
     * Mirrors getGrossProfitByProduct's revenue basis, grouped by user. One query (no N+1).
     * Returns [ user_id => net_revenue (float) ].
     */
    public function getNetRevenueByUser(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;

        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'sales.user_id',
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as net_revenue')
            )
            ->groupBy('sales.user_id')
            ->get();

        return $rows->mapWithKeys(fn ($r) => [$r->user_id => (float) $r->net_revenue]);
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
                                 SUM(COALESCE(NULLIF(si.net_amount,0), si.subtotal) * ((si.quantity - COALESCE(si.returned_quantity,0)) / NULLIF(si.quantity,0))) as net_revenue,
                                 SUM(COALESCE(sib_agg.fifo_cogs,
                                              si.cost_price * (si.quantity + COALESCE(si.free_quantity,0))) * ((si.quantity - COALESCE(si.returned_quantity,0)) / NULLIF(si.quantity,0))) as total_cogs
                          FROM sale_items si
                          LEFT JOIN (SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                                     FROM sale_item_batches 
                                     WHERE tenant_id = '{$tenantId}'
                                     AND is_reversed = 0
                                     GROUP BY sale_item_id) sib_agg
                               ON sib_agg.sale_item_id = si.id
                          WHERE si.tenant_id = '{$tenantId}'
                          GROUP BY si.sale_id) as line_totals"),
                'line_totals.sale_id', '=', 'sales.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'sales.id',
                'sales.reference_number',
                'sales.posted_at as date',
                'parties.name as party_name',
                DB::raw('COALESCE(line_totals.net_revenue, 0) - sales.global_discount as net_revenue'),
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
                          WHERE tenant_id = '{$tenantId}'
                          AND is_reversed = 0
                          GROUP BY sale_item_id) as sib"),
                'sib.sale_item_id', '=', 'sale_items.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as net_revenue'),
                DB::raw('SUM(COALESCE(sib.fifo_cogs, sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity, 0))) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as total_cogs')
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
                // category_id added (additive — existing consumers unaffected) so
                // callers can join Purchases/Stock Value/customer-detail maps back
                // to this row. NULL for the "Uncategorized" bucket, matching the
                // 'uncategorized' key used by getPurchasesByCategory() etc.
                'category_id' => $row->category_id ?? 'uncategorized',
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
                                 SUM(COALESCE(NULLIF(si.net_amount,0), si.subtotal) * ((si.quantity - COALESCE(si.returned_quantity,0)) / NULLIF(si.quantity,0))) as net_revenue,
                                 SUM(COALESCE(sib_agg.fifo_cogs,
                                              si.cost_price * (si.quantity + COALESCE(si.free_quantity,0))) * ((si.quantity - COALESCE(si.returned_quantity,0)) / NULLIF(si.quantity,0))) as total_cogs
                          FROM sale_items si
                          LEFT JOIN (SELECT sale_item_id, SUM(total_cogs) as fifo_cogs
                                     FROM sale_item_batches 
                                     WHERE tenant_id = '{$tenantId}'
                                     AND is_reversed = 0
                                     GROUP BY sale_item_id) sib_agg
                               ON sib_agg.sale_item_id = si.id
                          WHERE si.tenant_id = '{$tenantId}'
                          GROUP BY si.sale_id) as line_totals"),
                'line_totals.sale_id', '=', 'sales.id'
            )
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'parties.id as party_id',
                'parties.name as party_name',
                DB::raw('COUNT(DISTINCT sales.id) as invoice_count'),
                DB::raw('SUM(COALESCE(line_totals.net_revenue, 0) - sales.global_discount) as net_revenue'),
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
                    'unit_cost'        => $row->total_qty > 0 ? (float) $row->total_cost_value / (float) $row->total_qty : 0,
                    'stock_value'      => $costValue,
                    'retail_value'     => $retailValue,
                    'potential_profit' => $retailValue - $costValue,
                ];
            });
    }

    /**
     * Total cost of goods purchased per product within a date range, from
     * purchase_items (the real per-purchase unit_cost — not the current/live
     * product cost_price). Used to power the "Purchases" column on the
     * Item-Wise and Category-Wise Detailed reports.
     *
     * Keyed by product_id => ['qty_purchased' => float, 'purchase_cost' => float].
     */
    public function getPurchasesByProduct(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('purchase_items')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->where('purchases.tenant_id', $tenantId)
            ->whereBetween('purchases.purchase_date', [$start, $end])
            ->select(
                'purchase_items.product_id',
                DB::raw('SUM(purchase_items.qty) as qty_purchased'),
                DB::raw('SUM(purchase_items.line_total) as purchase_cost')
            )
            ->groupBy('purchase_items.product_id')
            ->get();

        return $rows->mapWithKeys(fn ($r) => [
            $r->product_id => [
                'qty_purchased' => round((float) $r->qty_purchased, 4),
                'purchase_cost' => round((float) $r->purchase_cost, 2),
            ],
        ]);
    }

    /**
     * Current stock quantity + value for a set of products (or all products if
     * $productIds is null), from live inventory_batches.remaining_qty — the
     * exact same formula as getInventoryValuationReport(), sliced per product.
     * "Current" because stock value is a live, point-in-time-of-now concept;
     * for a value as of a PAST date, see getPointInTimeInventory() below.
     *
     * Keyed by product_id => ['stock_qty' => float, 'stock_value' => float].
     */
    public function getCurrentStockValueByProduct(?array $productIds = null): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('inventory_batches')
            ->where('inventory_batches.tenant_id', $tenantId)
            ->whereNull('inventory_batches.deleted_at')
            ->where('inventory_batches.remaining_qty', '>', 0)
            ->when($productIds, fn ($q) => $q->whereIn('inventory_batches.product_id', $productIds))
            ->select(
                'inventory_batches.product_id',
                DB::raw('SUM(inventory_batches.remaining_qty) as stock_qty'),
                DB::raw('SUM(inventory_batches.remaining_qty * inventory_batches.unit_cost) as stock_value')
            )
            ->groupBy('inventory_batches.product_id')
            ->get();

        return $rows->mapWithKeys(fn ($r) => [
            $r->product_id => [
                'stock_qty'   => round((float) $r->stock_qty, 4),
                'stock_value' => round((float) $r->stock_value, 2),
            ],
        ]);
    }

    /**
     * Customer purchase detail for a set of products within a date range:
     * who bought it, how many times (distinct invoices), and total spend.
     * Powers the customer drilldown on the Item-Wise Detailed report.
     *
     * Keyed by product_id => Collection of
     *   ['party_id','party_name','purchase_count','total_qty','total_spent'].
     */
    public function getCustomerDetailByProduct(array $productIds, string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereIn('sale_items.product_id', $productIds)
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'sale_items.product_id',
                'parties.id as party_id',
                'parties.name as party_name',
                DB::raw('COUNT(DISTINCT sales.id) as purchase_count'),
                DB::raw('SUM(sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) as total_qty'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as total_spent')
            )
            ->groupBy('sale_items.product_id', 'parties.id', 'parties.name')
            ->orderByDesc('total_spent')
            ->get();

        return $rows->map(fn ($r) => [
            'product_id'      => $r->product_id,
            'party_id'        => $r->party_id,
            'party_name'      => $r->party_name,
            'purchase_count'  => (int) $r->purchase_count,
            'total_qty'       => round((float) $r->total_qty, 4),
            'total_spent'     => round((float) $r->total_spent, 2),
        ])->groupBy('product_id');
    }

    /**
     * Total cost of goods purchased per CATEGORY within a date range.
     * Same source as getPurchasesByProduct(), rolled up one level via products.category_id.
     * Keyed by category_id (0 for uncategorized) => ['qty_purchased','purchase_cost'].
     */
    public function getPurchasesByCategory(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('purchase_items')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->join('products', 'products.id', '=', 'purchase_items.product_id')
            ->where('purchases.tenant_id', $tenantId)
            ->whereBetween('purchases.purchase_date', [$start, $end])
            ->select(
                'products.category_id', // NULL for uncategorized — MySQL GROUP BY collapses all NULLs into one group
                DB::raw('SUM(purchase_items.qty) as qty_purchased'),
                DB::raw('SUM(purchase_items.line_total) as purchase_cost')
            )
            ->groupBy('products.category_id')
            ->get();

        // Key by category_id, using the string 'uncategorized' for the NULL group
        // (a UUID column, so 0 would not be a valid/consistent sentinel).
        return $rows->mapWithKeys(fn ($r) => [
            ($r->category_id ?? 'uncategorized') => [
                'qty_purchased' => round((float) $r->qty_purchased, 4),
                'purchase_cost' => round((float) $r->purchase_cost, 2),
            ],
        ]);
    }

    /**
     * Current stock value rolled up by CATEGORY — same live inventory_batches
     * source as getCurrentStockValueByProduct(), grouped one level higher.
     * Keyed by category_id (0 for uncategorized) => ['stock_qty','stock_value'].
     */
    public function getCurrentStockValueByCategory(): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->where('inventory_batches.tenant_id', $tenantId)
            ->whereNull('inventory_batches.deleted_at')
            ->where('inventory_batches.remaining_qty', '>', 0)
            ->select(
                'products.category_id', // NULL for uncategorized — collapses to one GROUP BY group
                DB::raw('SUM(inventory_batches.remaining_qty) as stock_qty'),
                DB::raw('SUM(inventory_batches.remaining_qty * inventory_batches.unit_cost) as stock_value')
            )
            ->groupBy('products.category_id')
            ->get();

        return $rows->mapWithKeys(fn ($r) => [
            ($r->category_id ?? 'uncategorized') => [
                'stock_qty'   => round((float) $r->stock_qty, 4),
                'stock_value' => round((float) $r->stock_value, 2),
            ],
        ]);
    }

    /**
     * Customer purchase detail rolled up by CATEGORY within a date range.
     * Same shape as getCustomerDetailByProduct() but one level higher — powers
     * the customer drilldown on the Category-Wise Detailed report.
     * Keyed by category_id => Collection of
     *   ['party_id','party_name','purchase_count','total_qty','total_spent'].
     */
    public function getCustomerDetailByCategory(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'products.category_id', // NULL for uncategorized — collapses to one GROUP BY group
                'parties.id as party_id',
                'parties.name as party_name',
                DB::raw('COUNT(DISTINCT sales.id) as purchase_count'),
                DB::raw('SUM(sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) as total_qty'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as total_spent')
            )
            ->groupBy('products.category_id', 'parties.id', 'parties.name')
            ->orderByDesc('total_spent')
            ->get();

        return $rows->map(fn ($r) => [
            'category_id'     => $r->category_id ?? 'uncategorized',
            'party_id'        => $r->party_id,
            'party_name'      => $r->party_name,
            'purchase_count'  => (int) $r->purchase_count,
            'total_qty'       => round((float) $r->total_qty, 4),
            'total_spent'     => round((float) $r->total_spent, 2),
        ])->groupBy('category_id');
    }

    /**
     * Point-In-Time Inventory — reconstructs stock quantity AND value as of any
     * past date, not just today.
     *
     * Two different data sources are combined deliberately:
     *   - QUANTITY as of $asOf: replayed from stock_movements (a full, timestamped
     *     ledger of every quantity delta — purchase/sale/adjustment/transfer/return).
     *     current_qty (from inventory_batches.remaining_qty, live) MINUS every
     *     movement that happened AFTER $asOf gives the qty that existed AT $asOf.
     *     This works regardless of movement type because stock_movements already
     *     signs each row (+ for additions, - for deductions).
     *   - VALUE as of $asOf: inventory_batches don't retain a full cost history
     *     independent of remaining_qty, so value is approximated using each
     *     product's most recent unit_cost from inventory_batches that existed
     *     on/before $asOf (i.e. the batch(es) that would have been the active
     *     FIFO cost layer at that time). This mirrors current-day valuation
     *     logic (getInventoryValuationReport) applied at a historical qty.
     *
     * NOTE ON PRECISION: this is a reconstruction, not a stored historical
     * snapshot — it is exact for quantity (stock_movements is a complete,
     * append-only ledger) and a close approximation for per-unit cost (uses the
     * batch cost nearest to $asOf rather than a literal historical weighted-
     * average). Flagged here rather than silently presented as exact.
     *
     * @param  string  $asOf  Y-m-d date, OR Y-m-d H:i / Y-m-d H:i:s datetime, to
     *                        reconstruct inventory as of. A bare date (no time
     *                        component) is treated as end-of-that-day, matching
     *                        the original date-only behavior. A datetime string
     *                        is honored down to the minute/second given, so a
     *                        user can ask "what was on hand at 3:45 PM on the 8th"
     *                        and not just "as of the end of the 8th."
     * @return \Illuminate\Support\Collection  keyed by product_id
     */
    public function getPointInTimeInventory(string $asOf): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;

        // A plain date like "2026-07-08" has no time-of-day component, so Carbon
        // parses it at 00:00:00 — that would silently exclude every movement that
        // happened earlier that same day. Detect "no time given" and push to
        // end-of-day in that case only; otherwise honor the exact time supplied.
        $hasTimeComponent = (bool) preg_match('/\d{1,2}:\d{2}/', $asOf);
        $asOfEnd = $hasTimeComponent
            ? Carbon::parse($asOf)
            : Carbon::parse($asOf)->endOfDay();

        // Current live quantity per product (today).
        $currentQty = DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->select('product_id', DB::raw('SUM(remaining_qty) as qty'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        // Sum of every stock_movements delta that happened AFTER $asOf, per product.
        // Movements are already signed (+/-), so subtracting this from "now" undoes
        // everything that happened since $asOf, leaving the quantity AT $asOf.
        $movementsSinceAsOf = DB::table('stock_movements')
            ->where('created_at', '>', $asOfEnd)
            ->select('product_id', DB::raw('SUM(quantity) as delta'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        // Products with any batch that existed on/before $asOf — used to source
        // the historical per-unit cost (nearest batch AT or BEFORE $asOf).
        $historicalCost = DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where('created_at', '<=', $asOfEnd)
            ->select('product_id', 'unit_cost', 'created_at')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('product_id')
            ->map(fn ($batches) => (float) $batches->first()->unit_cost);

        $productIds = $currentQty->keys()
            ->merge($movementsSinceAsOf->keys())
            ->merge($historicalCost->keys())
            ->unique();

        $products = DB::table('products')
            ->whereIn('products.id', $productIds)
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->select('products.id', 'products.name', 'products.sku', 'categories.name as category_name')
            ->get()
            ->keyBy('id');

        return $productIds->map(function ($productId) use ($currentQty, $movementsSinceAsOf, $historicalCost, $products, $asOfEnd) {
            $product = $products->get($productId);
            if (!$product) return null;

            $nowQty      = (float) ($currentQty->get($productId)->qty ?? 0);
            $sinceDelta  = (float) ($movementsSinceAsOf->get($productId)->delta ?? 0);
            $qtyAtAsOf   = round($nowQty - $sinceDelta, 4);
            $unitCost    = (float) ($historicalCost->get($productId) ?? 0);
            $valueAtAsOf = round(max(0, $qtyAtAsOf) * $unitCost, 2);

            return [
                'product_id'   => $productId,
                'name'         => $product->name,
                'sku'          => $product->sku,
                'category'     => $product->category_name ?? 'Uncategorized',
                // Full resolved instant used as the cutoff (date + time), not just
                // the raw input string — so the report can show exactly what moment
                // was reconstructed, down to the second.
                'as_of'        => $asOfEnd->toDateTimeString(),
                'quantity'     => max(0, $qtyAtAsOf), // clamp: a negative here means incomplete pre-tracking movement history, not real negative stock
                'unit_cost'    => round($unitCost, 2),
                'stock_value'  => $valueAtAsOf,
            ];
        })->filter()->values();
    }

    /**
     * Customer Insights — favorite category and most-bought item per customer,
     * plus overall purchase behavior, within a date range.
     *
     * @return \Illuminate\Support\Collection  one row per customer (party)
     */
    public function getCustomerInsights(string $start, string $end): \Illuminate\Support\Collection
    {
        $tenantId = app('current.tenant')->id;

        // Per customer x category: qty/spend, to find each customer's favorite category.
        $byCategory = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'parties.id as party_id',
                'parties.name as party_name',
                DB::raw('COALESCE(categories.name, "Uncategorized") as category_name'),
                DB::raw('SUM(sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) as qty'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as spend')
            )
            ->groupBy('parties.id', 'parties.name', DB::raw('COALESCE(categories.name, "Uncategorized")'))
            ->get()
            ->groupBy('party_id');

        // Per customer x product: qty/spend, to find each customer's most-bought item.
        $byProduct = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'parties.id as party_id',
                'products.name as product_name',
                DB::raw('SUM(sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) as qty'),
                DB::raw('SUM(COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) * ((sale_items.quantity - COALESCE(sale_items.returned_quantity, 0)) / NULLIF(sale_items.quantity, 0))) as spend')
            )
            ->groupBy('parties.id', 'products.name')
            ->get()
            ->groupBy('party_id');

        // Overall per-customer totals (invoice count, total spend, last purchase).
        $overall = DB::table('sales')
            ->join('parties', 'parties.id', '=', 'sales.party_id')
            ->where('sales.tenant_id', $tenantId)
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'parties.id as party_id',
                'parties.name as party_name',
                'parties.phone as party_phone',
                DB::raw('COUNT(DISTINCT sales.id) as invoice_count'),
                DB::raw('SUM(sales.net_sales) as total_spend'),
                DB::raw('MAX(sales.posted_at) as last_purchase_at')
            )
            ->groupBy('parties.id', 'parties.name', 'parties.phone')
            ->orderByDesc('total_spend')
            ->get();

        return $overall->map(function ($row) use ($byCategory, $byProduct) {
            $cats = $byCategory->get($row->party_id, collect());
            $favCategory = $cats->sortByDesc('spend')->first();
            // Least-favorite category: the lowest-spend category this customer
            // still bought from at least once (distinct from a category they
            // never bought — that's simply absent from $cats entirely, not
            // "least favorite" in any meaningful sense). Only meaningful when
            // the customer bought from 2+ distinct categories; a single-category
            // customer has no genuine least-favorite, so leave it blank.
            $leastFavCategory = $cats->count() > 1 ? $cats->sortBy('spend')->first() : null;

            $prods = $byProduct->get($row->party_id, collect());
            $favProduct = $prods->sortByDesc('qty')->first();

            return [
                'party_id'          => $row->party_id,
                'party_name'        => $row->party_name,
                'party_phone'       => $row->party_phone,
                'invoice_count'     => (int) $row->invoice_count,
                'total_spend'       => round((float) $row->total_spend, 2),
                'avg_invoice_value' => $row->invoice_count > 0 ? round((float) $row->total_spend / (int) $row->invoice_count, 2) : 0.0,
                'last_purchase_at'  => $row->last_purchase_at,
                'favorite_category' => $favCategory->category_name ?? '—',
                'favorite_category_spend' => round((float) ($favCategory->spend ?? 0), 2),
                'least_favorite_category' => $leastFavCategory->category_name ?? '—',
                'least_favorite_category_spend' => round((float) ($leastFavCategory->spend ?? 0), 2),
                'categories_purchased' => $cats->count(),
                'most_bought_item'  => $favProduct->product_name ?? '—',
                'most_bought_item_qty' => round((float) ($favProduct->qty ?? 0), 2),
            ];
        });
    }

    /**
     * Supplier Insights & Price History — which suppliers source which products,
     * and how the purchase unit_cost has moved over time per product per supplier.
     *
     * @return array{
     *   sourcing: \Illuminate\Support\Collection,   supplier -> product sourcing map
     *   price_history: \Illuminate\Support\Collection   chronological unit_cost points per product+supplier
     * }
     */
    public function getSupplierInsights(string $start, string $end): array
    {
        $tenantId = app('current.tenant')->id;

        // Part A: From purchases & purchase_items
        $sourcingA = DB::table('purchase_items')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->join('parties', 'parties.id', '=', 'purchases.party_id')
            ->leftJoin('products', 'products.id', '=', 'purchase_items.product_id')
            ->where('purchases.tenant_id', $tenantId)
            ->where('parties.type', 'supplier')
            ->whereBetween('purchases.purchase_date', [$start, $end])
            ->select(
                'parties.id as supplier_id',
                'parties.name as supplier_name',
                'purchase_items.product_id as product_id',
                DB::raw("COALESCE(products.name, 'Unknown Sourced Item') as product_name"),
                'purchase_items.qty as qty',
                'purchase_items.unit_cost as unit_cost',
                'purchases.id as purchase_id'
            )->get();

        // Part B: From invoices & invoice_items (where invoices.type = 'purchase')
        $sourcingB = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('parties', 'parties.id', '=', 'invoices.party_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->where('invoices.tenant_id', $tenantId)
            ->where('invoices.type', 'purchase')
            ->where('parties.type', 'supplier')
            ->whereBetween('invoices.date', [$start, $end])
            ->select(
                'parties.id as supplier_id',
                'parties.name as supplier_name',
                'invoice_items.product_id as product_id',
                DB::raw("COALESCE(products.name, 'Unknown Sourced Item') as product_name"),
                'invoice_items.received_qty as qty',
                'invoice_items.effective_unit_cost as unit_cost',
                'invoices.id as purchase_id'
            )->get();

        // Merge raw points
        $mergedPoints = $sourcingA->concat($sourcingB);

        // Group by supplier-product pairs to calculate summaries
        $sourcing = $mergedPoints->groupBy(function($item) {
            return $item->supplier_id . '_' . $item->product_id;
        })->map(function($group) {
            $first = $group->first();
            $costs = $group->pluck('unit_cost')->map(fn($c) => (float)$c);
            $minCost = $costs->min();
            $maxCost = $costs->max();
            $avgCost = $costs->avg();
            $totalQty = $group->sum('qty');
            $purchaseCount = $group->pluck('purchase_id')->unique()->count();

            return [
                'supplier_id'          => $first->supplier_id,
                'supplier_name'        => $first->supplier_name,
                'product_id'           => $first->product_id,
                'product_name'         => $first->product_name,
                'total_qty_purchased'  => round((float) $totalQty, 4),
                'avg_unit_cost'        => round((float) $avgCost, 2),
                'min_unit_cost'        => round((float) $minCost, 2),
                'max_unit_cost'        => round((float) $maxCost, 2),
                'cost_variance_pct'    => $minCost > 0 ? round((($maxCost - $minCost) / $minCost) * 100, 1) : 0.0,
                'purchase_count'       => (int) $purchaseCount,
            ];
        })->values();

        // Build unified chronological price history series
        // Part A price history points
        $historyA = DB::table('purchase_items')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->join('parties', 'parties.id', '=', 'purchases.party_id')
            ->leftJoin('products', 'products.id', '=', 'purchase_items.product_id')
            ->where('purchases.tenant_id', $tenantId)
            ->where('parties.type', 'supplier')
            ->whereBetween('purchases.purchase_date', [$start, $end])
            ->select(
                'purchase_items.product_id as product_id',
                DB::raw("COALESCE(products.name, 'Unknown Sourced Item') as product_name"),
                'parties.id as supplier_id',
                'parties.name as supplier_name',
                'purchases.purchase_date as date',
                'purchase_items.unit_cost as unit_cost',
                'purchase_items.qty as qty'
            )->get();

        // Part B price history points
        $historyB = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->join('parties', 'parties.id', '=', 'invoices.party_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->where('invoices.tenant_id', $tenantId)
            ->where('invoices.type', 'purchase')
            ->where('parties.type', 'supplier')
            ->whereBetween('invoices.created_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select(
                'invoice_items.product_id as product_id',
                DB::raw("COALESCE(products.name, 'Unknown Sourced Item') as product_name"),
                'parties.id as supplier_id',
                'parties.name as supplier_name',
                DB::raw('DATE(invoices.created_at) as date'),
                'invoice_items.effective_unit_cost as unit_cost',
                'invoice_items.received_qty as qty'
            )->get();

        $priceHistory = $historyA->concat($historyB)
            ->sortBy('date')
            ->map(fn ($r) => [
                'product_id'     => $r->product_id,
                'product_name'   => $r->product_name,
                'supplier_id'    => $r->supplier_id,
                'supplier_name'  => $r->supplier_name,
                'date'           => $r->date,
                'unit_cost'      => round((float) $r->unit_cost, 2),
                'qty'            => round((float) $r->qty, 4),
            ])
            ->groupBy('product_id');

        return ['sourcing' => $sourcing, 'price_history' => $priceHistory];
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

        $tenantId = app('current.tenant')->id;
        // 2. Transactions in Period
        $items = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
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
        // Output Tax: credits on account 2100 (Sales Tax Payable — credit-normal liability)
        $outputTaxAccount = Account::where('code', '2100')->first();
        $outputTax = 0.0;
        if ($outputTaxAccount) {
            $outputTax = $this->sumJournalItems($outputTaxAccount->id, 'credit', $start, $end)
                       - $this->sumJournalItems($outputTaxAccount->id, 'debit',  $start, $end);
            $outputTax = max(0.0, (float) $outputTax);
        }

        // Input Tax: debits on account 2300 (Input Tax — debit-normal asset)
        // Also accept debits on 2100 itself (legacy: some setups post input tax on 2100)
        $inputTaxAccount = Account::where('code', '2300')->first();
        $inputTax = 0.0;
        if ($inputTaxAccount) {
            $inputTax = $this->sumJournalItems($inputTaxAccount->id, 'debit',  $start, $end)
                      - $this->sumJournalItems($inputTaxAccount->id, 'credit', $start, $end);
            $inputTax = max(0.0, (float) $inputTax);
        }
        // Fallback: if no 2300 account, input tax = debits on 2100
        if (!$inputTaxAccount) {
            $inputTax = $outputTaxAccount
                ? (float) $this->sumJournalItems($outputTaxAccount->id, 'debit', $start, $end)
                : 0.0;
        }

        $tenantId = app('current.tenant')->id;
        $details = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->where(function($q) use ($outputTaxAccount, $inputTaxAccount) {
                if ($outputTaxAccount) $q->orWhere('journal_items.account_id', $outputTaxAccount->id);
                if ($inputTaxAccount)  $q->orWhere('journal_items.account_id', $inputTaxAccount->id);
            })
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
            'details'     => $details,
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
        $tenantId = app('current.tenant')->id;
        // Identify all Cash/Bank accounts (Codes 1000-1099)
        $cashAccounts = Account::where('tenant_id', $tenantId)
            ->where('type', 'asset')
            ->whereBetween('code', ['1000', '1099'])
            ->pluck('id')
            ->toArray();
        // 1. Operating Inflow (Debits to Cash where partner account is Income or Receivable)
        $inflow = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->whereIn('journal_items.account_id', $cashAccounts)
            ->where('journal_items.debit', '>', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.debit');

        // 2. Operating Outflow (Credits to Cash where partner account is Expense or Payable)
        $outflow = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->whereIn('journal_items.account_id', $cashAccounts)
            ->where('journal_items.credit', '>', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.credit');

        return [
            'operating_inflow'  => (float) $inflow,
            'operating_outflow' => (float) $outflow,
            'net_cash_flow'     => (float) ($inflow - $outflow),
            'net_change_in_cash'=> (float) ($inflow - $outflow),
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

        $tenantId = app('current.tenant')->id;
        $balances = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.date', '<=', $asOf)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('account_id, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        foreach ($allAccounts as $account) {
            // Compute the balance from pre-fetched journal_items
            $sum = $balances->get($account->id);
            $debit  = (float) ($sum->total_debit  ?? 0.0);
            $credit = (float) ($sum->total_credit ?? 0.0);

            if (in_array($account->type, ['asset', 'expense'])) {
                $balance = $debit - $credit;
            } else {
                $balance = $credit - $debit;
            }

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

        // Add retained earnings (all-time net profit up to $asOf)
        $plAllTime = $this->getProfitAndLoss('1900-01-01', $asOf);
        $retainedEarnings = (float) $plAllTime['net_profit'];

        $sections['equity']['accounts'][] = [
            'id'      => 'RE',
            'code'    => 'RE',
            'name'    => 'Retained Earnings (current period)',
            'balance' => round($retainedEarnings, 2),
        ];
        $sections['equity']['total'] += $retainedEarnings;

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

    public function getTrialBalance(?string $asOf = null): array
    {
        $tenantId = app('current.tenant')->id;
        $query = DB::table('accounts as a')
            ->where('a.tenant_id', $tenantId)
            ->leftJoin('journal_items as ji', function($join) use ($tenantId) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('ji.tenant_id', $tenantId);
            })
            ->leftJoin('journal_entries as je', function ($join) use ($asOf, $tenantId) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tenantId)
                     ->where('je.is_reversed', 0);
                if ($asOf) {
                    $join->where('je.date', '<=', $asOf);
                }
            })
            ->where('a.is_active', 1)
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type', 'a.normal_balance')
            ->orderBy('a.code')
            ->selectRaw('
                a.id, a.code, a.name, a.type, a.normal_balance,
                SUM(CASE WHEN je.id IS NOT NULL THEN ji.debit ELSE 0 END)  AS total_debit,
                SUM(CASE WHEN je.id IS NOT NULL THEN ji.credit ELSE 0 END) AS total_credit
            ')
            ->get();

        $rows = []; $grandDebit = 0; $grandCredit = 0;
        foreach ($query as $row) {
            $balance = $row->normal_balance === 'debit'
                ? round($row->total_debit - $row->total_credit, 2)
                : round($row->total_credit - $row->total_debit, 2);
            $rows[] = [
                'code'           => $row->code,
                'name'           => $row->name,
                'type'           => $row->type,
                'normal_balance' => $row->normal_balance,
                'total_debit'    => round((float) $row->total_debit,  2),
                'total_credit'   => round((float) $row->total_credit, 2),
                'balance'        => $balance,
            ];
            if ($row->normal_balance === 'debit') {
                if ($balance >= 0) {
                    $grandDebit += $balance;
                } else {
                    $grandCredit += abs($balance);
                }
            } else {
                if ($balance >= 0) {
                    $grandCredit += $balance;
                } else {
                    $grandDebit += abs($balance);
                }
            }
        }
        return [
            'as_of'        => $asOf ?? 'all time',
            'rows'         => $rows,
            'grand_debit'  => round($grandDebit,  2),
            'grand_credit' => round($grandCredit, 2),
            'balanced'     => abs($grandDebit - $grandCredit) < 0.01,
        ];
    }

    public function getDetailedCashFlow(string $start, string $end): array
    {
        $tenantId = app('current.tenant')->id;
        $cashAccounts = ['1000', '1010'];
        $rows = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tenantId)
            ->join('journal_entries as je', function($join) use ($tenantId) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tenantId);
            })
            ->join('accounts as a', function($join) use ($tenantId) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('a.tenant_id', $tenantId);
            })
            ->where('je.is_reversed', 0)
            ->whereIn('a.code', $cashAccounts)
            ->whereBetween('je.date', [$start, $end])
            ->selectRaw('
                je.reference_type, je.description, je.date,
                SUM(ji.debit)  AS cash_in,
                SUM(ji.credit) AS cash_out
            ')
            ->groupBy('je.id', 'je.reference_type', 'je.description', 'je.date')
            ->orderBy('je.date')
            ->get();

        $operating = []; $investing = []; $financing = [];
        $operatingTypes = ['sale','payment','purchase','salary_payment',
            'settlement_payment','cash_shortage','operating_expense',
            'donation','advance_receipt','advance_payment'];
        $investingTypes = ['asset_purchase','insurance_recovery'];
        $financingTypes = ['loan_drawdown','loan_repayment',
            'owner_drawing','capital_injection','bank_transfer'];

        foreach ($rows as $row) {
            $net   = round((float)$row->cash_in - (float)$row->cash_out, 2);
            $entry = [
                'date'        => $row->date,
                'description' => $row->description,
                'type'        => $row->reference_type,
                'cash_in'     => round((float)$row->cash_in,  2),
                'cash_out'    => round((float)$row->cash_out, 2),
                'net'         => $net,
            ];
            if (in_array($row->reference_type, $operatingTypes))      { $operating[] = $entry; }
            elseif (in_array($row->reference_type, $investingTypes))   { $investing[] = $entry; }
            elseif (in_array($row->reference_type, $financingTypes))   { $financing[] = $entry; }
            else                                                         { $operating[] = $entry; }
        }
        $sumNet = fn($arr) => round(array_sum(array_column($arr, 'net')), 2);
        return [
            'period'             => ['from' => $start, 'to' => $end],
            'operating'          => $operating,
            'investing'          => $investing,
            'financing'          => $financing,
            'net_operating'      => $sumNet($operating),
            'net_investing'      => $sumNet($investing),
            'net_financing'      => $sumNet($financing),
            'net_change_in_cash' => round($sumNet($operating)+$sumNet($investing)+$sumNet($financing), 2),
        ];
    }

    public function getAgedReceivables(?string $asOf = null): AgedReportResult
    {
        $asOf     = $asOf ?? now()->toDateString();
        $tenantId = app('current.tenant')->id;
        $sales = DB::table('sales as s')
            ->where('s.tenant_id', $tenantId)
            ->join('parties as p', function($join) use ($tenantId) {
                $join->on('s.party_id', '=', 'p.id')->where('p.tenant_id', $tenantId);
            })
            ->whereIn('s.status', ['posted', 'partially_returned'])
            ->whereNotIn('s.payment_status', ['paid', 'written_off'])
            ->where('s.posted_at', '<=', $asOf . ' 23:59:59')
            ->selectRaw('s.id, s.reference_number, s.posted_at, s.invoice_total AS total_amount,
                         p.id AS party_id, p.name AS party_name')
            ->get();

        $rows = [];
        foreach ($sales as $sale) {
            $allocated = (float) DB::table('payment_allocations')
                ->where('tenant_id', $tenantId)->where('sale_id', $sale->id)
                ->where('status', 'active')->sum('allocated_amount');
            $returnedAmount = (float) DB::table('sale_items')
                ->where('sale_id', $sale->id)
                ->where('tenant_id', $tenantId)
                ->selectRaw('SUM(returned_quantity * (net_amount / COALESCE(NULLIF(quantity, 0), 1))) as ret')
                ->value('ret');
            $outstanding = round($sale->total_amount - $allocated - $returnedAmount, 2);
            if ($outstanding <= 0) continue;
            $ageDays = Carbon::parse($sale->posted_at)->diffInDays($asOf);
            $rows[] = [
                'party_id' => $sale->party_id, 'party_name' => $sale->party_name,
                'invoice_number' => $sale->reference_number, 'sale_date' => $sale->posted_at,
                'outstanding' => $outstanding, 'age_days' => $ageDays,
                'bucket' => $this->ageBucket($ageDays),
                'total' => $outstanding,
                'balance' => $outstanding,
            ];
        }

        // Add credit balances/unallocated advances to match GL 1200
        $parties = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->get();
        foreach ($parties as $party) {
            $sumInvoices = collect($rows)->where('party_id', $party->id)->sum('outstanding');
            
            $netGl = DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                ->where('ji.tenant_id', $tenantId)
                ->where('je.tenant_id', $tenantId)
                ->where('a.tenant_id', $tenantId)
                ->where('ji.party_id', $party->id)
                ->where('a.code', '1200')
                ->where('je.is_reversed', 0)
                ->where('je.date', '<=', $asOf)
                ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as bal')
                ->value('bal') ?? 0;
            
            $netGl = round((float)$netGl, 2);
            if (round($netGl - $sumInvoices, 2) < -0.01) {
                $creditAmount = round($netGl - $sumInvoices, 2);
                $rows[] = [
                    'party_id' => $party->id, 'party_name' => $party->name,
                    'invoice_number' => 'Credit / Advance', 'sale_date' => $asOf,
                    'outstanding' => $creditAmount, 'age_days' => 0,
                    'bucket' => '0-30',
                    'total' => $creditAmount,
                    'balance' => $creditAmount,
                ];
            }
        }

        return new AgedReportResult([
            'as_of'   => $asOf, 'rows' => $rows,
            'summary' => $this->ageBucketSummary($rows),
            'total'   => round(array_sum(array_column($rows, 'outstanding')), 2),
        ]);
    }

    public function getAgedPayables(?string $asOf = null): AgedReportResult
    {
        $asOf     = $asOf ?? now()->toDateString();
        $tenantId = app('current.tenant')->id;
        $purchases = DB::table('purchases as pu')
            ->where('pu.tenant_id', $tenantId)
            ->join('parties as p', function($join) use ($tenantId) {
                $join->on('pu.party_id', '=', 'p.id')->where('p.tenant_id', $tenantId);
            })
            ->where('pu.purchase_date', '<=', $asOf)
            ->selectRaw('pu.id, pu.invoice_number, pu.purchase_date,
                         pu.total AS total_amount, p.id AS party_id, p.name AS party_name')
            ->get();

        $rows = [];
        foreach ($purchases as $purchase) {
            $allocated = (float) DB::table('payment_allocations')
                ->where('tenant_id', $tenantId)->where('purchase_id', $purchase->id)
                ->where('status', 'active')->sum('allocated_amount');
            $outstanding = round($purchase->total_amount - $allocated, 2);
            if ($outstanding <= 0) continue;
            $ageDays = Carbon::parse($purchase->purchase_date)->diffInDays($asOf);
            $rows[] = [
                'party_id' => $purchase->party_id, 'party_name' => $purchase->party_name,
                'invoice_number' => $purchase->invoice_number, 'purchase_date' => $purchase->purchase_date,
                'outstanding' => $outstanding, 'age_days' => $ageDays,
                'bucket' => $this->ageBucket($ageDays),
                'total' => $outstanding,
                'balance' => $outstanding,
            ];
        }

        // Add credit balances/unallocated advances to match GL 2000
        $parties = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->get();
        foreach ($parties as $party) {
            $sumInvoices = collect($rows)->where('party_id', $party->id)->sum('outstanding');
            
            $netGl = DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                ->where('ji.tenant_id', $tenantId)
                ->where('je.tenant_id', $tenantId)
                ->where('a.tenant_id', $tenantId)
                ->where('ji.party_id', $party->id)
                ->where('a.code', '2000')
                ->where('je.is_reversed', 0)
                ->where('je.date', '<=', $asOf)
                ->selectRaw('SUM(ji.credit) - SUM(ji.debit) as bal')
                ->value('bal') ?? 0;
            
            $netGl = round((float)$netGl, 2);
            if (round($netGl - $sumInvoices, 2) < -0.01) {
                $creditAmount = round($netGl - $sumInvoices, 2);
                $rows[] = [
                    'party_id' => $party->id, 'party_name' => $party->name,
                    'invoice_number' => 'Credit / Advance', 'purchase_date' => $asOf,
                    'outstanding' => $creditAmount, 'age_days' => 0,
                    'bucket' => '0-30',
                    'total' => $creditAmount,
                    'balance' => $creditAmount,
                ];
            }
        }

        return new AgedReportResult([
            'as_of'   => $asOf, 'rows' => $rows,
            'summary' => $this->ageBucketSummary($rows),
            'total'   => round(array_sum(array_column($rows, 'outstanding')), 2),
        ]);
    }

    public function getSalesReport(string $from, string $to, ?string $partyId = null, ?string $productId = null): array
    {
        $tenantId = app('current.tenant')->id;
        $query = DB::table('sales as s')
            ->where('s.tenant_id', $tenantId)
            ->join('sale_items as si', fn($j) => $j->on('si.sale_id','=','s.id')->where('si.tenant_id',$tenantId))
            ->join('products as pr',   fn($j) => $j->on('si.product_id','=','pr.id')->where('pr.tenant_id',$tenantId))
            ->join('parties as pa',    fn($j) => $j->on('s.party_id','=','pa.id')->where('pa.tenant_id',$tenantId))
            ->where('s.status', 'posted')
            ->whereBetween('s.posted_at', [$from, $to])
            ->selectRaw('s.id, s.reference_number AS invoice_number, s.posted_at AS sale_date,
                         pa.name AS customer_name, pr.id AS product_id, pr.name AS product_name,
                         si.quantity AS qty, si.unit_price, si.tax_rate, si.line_total, si.net_amount,
                         si.cost_price AS cogs_amount')
            ->orderBy('s.posted_at');
        if ($partyId)   { $query->where('s.party_id',     $partyId); }
        if ($productId) { $query->where('si.product_id',  $productId); }
        $rows = $query->get()->toArray();
        return [
            'period'        => ['from' => $from, 'to' => $to],
            'rows'          => $rows,
            'total_revenue' => round(array_sum(array_column($rows, 'net_amount')),   2),
            'total_cogs'    => round(array_sum(array_column($rows, 'cogs_amount')), 2),
        ];
    }

    public function getPurchasesReport(string $from, string $to, ?string $partyId = null): array
    {
        $tenantId = app('current.tenant')->id;
        $query = DB::table('purchases as pu')
            ->where('pu.tenant_id', $tenantId)
            ->join('purchase_items as pi', fn($j) => $j->on('pi.purchase_id','=','pu.id')->where('pi.tenant_id',$tenantId))
            ->join('products as pr',      fn($j) => $j->on('pi.product_id','=','pr.id')->where('pr.tenant_id',$tenantId))
            ->join('parties as pa',       fn($j) => $j->on('pu.party_id','=','pa.id')->where('pa.tenant_id',$tenantId))
            ->whereBetween('pu.purchase_date', [$from, $to])
            ->selectRaw('pu.id, pu.invoice_number, pu.purchase_date,
                         pa.name AS supplier_name, pr.name AS product_name,
                         pi.qty, pi.unit_cost, (pi.line_total * (1 + pi.tax_rate / 100)) AS line_total')
            ->orderBy('pu.purchase_date');
        if ($partyId) { $query->where('pu.party_id', $partyId); }
        $rows = $query->get()->toArray();
        return [
            'period'      => ['from' => $from, 'to' => $to],
            'rows'        => $rows,
            'total_spend' => round(array_sum(array_column($rows, 'line_total')), 2),
        ];
    }

    public function getCogsReport(string $from, string $to): array
    {
        $tenantId = app('current.tenant')->id;
        $rows = DB::table('sale_item_batches as sib')
            ->where('sib.tenant_id', $tenantId)
            ->join('sale_items as si',  fn($j) => $j->on('sib.sale_item_id','=','si.id')->where('si.tenant_id',$tenantId))
            ->join('sales as s',        fn($j) => $j->on('si.sale_id','=','s.id')->where('s.tenant_id',$tenantId))
            ->join('products as p',     fn($j) => $j->on('si.product_id','=','p.id')->where('p.tenant_id',$tenantId))
            ->where('s.status', 'posted')
            ->where('sib.is_reversed', 0)
            ->whereBetween('s.posted_at', [$from, $to])
            ->selectRaw('p.id AS product_id, p.name AS product_name,
                         SUM(sib.qty_deducted) AS total_qty_sold,
                         SUM(sib.total_cogs)   AS total_cogs')
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('total_cogs')
            ->get()->toArray();

        $cogsAccount = Account::where('code', '5000')->first();
        $ledger5000  = 0.0;
        if ($cogsAccount) {
            $ledger5000 = (float) $this->sumJournalItems($cogsAccount->id, 'debit', $from, $to)
                        - (float) $this->sumJournalItems($cogsAccount->id, 'credit', $from, $to);
        }
        return [
            'period'      => ['from' => $from, 'to' => $to],
            'rows'        => $rows,
            'total_cogs'  => round(array_sum(array_column($rows, 'total_cogs')), 2),
            'ledger_5000' => $ledger5000,
            'reconciled'  => abs(array_sum(array_column($rows, 'total_cogs')) - $ledger5000) < 0.01,
        ];
    }

    public function getPartyLedger(string $partyId, string $from, string $to): array
    {
        $tenantId = app('current.tenant')->id;
        $party = DB::table('parties')->where('tenant_id', $tenantId)->where('id', $partyId)->firstOrFail();
        $accountCode = $party->type === 'supplier' ? '2000' : '1200';

        $lines = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tenantId)
            ->join('journal_entries as je', fn($j) => $j->on('ji.journal_entry_id','=','je.id')->where('je.tenant_id',$tenantId))
            ->join('accounts as a',         fn($j) => $j->on('ji.account_id','=','a.id')->where('a.tenant_id',$tenantId))
            ->where('ji.party_id', $partyId)
            ->where('a.code', $accountCode)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->selectRaw('je.date, je.reference_type, je.description,
                         a.code AS account_code, a.name AS account_name, ji.debit, ji.credit')
            ->orderBy('je.date')->orderBy('je.created_at')
            ->get()->toArray();

        $rawOp = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tenantId)
            ->join('journal_entries as je', fn($j) => $j->on('ji.journal_entry_id','=','je.id')->where('je.tenant_id',$tenantId))
            ->join('accounts as a',         fn($j) => $j->on('ji.account_id','=','a.id')->where('a.tenant_id',$tenantId))
            ->where('ji.party_id', $partyId)
            ->where('a.code', $accountCode)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<', $from)
            ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
            ->first();

        $drOp = (float)($rawOp->total_debit ?? 0);
        $crOp = (float)($rawOp->total_credit ?? 0);
        $openingBalance = $accountCode === '2000' ? ($crOp - $drOp) : ($drOp - $crOp);

        $runningBalance = $openingBalance;
        $ledgerLines = [];
        foreach ($lines as $line) {
            if ($accountCode === '2000') {
                $runningBalance += (float)$line->credit - (float)$line->debit;
            } else {
                $runningBalance += (float)$line->debit - (float)$line->credit;
            }
            $ledgerLines[] = array_merge((array)$line, ['running_balance' => round($runningBalance, 2)]);
        }
        return [
            'party'           => ['id' => $party->id, 'name' => $party->name],
            'period'          => ['from' => $from, 'to' => $to],
            'opening_balance' => round($openingBalance, 2),
            'lines'           => $ledgerLines,
            'closing_balance' => round($runningBalance, 2),
        ];
    }

    public function getInventoryMovement(string $from, string $to, ?string $productId = null): array
    {
        $tenantId = app('current.tenant')->id;
        $inflows = DB::table('inventory_batches as ib')
            ->where('ib.tenant_id', $tenantId)
            ->join('products as p', fn($j) => $j->on('ib.product_id','=','p.id')->where('p.tenant_id',$tenantId))
            ->whereNull('ib.deleted_at')
            ->whereBetween('ib.created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('p.id AS product_id, p.name AS product_name, ib.batch_type,
                         SUM(ib.initial_qty) AS qty_in, SUM(ib.initial_qty * ib.unit_cost) AS value_in')
            ->groupBy('p.id', 'p.name', 'ib.batch_type')->orderBy('p.name');
        if ($productId) { $inflows->where('ib.product_id', $productId); }

        $outflows = DB::table('sale_item_batches as sib')
            ->where('sib.tenant_id', $tenantId)
            ->join('sale_items as si', fn($j) => $j->on('sib.sale_item_id','=','si.id')->where('si.tenant_id',$tenantId))
            ->join('sales as s',       fn($j) => $j->on('si.sale_id','=','s.id')->where('s.tenant_id',$tenantId))
            ->join('products as p',    fn($j) => $j->on('si.product_id','=','p.id')->where('p.tenant_id',$tenantId))
            ->where('s.status', 'posted')->where('sib.is_reversed', 0)
            ->whereBetween('s.posted_at', [$from, $to])
            ->selectRaw('p.id AS product_id, p.name AS product_name,
                         SUM(sib.qty_deducted) AS qty_out, SUM(sib.total_cogs) AS value_out')
            ->groupBy('p.id', 'p.name');
        if ($productId) { $outflows->where('si.product_id', $productId); }

        return [
            'period'   => ['from' => $from, 'to' => $to],
            'inflows'  => $inflows->get()->toArray(),
            'outflows' => $outflows->get()->toArray(),
        ];
    }

    private function ageBucket(int $days): string
    {
        return match(true) {
            $days <= 30  => '0-30',
            $days <= 60  => '31-60',
            $days <= 90  => '61-90',
            default      => '90+',
        };
    }

    private function ageBucketSummary(array $rows): array
    {
        $buckets = ['0-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0];
        foreach ($rows as $row) {
            $buckets[$row['bucket']] = round($buckets[$row['bucket']] + $row['outstanding'], 2);
        }
        return $buckets;
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
            ->where('journal_entries.is_reversed', 0)
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

class AgedReportResult implements \ArrayAccess, \IteratorAggregate, \JsonSerializable, \Countable
{
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function offsetExists($offset): bool { return isset($this->data[$offset]); }
    public function offsetGet($offset): mixed { return $this->data[$offset]; }
    public function offsetSet($offset, $value): void { $this->data[$offset] = $value; }
    public function offsetUnset($offset): void { unset($this->data[$offset]); }

    public function getIterator(): \Traversable
    {
        return new \ArrayIterator($this->data['rows'] ?? []);
    }

    public function jsonSerialize(): mixed
    {
        return $this->data;
    }

    public function count(): int
    {
        return count($this->data['rows'] ?? []);
    }
}

