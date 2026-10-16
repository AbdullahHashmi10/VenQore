<?php

namespace Tests\Feature\Auth;

use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

class AppNavTest extends VenQoreTestCase
{
    public function test_an_owner_gets_the_four_tabs_and_the_quick_actions(): void
    {
        $tenant = $this->createTenant('nav-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $owner = $this->createTenantUser($tenant, 'owner');

        $res = $this->actingAs($owner)->getJson("/s/{$tenant->slug}/app-nav")->assertOk();

        $this->assertSame(['home', 'contacts', 'stock', 'settings'], array_column($res->json('tabs'), 'id'));
        $this->assertSame("/s/{$tenant->slug}/dashboard", $res->json('tabs.0.path'));
        $this->assertContains('New Sale', array_column($res->json('actions'), 'label'));
        $this->assertContains('/pos', $res->json('hide_on'));
        foreach ($res->json('actions') as $a) {
            $this->assertStringStartsWith("/s/{$tenant->slug}/", $a['path'], 'paths stay relative to the app host');
        }
    }

    public function test_someone_who_is_not_in_the_store_cannot_read_it(): void
    {
        $tenant = $this->createTenant('nav-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $other = $this->createTenant('nav-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $stranger = $this->createTenantUser($other, 'owner');

        $res = $this->actingAs($stranger)->getJson("/s/{$tenant->slug}/app-nav");
        $this->assertNotEquals(200, $res->status(), 'a non-member is turned away');
        $this->assertStringNotContainsString('"tabs"', $res->getContent());
    }
}
