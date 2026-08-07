<?php

namespace Tests\Feature\Guardrails;

use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * MySQL Trigger Verification (blueprint Phase E.3).
 *
 * CLAUDE.md carries a standing warning about the PaymentAllocation → JournalEntry link:
 * the `chk_allocation_insert` / `chk_allocation_update` triggers (migration
 * 2026_03_06_171402_add_allocations_trigger.php) SIGNAL SQLSTATE '45000' on
 * over-allocation. That warning finally has a test.
 *
 * This asserts the trigger BITES:
 *   - a valid allocation within the payment total is accepted;
 *   - an over-allocation is REJECTED with a database error (the SIGNAL fires).
 *
 * The whole point is that the guard is a DATABASE-level invariant, not app code — so we
 * exercise it through the database, bypassing any app-side validation, to prove the
 * trigger itself rejects the bad write. This is the "single writer" warning made real.
 *
 * MySQL-only (the trigger is MySQL; CLAUDE.md forbids SQLite). If not MySQL, skip.
 */
class PaymentAllocationTriggerTest extends VenQoreTestCase implements \Tests\Support\RequiresGoldenCompany
{
    private function requireMysqlWithTrigger(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('PaymentAllocation trigger is MySQL-only.');
        }
        $exists = DB::select(
            "SELECT COUNT(*) c FROM information_schema.triggers WHERE trigger_name = 'chk_allocation_insert'"
        );
        if (($exists[0]->c ?? 0) < 1) {
            $this->markTestSkipped('chk_allocation_insert trigger not installed in this database.');
        }
    }

    /** @test */
    public function trigger_rejects_over_allocation_of_a_payment(): void
    {
        $this->requireMysqlWithTrigger();

        $tenant = \App\Models\Tenant::query()->firstOrFail();

        $userId = DB::table('tenant_users')->where('tenant_id', $tenant->id)->value('user_id')
            ?: DB::table('users')->orderBy('id')->value('id')
            ?: \App\Models\User::factory()->create()->id;

        $jeId = \Illuminate\Support\Str::uuid()->toString();
        // Create a payment journal entry worth 100.00 (one item, debit 100).
        DB::table('journal_entries')->insert([
            'id'         => $jeId,
            'tenant_id'  => $tenant->id,
            'reference'  => 'TRIG-TEST-PAY-' . uniqid(),
            'date'       => now()->toDateString(),
            'user_id'    => $userId,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $accountId = DB::table('accounts')->where('tenant_id', $tenant->id)->value('id');
        DB::table('journal_items')->insert([
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $jeId,
            'account_id'       => $accountId,
            'debit'            => 100.00,
            'credit'           => 0.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // A valid allocation (80 <= 100) must succeed.
        $okId = DB::table('payment_allocations')->insertGetId([
            'tenant_id'                 => $tenant->id,
            'payment_journal_entry_id'  => $jeId,
            'sale_id'                   => null,
            'allocated_amount'          => 80.00,
            'status'                    => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->assertIsInt($okId, 'Valid allocation within the payment total should be accepted.');

        // A second allocation pushing the total over 100 must be REJECTED by the trigger.
        $rejected = false;
        try {
            DB::table('payment_allocations')->insert([
                'tenant_id'                 => $tenant->id,
                'payment_journal_entry_id'  => $jeId,
                'sale_id'                   => null,
                'allocated_amount'          => 50.00, // 80 + 50 = 130 > 100
                'status'                    => 'active',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            $rejected = true;
            $this->assertStringContainsStringIgnoringCase(
                'over-allocation',
                $e->getMessage(),
                'Trigger fired but with an unexpected message.'
            );
        }

        $this->assertTrue(
            $rejected,
            'PaymentAllocation over-allocation trigger did NOT fire — the ledger integrity '
                . 'guard CLAUDE.md warns about is not enforcing. This is a real defect.'
        );
    }
}
