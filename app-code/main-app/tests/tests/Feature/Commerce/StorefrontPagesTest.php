<?php

namespace Tests\Feature\Commerce;

use Illuminate\Support\Facades\DB;

/**
 * The public store is four pages (home, shop, product, cart). They must read the same sellable items
 * the cart prices, filter and sort them correctly, and never leak internals.
 */
class StorefrontPagesTest extends CommerceTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['inertia.testing.ensure_pages_exist' => false]);
        auth()->logout();                              // public visitors are guests with no ambient tenant
        app()->forgetInstance('current.tenant');
    }

    private function prods(array $q = []): array
    {
        return $this->get('/shop/' . $this->store->slug . '/products' . ($q ? '?' . http_build_query($q) : ''))->assertOk()->viewData('page')['props'];
    }

    public function test_shop_page_filters_sorts_and_pages(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Cheap Mug', 'price' => 100], 9, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Pricey Lamp', 'price' => 900], 9, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Gone Vase', 'price' => 500], 0, $this->store);

        $names = fn (array $q) => collect($this->prods($q)['items'])->pluck('name')->all();
        $this->assertSame(['Cheap Mug', 'Gone Vase', 'Pricey Lamp'], $names(['sort' => 'price_asc']));
        $this->assertSame(['Pricey Lamp', 'Gone Vase', 'Cheap Mug'], $names(['sort' => 'price_desc']));
        $this->assertSame(['Pricey Lamp'], $names(['min' => 600]));
        $this->assertSame(['Cheap Mug'], $names(['max' => 200]));
        $this->assertNotContains('Gone Vase', $names(['in_stock' => 1]));
        $this->assertSame(['Cheap Mug'], $names(['q' => 'mug']));
        $props = $this->prods();
        $this->assertSame(3, $props['pagination']['total']);
        $this->assertSame(100, (int) $props['bounds']['min']);
        $this->assertSame(900, (int) $props['bounds']['max']);
    }

    public function test_product_page_shows_the_item_and_its_option_ids_resolve_to_the_group(): void
    {
        $s = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Tee Small'], 10, $this->store);
        $l = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Tee Large', 'price' => 1200], 5, $this->store);
        DB::table('storefront_products')->where('product_id', $s)->update(['option_group' => 'Cotton Tee', 'option_label' => 'Small']);
        DB::table('storefront_products')->where('product_id', $l)->update(['option_group' => 'Cotton Tee', 'option_label' => 'Large']);
        $small = DB::table('storefront_products')->where('product_id', $s)->value('id');
        $large = DB::table('storefront_products')->where('product_id', $l)->value('id');
        $base = '/shop/' . $this->store->slug . '/p/';

        $head = $this->get($base . $small)->assertOk()->viewData('page')['props'];
        $this->assertSame('Cotton Tee', $head['item']['name']);
        $this->assertCount(2, $head['item']['options']);
        $viaOption = $this->get($base . $large)->assertOk()->viewData('page')['props'];
        $this->assertSame($large, (string) $viaOption['selected_option']);
        $this->assertSame($head['item']['id'], $viaOption['item']['id']);
    }

    public function test_unpublished_or_foreign_product_is_a_404_and_cart_page_renders(): void
    {
        $hidden = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Hidden'], 5, $this->store, ['is_published' => 0]);
        $listing = DB::table('storefront_products')->where('product_id', $hidden)->value('id');
        $this->get('/shop/' . $this->store->slug . '/p/' . $listing)->assertNotFound();
        $this->get('/shop/' . $this->store->slug . '/p/00000000-0000-0000-0000-000000000000')->assertNotFound();
        $this->get('/shop/' . $this->store->slug . '/cart')->assertOk();
    }

    public function test_old_browse_links_move_to_the_shop_page_and_pages_hide_internals(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Plain Thing', 'cost_price' => 77.77], 5, $this->store);
        $this->get('/shop/' . $this->store->slug . '?q=plain')->assertStatus(301)->assertRedirect('/shop/' . $this->store->slug . '/products?q=plain');
        foreach (['', '/products', '/p/' . DB::table('storefront_products')->where('product_id', $pid)->value('id')] as $suffix) {
            $html = $this->get('/shop/' . $this->store->slug . $suffix)->assertOk()->getContent();
            foreach (['77.77', 'cost_price', 'tenant_id', $pid] as $leak) {
                $this->assertStringNotContainsString($leak, $html, "leaked {$leak} on '{$suffix}'");
            }
        }
    }

    public function test_preview_carries_across_pages_for_an_unpublished_store(): void
    {
        $this->store->update(['status' => 'unpublished']);
        $this->get('/shop/' . $this->store->slug . '/products')->assertNotFound();
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute('commerce.store', now()->addHour(), ['slug' => $this->store->slug, 'preview' => 1]);
        $this->get($url)->assertOk();
        $this->get('/shop/' . $this->store->slug . '/products')->assertOk();   // same browser session
    }

    public function test_restaurants_get_the_menu_template_and_everyone_else_the_shop(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Zinger Burger', 'price' => 500], 9, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Cold Brew', 'price' => 300], 9, $this->store);

        $home = $this->get('/shop/' . $this->store->slug)->assertOk()->viewData('page')['props'];
        $this->assertSame('default', $home['template']);
        $this->assertSame([], $home['menu']);

        \App\Services\ModuleService::enable($this->tenant, 'table_service', 'system');
        $home = $this->get('/shop/' . $this->store->slug)->assertOk()->viewData('page')['props'];
        $this->assertSame('restaurant', $home['template']);
        $this->assertNotEmpty($home['menu']);
        $this->assertSame(2, collect($home['menu'])->sum(fn ($g) => count($g['items'])));

        // The menu page is one unpaginated list.
        $menu = $this->prods();
        $this->assertSame('restaurant', $menu['template']);
        $this->assertSame(1, $menu['pagination']['last']);
        $this->assertCount(2, $menu['items']);
    }
}
