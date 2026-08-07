<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * FeaturePagesTest — RECONSTRUCTED 2026-08-02.
 *
 * Original deleted during Batch 1/2 cleanup, never committed to git, not
 * present in any archive, stash or release zip. The seven method names below
 * were recovered from the run ledger (Tester/VerificationCenter/runs/) and
 * reimplemented against the current controller.
 *
 * Slugs from FeaturesController::VALID_SLUGS:
 *     ['accounting', 'growth-engine', 'inventory-management', 'offline-pos', 'point-of-sale']
 *
 * NOTE: the ledger records a `features_hub` test but no `growth-engine` test.
 * The original file therefore did not cover the growth-engine slug. A test for
 * it has been added below and marked, because leaving a valid slug uncovered
 * was a gap in the original, not a deliberate choice worth preserving.
 */
class FeaturePagesTest extends TestCase
{
    /** @test */
    public function features_hub_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);

        $response = $this->get('/features');

        $response->assertStatus(200);
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            'Expected Inertia SSR to be enabled for /features'
        );
    }

    /** @test */
    public function features_accounting_page_renders_successfully_with_ssr()
    {
        $this->assertFeaturePageRenders('accounting');
    }

    /** @test */
    public function features_inventory_management_page_renders_successfully_with_ssr()
    {
        $this->assertFeaturePageRenders('inventory-management');
    }

    /** @test */
    public function features_offline_pos_page_renders_successfully_with_ssr()
    {
        $this->assertFeaturePageRenders('offline-pos');
    }

    /** @test */
    public function features_point_of_sale_page_renders_successfully_with_ssr()
    {
        $this->assertFeaturePageRenders('point-of-sale');
    }

    /**
     * ADDED during reconstruction — not in the original.
     * growth-engine is a valid slug in FeaturesController but had no test.
     *
     * @test
     */
    public function features_growth_engine_page_renders_successfully_with_ssr()
    {
        $this->assertFeaturePageRenders('growth-engine');
    }

    /** @test */
    public function unknown_feature_slug_returns_404()
    {
        $this->get('/features/not-a-real-feature')->assertStatus(404);
    }

    /** @test */
    public function features_pages_are_included_in_sitemap()
    {
        $response = $this->get('/sitemap-pages.xml');

        $response->assertStatus(200);
        $response->assertSee('/features', false);
    }

    private function assertFeaturePageRenders(string $slug): void
    {
        config(['inertia.ssr.enabled' => false]);

        $response = $this->get("/features/{$slug}");

        $response->assertStatus(200);

        $this->assertTrue(
            config('inertia.ssr.enabled'),
            "Expected Inertia SSR to be enabled for /features/{$slug}"
        );

        $response->assertInertia(
            fn ($page) => $page
                ->component('Marketing/Features/Show')
                ->where('slug', $slug)
        );
    }
}
