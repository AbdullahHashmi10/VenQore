<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ReconcileInventoryGl — Track A / L007
 *
 * Permanent backstop for the "balanced-but-wrong ledger" failure class
 * (audit Finding 1). For every active tenant it compares:
 *
 *   (a) the physical inventory asset value
 *       = SUM(inventory_batches.remaining_qty × unit_cost)
 *       via FinancialReportingService::getInventoryValue()
 *
 *   (b) the General Ledger balance of the Inventory Asset account (code 1100)
 *       = SUM(debit) − SUM(credit) over that account's journal_items.
 *
 * If the two drift apart by more than a tiny rounding tolerance, the command
 * reports a non-zero exit and logs an error so cron-failure alerting
 * (L021 / L040) surfaces it. Read-only — it never mutates data.
 *
 * Usage:
 *   php artisan inventory:reconcile-gl
 *   php artisan inventory:reconcile-gl --tolerance=0.05
 */
class ReconcileInventoryGl extends Command
{
    protected $signature = 'inventory:reconcile-gl
        {--tolerance=0.01 : Absolute drift tolerance before a tenant is flagged}
        {--tenant= : Restrict the check to a single tenant id}';

    protected $description = 'Reconcile physical inventory value against the GL Inventory Asset (1100) balance per tenant.';

    public function handle(FinancialReportingService $reporting): int
    {
        $tolerance = (float) $this->option('tolerance');

        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($q) => $q->where('id', $this->option('tenant')))
            ->get();

        if ($tenants->isEmpty()) {
            $this->warn('No tenants found to reconcile.');
            return self::SUCCESS;
        }

        $drifted = [];

        foreach ($tenants as $tenant) {
            // Bind the tenant so tenant-scoped services/queries resolve correctly.
            app()->instance('current.tenant', $tenant);

            try {
                $physical = $reporting->getInventoryValue();
                $glBalance = $this->inventoryGlBalance($tenant->id);
            } catch (\Throwable $e) {
                $this->error("Tenant {$tenant->id}: reconciliation failed — {$e->getMessage()}");
                Log::error('Inventory/GL reconciliation error', [
                    'tenant_id' => $tenant->id,
                    'error'     => $e->getMessage(),
                ]);
                $drifted[] = $tenant->id;
                app()->forgetInstance('current.tenant');
                continue;
            }

            app()->forgetInstance('current.tenant');

            $diff = round($physical - $glBalance, 4);

            if (abs($diff) > $tolerance) {
                $drifted[] = $tenant->id;
                $this->error(sprintf(
                    'DRIFT — tenant %s: physical=%.4f, GL(1100)=%.4f, diff=%.4f',
                    $tenant->id, $physical, $glBalance, $diff
                ));
                Log::error('Inventory/GL drift detected', [
                    'tenant_id' => $tenant->id,
                    'physical'  => $physical,
                    'gl_1100'   => $glBalance,
                    'diff'      => $diff,
                    'tolerance' => $tolerance,
                ]);
            } else {
                $this->line(sprintf(
                    'OK   — tenant %s: physical=%.4f, GL(1100)=%.4f',
                    $tenant->id, $physical, $glBalance
                ));
            }
        }

        if (!empty($drifted)) {
            $this->newLine();
            $this->error('Inventory/GL reconciliation FAILED for tenant(s): ' . implode(', ', $drifted));
            return self::FAILURE;
        }

        $this->newLine();
        $this->info('✅ Inventory/GL reconciliation clean across ' . $tenants->count() . ' tenant(s).');
        return self::SUCCESS;
    }

    /**
     * GL balance of the Inventory Asset account (code 1100) for a tenant.
     * Asset balance = debit − credit over non-reversed journal items.
     */
    private function inventoryGlBalance(int|string $tenantId): float
    {
        $accountId = Account::where('tenant_id', $tenantId)
            ->where('code', '1100')
            ->value('id');

        if (!$accountId) {
            // No inventory account provisioned for this tenant yet.
            return 0.0;
        }

        $row = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $accountId)
            ->selectRaw('SUM(journal_items.debit) as d, SUM(journal_items.credit) as c')
            ->first();

        return (float) (($row->d ?? 0) - ($row->c ?? 0));
    }
}
