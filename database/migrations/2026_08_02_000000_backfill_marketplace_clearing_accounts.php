<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Backfill — Marketplace Clearing chart-of-accounts entries for existing tenants.
 *
 * TenantDefaultSeeder::seedChartOfAccounts() added two new account codes for the
 * T17 marketplace/settlement work:
 *   - 1205 "Marketplace Clearing"       (asset)  — MarketplaceSettlementService
 *     holds online sales here until the platform payout is confirmed.
 *   - 5410 "Marketplace Fee Variance"   (expense) — variance between estimated
 *     and actual marketplace/gateway fees at settlement time.
 *
 * TenantDefaultSeeder only runs for a tenant at PROVISIONING time (see
 * ProvisionTenantJob::handle() -> TenantDefaultSeeder::seedFor()). It does not
 * re-run for tenants that already exist. Every tenant created BEFORE this
 * migration has neither account — meaning MarketplaceSettlementService, which
 * posts to account 1205 by code lookup, will fail at runtime for every
 * pre-existing store the first time a marketplace sale settles.
 *
 * This mirrors the exact pattern used by
 * 2026_04_16_200000_fix_chart_of_accounts_code_alignment.php for the same
 * class of problem (seeder gained a new account code; existing tenants never
 * got it) — add the missing code per tenant, guarded by existence checks so
 * this is safe to run against tenants that already have one or both (e.g. if
 * a tenant was provisioned after the seeder change but before this migration
 * ran).
 */
return new class extends Migration
{
    public function up(): void
    {
        $tenantIds = DB::table('tenants')->pluck('id');

        $newAccounts = [
            [
                'code'    => '1205',
                'name'    => 'Marketplace Clearing',
                'type'    => 'asset',
            ],
            [
                'code'    => '5410',
                'name'    => 'Marketplace Fee Variance',
                'type'    => 'expense',
            ],
        ];

        foreach ($tenantIds as $tenantId) {
            foreach ($newAccounts as $account) {
                $exists = DB::table('accounts')
                    ->where('tenant_id', $tenantId)
                    ->where('code', $account['code'])
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('accounts')->insert([
                    'id'             => (string) Str::uuid(),
                    'tenant_id'      => $tenantId,
                    'code'           => $account['code'],
                    'name'           => $account['name'],
                    'type'           => $account['type'],
                    'balance'        => 0,
                    // Both 1205 (asset) and 5410 (expense) are debit-normal accounts —
                    // matches TenantDefaultSeeder::seedChartOfAccounts() exactly.
                    'normal_balance' => 'debit',
                    'is_active'      => true,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }

    /**
     * Reversal is best-effort and only removes accounts with a zero balance —
     * an account that has since been posted to must not be silently deleted,
     * since that would orphan journal_items referencing it.
     */
    public function down(): void
    {
        DB::table('accounts')
            ->whereIn('code', ['1205', '5410'])
            ->where('balance', 0)
            ->delete();
    }
};
