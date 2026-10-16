<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

class AppContextTest extends VenQoreTestCase
{
    public function test_guests_are_sent_to_sign_in(): void
    {
        $this->getJson('/app/context')->assertUnauthorized();
    }

    public function test_a_person_with_no_store_is_offered_to_create_one(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/app/context')->assertOk()
            ->assertJsonPath('stores', [])
            ->assertJsonPath('create_store', '/new-store')
            ->assertJsonPath('customer_home', '/my-orders');
    }

    public function test_each_store_opens_on_its_role_home(): void
    {
        $tenant = $this->createTenant('ctx-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $owner = $this->createTenantUser($tenant, 'owner');

        $res = $this->actingAs($owner)->getJson('/app/context')->assertOk();
        $this->assertSame($tenant->slug, $res->json('stores.0.slug'));
        $this->assertStringEndsWith('/dashboard', $res->json('stores.0.home'));
        $this->assertStringStartsWith('/s/' . $tenant->slug, $res->json('stores.0.home'));
    }
}
