<?php

namespace Tests\Feature\Module20;

uses(\Tests\Feature\VenQoreTestCase::class);

use Tests\Feature\VenQoreTestCase;
use App\Models\Party;
use App\Models\Invoice;
use App\Models\StoreCreditBalance;
use App\Models\LoyaltyBalance;
use App\Models\GiftCard;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-finance');
    $this->seedTenantDefaults($this->tenant);
});

// ─────────────────────────────────────────────────────────────
// CONCURRENCY & DOUBLE-SPEND LOCK TESTS
// ─────────────────────────────────────────────────────────────

test('store credit cannot be double spent and query uses atomic lock', function () {
    $user = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAsTenantUserModel($user, $this->tenant);

    $party = Party::factory()->create(['tenant_id' => $this->tenant->id]);
    StoreCreditBalance::addCredit($party->id, 500, 'Refund');

    DB::enableQueryLog();
    StoreCreditBalance::useCredit($party->id, 100);
    $queries = DB::getQueryLog();
    DB::disableQueryLog();

    $hasLock = collect($queries)->contains(function ($query) {
        return str_contains(strtolower($query['query']), 'for update');
    });
    expect($hasLock)->toBeTrue();

    // Verify subsequent double spend check fails
    expect(function () use ($party) {
        StoreCreditBalance::useCredit($party->id, 450);
    })->toThrow(\Exception::class, 'Insufficient store credit');
});

test('loyalty points cannot be double spent and query uses atomic lock', function () {
    $user = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAsTenantUserModel($user, $this->tenant);

    $party = Party::factory()->create(['tenant_id' => $this->tenant->id]);
    LoyaltyBalance::awardPoints($party->id, 100, 'Purchase rewards');

    DB::enableQueryLog();
    LoyaltyBalance::redeemPoints($party->id, 50);
    $queries = DB::getQueryLog();
    DB::disableQueryLog();

    $hasLock = collect($queries)->contains(function ($query) {
        return str_contains(strtolower($query['query']), 'for update');
    });
    expect($hasLock)->toBeTrue();

    // Verify subsequent double spend check fails
    expect(function () use ($party) {
        LoyaltyBalance::redeemPoints($party->id, 100);
    })->toThrow(\Exception::class, 'Insufficient loyalty points');
});

// ─────────────────────────────────────────────────────────────
// OVER-DISCOUNTING & NEGATIVE BALANCE TESTS
// ─────────────────────────────────────────────────────────────

test('credit and loyalty point redemptions cannot exceed invoice total amount', function () {
    $user = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAsTenantUserModel($user, $this->tenant);

    $party = Party::factory()->create(['tenant_id' => $this->tenant->id]);
    $invoice = Invoice::create([
        'tenant_id' => $this->tenant->id,
        'invoice_number' => 'INV-2001',
        'date' => now()->toDateString(),
        'party_id' => $party->id,
        'total_amount' => 300,
        'subtotal' => 300,
    ]);

    StoreCreditBalance::addCredit($party->id, 500);

    // Over-discounting via store credit should be blocked
    $responseCredit = $this->postJson("/s/{$this->tenant->slug}/api/store-credit/use", [
        'party_id' => $party->id,
        'amount' => 400,
        'invoice_id' => $invoice->id,
    ]);
    $responseCredit->assertStatus(400);
    $responseCredit->assertJsonFragment(['error' => 'Store credit amount cannot exceed the invoice total amount']);

    // Over-discounting via loyalty points should be blocked
    LoyaltyBalance::awardPoints($party->id, 5000); // 5000 points = 500 PKR at rate 10
    $responseLoyalty = $this->postJson("/s/{$this->tenant->slug}/api/loyalty/redeem", [
        'party_id' => $party->id,
        'points' => 4000,
        'invoice_id' => $invoice->id,
    ]);
    $responseLoyalty->assertStatus(400);
    $responseLoyalty->assertJsonFragment(['error' => 'Redemption value cannot exceed the invoice total amount']);
});

// ─────────────────────────────────────────────────────────────
// TENANT ISOLATION TESTS
// ─────────────────────────────────────────────────────────────

test('cannot access or manipulate store credit or loyalty of customer from another tenant', function () {
    $tenantA = $this->tenant;
    $tenantB = $this->createTenant('store-b');

    $userB = $this->createTenantUser($tenantB, 'owner');

    // Customer belonging to Tenant A
    $partyA = Party::factory()->create(['tenant_id' => $tenantA->id]);

    $this->actingAsTenantUserModel($userB, $tenantB);

    // Get info request on Tenant A's customer should fail with 404
    $responseInfo = $this->getJson("/s/{$tenantB->slug}/api/loyalty/{$partyA->id}");
    $responseInfo->assertStatus(404);

    // Award points request on Tenant A's customer should fail with 404
    $responseAward = $this->postJson("/s/{$tenantB->slug}/api/loyalty/award", [
        'party_id' => $partyA->id,
        'points' => 100,
    ]);
    $responseAward->assertStatus(404);

    // Redeem points request on Tenant A's customer should fail with 404
    $responseRedeem = $this->postJson("/s/{$tenantB->slug}/api/loyalty/redeem", [
        'party_id' => $partyA->id,
        'points' => 50,
    ]);
    $responseRedeem->assertStatus(404);

    // Add store credit request on Tenant A's customer should fail with 404
    $responseAddCredit = $this->postJson("/s/{$tenantB->slug}/api/store-credit/add", [
        'party_id' => $partyA->id,
        'amount' => 100,
    ]);
    $responseAddCredit->assertStatus(404);

    // Use store credit request on Tenant A's customer should fail with 404
    $responseUseCredit = $this->postJson("/s/{$tenantB->slug}/api/store-credit/use", [
        'party_id' => $partyA->id,
        'amount' => 50,
    ]);
    $responseUseCredit->assertStatus(404);
});

test('cannot create check or use gift cards across tenants', function () {
    $tenantA = $this->tenant;
    $tenantB = $this->createTenant('store-gift-b');

    $userA = $this->createTenantUser($tenantA, 'owner');
    $userB = $this->createTenantUser($tenantB, 'owner');

    $partyA = Party::factory()->create(['tenant_id' => $tenantA->id]);

    // Create a gift card in Tenant A
    $this->actingAsTenantUserModel($userA, $tenantA);
    $responseCreate = $this->postJson("/s/{$tenantA->slug}/api/gift-cards", [
        'value' => 500,
        'purchased_by' => $partyA->id,
    ]);
    $responseCreate->assertStatus(200);
    $code = $responseCreate->json('gift_card.code');

    // Switch to Tenant B
    $this->actingAsTenantUserModel($userB, $tenantB);

    // Attempting to assign Tenant A's customer during Gift Card creation in Tenant B should 404
    $responseCreateB = $this->postJson("/s/{$tenantB->slug}/api/gift-cards", [
        'value' => 500,
        'assigned_to' => $partyA->id,
    ]);
    $responseCreateB->assertStatus(404);

    // Attempting to check Tenant A's Gift Card in Tenant B should return 404
    $responseCheck = $this->getJson("/s/{$tenantB->slug}/api/gift-cards/{$code}");
    $responseCheck->assertStatus(404);

    // Attempting to use Tenant A's Gift Card in Tenant B should fail
    $responseUse = $this->postJson("/s/{$tenantB->slug}/api/gift-cards/use", [
        'code' => $code,
        'amount' => 100,
    ]);
    $responseUse->assertStatus(400); // Fails since code is invalid under Tenant B
});
