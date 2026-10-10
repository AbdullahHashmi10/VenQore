<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\MarketplaceSearch;
use App\Support\MapCoords;

class MarketplaceIntentTest extends CommerceTestCase
{
    public function test_parser_understands_common_phrases(): void
    {
        $p = MarketplaceSearch::parse('Restaurants near me');
        $this->assertSame('restaurants', $p['kind']);
        $this->assertTrue($p['near']);
        $this->assertSame('nearest', $p['sort']);
        $this->assertSame('', $p['text']);

        $p = MarketplaceSearch::parse('fastest delivery');
        $this->assertTrue($p['delivery']);
        $this->assertSame('fastest', $p['sort']);

        $p = MarketplaceSearch::parse('free delivery pharmacy open now');
        $this->assertTrue($p['free_delivery']);
        $this->assertTrue($p['open']);
        $this->assertSame('pharmacy', $p['kind']);

        $p = MarketplaceSearch::parse('sourdough');
        $this->assertSame('sourdough', $p['text']);
        $this->assertNull($p['kind']);
    }

    public function test_types_for_kind_come_from_the_business_catalogue(): void
    {
        $this->assertContains('restaurant', MarketplaceSearch::typesFor('restaurants'));
        $this->assertSame([], MarketplaceSearch::typesFor('nonsense'));
    }

    public function test_nearest_city_is_detected_from_coordinates(): void
    {
        // central Lahore
        $this->get('/shop?country=PK&lat=31.52&lng=74.36')->assertOk()
            ->assertInertia(function ($p) {
                $props = $p->toArray()['props'];
                $this->assertSame('lahore', $props['city']['slug']);
                $this->assertTrue($props['located']);
            });
        // middle of the ocean: no city
        $this->get('/shop?country=PK&lat=-30&lng=-30')->assertOk()
            ->assertInertia(fn ($p) => $this->assertNull($p->toArray()['props']['city']));
    }

    public function test_near_me_without_location_asks_for_it(): void
    {
        $this->get('/shop?country=PK&city=lahore&q=restaurants+near+me')->assertOk()
            ->assertInertia(fn ($p) => $this->assertTrue($p->toArray()['props']['needs_location']));
    }

    public function test_free_delivery_filter_and_distance(): void
    {
        $this->store->update(['supports_delivery' => true, 'delivery_charge' => 150, 'latitude' => 31.53, 'longitude' => 74.36]);
        $this->get('/shop?country=PK&city=lahore&q=free+delivery')->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['stores']['data']));
        $this->store->update(['delivery_charge' => 0]);
        $this->get('/shop?country=PK&city=lahore&lat=31.52&lng=74.36&q=free+delivery')->assertInertia(function ($p) {
            $d = $p->toArray()['props']['stores']['data'];
            $this->assertCount(1, $d);
            $this->assertNotNull($d[0]['distance_km']);
        });
    }

    public function test_live_offer_shows_in_offers_strip(): void
    {
        \Illuminate\Support\Facades\DB::table('commerce_promotions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'tenant_id' => $this->store->tenant_id, 'storefront_id' => $this->store->id,
            'name' => 'Weekend 20', 'code' => null, 'kind' => 'percent', 'percent' => 20, 'scope' => 'store', 'min_order' => 0, 'uses' => 0, 'is_active' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->get('/shop?country=PK&city=lahore')->assertInertia(function ($p) {
            $o = $p->toArray()['props']['offers'];
            $this->assertCount(1, $o);
            $this->assertSame('20% off', $o[0]['offer']);
        });
    }

    public function test_map_coords_parse_and_distance(): void
    {
        $this->assertNull(MapCoords::valid(0, 0));
        $this->assertEqualsWithDelta(0.0, MapCoords::km(31.5, 74.3, 31.5, 74.3), 0.001);
        $this->assertEqualsWithDelta(111.2, MapCoords::km(0.5, 10, 1.5, 10), 1.0);
    }
}
