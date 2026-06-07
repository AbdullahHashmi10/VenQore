<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Carbon\Carbon;

class SitemapController extends Controller
{
    /**
     * Generate the sitemap XML dynamically.
     */
    public function index(): Response
    {
        $now = Carbon::now()->toIso8601String();
        
        // Base marketing and legal pages
        $pages = [
            ['loc' => route('welcome'), 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => route('marketing.features'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'],
            ['loc' => route('marketing.pricing'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'],
            ['loc' => route('marketing.about'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.5'],
            ['loc' => route('marketing.contact'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.5'],
            ['loc' => route('blog.index'), 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '0.7'],
            ['loc' => route('terms'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'],
            ['loc' => route('privacy'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'],
        ];

        // Retrieve dynamic blog posts
        $blogController = new BlogController();
        foreach ($blogController->getPosts() as $post) {
            $postDate = Carbon::parse($post['date'])->toIso8601String();
            $pages[] = [
                'loc' => route('blog.show', ['slug' => $post['slug']]),
                'lastmod' => $postDate,
                'changefreq' => 'monthly',
                'priority' => '0.6',
            ];
        }

        $xml = view('marketing.sitemap', compact('pages'))->render();

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
