<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\DailySnapshot;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OwnerDailyPulseService
{
    /**
     * Calculate and save/update the daily snapshot for a tenant on a specific date.
     *
     * @param Tenant $tenant
     * @param string|Carbon $date
     * @return DailySnapshot
     */
    public function captureSnapshot(Tenant $tenant, $date): DailySnapshot
    {
        $dateString = $date instanceof Carbon ? $date->toDateString() : (string) $date;

        // Bind tenant to DI container for HasTenant and other scoping systems
        app()->instance('current.tenant', $tenant);

        // 1. Sales today (Sum of net_sales on posted sales)
        $salesValue = (float) Sale::posted()
            ->whereDate('posted_at', $dateString)
            ->sum('net_sales');

        // 2. Expense today (Sum of amount in expenses)
        $expenseValue = (float) Expense::whereDate('date', $dateString)
            ->sum('amount');

        // 2b. Purchases today (Sum of total_amount on purchase invoices)
        $purchasesValue = (float) \App\Models\Invoice::where('tenant_id', $tenant->id)
            ->where('type', 'purchase')
            ->whereDate('date', $dateString)
            ->sum('total_amount');

        // Instantiate FinancialReportingService
        $reportingService = new FinancialReportingService();

        // 3. Stock Value (FIFO stock valuation)
        $stockValue = (float) $reportingService->getInventoryValue();

        // 4. Receivables (Account 1200 debit-normal balance)
        $receivablesValue = (float) $reportingService->getReceivables($dateString);

        // 5. Payables (Account 2000 credit-normal balance)
        $payablesValue = (float) $reportingService->getPayables($dateString);

        // 6. Cash in Hand (Net balance for account code range 1000-1099)
        $cashAccounts = Account::where('tenant_id', $tenant->id)
            ->where('type', 'asset')
            ->whereBetween('code', ['1000', '1099'])
            ->pluck('id')
            ->toArray();

        if (empty($cashAccounts)) {
            $cashValue = 0.0;
        } else {
            $totals = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_items.tenant_id', $tenant->id)
                ->whereIn('journal_items.account_id', $cashAccounts)
                ->where('journal_entries.tenant_id', $tenant->id)
                ->where('journal_entries.date', '<=', $dateString)
                ->where('journal_entries.is_reversed', 0)
                ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
                ->first();

            $debit  = (float) ($totals->total_debit  ?? 0.0);
            $credit = (float) ($totals->total_credit ?? 0.0);
            $cashValue = $debit - $credit;
        }

        // Update or create the snapshot
        return DailySnapshot::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'date'      => $dateString,
            ],
            [
                'sales_value'       => $salesValue,
                'purchases_value'   => $purchasesValue,
                'stock_value'       => $stockValue,
                'payables_value'    => $payablesValue,
                'receivables_value' => $receivablesValue,
                'cash_value'        => $cashValue,
                'expense_value'     => $expenseValue,
            ]
        );
    }
}
