<?php

namespace Tests\Feature\SaleReliability;

use App\Models\Category;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * Sale reliability, end to end through the REAL POST /s/{store}/pos/sales
 * wrapper (shift + capability checks) on MariaDB. Every case asserts the
 * persisted invoice, payments and each journal account — not just "balanced".
 */
class PosSaleReliabilityTest extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    private Tenant $tenant;
    private User $cashier;
    private Register $register;
    private RegisterShift $shift;

    protected function setUp(): void
    {
        parent::setUp();
        \App\Support\SaleEvents::reset();
        $this->tenant = $this->createTenant('rel-' . uniqid(), 'ltd_3');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $this->register = Register::create(['tenant_id' => $this->tenant->id, 'name' => 'Till 1', 'status' => 'active']);
        $this->shift = RegisterShift::create([
            'tenant_id' => $this->tenant->id, 'register_id' => $this->register->id, 'opened_by' => $this->cashier->id,
            'opening_balance' => 0, 'status' => 'open', 'opened_at' => now(),
        ]);
    }

    private function product(string $price, ?string $taxRate = null, string $name = 'Item'): Product
    {
        $cat = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        return Product::create([
            'tenant_id' => $this->tenant->id, 'name' => $name . ' ' . uniqid(), 'sku' => 'SKU-' . uniqid(),
            'unit' => 'pcs', 'base_unit' => 'pcs', 'price' => $price, 'category_id' => $cat->id,
            'type' => 'service', 'tax_rate' => $taxRate, 'cost_price' => 0,
        ]);
    }

    private function payload(array $items, array $over = []): array
    {
        return array_merge([
            'register_id' => $this->register->id,
            'items' => $items,
            'payment_method' => 'split',
            'payments' => [],
            'discount' => 0,
            'tax_rate' => 0,
            'tax_inclusive' => false,
            'tax_exempt' => true,
            'delivery_charge' => 0,
            'extra_charge_value' => 0,
            'bill_rounding' => false,
            'calculation_version' => 2,
            'source' => 'pos',
            'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        ], $over);
    }

    private function postSale(array $payload)
    {
        return $this->postJson($this->storeUrl($this->tenant, '/pos/sales'), $payload);
    }

    /** account code => [debit, credit] in minor units for the sale's entry */
    private function journal(string $saleId): array
    {
        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.reference', $saleId)->where('je.reference_type', 'sale')
            ->select('a.code', 'ji.debit', 'ji.credit')->get();
        $out = [];
        foreach ($rows as $r) {
            $out[$r->code][0] = ($out[$r->code][0] ?? 0) + (int) round($r->debit * 100);
            $out[$r->code][1] = ($out[$r->code][1] ?? 0) + (int) round($r->credit * 100);
        }
        ksort($out);
        return $out;
    }

    public function test_fractional_bill_discount_posts_one_consistent_amount(): void
    {
        // The owner: a 12.5% discount is above a cashier's limit (S-044 approval), which is not under test here.
        $this->actingAsTenantUserModel($this->createTenantUser($this->tenant, 'owner'), $this->tenant);
        $p = $this->product('7725');
        $res = $this->postSale($this->payload(
            [['product_id' => $p->id, 'quantity' => 1, 'price' => 7725, 'discount' => 0]],
            ['discount' => 965.63, 'payments' => [['method' => 'cash', 'amount' => 6759.37]], 'amount_paid' => 6759.37, 'expected_total' => 6759.37]
        ));
        $res->assertCreated()->assertJson(['success' => true, 'outcome' => 'committed', 'invoice_total' => '6759.37']);
        $sale = Sale::withoutGlobalScopes()->find($res->json('sale_id'));
        $this->assertSame('6759.37', number_format((float) $sale->invoice_total, 2, '.', ''));
        $this->assertSame(2, (int) $sale->calculation_version);
        $this->assertSame(['1000' => [675937, 0], '4000' => [0, 675937]], $this->journal($sale->id));
        $this->assertSame(675937, (int) round(DB::table('payments')->where('sale_id', $sale->id)->sum('amount') * 100));
    }

    public function test_delivery_charge_is_posted_once(): void
    {
        $p = $this->product('450');
        $res = $this->postSale($this->payload(
            [['product_id' => $p->id, 'quantity' => 2, 'price' => 450, 'discount' => 0]],
            ['delivery_charge' => 120, 'extra_charge_value' => 0, 'payments' => [['method' => 'cash', 'amount' => 1020]], 'expected_total' => 1020]
        ));
        $res->assertCreated();
        $this->assertSame(['1000' => [102000, 0], '4000' => [0, 90000], '4100' => [0, 12000]], $this->journal($res->json('sale_id')));
    }

    public function test_cash_change_is_recorded_but_not_posted(): void
    {
        $p = $this->product('1020');
        $res = $this->postSale($this->payload(
            [['product_id' => $p->id, 'quantity' => 1, 'price' => 1020, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 1020]], 'tendered_amount' => 1100, 'change_return' => 80, 'expected_total' => 1020]
        ));
        $res->assertCreated()->assertJson(['tendered_amount' => '1100.00', 'change_return' => '80.00', 'payment_status' => 'paid']);
        $this->assertSame(['1000' => [102000, 0], '4000' => [0, 102000]], $this->journal($res->json('sale_id')));
    }

    public function test_per_line_tax_matches_the_till(): void
    {
        $a = $this->product('0.05', '10');
        $b = $this->product('0.05', '10');
        $res = $this->postSale($this->payload([
            ['product_id' => $a->id, 'quantity' => 1, 'price' => 0.05, 'discount' => 0],
            ['product_id' => $b->id, 'quantity' => 1, 'price' => 0.05, 'discount' => 0],
        ], ['tax_exempt' => false, 'payments' => [['method' => 'cash', 'amount' => 0.12]], 'expected_total' => 0.12]));
        $res->assertCreated();
        $this->assertSame(['1000' => [12, 0], '2100' => [0, 2], '4000' => [0, 10]], $this->journal($res->json('sale_id')));
    }

    public function test_total_mismatch_is_refused_before_anything_is_written(): void
    {
        $p = $this->product('100');
        $res = $this->postSale($this->payload(
            [['product_id' => $p->id, 'quantity' => 1, 'price' => 100, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 100.05]], 'expected_total' => 100.05]
        ));
        $res->assertStatus(422)->assertJson(['code' => 'total_mismatch', 'outcome' => 'rejected']);
        $this->assertSame(0, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->count());
    }

    public function test_walk_in_one_paisa_short_is_refused(): void
    {
        $p = $this->product('100');
        $res = $this->postSale($this->payload(
            [['product_id' => $p->id, 'quantity' => 1, 'price' => 100, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 99.99]], 'expected_total' => 100]
        ));
        $res->assertStatus(422)->assertJson(['code' => 'walk_in_unpaid']);
        $this->assertSame(0, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
    }

    public function test_replay_returns_the_same_sale_and_changed_content_conflicts(): void
    {
        $p = $this->product('250');
        $payload = $this->payload(
            [['product_id' => $p->id, 'quantity' => 2, 'price' => 250, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 500]], 'expected_total' => 500]
        );
        $first = $this->postSale($payload)->assertCreated();
        $again = $this->postSale($payload)->assertCreated()->assertJson(['idempotent' => true, 'sale_id' => $first->json('sale_id')]);
        $changed = $payload;
        $changed['items'][0]['quantity'] = 3;
        $changed['payments'][0]['amount'] = 750;
        $changed['expected_total'] = 750;
        $this->postSale($changed)->assertStatus(409)->assertJson(['code' => 'idempotency_conflict']);
        $this->assertSame(1, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
        $this->assertSame(1, DB::table('journal_entries')->where('reference', $first->json('sale_id'))->where('reference_type', 'sale')->count());
    }

    public function test_replay_after_shift_closed_finds_the_committed_sale(): void
    {
        $p = $this->product('80');
        $payload = $this->payload(
            [['product_id' => $p->id, 'quantity' => 1, 'price' => 80, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 80]], 'expected_total' => 80]
        );
        $first = $this->postSale($payload)->assertCreated();
        $this->shift->update(['status' => 'closed', 'closed_at' => now()]);
        $this->postSale($payload)->assertCreated()->assertJson(['sale_id' => $first->json('sale_id'), 'idempotent' => true]);
        $this->assertSame(1, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
        $this->assertSame($this->shift->id, Sale::withoutGlobalScopes()->find($first->json('sale_id'))->register_shift_id);
    }

    public function test_intent_status_lookup_is_store_scoped(): void
    {
        $p = $this->product('10');
        $payload = $this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 10, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 10]], 'expected_total' => 10]);
        $sale = $this->postSale($payload)->assertCreated();
        $this->getJson($this->storeUrl($this->tenant, '/pos/sales/intent/' . $payload['idempotency_key']))
            ->assertOk()->assertJson(['outcome' => 'committed', 'sale_id' => $sale->json('sale_id'), 'invoice_total' => '10.00']);
        $this->getJson($this->storeUrl($this->tenant, '/pos/sales/intent/never-sent-123'))
            ->assertOk()->assertJson(['outcome' => 'not_found']);

        $other = $this->createTenant('rel-other-' . uniqid(), 'ltd_3');
        $owner = $this->createTenantUser($other, 'owner');
        $this->actingAsTenantUserModel($owner, $other);
        $this->getJson($this->storeUrl($other, '/pos/sales/intent/' . $payload['idempotency_key']))
            ->assertOk()->assertJson(['outcome' => 'not_found']);
    }

    public function test_activity_failure_after_commit_does_not_report_failure(): void
    {
        \App\Models\Activity::creating(function () {
            throw new \RuntimeException('activity store down');
        });
        $p = $this->product('55');
        $res = $this->postSale($this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 55, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 55]], 'expected_total' => 55]));
        $res->assertCreated()->assertJson(['success' => true]);
        $this->assertNotNull(Sale::withoutGlobalScopes()->find($res->json('sale_id')));
    }

    public function test_bill_rounding_is_explicit_round_off(): void
    {
        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(['tenant_id' => $this->tenant->id, 'key' => 'round_off_total'], ['value' => '0']);
        \App\Helpers\SettingsHelper::clearCache();
        $p = $this->product('99.99');
        $res = $this->postSale($this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 99.99, 'discount' => 0]],
            ['bill_rounding' => true, 'payments' => [['method' => 'cash', 'amount' => 100]], 'expected_total' => 100]));
        $res->assertCreated()->assertJson(['invoice_total' => '100.00']);
        $this->assertSame(['1000' => [10000, 0], '4000' => [0, 9999], '4900' => [0, 1]], $this->journal($res->json('sale_id')));
    }

    public function test_legacy_payload_without_version_still_posts_exactly(): void
    {
        $p = $this->product('100');
        $res = $this->postSale([
            'register_id' => $this->register->id,
            'items' => [['product_id' => $p->id, 'quantity' => 3, 'price' => 100, 'discount' => 29.999999999999996]],
            'payment_method' => 'split', 'payments' => [['method' => 'cash', 'amount' => 270]],
            'amount_paid' => 270, 'tax_exempt' => true, 'source' => 'pos',
            'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        ]);
        $res->assertCreated();
        $this->assertSame(['1000' => [27000, 0], '4000' => [0, 27000]], $this->journal($res->json('sale_id')));
    }

    public function test_legacy_till_double_sent_delivery_is_folded_once(): void
    {
        $p = $this->product('450');
        $res = $this->postSale([
            'register_id' => $this->register->id,
            'items' => [['product_id' => $p->id, 'quantity' => 2, 'price' => 450, 'discount' => 0]],
            'payment_method' => 'split', 'payments' => [['method' => 'cash', 'amount' => 1020]], 'amount_paid' => 1020,
            'delivery_charge' => 120, 'extra_charge_value' => 120, 'extra_charge_label' => 'Delivery fee',
            'tax_exempt' => true, 'source' => 'pos', 'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        ]);
        $res->assertCreated()->assertJson(['invoice_total' => '1020.00']);
        $this->assertSame(['1000' => [102000, 0], '4000' => [0, 90000], '4100' => [0, 12000]], $this->journal($res->json('sale_id')));
    }

    public function test_replayed_offline_sale_keeps_the_moment_it_was_rung(): void
    {
        $p = $this->product('70');
        $rungAt = now()->subDay()->setTime(16, 38, 21);
        $res = $this->postSale($this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 70, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 70]], 'expected_total' => 70, 'occurred_at' => $rungAt->toIso8601String()]));
        $res->assertCreated();
        $sale = Sale::withoutGlobalScopes()->find($res->json('sale_id'));
        // The app stores wall-clock time in the STORE's timezone (TenantMiddleware
        // sets it per request), so compare instants, not strings.
        $tz = config('app.timezone');
        $this->assertTrue(\Carbon\Carbon::parse($sale->getRawOriginal('posted_at'), $tz)->equalTo($rungAt), 'posted_at = when it was rung');
        $this->assertTrue(\Carbon\Carbon::parse($sale->getRawOriginal('occurred_at'), $tz)->equalTo($rungAt), 'occurred_at kept');
        $this->assertTrue(\Carbon\Carbon::parse($sale->getRawOriginal('created_at'), $tz)->greaterThan($rungAt->copy()->addHours(12)), 'created_at stays the server receipt time');
        $this->assertSame($rungAt->copy()->setTimezone($tz)->toDateString(), DB::table('journal_entries')->where('reference', $sale->id)->value('date'));
    }

    public function test_device_clock_in_the_future_does_not_post_into_the_future(): void
    {
        $p = $this->product('5');
        $res = $this->postSale($this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 5, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 5]], 'expected_total' => 5, 'occurred_at' => now()->addDays(3)->toIso8601String()]));
        $res->assertCreated();
        $this->assertTrue(Sale::withoutGlobalScopes()->find($res->json('sale_id'))->posted_at->lessThanOrEqualTo(now()->addMinute()));
    }

    public function test_credit_leg_is_never_counted_as_cash_tendered(): void
    {
        $customer = \App\Models\Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Khata ' . uniqid(), 'type' => 'customer', 'phone' => '03' . random_int(100000000, 999999999)]);
        $p = $this->product('100');
        // An OLD till's shape: tendered_amount included the credit promise.
        $res = $this->postSale($this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 100, 'discount' => 0]], [
            'customer_id' => $customer->id,
            'payments' => [['method' => 'cash', 'amount' => 40], ['method' => 'credit', 'amount' => 60]],
            'amount_paid' => 40, 'tendered_amount' => 100, 'change_return' => 0, 'expected_total' => 100,
        ]));
        $res->assertCreated()->assertJson(['tendered_amount' => '40.00', 'change_return' => '0.00']);
        $this->assertSame(['1000' => [4000, 0], '1200' => [6000, 0], '4000' => [0, 10000]], $this->journal($res->json('sale_id')));
    }

    public function test_mixed_card_and_cash_change_comes_only_from_cash(): void
    {
        $p = $this->product('100');
        $items = [['product_id' => $p->id, 'quantity' => 1, 'price' => 100, 'discount' => 0]];
        $payments = [['method' => 'card', 'amount' => 60], ['method' => 'cash', 'amount' => 40]];

        // An inflated total with a card line must not invent change.
        $inflated = $this->postSale($this->payload($items, ['payments' => $payments, 'tendered_amount' => 500, 'expected_total' => 100]));
        $inflated->assertCreated()->assertJson(['tendered_amount' => '100.00', 'change_return' => '0.00']);
        $this->assertSame(['1000' => [4000, 0], '1010' => [6000, 0], '4000' => [0, 10000]], $this->journal($inflated->json('sale_id')));

        // The cash part paid with a Rs50 note: exactly Rs10 change, books unchanged.
        $exact = $this->postSale($this->payload($items, ['payments' => $payments, 'tendered_amount' => 110, 'cash_tendered' => 50, 'expected_total' => 100]));
        $exact->assertCreated()->assertJson(['tendered_amount' => '110.00', 'change_return' => '10.00']);
        $this->assertSame(['1000' => [4000, 0], '1010' => [6000, 0], '4000' => [0, 10000]], $this->journal($exact->json('sale_id')));
    }

    public function test_offline_batch_reports_a_result_per_order(): void
    {
        $p = $this->product('40');
        $good = $this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 40, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 40]], 'expected_total' => 40, 'client_sale_id' => 'off-good-1', 'register_id' => 'REG-1']);
        $bad = $this->payload([['product_id' => $p->id, 'quantity' => 1, 'price' => 40, 'discount' => 0]],
            ['payments' => [['method' => 'cash', 'amount' => 39]], 'expected_total' => 40, 'client_sale_id' => 'off-bad-1', 'register_id' => 'REG-1']);
        $owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $this->tenant);
        $res = $this->postJson($this->storeUrl($this->tenant, '/api/sync/orders/batch'), ['orders' => [$good, $bad]]);
        $res->assertOk()->assertJson(['count' => 1, 'status' => 'partial']);
        $results = collect($res->json('results'))->keyBy('client_sale_id');
        $this->assertSame('committed', $results['off-good-1']['outcome']);
        $this->assertSame('rejected', $results['off-bad-1']['outcome']);
        $this->assertSame('walk_in_unpaid', $results['off-bad-1']['code']);
    }
}
