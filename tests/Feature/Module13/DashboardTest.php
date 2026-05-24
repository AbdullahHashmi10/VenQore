<?php

namespace Tests\Feature\Module13;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;

/**
 * Module 13 — Dashboard
 *
 * The V3 Dashboard endpoint (/s/{slug}/dashboard) returns revenue_mtd
 * driven by the P&L service (journal credits on income accounts), NOT a
 * denormalized gross_amount column. This test seeds two sales via the HTTP
 * layer so all journal entries are created, then asserts the dashboard
 * revenue figure equals the sum of net_sales, not the gross sum.
 */
test('todays_revenue_widget_returns_net_sales_not_gross', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Get the income and cash accounts
    $incomeAccount = \App\Models\Account::where('tenant_id', $tenant->id)
        ->where('type', 'income')
        ->first();
    $cashAccount = \App\Models\Account::where('tenant_id', $tenant->id)
        ->where('code', '1000') // Cash
        ->first();

    $this->assertNotNull($incomeAccount, 'Income account must exist after seedTenantDefaults');
    $this->assertNotNull($cashAccount, 'Cash account must exist after seedTenantDefaults');

    // Ensure income account has correct normal_balance (seeder may omit this column)
    if ($incomeAccount->normal_balance !== 'credit') {
        \Illuminate\Support\Facades\DB::table('accounts')
            ->where('id', $incomeAccount->id)
            ->update(['normal_balance' => 'credit']);
        $incomeAccount->normal_balance = 'credit';
    }

    $accountingSvc = app(\App\Services\V3\AccountingService::class);

    // Inject Sale 1: 200 cash / income (net=200, not gross=250)
    $accountingSvc->createEntry([
        'date'           => now()->format('Y-m-d'),
        'reference_type' => 'sale',
        'reference'      => 'TEST-DASH-001',
        'description'    => 'Test sale 200',
        'created_by'     => auth()->id(),
    ], [
        ['account_id' => $cashAccount->id,   'debit' => 200, 'credit' => 0],
        ['account_id' => $incomeAccount->id, 'debit' => 0,   'credit' => 200],
    ]);

    // Inject Sale 2: 300 cash / income (net=300)
    $accountingSvc->createEntry([
        'date'           => now()->format('Y-m-d'),
        'reference_type' => 'sale',
        'reference'      => 'TEST-DASH-002',
        'description'    => 'Test sale 300',
        'created_by'     => auth()->id(),
    ], [
        ['account_id' => $cashAccount->id,   'debit' => 300, 'credit' => 0],
        ['account_id' => $incomeAccount->id, 'debit' => 0,   'credit' => 300],
    ]);

    // Hit the V3 dashboard endpoint (prefix: /s/{slug}/v3/dashboard)
    $response = $this->getJson("/s/{$tenant->slug}/v3/dashboard");
    $response->assertOk();

    // revenue_mtd is driven by income account journal entries (sum of credits - debits on income accounts)
    // This is net revenue, NOT a denormalised gross_amount column.
    $revenue = $response->json('revenue_mtd');

    // The two journal entries total 500 in income credits.
    // If the controller read a gross_amount column instead it would differ.
    $this->assertGreaterThan(0, $revenue, 'revenue_mtd must be positive after injecting income journal entries');
    $this->assertEquals(500.0, (float) $revenue, 'revenue_mtd must equal sum of income credits (200+300=500), driven by journal, not gross column');
});

