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
        $categorized = $this->getCategorizedPages();
        $totalCount = 0;
        foreach ($categorized as $group) {
            $totalCount += count($group);
        }

        if ($totalCount > 30) {
            $now = Carbon::now()->toIso8601String();
            $sitemaps = [];
            foreach (array_keys($categorized) as $type) {
                $sitemaps[] = [
                    'loc' => route('sitemap.sub', ['type' => $type]),
                    'lastmod' => $now
                ];
            }
            $xml = view('marketing.sitemap-index', compact('sitemaps'))->render();
            return response($xml, 200, [
                'Content-Type' => 'application/xml',
            ]);
        }

        // Fallback flat sitemap if <= 30 pages
        $pages = [];
        foreach ($categorized as $group) {
            $pages = array_merge($pages, $group);
        }

        $xml = view('marketing.sitemap', compact('pages'))->render();
        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * Display a specific category sub-sitemap.
     */
    public function showSubSitemap(string $type): Response
    {
        $categorized = $this->getCategorizedPages();

        if (!isset($categorized[$type])) {
            abort(404, 'Sitemap type not found.');
        }

        $pages = $categorized[$type];

        $xml = view('marketing.sitemap', compact('pages'))->render();
        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * Compile all public marketing routes categorized by type.
     */
    private function getCategorizedPages(): array
    {
        $now = Carbon::now()->toIso8601String();
        $categorized = [
            'pages' => [],
            'blog' => [],
            'compare' => [],
            'solutions' => [],
            'tools' => []
        ];

        // 1. Pages (Static pages and feature deep-dives)
        $categorized['pages'][] = ['loc' => route('welcome'), 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '1.0'];
        $categorized['pages'][] = ['loc' => route('marketing.features'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.pricing'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.about'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.5'];
        $categorized['pages'][] = ['loc' => route('marketing.contact'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.5'];
        $categorized['pages'][] = ['loc' => route('terms'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('privacy'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('demo.landing'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.9'];
        $categorized['pages'][] = ['loc' => route('refund-policy'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('marketing.newsletter'), 'lastmod' => $now, 'changefreq' => 'monthly', 'priority' => '0.4'];
        $categorized['pages'][] = ['loc' => route('marketing.vensynq'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.smartcapture'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.roadmap'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.partners'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];

        // Documentation (Dynamic /docs and /docs/{slug})
        $categorized['pages'][] = ['loc' => route('marketing.docs.index'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $docsDir = resource_path('docs');
        if (\Illuminate\Support\Facades\File::exists($docsDir)) {
            foreach (\Illuminate\Support\Facades\File::files($docsDir) as $file) {
                if ($file->getExtension() === 'md') {
                    $slug = $file->getBasename('.md');
                    if ($slug !== 'getting-started') {
                        $categorized['pages'][] = [
                            'loc' => route('marketing.docs.show', ['slug' => $slug]),
                            'lastmod' => Carbon::createFromTimestamp($file->getMTime())->toIso8601String(),
                            'changefreq' => 'weekly',
                            'priority' => '0.7',
                        ];
                    }
                }
            }
        }

        // Feature deep-dives
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'accounting']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'growth-engine']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'inventory-management']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'offline-pos']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'point-of-sale']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];

        // 2. Blog (Dynamic and index)
        $categorized['blog'][] = ['loc' => route('blog.index'), 'lastmod' => $now, 'changefreq' => 'daily', 'priority' => '0.7'];
        $blogController = new BlogController();
        foreach ($blogController->getPosts() as $post) {
            $postDate = Carbon::parse($post['date'])->toIso8601String();
            $categorized['blog'][] = [
                'loc' => route('blog.show', ['slug' => $post['slug']]),
                'lastmod' => $postDate,
                'changefreq' => 'monthly',
                'priority' => '0.6',
            ];
        }

        // 3. Compare (Index and specific comparison links)
        $categorized['compare'][] = ['loc' => route('marketing.compare.index'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['compare'][] = ['loc' => route('marketing.compare.show', ['slug' => 'venqore-vs-square']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['compare'][] = ['loc' => route('marketing.compare.show', ['slug' => 'venqore-vs-vyapar']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];

        // 4. Solutions (Index and 6 industry detail pages)
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.index'), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'pharmacy']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'electronics-store']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'grocery']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'wholesale']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'clothing']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'multi-store']), 'lastmod' => $now, 'changefreq' => 'weekly', 'priority' => '0.8'];

        // 5. Tools
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
                continue;
            }

            $priority = match (true) {
                $seoKey === 'tools.index' => '0.8',
                $param !== null => '0.6',
                default => '0.7',
            };

            $categorized['tools'][] = [
                'loc' => $loc,
                'lastmod' => $now,
                'changefreq' => 'monthly',
                'priority' => $priority,
            ];
        }

        return $categorized;
    }

    /**
     * The single wildcard parameter name for a tools.* programmatic route,
     * e.g. 'format' for tools.barcode.format (GET /barcode-generator/{format}).
     */
    private static function firstRouteParamName(string $routeName): string
    {
        $route = \Illuminate\Support\Facades\Route::getRoutes()->getByName($routeName);

        if (!$route) {
            return 'param';
        }

        $paramNames = $route->parameterNames();
        return !empty($paramNames) ? $paramNames[0] : 'param';
    }
}
