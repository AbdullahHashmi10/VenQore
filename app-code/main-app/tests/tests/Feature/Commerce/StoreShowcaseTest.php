<?php

namespace Tests\Feature\Commerce;

use Illuminate\Support\Facades\DB;

class StoreShowcaseTest extends CommerceTestCase
{
    public function test_front_page_has_featured_products_but_filtered_pages_do_not(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Star Item'], 10, $this->store);
        DB::table('storefront_products')->where('storefront_id', $this->store->id)->update(['is_featured' => 1]);

        $this->get('/shop/' . $this->store->slug)->assertOk()->assertInertia(function ($p) {
            $s = $p->toArray()['props']['showcase'];
            $this->assertNotNull($s);
            $this->assertSame(['Star Item'], collect($s['featured'])->pluck('name')->all());
        });
        $this->get('/shop/' . $this->store->slug . '?q=Star')->assertOk()
            ->assertInertia(fn ($p) => $this->assertNull($p->toArray()['props']['showcase']));
    }
}
