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
            // Added 2026-07-03 — demo, refund policy, newsletter, coming-soon product lines
            ['loc' => route('demo.landing'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.9'],
            ['loc' => route('refund-policy'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'],
            ['loc' => route('marketing.newsletter'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.4'],
            ['loc' => route('marketing.vensynq'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'],
            ['loc' => route('marketing.smartcapture'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'],
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

        // Free Tools program — every entry in App\Support\ToolSeo::pages()
        // is added automatically so a new tool can never be forgotten here
        // (plan §4.9). Hub gets 0.8; individual tools 0.7; programmatic
        // children (e.g. barcode format pages, keyed "route.name:{param}")
        // get 0.6. Parameterised keys are resolved via their underlying
        // route + parameter, since "route.name:{param}" is a ToolSeo lookup
        // key, not a real Laravel route name — see MarketingSeo::current().
        foreach (array_keys(\App\Support\ToolSeo::pages()) as $seoKey) {
            [$routeName, $param] = array_pad(explode(':', $seoKey, 2), 2, null);

            if (!\Illuminate\Support\Facades\Route::has($routeName)) {
                continue;
            }

            try {
                $loc = $param !== null
                    ? route($routeName, [self::firstRouteParamName($routeName) => $param])
                    : route($routeName);
            } catch (\Throwable $e) {
                continue; // skip anything that doesn't resolve rather than break the whole sitemap
            }

            $priority = match (true) {
                $seoKey === 'tools.index' => '0.8',
                $param !== null => '0.6',
                default => '0.7',
            };

            $pages[] = [
                'loc' => $loc,
                'lastmod' => $now,
                'changefreq' => 'monthly',
                'priority' => $priority,
            ];
        }

        $xml = view('marketing.sitemap', compact('pages'))->render();

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * The single wildcard parameter name for a tools.* programmatic route,
     * e.g. 'format' for tools.barcode.format (GET /barcode-generator/{format}).
     */
    private static function firstRouteParamName(string $routeName): string
    {
        $route = \Illuminate\Support\Facades\Route::getRoutes()->getByName($routeName);

        return $route ? ($route->parameterNames()[0] ?? 'format') : 'format';
    }
}
