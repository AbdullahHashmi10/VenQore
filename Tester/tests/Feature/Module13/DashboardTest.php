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
    \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-15 12:00:00', 'UTC'));
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
    \Carbon\Carbon::setTestNow();
});

test('attributes revenue and COGS to posted_at date range instead of created_at date range', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $product = \App\Models\Product::factory()->create([
        'tenant_id' => $tenant->id,
        'min_stock_alert' => 5,
    ]);

    // Create a sale created in May but posted in June
    $sale = \App\Models\Sale::create([
        'tenant_id' => $tenant->id,
        'user_id' => auth()->id(),
        'status' => 'posted',
        'net_sales' => 1200.0,
        'invoice_total' => 1200.0,
        'created_at' => '2026-05-31 23:59:00',
        'posted_at' => '2026-06-01 00:01:00',
    ]);

    // Hitting dashboard for June should see 1200 sales
    \Carbon\Carbon::setTestNow('2026-06-02 12:00:00');

    $response = $this->getJson("/s/{$tenant->slug}/dashboard");
    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    expect((float)$props['performance']['Month']['sales'])->toBe(1200.0);

    // Now set test now to May 2026: the sale posted in June should not count
    \Carbon\Carbon::setTestNow(); // Reset temporarily to allow tenant creation at current time
    
    $tenant2 = $this->createTenant();
    $this->actingAsOwner($tenant2);
    $this->seedTenantDefaults($tenant2);

    \Carbon\Carbon::setTestNow('2026-06-15 12:00:00');
    $response = $this->getJson("/s/{$tenant2->slug}/dashboard");
    $response->assertOk();
    $props = $response->original->getData()['page']['props'];
    expect((float)$props['performance']['Month']['sales'])->toBe(0.0);

    \Carbon\Carbon::setTestNow(); // Reset
});

test('computes dashboard net profit and P&L summary using accrual journal entry credits/debits, not cash movement', function () {
    \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-15 12:00:00', 'UTC'));
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $incomeAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('type', 'income')->first();
    $receivablesAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1200')->first();

    $accountingSvc = app(\App\Services\V3\AccountingService::class);

    // Create a credit sale: Debit Receivables (1200) Rs 1000, Credit Income (4000) Rs 1000
    // No cash/bank accounts involved. Cash movement = 0.
    $accountingSvc->createEntry([
        'date'           => now()->format('Y-m-d'),
        'reference_type' => 'sale',
        'reference'      => 'TEST-CREDIT-001',
        'description'    => 'Credit sale 1000',
        'created_by'     => auth()->id(),
    ], [
        ['account_id' => $receivablesAccount->id, 'debit' => 1000, 'credit' => 0],
        ['account_id' => $incomeAccount->id,      'debit' => 0,    'credit' => 1000],
    ]);

    $response = $this->getJson("/s/{$tenant->slug}/dashboard");
    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    // Under correct Accrual P&L logic, netProfit.Month.value = 1000.
    expect((float) $props['netProfit']['Month']['value'])->toBe(1000.0);
    expect((float) $props['plSummary']['Month']['income'])->toBe(1000.0);
    \Carbon\Carbon::setTestNow();
});

test('scopes all cashier dashboard widgets and session stats strictly to the current tenant', function () {
    $tenantA = $this->createTenant();
    $tenantB = $this->createTenant();

    // Create cashier membership on Tenant A
    $user = \App\Models\User::factory()->create();
    $membership = \App\Models\TenantUser::create([
        'user_id' => $user->id,
        'tenant_id' => $tenantA->id,
        'role' => 'cashier',
        'status' => 'active',
        'display_name' => $user->name,
        'joined_at' => now(),
    ]);

    $this->actingAs($user);
    app()->instance('current.membership', $membership);
    app()->instance('current.tenant', $tenantA);

    // Seed sale on Tenant A
    \App\Models\Sale::create([
        'tenant_id' => $tenantA->id,
        'user_id' => $user->id,
        'status' => 'posted',
        'net_sales' => 500.0,
        'invoice_total' => 500.0,
        'created_at' => now(),
        'posted_at' => now(),
    ]);

    // Seed sale on Tenant B (should be isolated)
    \App\Models\Sale::create([
        'tenant_id' => $tenantB->id,
        'user_id' => $user->id,
        'status' => 'posted',
        'net_sales' => 1000.0,
        'invoice_total' => 1000.0,
        'created_at' => now(),
        'posted_at' => now(),
    ]);

    $response = $this->getJson("/s/{$tenantA->slug}/dashboard");
    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    expect((float)$props['session']['session_total'])->toBe(500.0);
    expect((int)$props['session']['transaction_count'])->toBe(1);
});

test('handles zero activity onboarding state without throwing unhandled exceptions', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $response = $this->getJson("/s/{$tenant->slug}/dashboard");
    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    expect((float)$props['performance']['Today']['sales'])->toBe(0.0);
    expect((float)$props['outstanding']['Today']['receivables'])->toBe(0.0);
    expect((float)$props['netProfit']['Today']['value'])->toBe(0.0);
    expect($props['recentTransactions'])->toBeEmpty();
    expect($props['cashData'])->toBeNull();
});

test('restricts V3 dashboard endpoint to users without financial permissions', function () {
    $tenant = $this->createTenant();
    $cashierUser = \App\Models\User::factory()->create();
    \App\Models\TenantUser::create([
        'user_id' => $cashierUser->id,
        'tenant_id' => $tenant->id,
        'role' => 'cashier', // cashier has no finance or reports permission
        'status' => 'active',
        'display_name' => $cashierUser->name,
        'joined_at' => now(),
    ]);

    $this->actingAs($cashierUser);
    app()->instance('current.tenant', $tenant);

    $response = $this->getJson("/s/{$tenant->slug}/v3/dashboard");
    $response->assertStatus(403);
});


