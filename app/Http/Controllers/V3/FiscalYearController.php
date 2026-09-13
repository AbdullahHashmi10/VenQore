<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\PlanGate;
use App\Engines\AccountingService;
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
        // ── Plan Gate: Fiscal Year Closing Wizard ──────────────────────────
        PlanGate::enforce('fiscal_year_closing');

        $validated = $request->validate([
            'fiscal_year_end' => ['required', 'date'],
            // users.id is a BIGINT: 'string' rejected every JSON caller sending the id
            // as a number (the documented contract: "approved_by": 1). 'integer'
            // accepts both 5 and "5".
            'approved_by'     => ['required', 'integer', 'exists:users,id'],
            'approval_pin'    => ['nullable', 'string', 'max:20'],
        ]);

        $tenantId = app('current.tenant')->id;

        // The store owner outranks an admin (owner ⊇ admin), so either may
        // approve. Managers, cashiers and other roles still may not. The role
        // comes from the ACTIVE tenant_users membership of THIS store (users has
        // no tenant_id — a user can belong to many stores).
        $approverRole = \App\Support\ManagerApproval::roleOf($validated['approved_by'], $tenantId);
        if (!in_array($approverRole, ['owner', 'admin'], true)) {
            return back()->withErrors([
                'approved_by' => 'Fiscal year close requires owner or admin approval.',
            ]);
        }

        // ...and the approval must be VERIFIED: the approver's PIN is required
        // whenever the approver is not the logged-in user (naming an admin's id
        // used to be enough to close the year in their name).
        $problem = \App\Support\ManagerApproval::check(
            $validated['approved_by'],
            $validated['approval_pin'] ?? null,
            $tenantId,
            auth()->id()
        );
        if ($problem !== null) {
            return back()->withErrors(['approved_by' => $problem]);
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

            $balance = round($balance, 2);
            if (abs($balance) < 0.01) continue;

            // $balance is the raw DEBIT-minus-CREDIT net for every account type:
            // income accounts normally come out negative (credit balance), expense
            // accounts positive. Post the opposite side to bring it to zero —
            // a net-debit account is credited, a net-credit account is debited —
            // and accumulate profit as credits minus debits.
            $netProfit -= $balance;
            $journalLines[] = [
                'account_code' => $account->code,
                'debit'        => $balance < 0 ? abs($balance) : 0,
                'credit'       => $balance > 0 ? $balance : 0,
            ];
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
