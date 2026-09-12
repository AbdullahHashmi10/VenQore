<?php

namespace Tests\Feature\Module19;

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\EcommerceChannel;
use App\Models\MarketplacePayout;
use App\Models\Sale;
use App\Services\VenSynQ\MarketplaceSettlementService;
use Illuminate\Support\Facades\DB;

/**
 * Module 19 — T17 Marketplace Clearing Pipeline.
 *
 * These tests guard the LEDGER. Every one of them asserts the double-entry stays
 * balanced, because an unbalanced marketplace journal silently corrupts the
 * Balance Sheet for every tenant using online channels.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function t17Channel($tenant, array $overrides = []): EcommerceChannel
{
    return EcommerceChannel::create(array_merge([
        'tenant_id'                => $tenant->id,
        'name'                     => 'Amazon UK',
        'platform'                 => 'amazon',
        'external_seller_id'       => 'A1CLEARING' . mt_rand(100, 999),
        'default_fulfillment_type' => 'fbm',
        'fee_percentage'           => 15.00,
        'currency'                 => 'GBP',
        'settlement_days'          => 14,
        'reserve_percentage'       => 0,
        'auto_sweep'               => false,
        'is_connected'             => true,
    ], $overrides));
}

function t17Sale($tenant, $channel, array $overrides = []): Sale
{
    return Sale::withoutEvents(fn () => Sale::factory()->create(array_merge([
        'tenant_id'            => $tenant->id,
        'ecommerce_channel_id' => $channel->id,
        'channel_order_id'     => 'ORD-' . mt_rand(10000, 99999),
        'is_dropship'          => true,
        'status'               => 'posted',
        'posted_at'            => now(),
        'total'                => 100.00,
    ], $overrides)));
}

/** Sum debits and credits for a journal entry — the invariant that must hold. */
function t17EntryTotals(string $reference): array
{
    $row = DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.reference', $reference)
        ->selectRaw('SUM(journal_items.debit) as d, SUM(journal_items.credit) as c')
        ->first();

    return ['debit' => round((float) $row->d, 2), 'credit' => round((float) $row->c, 2)];
}

/** Balance on one account code for a tenant. */
function t17AccountMovement(string $code, $tenantId): array
{
    $row = DB::table('journal_items')
        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('accounts.code', $code)
        ->where('journal_entries.tenant_id', $tenantId)
        ->selectRaw('SUM(journal_items.debit) as d, SUM(journal_items.credit) as c')
        ->first();

    return ['debit' => round((float) $row->d, 2), 'credit' => round((float) $row->c, 2)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// The core problem: online money is NOT cash
// ═══════════════════════════════════════════════════════════════════════════════

test('t17_sale_posts_to_clearing_not_to_cash', function () {
    $tenant = $this->createTenant('clearing-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $sale    = t17Sale($tenant, $channel);

    app(MarketplaceSettlementService::class)
        ->postSaleToClearing($sale, $channel, 100.00, 15.00, 40.00);

    $reference = $sale->channel_order_id;

    // The whole point: 1205 Clearing is debited, 1000 Cash on Hand is NOT.
    $clearing = t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id);
    $cash     = t17AccountMovement('1000', $tenant->id);

    expect($clearing['debit'])->toBe(85.00);   // 100 gross − 15 fee
    expect($cash['debit'])->toBe(0.00);        // never touched

    // Revenue recognised gross, fee expensed separately.
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_REVENUE, $tenant->id)['credit'])->toBe(100.00);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_FEES, $tenant->id)['debit'])->toBe(15.00);

    // COGS pair.
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_COGS, $tenant->id)['debit'])->toBe(40.00);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_INVENTORY, $tenant->id)['credit'])->toBe(40.00);

    // THE INVARIANT.
    $totals = t17EntryTotals($reference);
    expect($totals['debit'])->toBe($totals['credit']);
});

test('t17_sale_attaches_to_an_open_payout_batch', function () {
    $tenant = $this->createTenant('batch-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant, ['settlement_days' => 14]);
    $service = app(MarketplaceSettlementService::class);

    $payoutA = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 100.00, 15.00);
    $payoutB = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 200.00, 30.00);

    // Both orders accrue into ONE batch — the owner confirms once, not per order.
    expect($payoutA->id)->toBe($payoutB->id);
    expect(MarketplacePayout::where('tenant_id', $tenant->id)->count())->toBe(1);

    $payout = $payoutB->fresh();
    expect((float) $payout->expected_gross)->toBe(300.00);
    expect((float) $payout->expected_fees)->toBe(45.00);
    expect((float) $payout->expected_net)->toBe(255.00);

    // Arrival date reflects the platform's real settlement terms.
    expect($payout->expected_at->toDateString())->toBe(now()->addDays(14)->toDateString());
});

