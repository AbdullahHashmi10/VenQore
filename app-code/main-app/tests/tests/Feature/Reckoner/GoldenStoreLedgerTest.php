<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

class GoldenStoreLedgerTest extends TestCase
{
    /**
     * Asserts directly from journal_items ⋈ journal_entries ⋈ accounts
     * every §8.1 money value and contract condition.
     */
    public function test_golden_store_ledger_matches_section_8_1_spec(): void
    {
        $fixture = ReckonerGoldenStoreFixture::build(http: $this);
        $tenant = $fixture['tenant'];
        $tenantId = $tenant->id;
        $sales = $fixture['sales'];
        $purchases = $fixture['purchases'];

        // 1. REVENUE (August 2026): 7,700.00
        $revenue = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '4000')
            ->whereBetween('je.date', ['2026-08-01', '2026-08-31'])
            ->selectRaw('COALESCE(SUM(ji.credit) - SUM(ji.debit), 0) as val')
            ->value('val');
        $this->assertEquals(7700.00, $revenue, "Section 8.1 revenue mismatch: expected 7,700.00, got {$revenue}");

        // 2. COGS (August 2026): 3,200.00
        $cogs = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '5000')
            ->whereBetween('je.date', ['2026-08-01', '2026-08-31'])
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(3200.00, $cogs, "Section 8.1 COGS mismatch: expected 3,200.00, got {$cogs}");

        // 3. OPEX (August 2026): 4,000.00
        $opex = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '6000')
            ->whereBetween('je.date', ['2026-08-01', '2026-08-31'])
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(4000.00, $opex, "Section 8.1 OPEX mismatch: expected 4,000.00, got {$opex}");

        // 4. CASH (as of 2026-08-31): 148,200.00
        $cash = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '1000')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(148200.00, $cash, "Section 8.1 Cash mismatch: expected 148,200.00, got {$cash}");

        // 5. BANK (as of 2026-08-31): 48,000.00
        $bank = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '1010')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(48000.00, $bank, "Section 8.1 Bank mismatch: expected 48,000.00, got {$bank}");

        // 6. AR (as of 2026-08-31): 2,500.00
        $ar = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '1200')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(2500.00, $ar, "Section 8.1 AR mismatch: expected 2,500.00, got {$ar}");

        // 7. AP (as of 2026-08-31): 3,000.00
        $ap = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '2000')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.credit) - SUM(ji.debit), 0) as val')
            ->value('val');
        $this->assertEquals(3000.00, $ap, "Section 8.1 AP mismatch: expected 3,000.00, got {$ap}");

        // 8. INVENTORY (as of 2026-08-31): 6,500.00
        $inventory = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '1100')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');
        $this->assertEquals(6500.00, $inventory, "Section 8.1 Inventory mismatch: expected 6,500.00, got {$inventory}");

        // 9. TAX PAYABLE (as of 2026-08-31): 500.00
        $taxPayable = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '2100')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.credit) - SUM(ji.debit), 0) as val')
            ->value('val');
        $this->assertEquals(500.00, $taxPayable, "Section 8.1 Tax Payable mismatch: expected 500.00, got {$taxPayable}");

        // 10. EQUITY (as of 2026-08-31): 201,700.00 (capital 200,000 + retained 1,700)
        $capital = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.code', '3000')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.credit) - SUM(ji.debit), 0) as val')
            ->value('val');

        $totalIncome = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.type', 'income')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.credit) - SUM(ji.debit), 0) as val')
            ->value('val');

        $totalExpense = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('a.type', 'expense')
            ->where('je.date', '<=', '2026-08-31')
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as val')
            ->value('val');

        $equity = $capital + ($totalIncome - $totalExpense);
        $this->assertEquals(201700.00, $equity, "Section 8.1 Equity mismatch: expected 201,700.00, got {$equity}");

        // 11. EXPENSES ROW COUNT: 1 row
        $expenseCount = DB::table('expenses')->where('tenant_id', $tenantId)->count();
        $this->assertSame(1, $expenseCount, "Expected exactly 1 expenses row, got {$expenseCount}");

        // 12. C1 3,000 RECEIPT ALLOCATED TO S1
        $s1 = $sales['s1'];
        $allocTable = \Illuminate\Support\Facades\Schema::hasTable('allocations') ? 'allocations' : 'payment_allocations';
        $c1Allocated = (float) DB::table($allocTable)
            ->where('sale_id', $s1->id)
            ->where('status', 'active')
            ->sum('allocated_amount');
        $this->assertEquals(3000.00, $c1Allocated, "Expected C1 receipt 3,000 allocated to sale S1, got {$c1Allocated}");

        // 13. S1 5,000 SUPPLIER PAYMENT ALLOCATED TO P1
        $p1 = $purchases['p1'];
        $s1Allocated = (float) DB::table($allocTable)
            ->where('purchase_id', $p1->id)
            ->where('status', 'active')
            ->sum('allocated_amount');
        $this->assertEquals(5000.00, $s1Allocated, "Expected supplier payment 5,000 allocated to purchase P1, got {$s1Allocated}");

        // 14. S3 VOIDED: NOT A RECOGNISED SALE, JOURNAL ENTRY AND MIRROR BOTH is_reversed = 1
        $s3 = $sales['s3'];
        $s3Fresh = DB::table('sales')->where('tenant_id', $tenantId)->where('id', $s3->id)->first();
        $this->assertContains($s3Fresh->status, ['cancelled', 'voided', 'returned'], "S3 should have cancelled/voided status, got {$s3Fresh->status}");

        $s3Entries = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($s3) {
                $q->where('reference', $s3->id)
                  ->orWhere('reference', $s3->reference_number)
                  ->orWhere('description', 'like', "%{$s3->reference_number}%");
            })
            ->get();
        $this->assertGreaterThanOrEqual(2, $s3Entries->count(), "Expected at least original and reversal journal entries for S3");
        foreach ($s3Entries as $entry) {
            $this->assertEquals(1, $entry->is_reversed, "Entry {$entry->id} ({$entry->description}) must have is_reversed = 1");
        }

        // 15. SALES.SOURCE: 'pos' FOR S0/S2/S3, 'manual' FOR S1
        $this->assertSame('pos', DB::table('sales')->where('tenant_id', $tenantId)->where('id', $sales['s0']->id)->value('source'), 'S0 source must be pos');
        $this->assertSame('manual', DB::table('sales')->where('tenant_id', $tenantId)->where('id', $sales['s1']->id)->value('source'), 'S1 source must be manual');
        $this->assertSame('pos', DB::table('sales')->where('tenant_id', $tenantId)->where('id', $sales['s2']->id)->value('source'), 'S2 source must be pos');
        $this->assertSame('pos', DB::table('sales')->where('tenant_id', $tenantId)->where('id', $sales['s3']->id)->value('source'), 'S3 source must be pos');
    }
}
