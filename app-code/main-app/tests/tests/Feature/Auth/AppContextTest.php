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

    public function test_signing_in_with_no_store_makes_a_customer_in_the_app_and_goes_to_create_or_join_on_the_web(): void
    {
        $user = User::factory()->create();

        request()->headers->set('User-Agent', 'Mozilla/5.0 Chrome/130 Safari/537.36');
        $this->assertSame(url('/start'), \App\Support\PostLoginRedirect::for($user)->getTargetUrl(), 'website: unchanged');

        request()->headers->set('User-Agent', 'Mozilla/5.0 (Linux; Android 14; Mobile) Chrome/130 VenQoreMobile/1.0');
        $this->assertSame(url('/my-orders'), \App\Support\PostLoginRedirect::for($user)->getTargetUrl(), 'app: a customer, not an owner');
    }

    public function test_the_side_chosen_in_the_app_decides_where_sign_in_lands(): void
    {
        $user = User::factory()->create();
        $tenant = $this->createTenant('side-' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(6)), 'ltd_3', 'active');
        $owner = $this->createTenantUser($tenant, "owner");

        // Customer side: always the customer page, even for an account that owns a store.
        request()->headers->set("User-Agent", "Mozilla/5.0 Chrome VenQoreMobile/1.0 VenQoreSide/customer");
        $this->assertSame(url('/my-orders'), \App\Support\PostLoginRedirect::for($owner)->getTargetUrl());
        $this->assertSame(url('/my-orders'), \App\Support\PostLoginRedirect::for($user)->getTargetUrl());

        // Store side: an owner opens their store; someone with no store is sent to create or join one.
        request()->headers->set("User-Agent", "Mozilla/5.0 Chrome VenQoreMobile/1.0 VenQoreSide/store");
        $this->assertStringContainsString('/s/' . $tenant->slug, \App\Support\PostLoginRedirect::for($owner)->getTargetUrl());
        $this->assertSame(url('/start'), \App\Support\PostLoginRedirect::for($user)->getTargetUrl());
    }
}
