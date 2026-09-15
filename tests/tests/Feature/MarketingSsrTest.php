<?php

namespace Tests\Feature;

use Tests\TestCase;

class MarketingSsrTest extends TestCase
{
    /** @test */
    public function marketing_routes_have_ssr_enabled()
    {
        $marketingRoutes = [
            '/features',
            '/pricing',
            '/about',
            '/contact',
            '/terms',
            '/privacy',
            '/refund-policy',
            '/blog',
            '/demo',
        ];

        foreach ($marketingRoutes as $url) {
            config(['inertia.ssr.enabled' => false]);
            $response = $this->get($url);
            if ($response->status() !== 200) {
                dump("Route {$url} returned status {$response->status()}: " . substr($response->getContent(), 0, 500));
            }
            $response->assertStatus(200);
            $this->assertTrue(
                config('inertia.ssr.enabled'),
                "Expected Inertia SSR to be enabled for marketing route: {$url}"
            );
        }
    }

    /** @test */
    public function tenant_routes_keep_inertia_ssr_disabled()
    {
        config(['inertia.ssr.enabled' => true]);

        $user = \App\Models\User::factory()->make();

        $tenantRoutes = [
            '/hub',
        ];

        foreach ($tenantRoutes as $route) {
            $response = $this->actingAs($user)->get($route);
            $this->assertFalse(
                config('inertia.ssr.enabled'),
                "Expected inertia.ssr.enabled to be false for tenant route: {$route}"
            );
        }
    }
}
