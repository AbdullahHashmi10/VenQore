<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FiscalYearController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function close(Request $request)
    {
        $validated = $request->validate([
            'fiscal_year_end' => ['required', 'date'],
            'approved_by'     => ['required', 'string', 'exists:users,id'],
        ]);

        $tenantId = app('current.tenant')->id;
        $approver = DB::table('users')->where('users.tenant_id', app('current.tenant')->id)
            ->join('tenant_users', 'users.id', '=', 'tenant_users.user_id')
            ->where('tenant_users.tenant_id', $tenantId)
            ->where('users.id', $validated['approved_by'])
            ->select('users.*', 'tenant_users.role')
            ->first();

        if (!$approver || $approver->role !== 'admin') {
            return back()->withErrors([
                'approved_by' => 'Fiscal year close requires admin approval.',
            ]);
        }

        $yearEnd = Carbon::parse($validated['fiscal_year_end']);

        // Guard: cannot close a year that's already been closed
        $alreadyClosed = DB::table('journal_entries')->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('reference_type', 'fiscal_year_close')
            ->where('date', $yearEnd->toDateString())
            ->exists();

        if ($alreadyClosed) {
            return back()->withErrors([
                'fiscal_year_end' => 'This fiscal year has already been closed.',
            ]);
        }

        // Get all P&L account balances up to year end
        $plAccounts = DB::table('accounts')->where('accounts.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->whereIn('type', ['income', 'expense'])
            ->where('is_active', 1)
            ->get();

        $journalLines = [];
        $netProfit    = 0;

        foreach ($plAccounts as $account) {
            $balance = (float) DB::table('journal_items as ji')->where('ji.tenant_id', app('current.tenant')->id)
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('je.tenant_id', $tenantId)
                ->where('ji.account_id', $account->id)
                ->where('je.is_reversed', 0)
                ->where('je.date', '<=', $yearEnd->toDateString())
                ->where('je.reference_type', '!=', 'fiscal_year_close')
                ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
                ->value('balance') ?? 0;

            if (abs($balance) < 0.01) continue;

            // Zero the account: debit income accounts, credit expense accounts
            if ($account->normal_balance === 'credit') {
                // Income account — has credit balance, debit it to zero
                $netProfit += $balance;
                $journalLines[] = [
                    'account_code' => $account->code,
                    'debit'        => $balance,
                    'credit'       => 0,
                ];
            } else {
                // Expense account — has debit balance, credit it to zero
                $netProfit -= $balance;
                $journalLines[] = [
                    'account_code' => $account->code,
                    'debit'        => 0,
                    'credit'       => $balance,
                ];
            }
        }

        if (empty($journalLines)) {
            return back()->withErrors([
                'fiscal_year_end' => 'No P&L balances found for this period.',
            ]);
        }

        // Plug: net profit goes to Retained Earnings (3100)
        if ($netProfit >= 0) {
            $journalLines[] = [
                'account_code' => '3100',
                'debit'        => 0,
                'credit'       => round($netProfit, 2),
            ];
        } else {
            $journalLines[] = [
                'account_code' => '3100',
                'debit'        => round(abs($netProfit), 2),
                'credit'       => 0,
            ];
        }

        $closeId = Str::uuid()->toString();

        $this->accounting->createEntry([
            'date'           => $yearEnd->toDateString(),
            'reference_type' => 'fiscal_year_close',
            'reference'   => $closeId,
            'description'    => "Fiscal year close — {$yearEnd->format('Y')}",
            'approved_by'    => $validated['approved_by'],
        ], $journalLines);

        return redirect()->back()->with(
            'success',
            "Fiscal year {$yearEnd->format('Y')} closed. " .
            "Net profit Rs." . number_format($netProfit, 2) . " transferred to Retained Earnings."
        );
    }
}
