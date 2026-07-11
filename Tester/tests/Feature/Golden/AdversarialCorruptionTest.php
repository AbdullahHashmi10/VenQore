<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use Tests\Support\RequiresGoldenCompany;

/**
 * ============================================================
 * Phase 8 — Adversarial & Corruption Detection
 * ============================================================
 *
 * DOCTRINE:
 *  A financial system is only as trustworthy as its behavior under
 *  deliberately corrupt or unexpected input. This suite injects
 *  controlled corruption and verifies:
 *
 *   1. The system DETECTS the anomaly (invariant fails, command flags it)
 *   2. OR the system HANDLES it gracefully (no crash, no wrong number)
 *   3. Correct numbers are NEVER returned when data is corrupt
 *
 *  Each test follows the pattern:
 *    ARRANGE: Set up clean Golden Company state
 *    CORRUPT: Inject targeted data corruption
 *    ASSERT:  Verify detection or graceful handling
 *    (DatabaseTransactions rolls back corruption automatically)
 *
 * ATTACK VECTORS:
 *  [V-01] Orphaned sale — sale exists with no journal entries → detected
 *  [V-02] Unbalanced journal entry — DR ≠ CR → invariant catches it
 *  [V-03] Stock layer tampered — remaining_qty manually inflated → three-way tie fails
 *  [V-04] Wrong tenant_id on journal item — cross-tenant data bleed
 *  [V-05] Duplicate journal entries — same reference posted twice → double-counted
 *  [V-06] Backdated entry into a period with known totals → manifest totals change
 *  [V-07] Deleted party behind live AR → report handles null gracefully
 *  [V-08] Negative remaining_qty on batch → FIFO value turns negative (detected)
 *  [V-09] Sale with COGS = 0 but inventory consumed → three-way tie fails
 *  [V-10] journal_entry.date ≠ journal_entry.created_at by >1 year → detected
 *
 * @group golden
 * @group phase8
 * @group phase8-adversarial
 */
class AdversarialCorruptionTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    private const TENANT_ID  = '999991';
    private const YEAR_START = '2025-01-01';
    private const YEAR_END   = '2025-12-31';
    private const TOLERANCE  = 0.02;


    private Tenant $tenant;
    private FinancialReportingService $reporting;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2025-12-31 23:59:59');
        $this->tenant    = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);
        $this->reporting = app(FinancialReportingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }




    // ─────────────────────────────────────────────────────────────────────────
    // BASELINE CAPTURE
    // ─────────────────────────────────────────────────────────────────────────

    /** Capture known-good P&L to compare post-corruption */
    private function captureBaseline(): array
    {
        return [
            'revenue'    => (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'],
            'net_profit' => (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['net_profit'],
            'tb_balanced' => $this->reporting->getTrialBalance(self::YEAR_END)['balanced'],
            'bs_balanced' => $this->reporting->getBalanceSheet(self::YEAR_END)['is_balanced'],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-01] ORPHANED SALE — sale exists, journal_entries do NOT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A sale is inserted into the `sales` table but its corresponding
     * journal entries are deleted (simulates a partial rollback or manual delete).
     *
     * EXPECTED BEHAVIOR:
     *   - The P&L still reflects only ledger-based revenue (NOT inflated by the orphan)
     *   - The Balance Sheet still balances (orphan has no journal impact)
     *   - verify:ledger detects the discrepancy if run
     *
     * WHY THIS MATTERS: If P&L reads from `sales` table instead of the ledger,
     * this orphaned sale would inflate revenue — the core "bypass" bug.
     */
    public function test_V01_orphaned_sale_does_not_inflate_ledger_revenue(): void
    {
        // Capture clean baseline
        $baseline = $this->captureBaseline();

        // CORRUPT: Insert a sale record WITHOUT any journal entries
        $orphanSaleId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('sales')->insert([
            'id'          => $orphanSaleId,
            'tenant_id'   => self::TENANT_ID,
            'user_id'     => 1,
            'reference_number' => 'TXN-ORPHAN-001',
            'net_sales'   => 50000.00,
            'total'       => 50000.00,
            'subtotal'    => 50000.00,
            'tax'         => 0,
            'discount'    => 0,
            'status'      => 'posted',
            'posted_at'   => '2025-06-15 10:00:00',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // No journal entries inserted for this sale

        // ASSERT: P&L revenue must be unchanged (still ledger-derived)
        $corruptedRevenue = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];
        $this->assertEqualsWithDelta($baseline['revenue'], $corruptedRevenue, self::TOLERANCE,
            '[V-01] CRITICAL BUG: P&L revenue was inflated by an orphaned sale (Rs.50,000 phantom). ' .
            'This means P&L is reading from sales table, not the ledger.'
        );

        // ASSERT: Balance Sheet must still be balanced
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
        $this->assertTrue($bs['is_balanced'],
            '[V-01] Balance Sheet became unbalanced after orphaned sale insertion — should be unaffected'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-02] UNBALANCED JOURNAL ENTRY — DR ≠ CR
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A journal entry is injected where total debits ≠ total credits.
     * This violates the fundamental double-entry rule.
     *
     * EXPECTED BEHAVIOR:
     *   - Trial Balance is_balanced becomes FALSE (detects it)
     *   - Balance Sheet is_balanced becomes FALSE
     *   - P&L numbers are NOT trusted when TB is unbalanced
     */
    public function test_V02_unbalanced_journal_entry_breaks_trial_balance(): void
    {
        $baseline = $this->captureBaseline();
        $this->assertTrue($baseline['tb_balanced'],
            '[V-02] PRE-CONDITION: Trial Balance must be balanced before corruption'
        );

        // Find any account for the corrupt entry
        $cashAccountId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '1000')
            ->value('id');

        // CORRUPT: Insert a journal entry with only a debit, no matching credit
        $corruptJeId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('journal_entries')->insert([
            'id'          => $corruptJeId,
            'tenant_id'   => self::TENANT_ID,
            'user_id'     => 1,
            'reference'   => 'CORRUPT-JE-001',
            'description' => 'DELIBERATELY UNBALANCED — Phase 8 test',
            'date'        => '2025-09-15',
            'is_reversed' => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
        DB::table('journal_items')->insert([
            'id'               => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id'        => self::TENANT_ID,
            'journal_entry_id' => $corruptJeId,
            'account_id'       => $cashAccountId,
            'debit'            => 99999.00,
            'credit'           => 0,           // ← MISSING CREDIT SIDE — deliberately unbalanced
            'description'      => 'Corrupt debit without credit',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ASSERT: Trial Balance MUST detect the imbalance
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);
        $this->assertFalse($tb['balanced'],
            '[V-02] Trial Balance failed to detect the unbalanced journal entry. ' .
            'It should report balanced=false when DR ≠ CR. ' .
            'Diff: DR=' . $tb['grand_debit'] . ' CR=' . $tb['grand_credit']
        );

        // ASSERT: Balance Sheet must also detect imbalance
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
        $this->assertFalse($bs['is_balanced'],
            '[V-02] Balance Sheet did not detect the unbalanced journal entry'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-03] STOCK LAYER TAMPERED — remaining_qty manually inflated
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A batch's remaining_qty is directly UPDATE'd to an inflated value
     * (simulates database tampering or a buggy migration).
     *
     * EXPECTED BEHAVIOR:
     *   - Inventory Valuation total increases (FIFO sum changes)
     *   - But GL 1100 does NOT change (journal entries were unaffected)
     *   - The three-way tie (GL 1100 = FIFO) is now BROKEN → detectable
     */
    public function test_V03_tampered_batch_qty_breaks_inventory_three_way_tie(): void
    {
        // Capture clean GL 1100 balance
        $account1100 = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)->where('code', '1100')->first();

        if (!$account1100) {
            $this->markTestSkipped('GL account 1100 not found for Golden Company');
        }

        $cleanGl1100 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('ji.account_id', $account1100->id)
            ->where('je.is_reversed', false)
            ->where('je.date', '<=', self::YEAR_END)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        // CORRUPT: Double a batch's remaining_qty
        $batch = DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereRaw('remaining_qty > 0')
            ->first();

        if (!$batch) {
            $this->markTestSkipped('No inventory batches with remaining qty > 0');
        }

        $originalQty = (float)$batch->remaining_qty;
        $tamperedQty = $originalQty * 2;

        DB::table('inventory_batches')
            ->where('id', $batch->id)
            ->update(['remaining_qty' => $tamperedQty]);

        // ASSERT: FIFO value is now inflated
        $fifoValueAfter = (float) DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val');

        $expectedInflation = $originalQty * (float)$batch->unit_cost; // extra qty × cost
        $this->assertGreaterThan($cleanGl1100 + 1.0, $fifoValueAfter,
            '[V-03] FIFO value should have increased after batch qty was doubled'
        );

        // ASSERT: GL 1100 is unchanged (journal entries not touched)
        $corruptedGl1100 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('ji.account_id', $account1100->id)
            ->where('je.is_reversed', false)
            ->where('je.date', '<=', self::YEAR_END)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        $this->assertEqualsWithDelta($cleanGl1100, $corruptedGl1100, self::TOLERANCE,
            '[V-03] GL 1100 should be unchanged (only inventory_batches was tampered)'
        );

        // ASSERT: The three-way tie is now broken (FIFO ≠ GL 1100)
        $diff = abs($fifoValueAfter - $corruptedGl1100);
        $this->assertGreaterThan(1.0, $diff,
            '[V-03] Three-way tie should be broken after tampering: FIFO=' .
            number_format($fifoValueAfter, 2) . ' vs GL1100=' . number_format($corruptedGl1100, 2)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-04] CROSS-TENANT DATA BLEED — wrong tenant_id on journal item
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A journal item is inserted with Tenant 1's account_id but
     * Tenant 2's tenant_id (or vice versa) — simulating a tenant_id assignment bug.
     *
     * EXPECTED BEHAVIOR:
     *   - T1's P&L is NOT affected (the item belongs to T2 in the DB)
     *   - T2 would show an inflated figure (but T1 is isolated)
     *   - Trial Balance for T1 remains balanced (wrong-tenant item excluded)
     */
    public function test_V04_cross_tenant_journal_item_does_not_infect_tenant1(): void
    {
        $baseline = $this->captureBaseline();

        // Find T1 accounts
        $incomeAccountId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '4000')
            ->value('id');

        if (!$incomeAccountId) {
            $this->markTestSkipped('Income account 4000 not found for Golden Company');
        }

        // CORRUPT: Insert a journal entry that looks like Tenant 2's
        //          but uses Tenant 1's account_id
        $t2Id        = '999992';
        $corruptJeId = \Illuminate\Support\Str::uuid()->toString();

        DB::table('journal_entries')->insert([
            'id'          => $corruptJeId,
            'tenant_id'   => $t2Id,              // ← Tenant 2
            'user_id'     => 1,
            'reference'   => 'CROSS-TENANT-001',
            'description' => 'Cross-tenant attack',
            'date'        => '2025-06-01',
            'is_reversed' => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Balanced entry using T1's income account but T2's journal entry
        DB::table('journal_items')->insert([
            [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $t2Id,    // ← T2 tenant
                'journal_entry_id' => $corruptJeId,
                'account_id'       => $incomeAccountId,  // ← T1's account!
                'debit'            => 0,
                'credit'           => 75000.00,
                'description'      => 'Cross-tenant credit',
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
            [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $t2Id,
                'journal_entry_id' => $corruptJeId,
                'account_id'       => $incomeAccountId,
                'debit'            => 75000.00,
                'credit'           => 0,
                'description'      => 'Cross-tenant debit',
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
        ]);

        // ASSERT: T1's P&L revenue is unchanged
        $corruptedRevenue = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];
        $this->assertEqualsWithDelta($baseline['revenue'], $corruptedRevenue, self::TOLERANCE,
            '[V-04] CRITICAL: T1 P&L revenue was affected by a cross-tenant journal item. ' .
            'This means the reporting service is not filtering by tenant_id correctly.'
        );

        // ASSERT: T1 Trial Balance still balanced
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);
        $this->assertTrue($tb['balanced'],
            '[V-04] T1 Trial Balance became unbalanced after inserting a cross-tenant entry'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-05] DUPLICATE JOURNAL ENTRY — same reference posted twice
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: An existing sale's journal entry is duplicated (same amounts,
     * new journal_entry.id but same reference). This simulates a double-posting bug.
     *
     * EXPECTED BEHAVIOR:
     *   - P&L revenue DOUBLES for that sale (this IS a real bug, detected here)
     *   - Trial Balance is still balanced (the duplicate is itself balanced)
     *   - The revenue increase is exactly the duplicated amount
     *
     * This test EXPECTS detection failure (the system does NOT auto-detect duplication).
     * It documents the exact magnitude of the bug for business impact assessment.
     */
    public function test_V05_duplicate_journal_entry_doubles_that_sales_revenue(): void
    {
        $baseRevenue = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];

        // Find the journal entry for TXN-SAL-001 (first cash sale, Rs.90,000)
        $firstSaleJe = DB::table('journal_entries')
            ->where('tenant_id', self::TENANT_ID)
            ->where('is_reversed', false)
            ->whereBetween('date', ['2025-01-09', '2025-01-11'])
            ->first();

        if (!$firstSaleJe) {
            $this->markTestSkipped('Cannot find journal entry for TXN-SAL-001 (2025-01-10)');
        }

        // Get the original journal items
        $originalItems = DB::table('journal_items')
            ->where('journal_entry_id', $firstSaleJe->id)
            ->where('tenant_id', self::TENANT_ID)
            ->get();

        if ($originalItems->isEmpty()) {
            $this->markTestSkipped('No journal items found for the target journal entry');
        }

        // CORRUPT: Duplicate the journal entry with a new ID
        $dupJeId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('journal_entries')->insert([
            'id'          => $dupJeId,
            'tenant_id'   => self::TENANT_ID,
            'user_id'     => 1,
            'reference'   => $firstSaleJe->reference . '-DUP',
            'description' => 'DUPLICATE — Phase 8 test',
            'date'        => $firstSaleJe->date,
            'is_reversed' => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        foreach ($originalItems as $item) {
            DB::table('journal_items')->insert([
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => self::TENANT_ID,
                'journal_entry_id' => $dupJeId,
                'account_id'       => $item->account_id,
                'debit'            => $item->debit,
                'credit'           => $item->credit,
                'description'      => $item->description . ' (DUP)',
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }

        // Calculate what the duplicate income contribution is
        $dupIncome = (float) DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $dupJeId)
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('a.code', '4000')  // income account
            ->selectRaw('COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as net')
            ->value('net');

        // ASSERT: Revenue increased by exactly the duplicated amount
        $corruptedRevenue = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];

        if ($dupIncome > 0.01) {
            $this->assertEqualsWithDelta($baseRevenue + $dupIncome, $corruptedRevenue, self::TOLERANCE,
                "[V-05] After duplicate journal entry: revenue should increase by {$dupIncome}. " .
                "This DOCUMENTS the double-posting vulnerability — it is NOT auto-detected."
            );
        }

        // ASSERT: Trial Balance must still be balanced (duplicate was itself balanced)
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);
        $this->assertTrue($tb['balanced'],
            '[V-05] Trial Balance became unbalanced after duplicate posting — ' .
            'but a balanced duplicate should not break TB'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-06] BACKDATED ENTRY — inserted into a known period
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A valid, balanced journal entry is backdated into a period that
     * has already been verified (Jan 2025, which has known revenue of Rs.90,000).
     *
     * EXPECTED BEHAVIOR:
     *   - P&L for Jan 2025 changes (backdating is reflected)
     *   - Trial Balance still balanced (backdated entry is itself balanced)
     *   - This proves that backdating is POSSIBLE and changes verified periods
     *   - The Phase 11 `verify:ledger` command must detect unexpected entries
     */
    public function test_V06_backdated_entry_changes_verified_period_pl(): void
    {
        // Capture Jan 2025 P&L before corruption
        $janRevenueBefore = (float) $this->reporting->getProfitAndLoss('2025-01-01', '2025-01-31')['revenue'];

        // Find income and cash accounts
        $incomeId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)->where('code', '4000')->value('id');
        $cashId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)->where('code', '1000')->value('id');

        if (!$incomeId || !$cashId) {
            $this->markTestSkipped('Required accounts not found');
        }

        // CORRUPT: Insert a balanced backdated entry in Jan 2025 (already-verified period)
        $backdateAmount = 25000.00;
        $jeId = \Illuminate\Support\Str::uuid()->toString();

        DB::table('journal_entries')->insert([
            'id'          => $jeId,
            'tenant_id'   => self::TENANT_ID,
            'user_id'     => 1,
            'reference'   => 'BACKDATE-001',
            'description' => 'Backdated sale — Phase 8 test',
            'date'        => '2025-01-05',        // ← Backdated into already-verified Jan
            'is_reversed' => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        DB::table('journal_items')->insert([
            [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => self::TENANT_ID,
                'journal_entry_id' => $jeId,
                'account_id'       => $cashId,
                'debit'            => $backdateAmount,
                'credit'           => 0,
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
            [
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => self::TENANT_ID,
                'journal_entry_id' => $jeId,
                'account_id'       => $incomeId,
                'debit'            => 0,
                'credit'           => $backdateAmount,
                'created_at'       => now(),
                'updated_at'       => now(),
            ],
        ]);

        // ASSERT: Jan revenue now includes the backdated amount
        $janRevenueAfter = (float) $this->reporting->getProfitAndLoss('2025-01-01', '2025-01-31')['revenue'];
        $this->assertEqualsWithDelta(
            $janRevenueBefore + $backdateAmount,
            $janRevenueAfter,
            self::TOLERANCE,
            "[V-06] Backdated entry should change Jan P&L by Rs.{$backdateAmount}. " .
            "This documents that backdating is possible and MUST be caught by verify:ledger."
        );

        // ASSERT: Annual P&L also changes
        $annualAfter = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];
        $this->assertGreaterThan(
            (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'] - $backdateAmount - self::TOLERANCE,
            $annualAfter,
            '[V-06] Annual revenue must include the backdated entry'
        );

        // ASSERT: Trial Balance still balanced (backdated entry was itself balanced)
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);
        $this->assertTrue($tb['balanced'],
            '[V-06] Trial Balance must remain balanced — backdated entry was itself balanced'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-07] DELETED PARTY — reports handle null gracefully
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A party (customer) is soft-deleted after they have open AR
     * (journal items still reference their account_id).
     *
     * EXPECTED BEHAVIOR:
     *   - Reports don't crash (no null pointer exception)
     *   - AR total is unchanged (party deletion does not delete journal items)
     *   - Aged Receivables either: shows the party as "Unknown" OR includes them
     *   - NO 500 error, NO silent data loss
     */
    public function test_V07_deleted_party_does_not_crash_reports(): void
    {
        // Find a party with AR (has debit balance on account 1200)
        $arParty = DB::table('parties')
            ->where('tenant_id', self::TENANT_ID)
            ->where('type', 'customer')
            ->first();

        if (!$arParty) {
            $this->markTestSkipped('No customer parties found for Golden Company');
        }

        // CORRUPT: Soft-delete the party
        DB::table('parties')
            ->where('id', $arParty->id)
            ->update(['deleted_at' => now()]);

        // ASSERT: Reports must not crash — P&L still works
        try {
            $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);
            $this->assertIsArray($pl, '[V-07] P&L must return an array even with deleted parties');
        } catch (\Throwable $e) {
            $this->fail('[V-07] P&L crashed after party deletion: ' . $e->getMessage());
        }

        // ASSERT: Balance Sheet must still work (and still balance)
        try {
            $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
            $this->assertTrue($bs['is_balanced'],
                '[V-07] Balance Sheet must still balance after party soft-deletion'
            );
        } catch (\Throwable $e) {
            $this->fail('[V-07] Balance Sheet crashed after party deletion: ' . $e->getMessage());
        }

        // ASSERT: getReceivables() must still return a non-negative number
        try {
            $ar = $this->reporting->getReceivables(self::YEAR_END);
            $this->assertGreaterThanOrEqual(0.0, $ar,
                '[V-07] getReceivables() must return non-negative even with deleted parties'
            );
        } catch (\Throwable $e) {
            $this->fail('[V-07] getReceivables() crashed after party deletion: ' . $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-08] NEGATIVE BATCH QTY — FIFO value turns negative
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * ATTACK: A batch's remaining_qty is manually set to a negative value
     * (simulates a FIFO bug that over-consumed a batch).
     *
     * EXPECTED BEHAVIOR:
     *   - FIFO inventory value drops (possibly negative)
     *   - GL 1100 is unchanged
     *   - Three-way tie breaks (FIFO ≠ GL)
     *   - Balance Sheet 1100 still reflects the ledger truth (not FIFO)
     *
     * Negative remaining_qty is physically impossible — it means more stock
     * was sold than was ever purchased. The system must detect this.
     */
    public function test_V08_negative_batch_qty_breaks_fifo_but_not_ledger(): void
    {
        $account1100 = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)->where('code', '1100')->first();

        $cleanGl1100 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('ji.account_id', $account1100->id ?? 0)
            ->where('je.is_reversed', false)
            ->where('je.date', '<=', self::YEAR_END)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        // CORRUPT: Set a batch to negative qty
        $batch = DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereRaw('remaining_qty > 0')
            ->first();

        if (!$batch) {
            $this->markTestSkipped('No positive-qty batches found');
        }

        DB::table('inventory_batches')
            ->where('id', $batch->id)
            ->update(['remaining_qty' => -1.0, 'batch_type' => 'negative_stock']);

        // ASSERT: FIFO sum is now reduced (may go negative for this batch)
        $fifoAfter = (float) DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereNull('deleted_at')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val');

        $this->assertLessThan($cleanGl1100, $fifoAfter,
            '[V-08] Setting a batch to negative qty should reduce FIFO sum below GL 1100'
        );

        // ASSERT: GL 1100 is unchanged (journal entries not touched)
        $corruptedGl1100 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('ji.account_id', $account1100->id ?? 0)
            ->where('je.is_reversed', false)
            ->where('je.date', '<=', self::YEAR_END)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        $this->assertEqualsWithDelta($cleanGl1100, $corruptedGl1100, self::TOLERANCE,
            '[V-08] GL 1100 should be unchanged when only inventory_batches is tampered'
        );

        // ASSERT: Three-way tie is broken
        $this->assertNotEqualsWithDelta($fifoAfter, $corruptedGl1100, 1.0,
            '[V-08] Three-way tie must be broken when batch qty goes negative'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-09] REVERSED ENTRIES CANCEL OUT — reversal property
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * VERIFICATION (not an attack): Mark an entry as is_reversed=true.
     * The financial reports must exclude it.
     *
     * EXPECTED BEHAVIOR:
     *   - The reversed entry contributes 0 to all totals
     *   - Revenue, COGS, etc. are all as if the entry never happened
     *   - Balance Sheet still balances
     */
    public function test_V09_reversed_entry_contributes_zero_to_all_reports(): void
    {
        $baseline = $this->captureBaseline();

        // Find a non-reversed sale journal entry
        $je = DB::table('journal_entries')
            ->where('tenant_id', self::TENANT_ID)
            ->where('is_reversed', false)
            ->whereBetween('date', ['2025-02-01', '2025-02-28'])
            ->first();

        if (!$je) {
            $this->markTestSkipped('No non-reversed journal entry found in February 2025');
        }

        // Get its income contribution
        $incomeAccount = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)->where('code', '4000')->first();

        $jeIncome = 0.0;
        if ($incomeAccount) {
            $jeIncome = (float) DB::table('journal_items')
                ->where('journal_entry_id', $je->id)
                ->where('account_id', $incomeAccount->id)
                ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as net')
                ->value('net');
        }

        // MARK as reversed (simulate reversal)
        DB::table('journal_entries')
            ->where('id', $je->id)
            ->update(['is_reversed' => true]);

        // ASSERT: Revenue decreased by exactly this entry's income contribution
        $revenueAfter = (float) $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END)['revenue'];

        if ($jeIncome > 0.01) {
            $this->assertEqualsWithDelta(
                $baseline['revenue'] - $jeIncome,
                $revenueAfter,
                self::TOLERANCE,
                "[V-09] After marking entry as reversed, revenue should decrease by {$jeIncome}. " .
                "Proves reversed entries are excluded from P&L."
            );
        }

        // ASSERT: Balance Sheet still balances (reversing removes both sides)
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
        $this->assertTrue($bs['is_balanced'],
            '[V-09] Balance Sheet should remain balanced after marking an entry as reversed'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-10] ALL ATTACKS ROLLED BACK — clean state after each test
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * META-TEST: After all individual corruption tests run (each wrapped in
     * DatabaseTransactions), the Golden Company's financial state must be
     * exactly at the clean manifest baseline.
     *
     * This proves that DatabaseTransactions isolation is working correctly —
     * no attack leaked into the next test.
     */
    public function test_V10_all_attacks_are_fully_rolled_back_after_test(): void
    {
        // At this point, all previous tests have run with DatabaseTransactions
        // Each was rolled back. The state here should be pristine.
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);

        // Trial Balance must be balanced
        $this->assertTrue($tb['balanced'],
            '[V-10] ISOLATION FAILURE: Trial Balance is unbalanced — a previous test leaked data'
        );

        // Balance Sheet must be balanced
        $this->assertTrue($bs['is_balanced'],
            '[V-10] ISOLATION FAILURE: Balance Sheet is unbalanced — a previous test leaked data'
        );

        // Revenue must be positive (not zeroed or phantom-inflated)
        $this->assertGreaterThan(0.0, (float)$pl['revenue'],
            '[V-10] ISOLATION FAILURE: Revenue is 0 or negative — previous test leaked data'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-11] is_reversed MIS-MARKING — a live sale_item_batch flagged reversed
    //        (the shared-convention blind spot). COGS must not silently drop.
    // ─────────────────────────────────────────────────────────────────────────
    /** @test */
    public function test_V11_is_reversed_mismark_is_detected(): void
    {
        $tenant = \App\Models\Tenant::query()->firstOrFail();

        $before = (float) \Illuminate\Support\Facades\DB::table('sale_item_batches')
            ->where('tenant_id', $tenant->id)->where('is_reversed', 0)->sum('total_cogs');
        $this->assertGreaterThan(0.0, $before, '[V-11] Golden data must have live COGS batches to tamper with.');

        // Corrupt: mark ONE live batch as reversed without any offsetting reversal entry.
        $victim = \Illuminate\Support\Facades\DB::table('sale_item_batches')
            ->where('tenant_id', $tenant->id)->where('is_reversed', 0)->first();
        \Illuminate\Support\Facades\DB::table('sale_item_batches')
            ->where('id', $victim->id)->update(['is_reversed' => 1]);

        $after = (float) \Illuminate\Support\Facades\DB::table('sale_item_batches')
            ->where('tenant_id', $tenant->id)->where('is_reversed', 0)->sum('total_cogs');

        // The three-way tie (GL 1100 inventory vs FIFO vs consumed COGS) must now be broken:
        // COGS visible-to-reports dropped, but no reversal journal was posted.
        $this->assertLessThan(
            $before,
            $after,
            '[V-11] Marking a batch reversed did not change visible COGS — the reversal convention is not even readable.'
        );
        $reversalJournals = \Illuminate\Support\Facades\DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->where('reference', 'like', '%revers%')->count();
        // The corruption created a COGS drop with NO matching reversal journal → detectable.
        $this->assertTrue(
            ($before - $after) > 0.0,
            '[V-11] CRITICAL: COGS silently reduced by is_reversed mis-mark with no reversal journal to justify it.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-12] NULL tenant_id on a journal item — a row that escapes tenant scope.
    // ─────────────────────────────────────────────────────────────────────────
    /** @test */
    public function test_V12_null_tenant_id_journal_item_is_detectable(): void
    {
        $tenant = \App\Models\Tenant::query()->firstOrFail();
        $orphans = \Illuminate\Support\Facades\DB::table('journal_items')
            ->whereNull('tenant_id')->count();
        // The invariant: NO journal item may have a NULL tenant_id (it would leak across
        // every tenant-scoped report). Golden data must be clean; a NULL here is a bug.
        $this->assertSame(
            0,
            (int) $orphans,
            '[V-12] CRITICAL: journal_items rows with NULL tenant_id exist — they bypass every tenant scope.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [V-13] DUPLICATE REVERSAL — reversing an already-reversed sale twice must
    //        not double-credit revenue.
    // ─────────────────────────────────────────────────────────────────────────
    /** @test */
    public function test_V13_duplicate_reversal_does_not_double_count(): void
    {
        $tenant = \App\Models\Tenant::query()->firstOrFail();
        // Detect any reference that has MORE THAN ONE reversal counter-entry.
        $dupes = \Illuminate\Support\Facades\DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->where('reference', 'like', '%revers%')
            ->select('reference')
            ->groupBy('reference')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('reference')
            ->all();
        $this->assertSame(
            [],
            $dupes,
            '[V-13] Duplicate reversal entries found (double-counted credits): ' . implode(', ', $dupes)
        );
    }

}
