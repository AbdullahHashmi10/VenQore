<?php

namespace Tests\Feature\Module15;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;

/**
 * Module 15 — Parties & Ledger
 *
 * Tests verify that party balances are fully ledger-driven (no denormalized
 * cached columns used) and that credit limit enforcement blocks over-limit sales.
 */

/**
 * Test 1: Customer balance is ledger-driven, not a cached column.
 *
 * Flow:
 *   1. Create a customer party with opening_balance = 0 (clean slate).
 *   2. Manually inject a journal entry crediting A/R for 350 (simulating a credit sale).
 *   3. Hit GET /parties?wantsJson and locate the party.
 *   4. Assert current_balance = 350 (read from journal, not from parties.current_balance).
 *
 * This guards against a regression where the controller reads a denormalized
 * column instead of live journal data.
 */
test('customer_balance_is_ledger_driven_not_cached', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create a customer party with zero opening balance
    $partyResponse = $this->postJson("/s/{$tenant->slug}/parties", [
        'name'                 => 'Ledger Test Customer',
        'type'                 => 'customer',
        'opening_balance'      => 0,
        'opening_balance_type' => 'receivable',
    ])->assertOk();

    $partyId = $partyResponse->json('party.id');
    $this->assertNotNull($partyId);

    // Get the A/R account for this tenant
    $arAccount = \App\Models\Account::where('tenant_id', $tenant->id)
        ->where('code', '1200')
        ->first();
    $this->assertNotNull($arAccount, 'A/R account (1200) must exist after seedTenantDefaults');

    // Get any income account for the other leg of the entry
    $incomeAccount = \App\Models\Account::where('tenant_id', $tenant->id)
        ->where('type', 'income')
        ->first();
    $this->assertNotNull($incomeAccount, 'Income account must exist after seedTenantDefaults');

    // Directly inject a journal entry: DR A/R 350 / CR Income 350
    // (simulating a credit sale for 350 where the customer owes us)
    $accountingSvc = app(\App\Services\V3\AccountingService::class);
    $accountingSvc->createEntry([
        'date'           => now()->format('Y-m-d'),
        'reference_type' => 'sale',
        'reference'      => 'TEST-LEDGER-001',
        'party_id'       => $partyId,
        'description'    => 'Test credit sale',
        'created_by'     => auth()->id(),
    ], [
        ['account_id' => $arAccount->id,     'debit' => 350, 'credit' => 0,   'party_id' => $partyId],
        ['account_id' => $incomeAccount->id,  'debit' => 0,   'credit' => 350, 'party_id' => $partyId],
    ]);

    // Corrupt the denormalized column to verify the controller ignores it
    DB::table('parties')
        ->where('id', $partyId)
        ->update(['current_balance' => 9999]); // deliberate wrong value

    // Hit the parties endpoint as JSON — should compute balance from journal
    $response = $this->getJson("/s/{$tenant->slug}/parties?type=customer");
    $response->assertOk();

    $parties = $response->json('data');
    $party = collect($parties)->firstWhere('id', $partyId);
    $this->assertNotNull($party, 'Party must appear in parties list');

    // current_balance should be 350 (from journal), NOT 9999 (from cached column)
    $this->assertEquals(
        350.0,
        (float) $party['current_balance'],
        'Party balance must be 350 (ledger-driven), not 9999 (denormalized/cached)'
    );
});

/**
 * Test 2: Credit limit enforcement blocks over-limit sale.
 *
 * Flow:
 *   1. Create customer with credit_limit = 500.
 *   2. Attempt a credit sale for 600 (no upfront payment, add_to_ledger = true).
 *   3. Assert sale is blocked with a non-200 response OR the response body
 *      contains a credit limit error message.
 */
test('credit_limit_exceeded_blocks_sale', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create customer with credit_limit = 500
    $partyResponse = $this->postJson("/s/{$tenant->slug}/parties", [
        'name'                 => 'Credit Limit Customer',
        'type'                 => 'customer',
        'opening_balance'      => 0,
        'opening_balance_type' => 'receivable',
        'credit_limit'         => 500,
    ])->assertOk();

    $partyId = $partyResponse->json('party.id');

    $product = \App\Models\Product::factory()->create([
        'tenant_id' => $tenant->id,
        'price'     => 600,
    ]);

    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    \App\Models\Stock::create([
        'tenant_id'    => $tenant->id,
        'warehouse_id' => $warehouse->id,
        'product_id'   => $product->id,
        'quantity'     => 1000,
    ]);

    // Attempt credit sale of 600 — exceeds limit of 500
    $response = $this->postJson("/s/{$tenant->slug}/sales", [
        'customer_id'    => $partyId,
        'warehouse_id'   => $warehouse->id,
        'items'          => [['product_id' => $product->id, 'quantity' => 1, 'price' => 600, 'discount' => 0]],
        'discount'       => 0,
        'amount_paid'    => 0,   // no payment upfront — full amount on credit
        'payment_method' => 'credit',
        'add_to_ledger'  => true,
    ]);

    // The sale should be blocked (4xx) OR succeed with a warning payload
    // indicating the credit limit was enforced.
    // If the feature isn't enforced yet, assert 422 / message contains 'credit'.
    $response->assertStatus(422);
    $body = $response->json();
    $bodyStr = strtolower(json_encode($body));
    $this->assertTrue(
        str_contains($bodyStr, 'credit') || str_contains($bodyStr, 'limit'),
        'Error response must mention credit limit. Got: ' . json_encode($body)
    );
});
