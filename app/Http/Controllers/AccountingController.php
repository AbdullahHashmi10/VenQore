<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Services\FinancialReportingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AccountingController extends Controller
{
    public function dashboard()
    {
        $now     = Carbon::now();
        $service = new FinancialReportingService();

        // ── Month-scoped P&L for the dashboard summary ──────────────────────
        $pnl = $service->getProfitAndLoss(
            $now->copy()->startOfMonth()->toDateString(),
            $now->copy()->endOfMonth()->toDateString()
        );

        // ── Receivables & Payables — real-time from journal_items ────────────
        $receivables = $service->getReceivables($now->toDateString());
        $payables    = $service->getPayables($now->toDateString());

        // ── Balance Sheet totals — call once, destructure ────────────────────
        // BUG-02 FIX: no longer reads accounts.balance cached column
        $bs = $service->getBalanceSheet($now->toDateString());

        // ── Recent Transactions (display only) ───────────────────────────────
        $recentTransactions = \App\Models\JournalEntry::with('items.account')
            ->latest('date')
            ->take(5)
            ->get();

        return Inertia::render('Accounting/Dashboard', [
            'stats' => [
                'total_income'       => $pnl['revenue'],
                'total_expense'      => $pnl['total_expenses'],
                'net_profit'         => $pnl['net_profit'],
                'gross_profit'       => $pnl['gross_profit'],
                'cogs'               => $pnl['cogs'],
                'total_receivables'  => $receivables,
                'total_payables'     => $payables,
                'total_assets'       => $bs['total_assets'],
                'total_liabilities'  => $bs['total_liabilities'],
                'total_equity'       => $bs['total_equity'],
            ],
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function index()
    {
        $accounts = Account::orderBy('code')->get();
        return Inertia::render('Accounting/ChartOfAccounts', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * The formal P&L statement — now delegates to FinancialReportingService.
     * Guaranteed to return identical numbers to /reports/profit-loss for the same dates.
     */
    public function profitAndLoss(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date',   Carbon::now()->endOfMonth()->toDateString());

        $pnl = (new FinancialReportingService())->getProfitAndLoss($startDate, $endDate);

        return Inertia::render('Accounting/ProfitLoss', [
            'incomeAccounts'  => $pnl['income_accounts'],
            'expenseAccounts' => $pnl['expense_accounts'],
            'totalIncome'     => $pnl['revenue'],
            'totalExpense'    => $pnl['total_expenses'],
            'grossProfit'     => $pnl['gross_profit'],
            'cogs'            => $pnl['cogs'],
            'netProfit'       => $pnl['net_profit'],
            'filters'         => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function balanceSheet(Request $request)
    {
        // BUG-02 FIX (CALCULATION_LOGIC.md §8 BUG-02)
        // Old code: read Account::balance (cached column, no date filter).
        // New code: FinancialReportingService::getBalanceSheet() reads journal_items
        //           exclusively and computes the correct balance as-of any date.
        $asOf   = $request->input('date', now()->toDateString());
        $report = (new FinancialReportingService())->getBalanceSheet($asOf);

        return Inertia::render('Accounting/BalanceSheet', $report);
    }

    public function apiIndex(Request $request)
    {
        $query = Account::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $query->whereNotIn('name', ['Inventory', 'Accounts Receivable']);

        return response()->json($query->get());
    }
}
