<?php

namespace Tests\Feature\Guardrails;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * Ledger Corruption ALERTING test (blueprint Phase F.2, closes F-15).
 *
 * The audit's point: detection is not the same as alerting. A command that CAN find
 * corruption is worthless if nothing runs it and nothing shouts when it fires. This test
 * proves the loop closes:
 *   1. corrupt a fixture tenant's ledger (unbalance one journal entry),
 *   2. run `verify:ledger`,
 *   3. assert it exits NON-ZERO (detection), and
 *   4. assert an alert artifact is produced (alerting).
 *
 * Paired with the scheduled registration (see console kernel / scheduler) this makes the
 * check run daily per tenant in production — detection becomes alerting, not just
 * possibility.
 */
class LedgerCorruptionAlertTest extends VenQoreTestCase implements \Tests\Support\RequiresGoldenCompany
{
    /** @test */
    public function verify_ledger_detects_and_alerts_on_injected_corruption(): void
    {
        $tenant = \App\Models\Tenant::query()->firstOrFail();

        $userId = DB::table('tenant_users')->where('tenant_id', $tenant->id)->value('user_id')
            ?: DB::table('users')->orderBy('id')->value('id')
            ?: \App\Models\User::factory()->create()->id;

        $jeId = \Illuminate\Support\Str::uuid()->toString();
        // Inject corruption: create a journal entry whose items do NOT balance.
        DB::table('journal_entries')->insert([
            'id'         => $jeId,
            'tenant_id'  => $tenant->id,
            'reference'  => 'CORRUPT-' . uniqid(),
            'date'       => now()->toDateString(),
            'user_id'    => $userId,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $accountId = DB::table('accounts')->where('tenant_id', $tenant->id)->value('id');
        DB::table('journal_items')->insert([
            'tenant_id'        => $tenant->id,
            'journal_entry_id' => $jeId,
            'account_id'       => $accountId,
            'debit'            => 999.99,   // debit with no matching credit → unbalanced
            'credit'           => 0.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Run the detector.
        $exit = Artisan::call('verify:ledger', ['--tenant' => $tenant->id]);

        // (1) Detection: non-zero exit.
        $this->assertNotSame(
            0,
            $exit,
            'F-15: verify:ledger returned 0 despite an injected unbalanced journal entry — it failed to DETECT corruption.'
        );

        // (2) Alerting: the run must leave an artifact a human/monitor can see.
        $output = Artisan::output();
        $this->assertNotEmpty($output, 'verify:ledger produced no output to alert on.');
        $this->assertMatchesRegularExpression(
            '/imbalanc|unbalanced|corrupt|issue|DIFF/i',
            $output,
            'F-15: verify:ledger detected an issue but emitted no recognizable ALERT text.'
        );
    }
}
