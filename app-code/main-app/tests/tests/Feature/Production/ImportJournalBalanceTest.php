<?php

namespace Tests\Feature\Production;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;
use Tests\Support\RequiresGoldenCompany;

/**
 * IMP-001 (blueprint Phase D.5) — imported data must not break the ledger.
 *
 * DataImportService is allow-listed by the single-writer guard (it may write journal
 * rows directly). That privilege makes it an F-16 sibling risk: an import that writes
 * unbalanced journals corrupts the ledger silently. This test asserts that after any
 * import, the double-entry invariant still holds for every affected journal entry.
 *
 * The pure invariant (SUM debit == SUM credit per entry, and per tenant) is an
 * INDEPENDENT oracle — it does not call the import service or any report service.
 */
class ImportJournalBalanceTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    /** @test */
    public function every_journal_entry_balances_per_entry(): void
    {
        $tenant = Tenant::query()->firstOrFail();

        // Per-entry balance: for each journal_entry, SUM(debit) must equal SUM(credit).
        $unbalanced = DB::table('journal_items')
            ->where('tenant_id', $tenant->id)
            ->select('journal_entry_id')
            ->groupBy('journal_entry_id')
            ->havingRaw('ROUND(SUM(debit), 2) <> ROUND(SUM(credit), 2)')
            ->pluck('journal_entry_id')
            ->all();

        $this->assertSame(
            [],
            $unbalanced,
            'IMP-001: these journal entries do not balance (debits != credits): '
                . implode(', ', $unbalanced)
                . '. An import or writer produced an unbalanced entry.'
        );
    }

    /** @test */
    public function tenant_trial_balance_is_zero(): void
    {
        $tenant = Tenant::query()->firstOrFail();
        $t = DB::table('journal_items')
            ->where('tenant_id', $tenant->id)
            ->selectRaw('ROUND(SUM(debit),2) d, ROUND(SUM(credit),2) c')
            ->first();

        $this->assertEqualsWithDelta(
            (float) ($t->d ?? 0),
            (float) ($t->c ?? 0),
            0.01,
            'IMP-001: tenant trial balance is non-zero — the ledger is internally inconsistent.'
        );
    }
}
