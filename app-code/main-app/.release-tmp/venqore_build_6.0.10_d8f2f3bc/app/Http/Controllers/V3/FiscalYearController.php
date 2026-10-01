<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountingLockException;
use App\Models\AccountingPeriodLock;
use App\Models\FiscalYear;
use App\Models\FiscalYearCloseCheck;
use App\Models\FiscalYearEvent;
use App\Models\TenantUser;
use App\Services\Accounting\FiscalYearService;
use App\Services\PlanGate;
use App\Support\ManagerApproval;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FiscalYearController extends Controller
{
    public function __construct(
        private FiscalYearService $fiscalYearService
    ) {}

    /**
     * List fiscal years, current active status, period locks, and exceptions.
     */
    public function index(Request $request)
    {
        PlanGate::enforce('fiscal_year_closing');

        $tenantId = app('current.tenant')->id;

        $fiscalYears = FiscalYear::where('tenant_id', $tenantId)
            ->orderBy('start_date', 'desc')
            ->get();

        $activeLock = AccountingPeriodLock::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('locked_through_date', 'desc')
            ->first();

        $activeExceptions = AccountingLockException::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('revoked_at')
            ->where('expires_at', '>=', now())
            ->with(['user'])
            ->get();

        $retainedAccounts = Account::where('tenant_id', $tenantId)
            ->where('type', 'equity')
            ->where('is_active', true)
            ->get(['id', 'code', 'name', 'role']);

        $data = [
            'fiscal_years'     => $fiscalYears,
            'active_lock'      => $activeLock,
            'active_exceptions'=> $activeExceptions,
            'retained_accounts'=> $retainedAccounts,
        ];

        if ($request->wantsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Admin/FiscalYears', [
            'mode' => 'admin',
            ...$data,
        ]);
    }

    /**
     * Create/Open a new Fiscal Year.
     */
    public function store(Request $request)
    {
        PlanGate::enforce('fiscal_year_closing');

        $validated = $request->validate([
            'name'                        => ['required', 'string', 'max:100'],
            'start_date'                  => ['required', 'date'],
            'end_date'                    => ['required', 'date', 'after:start_date'],
            'retained_earnings_account_id'=> ['nullable', 'string', 'exists:accounts,id'],
            'notes'                       => ['nullable', 'string', 'max:1000'],
        ]);

        $tenantId = app('current.tenant')->id;

        $fy = $this->fiscalYearService->createFiscalYear(
            tenantId: $tenantId,
            name: $validated['name'],
            startDate: $validated['start_date'],
            endDate: $validated['end_date'],
            creator: auth()->user(),
            retainedEarningsAccountId: $validated['retained_earnings_account_id'] ?? null,
            notes: $validated['notes'] ?? null
        );

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'fiscal_year' => $fy]);
        }

        return redirect()->back()->with('success', "Fiscal Year '{$fy->name}' created successfully.");
    }

    /**
     * Read-only pre-close preview and checklist.
     */
    public function preview(Request $request, string $id)
    {
        PlanGate::enforce('fiscal_year_closing');

        $tenantId = app('current.tenant')->id;

        $fy = FiscalYear::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $preview = $this->fiscalYearService->previewClose($fy);

        return response()->json($preview);
    }

    /**
     * Close a fiscal year.
     */
    public function close(Request $request)
    {
        PlanGate::enforce('fiscal_year_closing');

        $validated = $request->validate([
            'fiscal_year_id' => ['nullable', 'string', 'exists:fiscal_years,id'],
            'fiscal_year_end'=> ['required_without:fiscal_year_id', 'nullable', 'date'],
            'approved_by'    => ['required', 'integer', 'exists:users,id'],
            'approval_pin'   => ['nullable', 'string', 'max:20'],
            'preview_hash'   => ['nullable', 'string', 'max:64'],
            'override_reason'=> ['nullable', 'string', 'max:1000'],
        ]);

        $tenantId = app('current.tenant')->id;

        try {
            // Resolve target FiscalYear
            if (!empty($validated['fiscal_year_id'])) {
                $fy = FiscalYear::where('tenant_id', $tenantId)
                    ->where('id', $validated['fiscal_year_id'])
                    ->firstOrFail();
            } else {
                $yearEndStr = Carbon::parse($validated['fiscal_year_end'])->toDateString();

                // Find existing or auto-create a FiscalYear for this end date
                $fy = FiscalYear::where('tenant_id', $tenantId)
                    ->where('end_date', $yearEndStr)
                    ->first();

                if (!$fy) {
                    // Find or derive start date
                    $yearEndCarbon = Carbon::parse($yearEndStr);
                    $yearStartStr  = $yearEndCarbon->copy()->subYear()->addDay()->toDateString();
                    $fyName        = 'FY ' . $yearEndCarbon->format('Y');

                    $fy = $this->fiscalYearService->createFiscalYear(
                        tenantId: $tenantId,
                        name: $fyName,
                        startDate: $yearStartStr,
                        endDate: $yearEndStr,
                        creator: auth()->user()
                    );
                }
            }

            $closedFy = $this->fiscalYearService->closeYear(
                fy: $fy,
                requester: auth()->user(),
                approverId: (int) $validated['approved_by'],
                approvalPin: $validated['approval_pin'] ?? null,
                previewHash: $validated['preview_hash'] ?? null,
                overrideReason: $validated['override_reason'] ?? null
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['approved_by' => $e->getMessage(), 'fiscal_year_end' => $e->getMessage()]);
        } catch (\Throwable $e) {
            return back()->withErrors(['fiscal_year_end' => $e->getMessage(), 'approved_by' => $e->getMessage()]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success'    => true,
                'message'    => "Fiscal year {$closedFy->name} closed.",
                'fiscal_year'=> $closedFy,
            ]);
        }

        return redirect()->back()->with(
            'success',
            "Fiscal year {$closedFy->name} closed successfully."
        );
    }

    /**
     * Reopen a closed fiscal year.
     */
    public function reopen(Request $request, string $id)
    {
        PlanGate::enforce('fiscal_year_closing');

        $user = auth()->user();
        if (!$user || (!$user->hasPermission('finance.period_reopen') && !$user->isPlatformAdmin())) {
            $role = TenantUser::where('tenant_id', app('current.tenant')->id)
                ->where('user_id', $user?->id)
                ->value('role');
            if ($role !== 'owner' && $role !== 'admin') {
                abort(403, 'You do not have permission to reopen a closed fiscal period.');
            }
        }

        $validated = $request->validate([
            'approved_by'  => ['required', 'integer', 'exists:users,id'],
            'approval_pin' => ['nullable', 'string', 'max:20'],
            'reopen_reason'=> ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $tenantId = app('current.tenant')->id;

        // Verify Owner/Admin approval
        $approverRole = ManagerApproval::roleOf($validated['approved_by'], $tenantId);
        if (!in_array($approverRole, ['owner', 'admin'], true)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'approved_by' => 'Reopening a fiscal year requires owner or admin approval.',
            ]);
        }

        $problem = ManagerApproval::check($validated['approved_by'], $validated['approval_pin'] ?? null, $tenantId, auth()->id());
        if ($problem !== null) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'approved_by' => $problem,
            ]);
        }

        $fy = FiscalYear::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $reopenedFy = $this->fiscalYearService->reopenYear(
            fy: $fy,
            actor: auth()->user(),
            reason: $validated['reopen_reason']
        );

        if ($request->wantsJson()) {
            return response()->json([
                'success'    => true,
                'message'    => "Fiscal year {$reopenedFy->name} reopened.",
                'fiscal_year'=> $reopenedFy,
            ]);
        }

        return redirect()->back()->with('success', "Fiscal year {$reopenedFy->name} reopened.");
    }

    /**
     * Manage Period Locks.
     */
    public function storeLock(Request $request)
    {
        PlanGate::enforce('fiscal_year_closing');

        $validated = $request->validate([
            'fiscal_year_id'     => ['nullable', 'string', 'exists:fiscal_years,id'],
            'lock_type'          => ['required', 'string', 'in:soft,all_users,hard'],
            'locked_through_date'=> ['required', 'date'],
            'reason'             => ['nullable', 'string', 'max:255'],
        ]);

        $tenantId = app('current.tenant')->id;

        // Deactivate previous active locks if updating
        AccountingPeriodLock::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $lock = AccountingPeriodLock::create([
            'tenant_id'          => $tenantId,
            'fiscal_year_id'     => $validated['fiscal_year_id'] ?? null,
            'lock_type'          => $validated['lock_type'],
            'locked_through_date'=> $validated['locked_through_date'],
            'reason'             => $validated['reason'] ?? 'Manual lock',
            'created_by'         => auth()->id(),
            'is_active'          => true,
        ]);

        return redirect()->back()->with('success', "Accounting period locked through {$lock->locked_through_date->format('Y-m-d')}.");
    }

    /**
     * Create Lock Exception.
     */
    public function storeException(Request $request)
    {
        PlanGate::enforce('fiscal_year_closing');

        $validated = $request->validate([
            'period_lock_id' => ['nullable', 'string', 'exists:accounting_period_locks,id'],
            'user_id'        => ['nullable', 'integer', 'exists:users,id'],
            'scope'          => ['required', 'string', 'in:user,all_users'],
            'valid_from'     => ['required', 'date'],
            'expires_at'     => ['required', 'date', 'after:valid_from'],
            'reason'         => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $tenantId = app('current.tenant')->id;

        $exception = AccountingLockException::create([
            'tenant_id'     => $tenantId,
            'period_lock_id'=> $validated['period_lock_id'] ?? null,
            'user_id'       => $validated['scope'] === 'user' ? $validated['user_id'] : null,
            'scope'         => $validated['scope'],
            'valid_from'    => $validated['valid_from'],
            'expires_at'    => $validated['expires_at'],
            'reason'        => $validated['reason'],
            'granted_by'    => auth()->id(),
            'is_active'     => true,
        ]);

        return redirect()->back()->with('success', 'Accounting lock exception granted.');
    }

    /**
     * Revoke Lock Exception.
     */
    public function revokeException(Request $request, string $id)
    {
        PlanGate::enforce('fiscal_year_closing');

        $tenantId = app('current.tenant')->id;

        $exception = AccountingLockException::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $exception->update([
            'is_active' => false,
            'revoked_by'=> auth()->id(),
            'revoked_at'=> now(),
        ]);

        return redirect()->back()->with('success', 'Accounting lock exception revoked.');
    }

    /**
     * Download / View Close Evidence Report Data.
     */
    public function report(Request $request, string $id)
    {
        PlanGate::enforce('fiscal_year_closing');

        $tenantId = app('current.tenant')->id;
        $tenant   = app('current.tenant');

        $fy = FiscalYear::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->with(['retainedEarningsAccount', 'closeJournalEntry'])
            ->firstOrFail();

        $checks = FiscalYearCloseCheck::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fy->id)
            ->get();

        $events = FiscalYearEvent::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fy->id)
            ->orderBy('created_at', 'asc')
            ->get();

        $lock = AccountingPeriodLock::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fy->id)
            ->first();

        $reportData = [
            'store' => [
                'id'             => $tenant->id,
                'name'           => $tenant->name,
                'currency'       => $tenant->currency_symbol ?? '$',
                'timezone'       => $tenant->timezone,
            ],
            'fiscal_year' => [
                'id'            => $fy->id,
                'name'          => $fy->name,
                'start_date'    => $fy->start_date->toDateString(),
                'end_date'      => $fy->end_date->toDateString(),
                'status'        => $fy->status,
                'close_version' => $fy->close_version,
                'closed_at'     => $fy->closed_at?->toIso8601String(),
                'reopen_reason' => $fy->reopen_reason,
            ],
            'retained_earnings_account' => [
                'code' => $fy->retainedEarningsAccount?->code,
                'name' => $fy->retainedEarningsAccount?->name,
            ],
            'close_journal' => $fy->closeJournalEntry ? [
                'id'            => $fy->closeJournalEntry->id,
                'date'          => $fy->closeJournalEntry->date->toDateString(),
                'description'   => $fy->closeJournalEntry->description,
                'approved_by'   => $fy->closeJournalEntry->approved_by,
            ] : null,
            'checks'  => $checks,
            'lock'    => $lock,
            'history' => $events,
        ];

        return response()->json($reportData);
    }
}