// ═══════════════════════════════════════════════════════════════════════════════
// Estimates are never exact — the variance true-up
// ═══════════════════════════════════════════════════════════════════════════════

test('t17_payout_shortfall_is_trued_up_to_variance_and_stays_balanced', function () {
    $tenant = $this->createTenant('variance-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);

    // Expect £950 net.
    $payout = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 1000.00, 50.00);
    expect((float) $payout->fresh()->expected_net)->toBe(950.00);

    // Amazon actually deposits £918 — they took an extra £32 in storage/ad fees.
    $confirmed = $service->confirmPayout($payout->fresh(), 918.00);

    expect((float) $confirmed->actual_net)->toBe(918.00);
    expect((float) $confirmed->variance)->toBe(-32.00);
    expect($confirmed->status)->toBe('confirmed');

    // Dr Bank 918 + Dr Variance 32 = Cr Clearing 950. Balanced.
    $totals = t17EntryTotals('PAYOUT-' . substr($payout->id, 0, 8));
    expect($totals['debit'])->toBe(950.00);
    expect($totals['credit'])->toBe(950.00);

    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_BANK, $tenant->id)['debit'])->toBe(918.00);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_VARIANCE, $tenant->id)['debit'])->toBe(32.00);
});

test('t17_payout_overage_credits_variance_and_stays_balanced', function () {
    $tenant = $this->createTenant('overage-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);

    $payout = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 1000.00, 50.00);

    // We over-estimated the fee — £960 arrives instead of £950.
    $confirmed = $service->confirmPayout($payout->fresh(), 960.00);

    expect((float) $confirmed->variance)->toBe(10.00);

    // Dr Bank 960 = Cr Clearing 950 + Cr Variance 10.
    $totals = t17EntryTotals('PAYOUT-' . substr($payout->id, 0, 8));
    expect($totals['debit'])->toBe(960.00);
    expect($totals['credit'])->toBe(960.00);
});

test('t17_a_payout_cannot_be_confirmed_twice', function () {
    $tenant = $this->createTenant('double-confirm-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);

    $payout = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 100.00, 15.00);
    $service->confirmPayout($payout->fresh(), 85.00);

    // Double-confirming would double-credit the bank.
    expect(fn () => $service->confirmPayout($payout->fresh(), 85.00))
        ->toThrow(\RuntimeException::class);
});

// ═══════════════════════════════════════════════════════════════════════════════
// The sleeper bug: refunds must not raid the physical till
// ═══════════════════════════════════════════════════════════════════════════════

test('t17_online_refund_hits_clearing_never_cash_on_hand', function () {
    $tenant = $this->createTenant('refund-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);

    $sale   = t17Sale($tenant, $channel);
    $payout = $service->postSaleToClearing($sale, $channel, 100.00, 15.00);

    $service->postRefundToClearing($sale->fresh(), 40.00, 'Customer returned item');

    // A refund on an unsettled online order never touched the cash drawer.
    // Deducting it from 1000 would create a phantom till shortfall the
    // shopkeeper could never reconcile.
    expect(t17AccountMovement('1000', $tenant->id)['credit'])->toBe(0.00);

    $clearing = t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id);
    expect($clearing['debit'])->toBe(85.00);
    expect($clearing['credit'])->toBe(40.00);

    // Revenue reversed.
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_REVENUE, $tenant->id)['debit'])->toBe(40.00);

    // The owner's expected payout drops accordingly.
    expect((float) $payout->fresh()->expected_net)->toBe(45.00);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cutover — history must never be rewritten
// ═══════════════════════════════════════════════════════════════════════════════

test('t17_clearing_is_off_until_the_tenant_opts_in', function () {
    $tenant = $this->createTenant('no-clearing-store');   // clearing_go_live_at is null
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $sale    = t17Sale($tenant, $channel);

    $result = app(MarketplaceSettlementService::class)
        ->postSaleToClearing($sale, $channel, 100.00, 15.00);

    expect($result)->toBeNull();
    expect(MarketplacePayout::where('tenant_id', $tenant->id)->count())->toBe(0);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id)['debit'])->toBe(0.00);
});

