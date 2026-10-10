<?php

namespace Tests\Feature\Commerce;

use Illuminate\Support\Facades\DB;

/** Phase B: city directory search and filters. */
class MarketplaceSearchTest extends CommerceTestCase
{

    public function test_search_matches_store_name_and_product_name(): void
    {
        $this->store->update(['display_name' => 'Blue Bakery']);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Sourdough Loaf'], 10, $this->store);

        $this->get('/shop?country=PK&city=lahore&q=bakery')->assertOk()
            ->assertInertia(fn ($p) => $this->assertSame(['Blue Bakery'], collect($p->toArray()['props']['stores']['data'])->pluck('name')->all()));
        $this->get('/shop?country=PK&city=lahore&q=Sourdough')->assertOk()
            ->assertInertia(function ($p) {
                $props = $p->toArray()['props'];
                $this->assertSame(['Blue Bakery'], collect($props['stores']['data'])->pluck('name')->all());
                $this->assertSame('Sourdough Loaf', $props['products'][0]['product']);
            });
        $this->get('/shop?country=PK&city=lahore&q=zzznomatch')->assertOk()
            ->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['stores']['data']));
    }

    public function test_unpublished_store_products_never_appear_in_search(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Secret Widget'], 10, $this->store);
        $this->store->update(['status' => 'suspended']);
        $this->get('/shop?country=PK&city=lahore&q=Secret')->assertOk()
            ->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['products']));
    }

    public function test_delivery_and_pickup_filters(): void
    {
        $this->store->update(['supports_delivery' => false, 'supports_pickup' => true]);
        $this->get('/shop?country=PK&city=lahore&delivery=1')->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['stores']['data']));
        $this->get('/shop?country=PK&city=lahore&pickup=1')->assertInertia(fn ($p) => $this->assertCount(1, $p->toArray()['props']['stores']['data']));
    }

    public function test_like_wildcards_in_search_are_literal(): void
    {
        $this->store->update(['display_name' => 'Plain Shop']);
        $this->get('/shop?country=PK&city=lahore&q=%25')->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['stores']['data']));
    }
}
