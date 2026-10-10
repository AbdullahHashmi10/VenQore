<?php

namespace Tests\Feature\SaleReliability;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Channels 3 and 4 — returns and cancellations refund exactly what the sale
 * BOOKED (ReturnValuation), never a re-pricing; pieces add up to the whole;
 * retries and double submissions post once. Real HTTP routes on MariaDB.
 */
class ReturnsAndCancellationsReliabilityTest extends VenQoreTestCase
{
    use \Tests\Support\ReconcilesBeforeRollback;

    private Tenant $tenant;
    private User $owner;
    private string $warehouseId;

    protected function setUp(): void
    {
        parent::setUp();
        \App\Support\SaleEvents::reset();
        $this->tenant = $this->createTenant('ret-' . uniqid(), 'ltd_3');
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        $this->warehouseId = (string) (\App\Models\Warehouse::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->value('id')
            ?? tap((string) Str::uuid(), fn ($id) => DB::table('warehouses')->insert(['id' => $id, 'tenant_id' => $this->tenant->id, 'name' => 'Main', 'is_default' => 1, 'created_at' => now(), 'updated_at' => now()])));
    }

    private function product(string $price, ?string $tax = null): Product
    {
        $cat = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        return Product::create(['tenant_id' => $this->tenant->id, 'name' => 'Item ' . uniqid(), 'sku' => 'S-' . uniqid(), 'unit' => 'pcs', 'base_unit' => 'pcs',
            'price' => $price, 'category_id' => $cat->id, 'type' => 'service', 'tax_rate' => $tax, 'cost_price' => 0]);
    }

    private function cents($v): int
    {
        return (int) round(((float) $v) * 100);
    }

    /** POS sale through the real route; returns the Sale. */
    private function posSale(array $lines, float $billDiscount, float $expected, array $over = []): Sale
    {
        $res = $this->postJson($this->storeUrl($this->tenant, '/pos/sales'), array_merge([
            'items' => $lines, 'payment_method' => 'split', 'payments' => [['method' => 'cash', 'amount' => $expected]],
            'discount' => $billDiscount, 'tax_rate' => 0, 'tax_inclusive' => false, 'tax_exempt' => false, 'bill_rounding' => false,
            'calculation_version' => 2, 'source' => 'pos', 'expected_total' => $expected, 'idempotency_key' => (string) Str::uuid(),
        ], $over));
        $res->assertCreated();
        return Sale::withoutGlobalScopes()->find($res->json('sale_id'));
    }

