<?php

namespace Tests\Feature\Commerce;

use App\Models\User;
use App\Services\Commerce\CheckoutService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** One customer account across every store, found through a verified email. */
class CustomerHubTest extends CommerceTestCase
{
    private function orderAt($tenant, $store, string $warehouseId, string $email, bool $linkParty = true): string
    {
        $pid = $this->makeProduct($tenant, $warehouseId, ['price' => 500, 'cost_price' => 100], 20, $store);
        $order = app(CheckoutService::class)->place($store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]]))['order'];

        if ($linkParty) {
            $party = (string) Str::uuid();
            DB::table('parties')->insert([
                'id' => $party, 'tenant_id' => $tenant->id, 'name' => 'Ali', 'email' => $email, 'type' => 'customer',
                'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('commerce_orders')->where('id', $order->id)->update(['party_id' => $party]);
        }

        return $order->public_number;
    }

    private function secondStore(): array
    {
        $tenant = $this->createTenant('shop2-' . Str::lower(Str::random(6)), 'growth', 'active');
        $wh = (string) DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

        return [$tenant, $this->makeStore($tenant, $wh, ['display_name' => 'Second Shop']), $wh];
    }

    public function test_orders_from_every_store_appear_under_one_verified_email(): void
    {
        [$t2, $s2, $w2] = $this->secondStore();
        $a = $this->orderAt($this->tenant, $this->store, $this->warehouseId, 'sam@example.com');
        $b = $this->orderAt($t2, $s2, $w2, 'SAM@example.com');
        $this->actingAs(User::factory()->create(['email' => 'sam@example.com', 'email_verified_at' => now()]));

        $this->get('/my-orders')->assertOk()->assertInertia(function ($page) use ($a, $b) {
            $numbers = collect($page->toArray()['props']['orders'])->pluck('number')->all();
            $this->assertEqualsCanonicalizing([$a, $b], $numbers);
            $stores = collect($page->toArray()['props']['orders'])->pluck('store')->unique()->all();
            $this->assertCount(2, $stores);

            // The dashboard also knows what they order most, across both stores, and who they are.
            $props = $page->toArray()['props'];
            $this->assertNotEmpty($props['topItems']);
            $this->assertSame(2, (int) $props['topItems'][0]['times']);
            $this->assertSame('sam@example.com', $props['info']['email']);
        });
    }

    public function test_someone_elses_orders_are_never_shown(): void
    {
        $this->orderAt($this->tenant, $this->store, $this->warehouseId, 'sam@example.com');
        $this->actingAs(User::factory()->create(['email' => 'other@example.com', 'email_verified_at' => now()]));

        $this->get('/my-orders')->assertOk()->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['orders']));
    }

    public function test_an_unverified_email_sees_nothing(): void
    {
        $this->orderAt($this->tenant, $this->store, $this->warehouseId, 'sam@example.com');
        $this->actingAs(User::factory()->create(['email' => 'sam@example.com', 'email_verified_at' => null]));

        $this->get('/my-orders')->assertOk()->assertInertia(function ($p) {
            $this->assertFalse($p->toArray()['props']['verified']);
            $this->assertSame([], $p->toArray()['props']['orders']);
        });
    }

    public function test_guests_go_to_the_order_lookup(): void
    {
        auth()->logout();
        $this->get('/my-orders')->assertRedirect('/order-lookup');
    }
}
