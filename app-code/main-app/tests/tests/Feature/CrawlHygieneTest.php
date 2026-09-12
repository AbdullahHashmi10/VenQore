<?php

namespace Tests\Feature;

use Tests\TestCase;

class CrawlHygieneTest extends TestCase
{
    /** @test */
    public function internal_and_auth_routes_have_noindex_header()
    {
        $noindexRoutes = [
            '/login',
            '/VenQore-login',
            '/staff-login',
            '/forgot-password',
        ];

        foreach ($noindexRoutes as $url) {
            $response = $this->get($url);
            $response->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        }
    }

    /** @test */
    public function marketing_routes_do_not_have_noindex_header()
    {
        $marketingRoutes = [
            '/features',
            '/pricing',
            '/about',
            '/contact',
            '/blog',
            '/demo',
        ];

        foreach ($marketingRoutes as $url) {
            $response = $this->get($url);
            $response->assertHeaderMissing('X-Robots-Tag');
        }
    }
}
