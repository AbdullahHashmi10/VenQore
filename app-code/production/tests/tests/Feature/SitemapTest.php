<?php

namespace Tests\Feature;

use Tests\TestCase;

class SitemapTest extends TestCase
{
    /**
     * FIXED 2026-08-02: SitemapController::index() now returns a sitemap INDEX
     * (<sitemapindex>, pointing at sitemap-pages.xml / sitemap-blog.xml /
     * sitemap-compare.xml / sitemap-solutions.xml / sitemap-tools.xml) once the
     * site has more than 30 URLs — which it always does in practice (14+ static
     * pages, blog posts, compare pages, solutions pages, and every marketing
     * tool page). The old flat <urlset> assertions this test used to make were
     * against a code path that no real deployment ever hits. See
     * LAUNCH_VERIFICATION_AUDIT_2026-08-02.md item A6 for why this changed and
     * why keeping the index (rather than reverting) was the right call — a
     * sitemap index is standard practice once a site crosses ~30-50k URLs, and
     * this site already exceeds the threshold this controller uses.
     */

    /** @test */
    public function sitemap_endpoint_returns_a_valid_sitemap_index()
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');

        $content = $response->getContent();
        $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $content);

        // Every category the controller declares must have a corresponding
        // sub-sitemap entry in the index.
        foreach (['pages', 'blog', 'compare', 'solutions', 'tools'] as $type) {
            $this->assertStringContainsString(
                '<loc>' . route('sitemap.sub', ['type' => $type]) . '</loc>',
                $content,
                "Sitemap index is missing the '{$type}' sub-sitemap entry."
            );
        }
    }

    /** @test */
    public function pages_sub_sitemap_contains_home_and_core_static_pages()
    {
        $response = $this->get('/sitemap-pages.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');

        $content = $response->getContent();
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $content);
        $this->assertStringContainsString('<loc>' . route('welcome') . '</loc>', $content);
        $this->assertStringContainsString('<loc>' . route('marketing.pricing') . '</loc>', $content);
    }

    /** @test */
    public function blog_sub_sitemap_contains_blog_index_and_a_post()
    {
        $response = $this->get('/sitemap-blog.xml');

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringContainsString('<loc>' . route('blog.index') . '</loc>', $content);

        $blogController = new \App\Http\Controllers\Marketing\BlogController();
        $posts = $blogController->getPosts();
        if (count($posts) > 0) {
            $firstPostUrl = route('blog.show', ['slug' => $posts[0]['slug']]);
            $this->assertStringContainsString('<loc>' . $firstPostUrl . '</loc>', $content);
        }
    }

    /** @test */
    public function unknown_sub_sitemap_type_returns_404()
    {
        $response = $this->get('/sitemap-not-a-real-category.xml');

        $response->assertStatus(404);
    }
}
