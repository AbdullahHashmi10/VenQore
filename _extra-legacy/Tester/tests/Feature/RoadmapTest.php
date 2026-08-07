<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * RoadmapTest — RECONSTRUCTED 2026-08-02.
 *
 * Original deleted during Batch 1/2 cleanup, never committed to git. The three
 * method names were recovered from the run ledger
 * (Tester/VerificationCenter/runs/*_/tests.jsonl) and reimplemented against
 * RoadmapController, which renders Marketing/Roadmap at GET /roadmap.
 */
class RoadmapTest extends TestCase
{
    /** @test */
    public function roadmap_page_renders_successfully()
    {
        $response = $this->get('/roadmap');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Marketing/Roadmap'));
    }

    /** @test */
    public function roadmap_page_enables_inertia_ssr()
    {
        // HandleInertiaRequests::share() decides per-request whether a route is
        // a public marketing page and flips inertia.ssr.enabled accordingly.
        // Forcing it false first proves the middleware turned it back on
        // rather than it merely being on by default.
        config(['inertia.ssr.enabled' => false]);

        $this->get('/roadmap')->assertStatus(200);

        $this->assertTrue(
            config('inertia.ssr.enabled'),
            'Expected Inertia SSR to be enabled for /roadmap — without SSR the '
            . 'roadmap is invisible to search engines and social previews.'
        );
    }

    /** @test */
    public function roadmap_page_included_in_sitemap()
    {
        $response = $this->get('/sitemap-pages.xml');

        $response->assertStatus(200);
        $response->assertSee('/roadmap', false);
    }
}
