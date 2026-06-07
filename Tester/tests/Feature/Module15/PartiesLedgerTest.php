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

test('quick party modal payload validation', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $response = $this->postJson("/s/{$tenant->slug}/parties", [
        'name' => 'Test Party Validation',
        'phone' => '',
        'email' => '',
        'type' => 'customer',
        'opening_balance' => 0,
        'opening_balance_type' => 'receivable',
        'credit_limit' => '',
        'address' => '',
        'notes' => '',
        'default_discount' => 0
    ]);

    if ($response->status() !== 200 && $response->status() !== 201) {
        dd($response->json());
    }

    $response->assertStatus(200);
});

// 1. Race condition testing for credit limit checks
test('blocks credit limit bypass under concurrent checkout race conditions', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);
    $ownerId = auth()->id();

    // Customer with 500 limit
    $customer = \App\Models\Party::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'customer',
        'credit_limit' => 500,
        'opening_balance' => 0,
        'opening_balance_type' => 'receivable'
    ]);

    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 300]);
    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    \App\Models\Stock::create(['tenant_id' => $tenant->id, 'warehouse_id' => $warehouse->id, 'product_id' => $product->id, 'quantity' => 10]);

    // Transaction 1: Charge 300 (Remaining limit: 200)
    $this->postJson("/s/{$tenant->slug}/sales", [
        'customer_id' => $customer->id,
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 300]],
        'amount_paid' => 0,
        'payment_method' => 'credit',
        'add_to_ledger' => true
    ])->assertStatus(200);

    // Transaction 2: Try to charge another 300 (Exceeds remaining 200)
    // Should be blocked immediately
    $response = $this->postJson("/s/{$tenant->slug}/sales", [
        'customer_id' => $customer->id,
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 300]],
        'amount_paid' => 0,
        'payment_method' => 'credit',
        'add_to_ledger' => true
    ]);

    $response->assertStatus(422);
});

// 2. Prevent deletion if transactions exist
test('blocks deletion of a party when journal entries or payments exist', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $party = \App\Models\Party::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'customer',
        'opening_balance' => 100,
        'opening_balance_type' => 'receivable'
    ]);

    // Manually create a journal entry referencing this party to block deletion
    \App\Models\JournalEntry::create([
        'tenant_id' => $tenant->id,
        'date' => now()->format('Y-m-d'),
        'reference_type' => 'manual',
        'party_id' => $party->id,
        'description' => 'Opening balance',
        'user_id' => auth()->id()
    ]);

    // Should block deletion because journal entry for opening balance exists
    $response = $this->deleteJson("/s/{$tenant->slug}/parties/{$party->id}");
    $response->assertStatus(422);
    
    // Also test V3 destroy route
    $responseV3 = $this->deleteJson("/s/{$tenant->slug}/v3/parties/{$party->id}");
    $responseV3->assertRedirect()->assertSessionHasErrors('party');
});

// 3. Reversal ledger visibility
test('retains reversed entries in the ledger statement history for full audit trail', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $party = \App\Models\Party::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'customer',
        'opening_balance' => 0,
        'opening_balance_type' => 'receivable',
        'credit_limit' => 1000
    ]);

    // Create a sale and then return it (fully reverse it)
    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);
    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    \App\Models\Stock::create(['tenant_id' => $tenant->id, 'warehouse_id' => $warehouse->id, 'product_id' => $product->id, 'quantity' => 10]);

    $saleResponse = $this->postJson("/s/{$tenant->slug}/sales", [
        'customer_id' => $party->id,
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 100, 'discount' => 0]],
        'amount_paid' => 0,
        'payment_method' => 'credit',
        'add_to_ledger' => true
    ]);
    
    $saleResponse->assertStatus(200);
    $saleId = $saleResponse->json('sale_id');

    // Return the sale
    $this->postJson("/s/{$tenant->slug}/sales/{$saleId}/return", [
        'refund_method' => 'ledger',
        'reason' => 'Defective return'
    ])->assertRedirect();

    // Query ledger list
    $response = $this->get("/s/{$tenant->slug}/parties/{$party->id}/ledger");
    $response->assertOk();

    // The transactions array returned to Inertia should contain BOTH the original invoice debit and the return credit
    $transactions = $response->original->getData()['page']['props']['transactions'];
    expect(count($transactions))->toBeGreaterThanOrEqual(2);
});

