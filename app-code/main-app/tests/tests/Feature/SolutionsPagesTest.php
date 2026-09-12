<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * SolutionsPagesTest — RECONSTRUCTED 2026-08-02.
 *
 * The original file was deleted during the Batch 1/2 cleanup and was never
 * committed to git, so it could not be restored from history, any archive
 * snapshot, the stash, or any release zip.
 *
 * It WAS recoverable in one sense: the append-only run ledger under
 * Tester/VerificationCenter/runs/<run_id>/tests.jsonl records the name of every test
 * that has ever executed. All nine method names below were recovered from
 * there and reimplemented against the current controller.
 *
 * Slugs are taken from SolutionsController::show():
 *     ['pharmacy', 'electronics-store', 'grocery', 'wholesale', 'clothing', 'multi-store']
 *
 * Style follows ComparePagesTest, the surviving sibling written by the same
 * hand — SSR is disabled before each request and asserted to have been
 * re-enabled by HandleInertiaRequests::share(), which is how this codebase
 * proves a route is treated as a public marketing page.
 */
class SolutionsPagesTest extends TestCase
{
    /** @test */
    public function solutions_hub_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);

        $response = $this->get('/solutions');

        $response->assertStatus(200);
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            'Expected Inertia SSR to be enabled for /solutions'
        );
    }

    /** @test */
    public function solutions_pharmacy_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('pharmacy');
    }

    /** @test */
    public function solutions_electronics_store_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('electronics-store');
    }

    /** @test */
    public function solutions_grocery_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('grocery');
    }

    /** @test */
    public function solutions_wholesale_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('wholesale');
    }

    /** @test */
    public function solutions_clothing_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('clothing');
    }

    /** @test */
    public function solutions_multi_store_page_renders_successfully_with_ssr()
    {
        $this->assertSolutionPageRenders('multi-store');
    }

    /** @test */
    public function unknown_solution_slug_returns_404()
    {
        $this->get('/solutions/not-a-real-industry')->assertStatus(404);
    }

    /** @test */
    public function solutions_pages_are_included_in_sitemap()
    {
        $response = $this->get('/sitemap-solutions.xml');

        $response->assertStatus(200);

        foreach (['pharmacy', 'electronics-store', 'grocery', 'wholesale', 'clothing', 'multi-store'] as $slug) {
            $response->assertSee("/solutions/{$slug}", false);
        }
    }

    /**
     * Every industry page must return 200, be flagged for SSR, and receive its
     * slug as a prop — the page component branches on that prop, so a missing
     * or wrong slug renders the wrong industry.
     */
    private function assertSolutionPageRenders(string $slug): void
    {
        config(['inertia.ssr.enabled' => false]);

        $response = $this->get("/solutions/{$slug}");

        $response->assertStatus(200);

        $this->assertTrue(
            config('inertia.ssr.enabled'),
            "Expected Inertia SSR to be enabled for /solutions/{$slug}"
        );

        $response->assertInertia(
            fn ($page) => $page
                ->component('Marketing/Solutions/Show')
                ->where('slug', $slug)
        );
    }
}
