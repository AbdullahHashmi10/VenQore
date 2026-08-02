<?php

namespace Tests\Feature;

use Tests\TestCase;
use Carbon\Carbon;

/**
 * Rescued 2026-08-02: this test previously existed only as an orphan under
 * FinalTester/tests with no source of truth in Tester/tests or tests/ — meaning
 * it could never be updated again and was scheduled for deletion by
 * FinalTester/Scripts/sync.php's zombie-prune pass (see
 * LAUNCH_VERIFICATION_AUDIT_2026-08-02.md item C1). Its content is genuinely
 * useful — it's the most direct coverage of the sitemap INDEX structure and
 * sub-sitemap contents (SitemapTest.php and ComparePagesTest.php only check a
 * couple of individual sub-sitemaps each) — so it's given a real home here
 * instead of being deleted.
 */
class SitemapIndexAndLastModifiedTest extends TestCase
{
    /**
     * /sitemap.xml acts as a sitemap index listing sub-sitemaps.
     */
    public function test_sitemap_xml_acts_as_index_when_count_exceeds_30(): void
    {
        $response = $this->get('/sitemap.xml');
        $response->assertStatus(200);

        // Assert sitemap index structure
        $response->assertHeader('Content-Type', 'application/xml');
        $response->assertSee('<sitemapindex', false);
        $response->assertSee(route('sitemap.sub', ['type' => 'pages']), false);
        $response->assertSee(route('sitemap.sub', ['type' => 'blog']), false);
        $response->assertSee(route('sitemap.sub', ['type' => 'compare']), false);
        $response->assertSee(route('sitemap.sub', ['type' => 'solutions']), false);
        $response->assertSee(route('sitemap.sub', ['type' => 'tools']), false);
    }

    /**
     * Individual sub-sitemaps return the correct XML urlset.
     */
    public function test_sub_sitemaps_return_urlset(): void
    {
        // 1. Pages sub-sitemap
        $response = $this->get('/sitemap-pages.xml');
        $response->assertStatus(200);
        $response->assertSee('<urlset', false);
        $response->assertSee(route('welcome'), false);

        // 2. Solutions sub-sitemap
        $response = $this->get('/sitemap-solutions.xml');
        $response->assertStatus(200);
        $response->assertSee('<urlset', false);
        $response->assertSee(route('marketing.solutions.show', ['slug' => 'grocery']), false);
        $response->assertSee(route('marketing.solutions.show', ['slug' => 'pharmacy']), false);
    }

    /**
     * Marketing responses contain a valid Last-Modified HTTP header.
     */
    public function test_marketing_responses_contain_last_modified_header(): void
    {
        // Home page
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertHeader('Last-Modified');

        $lastModHome = $response->headers->get('Last-Modified');
        $this->assertNotEmpty($lastModHome);
        $this->assertNotNull(Carbon::createFromFormat(\DateTimeInterface::RFC7231, $lastModHome));

        // Solutions details page
        $response = $this->get('/solutions/grocery');
        $response->assertStatus(200);
        $response->assertHeader('Last-Modified');

        // Feature details page
        $response = $this->get('/features/accounting');
        $response->assertStatus(200);
        $response->assertHeader('Last-Modified');
    }
}
