<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Reckoner\Streams\LedgerStream;
use App\Reckoner\Streams\StockPositionsStream;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * ReckonerSnapshotCommand: Nightly snapshot for position and balance measures into reckoner_daily (§5.1, §6.3).
 */
class ReckonerSnapshotCommand extends Command
{
    protected $signature = 'reckoner:snapshot 
                            {--tenant= : Tenant slug or ID}
                            {--date= : Snapshot date (YYYY-MM-DD, defaults to yesterday)}';

    protected $description = 'Capture nightly position and balance snapshots into reckoner_daily';

    public function handle(LedgerStream $ledgerStream, StockPositionsStream $stockStream): int
    {
        $tenantOpt = $this->option('tenant');
        $dateOpt   = $this->option('date');
        $asOf = $dateOpt ?: Carbon::now()->subDay()->toDateString();

        $tenantQuery = DB::table('tenants');
        if ($tenantOpt) {
            $tenantQuery->where(function ($q) use ($tenantOpt) {
                $q->where('id', $tenantOpt)->orWhere('slug', $tenantOpt);
            });
        } else {
            $tenantQuery->whereIn('status', ['active', 'trial', 'scale', 'starter']);
        }

        $tenants = $tenantQuery->get();
        $totalSnapshots = 0;

        foreach ($tenants as $t) {
            $tid = (int) $t->id;
            $rows = [];
            $now = now();

            // 1. Receivables & Payables balances as of date
            $balances = $ledgerStream->closingBalances(['ar', 'ap', 'cash', 'bank'], [$asOf], [], $tid);
            $ar = (float) ($balances['ar'][$asOf]['total'] ?? 0.0);
            $ap = (float) ($balances['ap'][$asOf]['total'] ?? 0.0);
            $cash = (float) ($balances['cash'][$asOf]['total'] ?? 0.0);
            $bank = (float) ($balances['bank'][$asOf]['total'] ?? 0.0);
            $liquidity = round($cash + $bank, 4);

            $rows[] = [
                'tenant_id'          => $tid,
                'day'                => $asOf,
                'measure'            => 'gl.receivables_balance',
                'kind'               => 'closing',
                'dim'                => '',
                'dim_value'          => '',
                'value'              => $ar,
                'qty'                => 0.0,
                'n'                  => $ar > 0 ? 1 : 0,
                'definition_version' => 1,
                'computed_at'        => $now,
            ];
            $rows[] = [
                'tenant_id'          => $tid,
                'day'                => $asOf,
                'measure'            => 'gl.payables_balance',
                'kind'               => 'closing',
                'dim'                => '',
                'dim_value'          => '',
                'value'              => $ap,
                'qty'                => 0.0,
                'n'                  => $ap > 0 ? 1 : 0,
                'definition_version' => 1,
                'computed_at'        => $now,
            ];
            $rows[] = [
                'tenant_id'          => $tid,
                'day'                => $asOf,
                'measure'            => 'gl.cash_balance',
                'kind'               => 'closing',
                'dim'                => '',
                'dim_value'          => '',
                'value'              => $liquidity,
                'qty'                => 0.0,
                'n'                  => $liquidity > 0 ? 1 : 0,
                'definition_version' => 1,
                'computed_at'        => $now,
            ];

            // 2. Stock position
            $stockVal = (float) $stockStream->stockValuation($asOf, $tid);
            $stockQty = (float) $stockStream->unitsOnHand($asOf, $tid);

            $rows[] = [
                'tenant_id'          => $tid,
                'day'                => $asOf,
                'measure'            => 'stock.total_value',
                'kind'               => 'snapshot',
                'dim'                => '',
                'dim_value'          => '',
                'value'              => $stockVal,
                'qty'                => $stockQty,
                'n'                  => $stockQty > 0 ? 1 : 0,
                'definition_version' => 1,
                'computed_at'        => $now,
            ];

            DB::table('reckoner_daily')->upsert(
                $rows,
                ['tenant_id', 'measure', 'dim', 'dim_value', 'day'],
                ['value', 'qty', 'n', 'definition_version', 'computed_at']
            );

            $totalSnapshots += count($rows);
            $this->line("Tenant {$tid} ({$t->slug}): wrote " . count($rows) . " snapshots for {$asOf}.");
        }

        $this->info("Snapshot run completed for {$asOf}. Total snapshot records: {$totalSnapshots}");
        return 0;
    }
}
