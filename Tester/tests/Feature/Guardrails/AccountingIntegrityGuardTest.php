<?php

namespace Tests\Feature\Guardrails;

use App\Models\Account;
use App\Services\V3\AccountingService;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * AccountingIntegrityGuardTest — double-entry invariants that must NEVER break.
 *
 * These guard the foundation every report is built on. If any of them can be
 * violated silently, every downstream number (P&L, balance sheet, dashboard)
 * is untrustworthy while still looking fine.
 *
 *  1. The write engine MUST reject an unbalanced entry. This pins the
 *     validation at AccountingService::createEntry — if a future refactor
 *     removes it, the books can go unbalanced silently; this test catches that.
 *
 *  2. After real postings, EVERY individual journal entry balances (not just
 *     the tenant-wide total, which a compensating error could mask).
 *
 *  3. No orphan journal_items (an item whose parent entry does not exist).
 */
class AccountingIntegrityGuardTest extends VenQoreTestCase
{
    public function test_engine_rejects_an_unbalanced_journal_entry(): void
    {
        $tenant = $this->createTenant('acct-guard', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        app()->instance('current.tenant', $tenant);
        $user = $this->createTenantUser($tenant, 'owner');

        $cash = Account::where('tenant_id', $tenant->id)->where('code', '1000')->firstOrFail();
        $rev  = Account::where('tenant_id', $tenant->id)->where('code', '4000')->firstOrFail();

        $this->expectException(\InvalidArgumentException::class);

        // Debit 100 but credit only 90 — must be refused.
        app(AccountingService::class)->createEntry([
            'date'       => now()->toDateString(),
            'reference'  => 'UNBALANCED-1',
            'description' => 'Deliberately unbalanced',
            'created_by' => $user->id,
        ], [
            ['account_id' => $cash->id, 'debit' => 100, 'credit' => 0],
            ['account_id' => $rev->id,  'debit' => 0,   'credit' => 90],
        ]);
    }

    public function test_every_journal_entry_balances_and_no_orphans_exist(): void
    {
        $tenant = $this->createTenant('acct-guard-2', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        app()->instance('current.tenant', $tenant);
        $user = $this->createTenantUser($tenant, 'owner');

        $accounting = app(AccountingService::class);

        $ar   = Account::where('tenant_id', $tenant->id)->where('code', '1200')->firstOrFail();
        $rev  = Account::where('tenant_id', $tenant->id)->where('code', '4000')->firstOrFail();
        $cash = Account::where('tenant_id', $tenant->id)->where('code', '1000')->firstOrFail();

        $accounting->createEntry([
            'date' => now()->toDateString(), 'reference' => 'INTEG-1',
            'description' => 'Credit sale', 'created_by' => $user->id,
        ], [
            ['account_id' => $ar->id,  'debit' => 500, 'credit' => 0],
            ['account_id' => $rev->id, 'debit' => 0,   'credit' => 500],
        ]);

        $accounting->createEntry([
            'date' => now()->toDateString(), 'reference' => 'INTEG-2',
            'description' => 'Receipt', 'created_by' => $user->id,
        ], [
            ['account_id' => $cash->id, 'debit' => 300, 'credit' => 0],
            ['account_id' => $ar->id,   'debit' => 0,   'credit' => 300],
        ]);

        // (2) Every entry balances individually.
        $perEntry = DB::table('journal_items')
            ->where('tenant_id', $tenant->id)
            ->selectRaw('journal_entry_id, ROUND(SUM(debit),2) d, ROUND(SUM(credit),2) c')
            ->groupBy('journal_entry_id')
            ->get();

        $this->assertNotEmpty($perEntry, 'No journal items were posted.');
        foreach ($perEntry as $e) {
            $this->assertEqualsWithDelta(
                (float) $e->d,
                (float) $e->c,
                0.001,
                "Journal entry {$e->journal_entry_id} is individually unbalanced (D {$e->d} vs C {$e->c})."
            );
        }

        // (3) No orphan journal_items.
        $orphans = DB::table('journal_items as ji')
            ->leftJoin('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tenant->id)
            ->whereNull('je.id')
            ->count();

        $this->assertSame(0, $orphans, "Found {$orphans} orphan journal_items with no parent entry.");

        // Tenant-wide trial balance (existing helper) as a final backstop.
        $this->assertTrialBalanceZero($tenant);
    }
}
