<?php

namespace App\Services\Accounting;

use App\Engines\AccountingService;
use App\Models\Account;
use App\Models\AccountingPeriodLock;
use App\Models\FiscalYear;
use App\Models\FiscalYearCloseCheck;
use App\Models\FiscalYearEvent;
use App\Models\JournalEntry;
use App\Models\Tenant;
use App\Models\User;
use App\Support\ManagerApproval;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class FiscalYearService
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    /**
     * Create or open a new fiscal year for a tenant.
     */
    public function createFiscalYear(
        int|string $tenantId,
        string $name,
        string $startDate,
        string $endDate,
        ?User $creator = null,
        ?string $retainedEarningsAccountId = null,
        ?string $notes = null
    ): FiscalYear {
        $start = Carbon::parse($startDate)->toDateString();
        $end   = Carbon::parse($endDate)->toDateString();

        if (Carbon::parse($start)->greaterThanOrEqualTo(Carbon::parse($end))) {
            throw new InvalidArgumentException('Fiscal year start_date must be before end_date.');
        }

        // Check overlapping fiscal years for this tenant
        $overlap = DB::table('fiscal_years')
            ->where('tenant_id', (string) $tenantId)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date', [$start, $end])
                  ->orWhere(function ($sub) use ($start, $end) {
                      $sub->where('start_date', '<=', $start)
                          ->where('end_date', '>=', $end);
                  });
            })
            ->exists();

        if ($overlap) {
            throw new InvalidArgumentException("Fiscal year dates ({$start} to {$end}) overlap with an existing fiscal year record.");
        }

        // Resolve or validate Retained Earnings account
        if (!$retainedEarningsAccountId) {
            $retainedAccount = $this->resolveRetainedEarningsAccount($tenantId);
            $retainedEarningsAccountId = $retainedAccount->id;
        } else {
            $exists = Account::withoutGlobalScopes()
                ->where('tenant_id', (string) $tenantId)
                ->where('id', $retainedEarningsAccountId)
                ->exists();
            if (!$exists) {
                throw new InvalidArgumentException("Specified retained earnings account [{$retainedEarningsAccountId}] does not exist for this tenant.");
            }
        }

        $fy = FiscalYear::create([
            'tenant_id'                   => (string) $tenantId,
            'name'                        => $name,
            'start_date'                  => $start,
            'end_date'                    => $end,
            'status'                      => FiscalYear::STATUS_OPEN,
            'retained_earnings_account_id'=> $retainedEarningsAccountId,
            'opened_by'                   => $creator?->id,
            'opened_at'                   => now(),
            'notes'                       => $notes,
        ]);

        $this->logEvent($fy, 'created', $creator?->id, [
            'name'       => $name,
            'start_date' => $start,
            'end_date'   => $end,
        ]);

        return $fy;
    }

    /**
     * Generate read-only pre-close checklist and preview figures.
     */
    public function previewClose(FiscalYear $fy): array
    {
        $tenantId = $fy->tenant_id;
        $startStr = $fy->start_date->toDateString();
        $endStr   = $fy->end_date->toDateString();

        // 1. Calculate P&L strictly between start_date and end_date
        $plAccounts = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->whereIn('type', ['income', 'expense'])
            ->where('is_active', 1)
            ->get();

        $proposedLines = [];
        $netProfit = 0.0;
        $totalIncome = 0.0;
        $totalExpense = 0.0;

        foreach ($plAccounts as $account) {
            $balance = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('ji.tenant_id', $tenantId)
                ->where('je.tenant_id', $tenantId)
                ->where('ji.account_id', $account->id)
                ->where('je.is_reversed', 0)
                ->whereBetween('je.date', [$startStr, $endStr])
                ->where('je.reference_type', '!=', 'fiscal_year_close')
                ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
                ->value('balance') ?? 0.0;

            $balance = round($balance, 2);
            if (abs($balance) < 0.01) continue;

            if ($account->type === 'income') {
                $totalIncome += abs($balance);
            } else {
                $totalExpense += abs($balance);
            }

            // $balance is DEBIT minus CREDIT.
            // Income accounts normally have negative balance (credits > debits).
            // Expense accounts normally have positive balance (debits > credits).
            $netProfit -= $balance;

            $proposedLines[] = [
                'account_id'   => $account->id,
                'account_code' => $account->code,
                'account_name' => $account->name,
                'account_type' => $account->type,
                'debit'        => $balance < 0 ? abs($balance) : 0,
                'credit'       => $balance > 0 ? $balance : 0,
            ];
        }

        $netProfit = round($netProfit, 2);

        // Retained Earnings Line
        $retainedAccount = Account::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('id', $fy->retained_earnings_account_id)
            ->first() ?? $this->resolveRetainedEarningsAccount($tenantId);

        if ($netProfit >= 0) {
            $proposedLines[] = [
                'account_id'   => $retainedAccount->id,
                'account_code' => $retainedAccount->code,
                'account_name' => $retainedAccount->name,
                'account_type' => 'equity',
                'debit'        => 0,
                'credit'       => $netProfit,
            ];
        } else {
            $proposedLines[] = [
                'account_id'   => $retainedAccount->id,
                'account_code' => $retainedAccount->code,
                'account_name' => $retainedAccount->name,
                'account_type' => 'equity',
                'debit'        => round(abs($netProfit), 2),
                'credit'       => 0,
            ];
        }

        // 2. Perform Pre-Close Readiness Checks
        $checks = $this->runReadinessChecks($fy, $retainedAccount);

        // 3. Compute Preview Hash/Snapshot Key
        $hashData = [
            'fy_id'         => $fy->id,
            'start_date'    => $startStr,
            'end_date'      => $endStr,
            'net_profit'    => $netProfit,
            'lines_count'   => count($proposedLines),
            'retained_code' => $retainedAccount->code,
        ];
        $previewHash = md5(json_encode($hashData));

        return [
            'fiscal_year' => [
                'id'         => $fy->id,
                'name'       => $fy->name,
                'start_date' => $startStr,
                'end_date'   => $endStr,
                'status'     => $fy->status,
            ],
            'financial_summary' => [
                'total_income'     => round($totalIncome, 2),
                'total_expense'    => round($totalExpense, 2),
                'net_profit'       => $netProfit,
                'retained_account' => [
                    'id'   => $retainedAccount->id,
                    'code' => $retainedAccount->code,
                    'name' => $retainedAccount->name,
                ],
            ],
            'proposed_journal_lines' => $proposedLines,
            'checks'                 => $checks,
            'preview_hash'           => $previewHash,
            'can_close'              => collect($checks)->where('severity', 'blocking')->where('status', 'fail')->isEmpty(),
        ];
    }

    /**
     * Run all pre-close readiness checks for a fiscal year.
     */
    private function runReadinessChecks(FiscalYear $fy, Account $retainedAccount): array
    {
        $tenantId = $fy->tenant_id;
        $startStr = $fy->start_date->toDateString();
        $endStr   = $fy->end_date->toDateString();
        $checks   = [];

        // Check 1: Balanced Trial Balance up to end_date
        $totalDebits = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $endStr)
            ->sum('ji.debit');

        $totalCredits = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $endStr)
            ->sum('ji.credit');

        $tbDiff = abs(round($totalDebits - $totalCredits, 2));

        $checks[] = [
            'check_key'     => 'balanced_trial_balance',
            'label'         => 'Trial Balance Equality',
            'severity'      => 'blocking',
            'status'        => $tbDiff < 0.01 ? 'pass' : 'fail',
            'measured_value'=> "Debits: {$totalDebits}, Credits: {$totalCredits}, Diff: {$tbDiff}",
        ];

        // Check 2: Retained Earnings Account Valid
        $retainedValid = $retainedAccount && $retainedAccount->is_active && $retainedAccount->tenant_id == $tenantId;
        $checks[] = [
            'check_key'     => 'retained_earnings_account',
            'label'         => 'Retained Earnings Account Configured & Active',
            'severity'      => 'blocking',
            'status'        => $retainedValid ? 'pass' : 'fail',
            'measured_value'=> "Account [{$retainedAccount->code}] {$retainedAccount->name}",
        ];

        // Check 3: Pending Approval Documents in Fiscal Year
        $pendingApprovals = DB::table('approval_documents')
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->whereBetween('created_at', [$startStr . ' 00:00:00', $endStr . ' 23:59:59'])
            ->count();

        $checks[] = [
            'check_key'     => 'pending_approvals',
            'label'         => 'Pending Approval Documents',
            'severity'      => 'blocking',
            'status'        => $pendingApprovals === 0 ? 'pass' : 'fail',
            'measured_value'=> "{$pendingApprovals} document(s) pending approval in this period",
        ];

        // Check 4: Draft/Unposted Transactions
        $draftSales = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['draft', 'pending'])
            ->whereBetween('posted_at', [$startStr . ' 00:00:00', $endStr . ' 23:59:59'])
            ->count();

        $checks[] = [
            'check_key'     => 'draft_transactions',
            'label'         => 'Unposted Draft Transactions',
            'severity'      => 'warning',
            'status'        => $draftSales === 0 ? 'pass' : 'warning',
            'measured_value'=> "{$draftSales} draft sale(s) found",
        ];

        // Check 5: Asset Depreciation Status
        $depreciationEntries = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where('reference_type', 'depreciation')
            ->whereBetween('date', [$startStr, $endStr])
            ->count();

        $checks[] = [
            'check_key'     => 'asset_depreciation',
            'label'         => 'Fixed Asset Depreciation',
            'severity'      => 'warning',
            'status'        => $depreciationEntries > 0 ? 'pass' : 'warning',
            'measured_value'=> "{$depreciationEntries} depreciation run(s) logged in period",
        ];

        return $checks;
    }

    /**
     * Atomically close a fiscal year.
     */
    public function closeYear(
        FiscalYear $fy,
        User $requester,
        int $approverId,
        ?string $approvalPin = null,
        ?string $previewHash = null,
        ?string $overrideReason = null
    ): FiscalYear {
        $tenantId = $fy->tenant_id;

        // Verify Manager Approval & PIN
        $approverRole = ManagerApproval::roleOf($approverId, $tenantId);
        if (!in_array($approverRole, ['owner', 'admin'], true)) {
            throw new InvalidArgumentException('Fiscal year close requires owner or admin approval.');
        }

        $problem = ManagerApproval::check($approverId, $approvalPin, $tenantId, $requester->id);
        if ($problem !== null) {
            throw new InvalidArgumentException($problem);
        }

        return DB::transaction(function () use ($fy, $tenantId, $requester, $approverId, $previewHash, $overrideReason) {
            // Lock fiscal year row
            $lockedFy = FiscalYear::where('tenant_id', $tenantId)
                ->where('id', $fy->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedFy->status === FiscalYear::STATUS_CLOSED) {
                throw new \InvalidArgumentException("Fiscal year [{$lockedFy->name}] has already been closed.");
            }

            // Rerun preview & checks
            $preview = $this->previewClose($lockedFy);

            if (!$preview['can_close']) {
                $failedBlocking = collect($preview['checks'])
                    ->where('severity', 'blocking')
                    ->where('status', 'fail')
                    ->pluck('label')
                    ->implode(', ');
                throw new RuntimeException("Cannot close fiscal year due to blocking checks: {$failedBlocking}");
            }

            if ($previewHash && $preview['preview_hash'] !== $previewHash) {
                throw new RuntimeException("Ledger balances or configuration changed since preview was generated. Please review preview before closing.");
            }

            // Post closing journal
            $lines = [];
            foreach ($preview['proposed_journal_lines'] as $line) {
                $debit = round((float)($line['debit'] ?? 0), 2);
                $credit = round((float)($line['credit'] ?? 0), 2);
                if ($debit > 0 || $credit > 0) {
                    $lines[] = [
                        'account_code' => $line['account_code'],
                        'debit'        => $debit,
                        'credit'       => $credit,
                    ];
                }
            }

            $closeId = Str::uuid()->toString();

            $closeEntryId = null;
            if (!empty($lines)) {
                $closeEntry = $this->accounting->createEntry([
                    'date'           => $lockedFy->end_date->toDateString(),
                    'reference_type' => 'fiscal_year_close',
                    'reference'      => $lockedFy->id,
                    'description'    => "Fiscal year close — {$lockedFy->name}",
                    'approved_by'    => $approverId,
                    'user_id'        => $requester->id,
                ], $lines);
                $closeEntryId = $closeEntry->id;
            }

            // Update FiscalYear record
            $lockedFy->update([
                'status'                => FiscalYear::STATUS_CLOSED,
                'close_journal_entry_id'=> $closeEntryId,
                'closing_requested_by'  => $requester->id,
                'closing_approved_by'   => $approverId,
                'closed_at'             => now(),
                'preview_hash'          => $preview['preview_hash'],
            ]);

            // Save check records
            foreach ($preview['checks'] as $chk) {
                FiscalYearCloseCheck::create([
                    'tenant_id'      => $tenantId,
                    'fiscal_year_id' => $lockedFy->id,
                    'check_key'      => $chk['check_key'],
                    'severity'       => $chk['severity'],
                    'status'         => $chk['status'],
                    'measured_value' => $chk['measured_value'],
                    'reviewed_by'    => $requester->id,
                    'reviewed_at'    => now(),
                    'override_reason'=> $chk['severity'] === 'warning' ? $overrideReason : null,
                ]);
            }

            // Create/Update Accounting Period Lock
            AccountingPeriodLock::updateOrCreate(
                [
                    'tenant_id'      => $tenantId,
                    'fiscal_year_id' => $lockedFy->id,
                ],
                [
                    'id'                 => Str::uuid()->toString(),
                    'lock_type'          => AccountingPeriodLock::TYPE_SOFT,
                    'locked_through_date'=> $lockedFy->end_date->toDateString(),
                    'reason'             => "Fiscal year {$lockedFy->name} closed",
                    'created_by'         => $requester->id,
                    'is_active'          => true,
                ]
            );

            // Log Close Event
            $this->logEvent($lockedFy, 'close_completed', $requester->id, [
                'net_profit'    => $preview['financial_summary']['net_profit'],
                'close_entry_id'=> $closeEntry->id,
                'approver_id'   => $approverId,
            ]);

            return $lockedFy->fresh();
        });
    }

    /**
     * Reopen a closed fiscal year.
     */
    public function reopenYear(FiscalYear $fy, User $actor, string $reason): FiscalYear
    {
        $tenantId = $fy->tenant_id;

        return DB::transaction(function () use ($fy, $tenantId, $actor, $reason) {
            $lockedFy = FiscalYear::where('tenant_id', $tenantId)
                ->where('id', $fy->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedFy->status !== FiscalYear::STATUS_CLOSED) {
                throw new LogicException("Only a closed fiscal year can be reopened.");
            }

            // Check for Hard Lock
            $hardLock = AccountingPeriodLock::where('tenant_id', $tenantId)
                ->where('fiscal_year_id', $lockedFy->id)
                ->where('lock_type', AccountingPeriodLock::TYPE_HARD)
                ->where('is_active', true)
                ->exists();

            if ($hardLock) {
                throw new RuntimeException("This fiscal year has an irreversible hard lock and cannot be reopened.");
            }

            // Adjust or deactivate period lock BEFORE reversing entry so period guard allows reversal of the close journal
            $previousClosedEnd = DB::table('fiscal_years')
                ->where('tenant_id', $tenantId)
                ->where('status', FiscalYear::STATUS_CLOSED)
                ->where('id', '!=', $lockedFy->id)
                ->where('end_date', '<', $lockedFy->start_date->toDateString())
                ->orderBy('end_date', 'desc')
                ->value('end_date');

            $lock = AccountingPeriodLock::where('tenant_id', $tenantId)
                ->where('fiscal_year_id', $lockedFy->id)
                ->first();

            if ($lock) {
                if ($previousClosedEnd) {
                    $lock->update([
                        'locked_through_date' => $previousClosedEnd,
                        'reason'              => "Fiscal year {$lockedFy->name} reopened. Lock reverted to {$previousClosedEnd}",
                    ]);
                } else {
                    $lock->update(['is_active' => false]);
                }
            }

            // Reverse the close journal entry if it exists
            if ($lockedFy->close_journal_entry_id) {
                $this->accounting->reverseEntry($lockedFy->close_journal_entry_id, "Fiscal year {$lockedFy->name} reopened: {$reason}");
            }

            // Update status
            $lockedFy->update([
                'status'        => FiscalYear::STATUS_REOPENED,
                'reopened_by'   => $actor->id,
                'reopened_at'   => now(),
                'reopen_reason' => $reason,
                'close_version' => $lockedFy->close_version + 1,
            ]);

            $this->logEvent($lockedFy, 'reopened', $actor->id, [
                'reason'       => $reason,
                'close_version'=> $lockedFy->close_version,
            ]);

            return $lockedFy->fresh();
        });
    }

    /**
     * Resolve default Retained Earnings account (3100).
     */
    public function resolveRetainedEarningsAccount(int|string $tenantId): Account
    {
        return $this->accounting->getAccountByCode(
            code: '3100',
            defaultName: 'Retained Earnings',
            type: 'equity',
            normalBalance: 'credit'
        );
    }

    /**
     * Write immutable audit event to fiscal_year_events.
     */
    private function logEvent(FiscalYear $fy, string $eventType, ?int $actorId, ?array $payload = null): void
    {
        try {
            FiscalYearEvent::create([
                'id'            => Str::uuid()->toString(),
                'tenant_id'     => $fy->tenant_id,
                'fiscal_year_id'=> $fy->id,
                'event_type'    => $eventType,
                'actor_id'      => $actorId,
                'payload'       => $payload,
                'created_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Could not log fiscal year event: {$e->getMessage()}");
        }
    }
}
