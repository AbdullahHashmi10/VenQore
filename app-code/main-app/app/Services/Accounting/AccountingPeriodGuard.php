<?php

namespace App\Services\Accounting;

use App\Exceptions\PeriodLockedException;
use App\Models\AccountingLockException;
use App\Models\AccountingPeriodLock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountingPeriodGuard
{
    /**
     * Enforce accounting period lock rules before writing or reversing a journal entry.
     *
     * @throws PeriodLockedException if the date falls in a locked period without a valid exception.
     */
    public function enforce(
        int|string $tenantId,
        string $accountingDate,
        string $operationType = 'create',
        ?User $actor = null,
        ?string $postingSource = null
    ): void {
        $actor = $actor ?? auth()->user();
        $dateStr = Carbon::parse($accountingDate)->toDateString();

        $activeLock = DB::table('accounting_period_locks')
            ->where('tenant_id', (string) $tenantId)
            ->where('is_active', 1)
            ->where('locked_through_date', '>=', $dateStr)
            ->orderBy('locked_through_date', 'desc')
            ->first();

        if (!$activeLock) {
            return; // Not locked
        }

        // Check if there is an active, valid exception
        $now = now()->toDateTimeString();

        $exceptionQuery = DB::table('accounting_lock_exceptions')
            ->where('tenant_id', (string) $tenantId)
            ->where('is_active', 1)
            ->whereNull('revoked_at')
            ->where('valid_from', '<=', $now)
            ->where('expires_at', '>=', $now)
            ->where(function ($q) use ($actor) {
                $q->where('scope', 'all_users');
                if ($actor && $actor->id) {
                    $q->orWhere(function ($sub) use ($actor) {
                        $sub->where('scope', 'user')
                            ->where('user_id', $actor->id);
                    });
                }
            });

        $activeException = $exceptionQuery->first();

        if ($activeException) {
            // Log authorized exception usage
            try {
                app(\App\Engines\AuditService::class)->log(
                    event: 'period_lock_exception_used',
                    modelType: 'accounting_period_lock',
                    modelId: (string) $activeLock->id,
                    after: [
                        'tenant_id'      => $tenantId,
                        'accounting_date'=> $dateStr,
                        'operation_type' => $operationType,
                        'posting_source' => $postingSource,
                        'actor_id'       => $actor?->id,
                        'exception_id'   => $activeException->id,
                        'reason'         => $activeException->reason,
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning("Could not log period lock exception usage audit event: {$e->getMessage()}");
            }
            return; // Exception allowed
        }

        // Blocked - log failure attempt
        try {
            app(\App\Engines\AuditService::class)->log(
                event: 'period_lock_violation_blocked',
                modelType: 'accounting_period_lock',
                modelId: (string) $activeLock->id,
                after: [
                    'tenant_id'          => $tenantId,
                    'accounting_date'    => $dateStr,
                    'locked_through_date'=> $activeLock->locked_through_date,
                    'lock_type'          => $activeLock->lock_type,
                    'operation_type'     => $operationType,
                    'posting_source'     => $postingSource,
                    'actor_id'           => $actor?->id,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning("Could not log period lock violation audit event: {$e->getMessage()}");
        }

        $fyName = null;
        if (!empty($activeLock->fiscal_year_id)) {
            $fyName = DB::table('fiscal_years')
                ->where('tenant_id', (string) $tenantId)
                ->where('id', $activeLock->fiscal_year_id)
                ->value('name');
        }

        $formattedLockDate = Carbon::parse($activeLock->locked_through_date)->format('Y-m-d');

        throw new PeriodLockedException(
            message: "Accounting write refused: Date {$dateStr} falls on or before the locked period date ({$formattedLockDate})." . ($fyName ? " Fiscal year: {$fyName}." : ''),
            entryDate: $dateStr,
            lockedThroughDate: $formattedLockDate,
            fiscalYearName: $fyName,
            lockType: $activeLock->lock_type
        );
    }

    /**
     * Non-throwing check to see if a date is locked for a tenant.
     */
    public function isLocked(int|string $tenantId, string $accountingDate, ?User $actor = null): bool
    {
        try {
            $this->enforce($tenantId, $accountingDate, 'check', $actor);
            return false;
        } catch (PeriodLockedException $e) {
            return true;
        }
    }

    /**
     * Get the active period lock for a tenant.
     */
    public function getActiveLock(int|string $tenantId): ?AccountingPeriodLock
    {
        return AccountingPeriodLock::where('tenant_id', (string) $tenantId)
            ->where('is_active', true)
            ->orderBy('locked_through_date', 'desc')
            ->first();
    }
}
