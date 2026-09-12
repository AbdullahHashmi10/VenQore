<?php

namespace Tests\Feature;

use Tests\TestCase;

class ComparePagesTest extends TestCase
{
    /** @test */
    public function compare_hub_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);
        $response = $this->get('/compare');

        $response->assertStatus(200);
        $this->assertTrue(config('inertia.ssr.enabled'), 'Expected Inertia SSR to be enabled for /compare');
    }

    /** @test */
    public function compare_square_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);
        $response = $this->get('/compare/venqore-vs-square');

        $response->assertStatus(200);
        $this->assertTrue(config('inertia.ssr.enabled'), 'Expected Inertia SSR to be enabled for /compare/venqore-vs-square');
        $response->assertSee('VenQore vs Square POS');
    }

    /** @test */
    public function compare_vyapar_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);
        $response = $this->get('/compare/venqore-vs-vyapar');

        $response->assertStatus(200);
        $this->assertTrue(config('inertia.ssr.enabled'), 'Expected Inertia SSR to be enabled for /compare/venqore-vs-vyapar');
        $response->assertSee('VenQore vs Vyapar');
    }

    /**
     * FIXED 2026-08-02: /sitemap.xml is now a sitemap INDEX (see
     * SitemapController::index() and LAUNCH_VERIFICATION_AUDIT_2026-08-02.md
     * item A6) — it links to sitemap-compare.xml rather than listing compare
     * pages itself. This test now checks both: that the top-level index
     * references the compare sub-sitemap, and that the compare sub-sitemap
     * itself actually contains the compare page URLs.
     */

    /** @test */
    public function compare_sub_sitemap_is_referenced_by_the_sitemap_index()
    {
        $response = $this->get('/sitemap.xml');
        $response->assertStatus(200);

        $this->assertStringContainsString(
            '<loc>' . route('sitemap.sub', ['type' => 'compare']) . '</loc>',
            $response->getContent()
        );
    }

    /** @test */
    public function compare_pages_are_included_in_the_compare_sub_sitemap()
    {
        $response = $this->get('/sitemap-compare.xml');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('/compare', $content);
        $this->assertStringContainsString('/compare/venqore-vs-square', $content);
        $this->assertStringContainsString('/compare/venqore-vs-vyapar', $content);
    }
}