test('t17_sales_made_before_the_cutover_are_left_alone', function () {
    $tenant = $this->createTenant('cutover-store');
    // Went live today; this order is from last week.
    $tenant->forceFill(['clearing_go_live_at' => now()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $oldSale = t17Sale($tenant, $channel);
    $oldSale->forceFill(['created_at' => now()->subWeek()])->save();

    $result = app(MarketplaceSettlementService::class)
        ->postSaleToClearing($oldSale->fresh(), $channel, 100.00, 15.00);

    // Closed periods and already-filed reports must stay byte-identical.
    expect($result)->toBeNull();
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id)['debit'])->toBe(0.00);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline figures + maturity
// ═══════════════════════════════════════════════════════════════════════════════

test('t17_pipeline_reports_the_three_stages', function () {
    $tenant = $this->createTenant('pipeline-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);

    $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 1000.00, 150.00);

    $pipeline = $service->pipeline($tenant->id);

    expect($pipeline['gross_in_pipeline'])->toBe(1000.00);
    expect($pipeline['pending_payout'])->toBe(850.00);
    expect($pipeline['estimated_fees'])->toBe(150.00);
    expect($pipeline['cleared_to_bank'])->toBe(0.00);   // nothing confirmed yet

    // Confirm it, and the money moves to the final stage.
    $payout = MarketplacePayout::where('tenant_id', $tenant->id)->first();
    $service->confirmPayout($payout, 850.00);

    $after = $service->pipeline($tenant->id);
    expect($after['pending_payout'])->toBe(0.00);
    expect($after['cleared_to_bank'])->toBe(850.00);
});

test('t17_reserve_percentage_is_withheld_from_expected_payout', function () {
    $tenant = $this->createTenant('reserve-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    // PayPal-style 10% rolling chargeback reserve.
    $channel = t17Channel($tenant, ['reserve_percentage' => 10.00]);

    $payout = app(MarketplaceSettlementService::class)
        ->postSaleToClearing(t17Sale($tenant, $channel), $channel, 1000.00, 100.00)
        ->fresh();

    // 1000 gross − 100 fee = 900 clearing; 10% of 900 = 90 held back.
    expect((float) $payout->expected_reserve)->toBe(90.00);
    expect((float) $payout->expected_net)->toBe(810.00);
});

test('t17_matured_payouts_flip_to_due_without_moving_money', function () {
    $tenant = $this->createTenant('mature-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant, ['settlement_days' => 0]);
    $service = app(MarketplaceSettlementService::class);

    $payout = $service->postSaleToClearing(t17Sale($tenant, $channel), $channel, 100.00, 15.00);

    $bankBefore = t17AccountMovement(MarketplaceSettlementService::ACCT_BANK, $tenant->id)['debit'];

    $service->matureDuePayouts($tenant);

    expect($payout->fresh()->status)->toBe('due');

    // Maturing is a prompt, not a transfer. Auto-posting deposits that may not
    // have landed is what makes bank reconciliation impossible.
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_BANK, $tenant->id)['debit'])->toBe($bankBefore);
});

test('t17_posting_the_same_sale_twice_does_not_double_count', function () {
    $tenant = $this->createTenant('idempotent-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);
    $service = app(MarketplaceSettlementService::class);
    $sale    = t17Sale($tenant, $channel);

    $service->postSaleToClearing($sale, $channel, 100.00, 15.00);
    $service->postSaleToClearing($sale->fresh(), $channel, 100.00, 15.00);   // replayed webhook

    $payout = MarketplacePayout::where('tenant_id', $tenant->id)->first();

    expect((float) $payout->expected_gross)->toBe(100.00);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id)['debit'])->toBe(85.00);
});

test('t17_fee_can_never_exceed_gross_revenue', function () {
    $tenant = $this->createTenant('fee-cap-store');
    $tenant->forceFill(['clearing_go_live_at' => now()->subDay()])->save();
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);

    $channel = t17Channel($tenant);

    // A misconfigured fee_percentage must never drive clearing negative.
    $payout = app(MarketplaceSettlementService::class)
        ->postSaleToClearing(t17Sale($tenant, $channel), $channel, 100.00, 250.00)
        ->fresh();

    expect((float) $payout->expected_fees)->toBe(100.00);
    expect((float) $payout->expected_net)->toBe(0.00);
    expect(t17AccountMovement(MarketplaceSettlementService::ACCT_CLEARING, $tenant->id)['debit'])->toBe(0.00);
});
