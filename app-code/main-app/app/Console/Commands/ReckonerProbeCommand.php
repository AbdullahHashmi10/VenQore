<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\Invariants\ReckonerInvariants;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * ReckonerProbeCommand: Nightly/on-demand referee probe per §5.6 of RECKONER_TRUTH_REBUILD_PLAN.md.
 *
 * Runs all active invariants across tenants, verifies ledger controls, logs to reckoner_invariant_runs,
 * and reports data discrepancies.
 */
class ReckonerProbeCommand extends Command
{
    protected $signature = 'reckoner:probe 
                            {--tenant= : Tenant slug or ID (defaults to all active tenants)}
                            {--from= : Start date (YYYY-MM-DD)}
                            {--to= : End date (YYYY-MM-DD)}';

    protected $description = 'Run Reckoner invariant checks against active tenants and log results to reckoner_invariant_runs';

    public function handle(MeasureEngine $engine): int
    {
        $tenantOpt = $this->option('tenant');
        $fromOpt   = $this->option('from');
        $toOpt     = $this->option('to');

        $tenantsQuery = DB::table('tenants');
        if ($tenantOpt) {
            $tenantsQuery->where('id', $tenantOpt)->orWhere('slug', $tenantOpt);
        } else {
            $tenantsQuery->whereIn('status', ['active', 'trial', 'scale', 'starter']);
        }
        $rawTenants = $tenantsQuery->get();

        if ($rawTenants->isEmpty()) {
            $this->warn("No tenants found matching filter.");
            return 0;
        }

        $now = now();
        $totalChecks = 0;
        $failedChecks = 0;

        $tableRows = [];

        foreach ($rawTenants as $rawTenant) {
            $tenant = Tenant::find($rawTenant->id);
            if (!$tenant) {
                continue;
            }

            $this->info("Probing Tenant: {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})");

            $period = ReckonerPeriod::resolve(
                $fromOpt && $toOpt ? 'custom' : 'this_month',
                $fromOpt && $toOpt ? ['from' => $fromOpt, 'to' => $toOpt] : null,
                $tenant
            );

            // 1. Run all 16+ canonical invariants directly
            $results = ReckonerInvariants::checkAll($tenant, $period);

            foreach ($results as $invKey => $res) {
                $totalChecks++;
                $status = $res['status'] ?? ($res['passed'] ? 'pass' : 'fail');
                if ($status === 'fail') {
                    $failedChecks++;
                }

                // Log to reckoner_invariant_runs
                DB::table('reckoner_invariant_runs')->insert([
                    'tenant_id'    => $tenant->id,
                    'run_at'       => $now,
                    'invariant'    => $invKey,
                    'period_start' => $period->start->toDateString(),
                    'period_end'   => $period->end->toDateString(),
                    'status'       => $status,
                    'expected'     => isset($res['expected']) && is_numeric($res['expected']) ? (float) $res['expected'] : null,
                    'actual'       => isset($res['actual']) && is_numeric($res['actual']) ? (float) $res['actual'] : null,
                    'difference'   => (float) ($res['difference'] ?? 0.0),
                    'message'      => substr((string) ($res['message'] ?? ''), 0, 255),
                    'details'      => json_encode($res['details'] ?? []),
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]);

                $tableRows[] = [
                    $tenant->slug,
                    $invKey,
                    $status === 'pass' ? '<info>PASS</info>' : '<error>FAIL</error>',
                    is_numeric($res['expected'] ?? null) ? number_format((float) $res['expected'], 2) : '-',
                    is_numeric($res['actual'] ?? null) ? number_format((float) $res['actual'], 2) : '-',
                    number_format((float) ($res['difference'] ?? 0), 2),
                    substr((string) ($res['message'] ?? ''), 0, 45),
                ];
            }
        }

        $this->table(
            ['Tenant', 'Invariant', 'Status', 'Expected', 'Actual', 'Diff', 'Message'],
            $tableRows
        );

        $this->newLine();
        if ($failedChecks > 0) {
            $this->error("PROBE FAILED: {$failedChecks} / {$totalChecks} invariant checks failed!");
            return 1;
        }

        $this->info("PROBE PASSED: All {$totalChecks} invariant checks passed cleanly.");
        return 0;
    }
}
