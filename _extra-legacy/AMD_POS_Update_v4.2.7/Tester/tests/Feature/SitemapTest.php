<?php

namespace Tests\Feature;

use Tests\TestCase;

class SitemapTest extends TestCase
{
    /** @test */
    public function sitemap_endpoint_returns_valid_xml()
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');

        // Assert that the XML response contains the core links and XML tags
        $content = $response->getContent();
        $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $content);
        
        // Assert presence of home route
        $this->assertStringContainsString('<loc>' . route('welcome') . '</loc>', $content);
        
        // Assert presence of blog route
        $this->assertStringContainsString('<loc>' . route('blog.index') . '</loc>', $content);
        
        // Assert presence of one of the blog post routes
        $blogController = new \App\Http\Controllers\Marketing\BlogController();
        $posts = $blogController->getPosts();
        if (count($posts) > 0) {
            $firstPostUrl = route('blog.show', ['slug' => $posts[0]['slug']]);
            $this->assertStringContainsString('<loc>' . $firstPostUrl . '</loc>', $content);
        }
    }
}
