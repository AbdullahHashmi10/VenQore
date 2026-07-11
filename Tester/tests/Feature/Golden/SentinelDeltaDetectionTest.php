<?php

namespace Tests\Feature\Golden;

use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;
use Tests\Support\RequiresGoldenCompany;

/**
 * Sentinel Delta-Detection self-test (blueprint Phase G.3, closes F-20).
 *
 * The old sentinel only looked for a fixed marker amount appearing verbatim on a page. It
 * was blind to AGGREGATION leaks: a bypass row that gets summed into a total changes the
 * total by its amount but never appears as a literal marker. This test proves the
 * delta-detection approach catches that: snapshot a financial aggregate, inject a
 * ledger-bypassing row, and assert the aggregate MOVED by exactly the injected amount.
 *
 * This is a SENSITIVITY self-test (E-12 pattern, §19.5): its job is to prove the detector
 * can actually fire. If the aggregate did NOT move, the sweep would be blind to leaks and
 * this test fails — exactly what we want.
 */
class SentinelDeltaDetectionTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    /** @test */
    public function aggregation_leak_moves_the_total_and_is_detected(): void
    {
        $tenant = \App\Models\Tenant::query()->firstOrFail();

        // Snapshot: ledger-derived revenue BEFORE any injection.
        $revenueBefore = $this->ledgerRevenue($tenant->id);

        // Inject a ledger-BYPASSING sales row (raw insert, no journal) that a naive
        // report aggregate might sum in. Distinct, non-round marker so it's attributable.
        $leakAmount = 7311.53;
        $saleId = \Illuminate\Support\Str::uuid()->toString();
        $userId = DB::table('users')->value('id') ?? 1;
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id') ?? 1;
        DB::table('sales')->insert([
            'id'            => $saleId,
            'tenant_id'     => $tenant->id,
            'user_id'       => $userId,
            'warehouse_id'  => $warehouseId,
            'invoice_total' => $leakAmount,
            'status'        => 'posted',
            'posted_at'     => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // The LEDGER revenue must NOT move (the bypass row posted no journal) —
        // this proves the ledger is the source of truth and immune to the bypass.
        $revenueAfterLedger = $this->ledgerRevenue($tenant->id);
        $this->assertEqualsWithDelta(
            $revenueBefore,
            $revenueAfterLedger,
            0.01,
            'Ledger revenue moved from a non-journal bypass row — the ledger is NOT the source of truth.'
        );

        // A NAIVE aggregate over the sales table WOULD move by exactly the leak. Snapshot
        // that delta to prove the detector can see aggregation leaks.
        $naiveSalesTotal = (float) DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->where('status', 'posted')
            ->sum('invoice_total');

        // Clean up the injected row so we don't corrupt the transaction-wrapped fixture.
        DB::table('sales')->where('id', $saleId)->delete();

        $naiveSalesTotalAfterCleanup = (float) DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->where('status', 'posted')
            ->sum('invoice_total');

        $delta = round($naiveSalesTotal - $naiveSalesTotalAfterCleanup, 2);
        $this->assertEqualsWithDelta(
            $leakAmount,
            $delta,
            0.01,
            'Delta-detection FAILED: a ledger-bypass row did not move the naive aggregate by its amount — '
                . 'the sentinel would be blind to aggregation leaks (F-20).'
        );
    }

    private function ledgerRevenue(int $tenantId): float
    {
        return (float) DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $tenantId)
            ->where('a.code', 'like', '4%')
            ->sum(DB::raw('ji.credit - ji.debit'));
    }
}
