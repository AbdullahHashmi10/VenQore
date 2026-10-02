<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\OnlinePricing;
use App\Services\Commerce\ProductReadiness;
use Illuminate\Support\Facades\DB;

class PricingTest extends CommerceTestCase
{
    private function price(array $product, ?array $sp, array $store)
    {
        return app(OnlinePricing::class)->resolve((object) array_merge(['price' => 1000, 'cost_price' => 400, 'tax_rate' => 0, 'price_includes_tax' => 0], $product), $sp ? (object) $sp : null, (object) array_merge(['pricing_mode' => 'same', 'pricing_percent' => 0], $store));
    }

    public function test_plus_ten_percent(): void
    {
        $r = $this->price([], null, ['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        $this->assertSame(1100.0, $r['online_price']);
        $this->assertSame('percent', $r['rule']);
        $this->assertSame(1000.0, $r['base_price']);
    }

    public function test_minus_ten_percent(): void
    {
        $this->assertSame(900.0, $this->price([], null, ['pricing_mode' => 'decrease', 'pricing_percent' => 10])['online_price']);
    }

    public function test_fixed_override_beats_percentage(): void
    {
        $r = $this->price([], ['override_price' => 1050], ['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        $this->assertSame(1050.0, $r['online_price']);
        $this->assertSame('fixed_override', $r['rule']);
    }

    public function test_regular_price_when_same(): void
    {
        $this->assertSame(1000.0, $this->price([], null, [])['online_price']);
    }

    public function test_rounding_is_applied_once_to_two_decimals(): void
    {
        $this->assertSame(333.66, $this->price(['price' => 303.33], null, ['pricing_mode' => 'increase', 'pricing_percent' => 10])['online_price']);
    }

    public function test_tax_inclusive_price_is_not_taxed_twice(): void
    {
        $r = $this->price(['price' => 1000, 'tax_rate' => 10, 'price_includes_tax' => 1], null, ['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        $this->assertSame(1100.0, $r['online_price']);
        $this->assertSame(1000.0, $r['net_unit_price']);
        $line = app(OnlinePricing::class)->line($r, 2);
        $this->assertSame(2000.0, $line['line_net']);
        $this->assertSame(200.0, $line['tax_amount']);
        $this->assertSame(2200.0, $line['line_total']); // = 2 x shopper price, tax not added again
    }

    public function test_tax_exclusive_adds_tax_once(): void
    {
        $r = $this->price(['tax_rate' => 10], null, []);
        $line = app(OnlinePricing::class)->line($r, 1);
        $this->assertSame(1100.0, $line['line_total']);
    }

    public function test_below_cost_flag(): void
    {
        $this->assertTrue($this->price(['cost_price' => 950], null, ['pricing_mode' => 'decrease', 'pricing_percent' => 10])['below_cost']);
        $this->assertFalse($this->price([], null, ['pricing_mode' => 'decrease', 'pricing_percent' => 10])['below_cost']);
    }

    public function test_rule_validation(): void
    {
        $this->assertNull(OnlinePricing::validateRule('same', 0));
        $this->assertNull(OnlinePricing::validateRule('increase', 10));
        $this->assertNotNull(OnlinePricing::validateRule('decrease', 95));
        $this->assertNotNull(OnlinePricing::validateRule('increase', 0));
        $this->assertNotNull(OnlinePricing::validateRule('increase', 250));
        $this->assertNotNull(OnlinePricing::validateRule('bogus', 5));
    }

    public function test_core_retail_price_is_never_overwritten(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store, ['override_price' => 1234]);
        $this->store->update(['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        app(\App\Services\Commerce\CheckoutService::class)->quote($this->store->fresh(), [['product_id' => $pid, 'quantity' => 1]]);
        $this->assertEquals(1000, DB::table('products')->where('id', $pid)->value('price'));
    }

    public function test_readiness_blocks_unsupported_products(): void
    {
        $mk = fn (array $o) => (object) array_merge(['id' => 'x', 'tenant_id' => $this->tenant->id, 'is_active' => 1, 'type' => 'standard', 'price' => 10], $o);
        $this->assertNull(ProductReadiness::reason($mk([])));
        $this->assertNotNull(ProductReadiness::reason($mk(['is_active' => 0])));
        $this->assertNotNull(ProductReadiness::reason($mk(['type' => 'service'])));
        $this->assertNotNull(ProductReadiness::reason($mk(['type' => 'composite'])));
        $this->assertNotNull(ProductReadiness::reason($mk(['has_variants' => 1])));
        $this->assertNotNull(ProductReadiness::reason($mk(['is_weighted' => 1])));
        $this->assertNotNull(ProductReadiness::reason($mk(['price' => 0])));
    }
}