    /** Σ debit/credit per account code over entries of a type for a sale. */
    private function sumFor(string $saleId, array $types, string $code, string $side): int
    {
        $q = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $this->tenant->id)->where('a.code', $code)->whereIn('je.reference_type', $types)
            ->where(fn ($w) => $w->where('je.reference', $saleId)->orWhere('je.source_id', $saleId));
        return (int) round(((float) $q->sum("ji.{$side}")) * 100);
    }

    private function threeLineSale(): Sale
    {
        $a = $this->product('199.99', '17');
        $b = $this->product('49.95', '17');
        $c = $this->product('0.33', '17');
        $lines = [
            ['product_id' => $a->id, 'quantity' => 3, 'price' => 199.99, 'discount' => 0],
            ['product_id' => $b->id, 'quantity' => 1, 'price' => 49.95, 'discount' => 0],
            ['product_id' => $c->id, 'quantity' => 3, 'price' => 0.33, 'discount' => 0],
        ];
        // The total is computed by the shared calculator — the server checks it to the paisa.
        $calc = \App\Services\Sales\SaleTotals::calculate(['lines' => [
            ['unit_price' => '199.99', 'qty' => '3', 'tax_rate' => '17'], ['unit_price' => '49.95', 'qty' => '1', 'tax_rate' => '17'], ['unit_price' => '0.33', 'qty' => '3', 'tax_rate' => '17'],
        ], 'bill_discount' => ['type' => 'fixed', 'value' => '10.01'], 'tax' => ['enabled' => true, 'inclusive' => false, 'default_rate' => 0]]);
        return $this->posSale($lines, 10.01, \App\Support\Money::toFloat($calc['invoice']));
    }

    public function test_line_values_are_persisted_with_their_bill_discount_share(): void
    {
        $sale = $this->threeLineSale();
        $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
        $this->assertSame(1001, array_sum(array_map(fn ($i) => $this->cents($i->bill_discount_share), $items->all())));
        $this->assertSame($this->cents($sale->net_sales), array_sum(array_map(fn ($i) => $this->cents($i->revenue_amount), $items->all())));
    }

    public function test_partial_returns_in_pieces_add_up_to_exactly_what_was_booked(): void
    {
        $sale = $this->threeLineSale();
        $items = DB::table('sale_items')->where('sale_id', $sale->id)->orderBy('created_at')->get()->values();
        $url = $this->storeUrl($this->tenant, "/sales/{$sale->id}/return");
        // Line A back one unit at a time, then B and C.
        foreach ([[$items[0]->id, 1], [$items[0]->id, 1], [$items[2]->id, 2]] as [$id, $q]) {
            $this->post($url, ['items' => [['id' => $id, 'quantity' => $q]], 'reason' => 'piece'])->assertSessionHasNoErrors();
        }
        $this->post($url, ['items' => [['id' => $items[0]->id, 'quantity' => 1], ['id' => $items[1]->id, 'quantity' => 1], ['id' => $items[2]->id, 'quantity' => 1]], 'reason' => 'rest'])
            ->assertSessionHasNoErrors();

        $this->assertSame('returned', Sale::withoutGlobalScopes()->find($sale->id)->status);
        $this->assertSame($this->sumFor($sale->id, ['sale'], '4000', 'credit'), $this->sumFor($sale->id, ['sale_return'], '4000', 'debit'), 'revenue returned = revenue booked');
        $this->assertSame($this->sumFor($sale->id, ['sale'], '2100', 'credit'), $this->sumFor($sale->id, ['sale_return'], '2100', 'debit'), 'tax returned = tax booked');
        $this->assertSame($this->cents($sale->invoice_total), $this->sumFor($sale->id, ['sale_return'], '1000', 'credit'), 'cash refunded = cash taken');
    }

    public function test_returns_screen_refunds_the_booked_share_not_a_typed_price(): void
    {
        $sale = $this->threeLineSale();
        $line = DB::table('sale_items')->where('sale_id', $sale->id)->orderBy('created_at')->first();
        $party = $sale->party_id;
        $res = $this->post($this->storeUrl($this->tenant, '/returns'), [
            'customer_id' => $party, 'original_sale_id' => $sale->id, 'warehouse_id' => $this->warehouseId,
            'items' => [['product_id' => $line->product_id, 'original_sale_item_id' => $line->id, 'quantity' => 1, 'price' => 9999, 'tax_rate' => 50, 'discount' => 0]],
            'payment_method' => 'cash', 'amount_refunded' => 99999,
        ]);
        $res->assertSessionHasNoErrors();
        $ret = Sale::withoutGlobalScopes()->where('original_sale_id', $sale->id)->first();
        $this->assertNotNull($ret);
        $rev = \App\Services\Sales\ReturnValuation::share($this->cents($line->revenue_amount), 3, 0, 1);
        $tax = \App\Services\Sales\ReturnValuation::share($this->cents($line->tax_amount), 3, 0, 1);
        $this->assertSame(-($rev + $tax), $this->cents($ret->invoice_total), 'valued from the booked line, not from 9999 at 50%');
        $this->assertSame($rev + $tax, (int) round(((float) DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')->where('je.reference', $ret->id)->where('a.code', '1000')->sum('ji.credit')) * 100), 'refund capped at the booked value');
    }

    public function test_cancellation_mirrors_the_sale_exactly_and_runs_once(): void
    {
        $sale = $this->threeLineSale();
        $url = $this->storeUrl($this->tenant, "/sales/{$sale->id}/cancel");
        $this->postJson($url, ['reason' => 'mistake'])->assertOk();
        $second = $this->postJson($url, ['reason' => 'again']);
        $this->assertFalse($second->getStatusCode() === 200 && $second->json('success') === true, 'a second cancellation must not succeed');
        foreach (['1000' => 'debit', '4000' => 'credit', '2100' => 'credit'] as $code => $side) {
            $orig = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('je.reference', $sale->id)->where('je.reference_type', 'sale')->where('a.code', $code)->sum("ji.{$side}");
            $flip = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('je.tenant_id', $this->tenant->id)->where('je.reference_type', '!=', 'sale')->where('je.description', 'like', '%' . $sale->reference_number . '%')
                ->where('a.code', $code)->sum('ji.' . ($side === 'debit' ? 'credit' : 'debit'));
            $this->assertSame($this->cents($orig), $this->cents($flip), "account {$code} reversed exactly once");
        }
        $this->assertSame('cancelled', Sale::withoutGlobalScopes()->find($sale->id)->status);
    }

    public function test_cancelling_a_partly_returned_sale_reverses_exactly_the_remainder(): void
    {
        $sale = $this->threeLineSale();
        $first = DB::table('sale_items')->where('sale_id', $sale->id)->orderBy('created_at')->first();
        $this->post($this->storeUrl($this->tenant, "/sales/{$sale->id}/return"), ['items' => [['id' => $first->id, 'quantity' => 1]], 'reason' => 'one back'])->assertSessionHasNoErrors();
        $this->postJson($this->storeUrl($this->tenant, "/sales/{$sale->id}/cancel"), ['reason' => 'rest'])->assertOk();
        $this->assertSame($this->sumFor($sale->id, ['sale'], '4000', 'credit'), $this->sumFor($sale->id, ['sale_return'], '4000', 'debit'));
        $this->assertSame($this->sumFor($sale->id, ['sale'], '2100', 'credit'), $this->sumFor($sale->id, ['sale_return'], '2100', 'debit'));
    }

    public function test_open_pos_return_is_exact_and_idempotent(): void
    {
        $p = $this->product('33.335');
        $url = $this->storeUrl($this->tenant, '/pos/return');
        $body = ['items' => [['product_id' => $p->id, 'quantity' => 3, 'price' => 33.335]], 'warehouse_id' => $this->warehouseId, 'idempotency_key' => 'ret-key-1', 'refund_method' => 'cash'];
        $this->postJson($url, $body)->assertOk()->assertJson(['total' => 100.01]); // 100.005 → 100.01 once
        $this->postJson($url, $body)->assertOk();
        $this->assertSame(1, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->where('status', 'returned')->count());
        $changed = $body;
        $changed['items'][0]['quantity'] = 4;
        $this->assertSame(409, $this->postJson($url, $changed)->getStatusCode());
        $this->assertSame(1, Sale::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->where('status', 'returned')->count());
    }

    public function test_a_legacy_sale_without_booked_columns_still_refunds_exactly_what_it_posted(): void
    {
        $sale = $this->threeLineSale();
        // Simulate a sale saved before the booked-amount columns existed.
        DB::table('sale_items')->where('sale_id', $sale->id)->update(['revenue_amount' => null, 'bill_discount_share' => null]);
        $items = DB::table('sale_items')->where('sale_id', $sale->id)->orderBy('created_at')->get()->values();
        $url = $this->storeUrl($this->tenant, "/sales/{$sale->id}/return");
        $this->post($url, ['items' => [['id' => $items[0]->id, 'quantity' => 2]], 'reason' => 'legacy a'])->assertSessionHasNoErrors();
        $this->post($url, ['items' => [['id' => $items[0]->id, 'quantity' => 1], ['id' => $items[1]->id, 'quantity' => 1], ['id' => $items[2]->id, 'quantity' => 3]], 'reason' => 'legacy b'])
            ->assertSessionHasNoErrors();
        $this->assertSame($this->sumFor($sale->id, ['sale'], '4000', 'credit'), $this->sumFor($sale->id, ['sale_return'], '4000', 'debit'));
        $this->assertSame($this->sumFor($sale->id, ['sale'], '2100', 'credit'), $this->sumFor($sale->id, ['sale_return'], '2100', 'debit'));
    }

    public function test_valuation_pieces_conserve_for_awkward_quantities(): void
    {
        // Pure check of the cumulative share: 3 pieces of a 1.005-unit weighed line.
        $booked = 100001; // Rs 1000.01
        $parts = [
            \App\Services\Sales\ReturnValuation::share($booked, '1.005', '0', '0.335'),
            \App\Services\Sales\ReturnValuation::share($booked, '1.005', '0.335', '0.335'),
            \App\Services\Sales\ReturnValuation::share($booked, '1.005', '0.67', '0.335'),
        ];
        $this->assertSame($booked, array_sum($parts));
    }
}
