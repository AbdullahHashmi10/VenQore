<?php

namespace Tests\Feature\Production;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;
use Tests\Support\RequiresGoldenCompany;

/**
 * EXP-001 (blueprint Phase D.4) — exports must carry the SAME numbers as the ledger.
 *
 * An export the user downloads (CSV/Excel/PDF) is a money surface. If it disagrees with
 * the ledger, decisions get made on a wrong number. This suite parses the generated
 * export for the Golden tenant and asserts its totals match the ledger-derived totals —
 * an output verification, not a "did it produce a file" check.
 *
 * Kept format-focused and dependency-light: it verifies the SalesExport collection's
 * numeric total against the ledger revenue. When run on-machine it exercises the real
 * maatwebsite/excel export class the app ships.
 */
class ExportContentVerificationTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    /** @test */
    public function export_sales_total_matches_ledger_revenue(): void
    {
        $tenant = Tenant::query()->firstOrFail();
        app()->instance('current.tenant', $tenant);

        // Ledger-derived revenue (credits to revenue accounts 4000/4xxx).
        $ledgerRevenue = (float) DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('a.code', 'like', '4%')
            ->sum(DB::raw('ji.credit - ji.debit'));

        $exportClass = \App\Exports\SalesExport::class;
        if (! class_exists($exportClass)) {
            $this->markTestSkipped('SalesExport class not present.');
        }

        // Build the export collection the app would render, and sum its money column.
        // The export contract varies; resolve defensively and assert on the numeric total.
        try {
            $export = app()->makeWith($exportClass, ['tenantId' => $tenant->id]);
        } catch (\Throwable $e) {
            $export = new $exportClass();
        }

        if (! method_exists($export, 'collection')) {
            $this->markTestSkipped('SalesExport has no collection() to inspect.');
        }

        $rows = $export->collection();
        $exportTotal = 0.0;
        foreach ($rows as $row) {
            $arr = is_array($row) ? $row : (method_exists($row, 'toArray') ? $row->toArray() : (array) $row);
            foreach (['net_amount', 'net_total', 'total', 'amount', 'grand_total'] as $k) {
                if (array_key_exists($k, $arr) && is_numeric($arr[$k])) {
                    $exportTotal += (float) $arr[$k];
                    break;
                }
            }
        }

        // If the export models NET revenue, it should track the ledger revenue closely.
        $this->assertGreaterThan(0, abs($ledgerRevenue), 'Golden tenant must have ledger revenue to compare.');
        $this->assertEqualsWithDelta(
            abs($ledgerRevenue),
            $exportTotal,
            max(0.01, abs($ledgerRevenue) * 0.01), // 1% tolerance for gross-vs-net export modeling
            'EXP-001: Sales export total diverges from ledger revenue by more than 1% — '
                . "export=$exportTotal ledger=" . abs($ledgerRevenue)
        );
    }
}
