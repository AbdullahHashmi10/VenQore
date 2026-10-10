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
            $sitemaps = [];
            foreach ($categorized as $type => $group) {
                // Newest real lastmod in the group; omitted when none is known.
                $dates = array_filter(array_column($group, 'lastmod'));
                $sitemaps[] = [
                    'loc' => route('sitemap.sub', ['type' => $type]),
                    'lastmod' => $dates ? max($dates) : null,
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
        $categorized = [
            'pages' => [],
            'blog' => [],
            'compare' => [],
            'solutions' => [],
            'tools' => []
        ];

        // 1. Pages (Static pages and feature deep-dives)
        $categorized['pages'][] = ['loc' => route('welcome'), 'changefreq' => 'daily', 'priority' => '1.0'];
        $categorized['pages'][] = ['loc' => route('marketing.features'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.pricing'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.about'), 'changefreq' => 'monthly', 'priority' => '0.5'];
        $categorized['pages'][] = ['loc' => route('marketing.contact'), 'changefreq' => 'monthly', 'priority' => '0.5'];
        $categorized['pages'][] = ['loc' => route('privacy'), 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('terms'), 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('refund-policy'), 'changefreq' => 'monthly', 'priority' => '0.3'];
        $categorized['pages'][] = ['loc' => route('marketing.vensynq'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.smartcapture'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.roadmap'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.partners'), 'changefreq' => 'weekly', 'priority' => '0.8'];

        // ── V6 product pages ────────────────────────────────────────────────
        // Added 2026-09-05. These seven shipped with the AI-builder
        // repositioning and were never registered here, so nothing in the
        // new product story was discoverable: Blueprint is the entry point of
        // the whole positioning, and the Reckoner and Core Ledger pages carry
        // the correctness argument the product is sold on.
        $categorized['pages'][] = ['loc' => route('marketing.blueprint'), 'changefreq' => 'weekly', 'priority' => '0.9'];
        $categorized['pages'][] = ['loc' => route('marketing.security'), 'changefreq' => 'monthly', 'priority' => '0.7'];
        $categorized['pages'][] = ['loc' => route('marketing.onboarding'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.ledger'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.reckoner'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.documents'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.dashboard-preview'), 'changefreq' => 'weekly', 'priority' => '0.8'];

        // The POS terminal page
        $categorized['pages'][] = ['loc' => route('marketing.pos'), 'changefreq' => 'weekly', 'priority' => '0.8'];

        // ── Help centre, tools hub and status ────────────────────────────────
        $categorized['pages'][] = ['loc' => route('help.index'), 'changefreq' => 'weekly', 'priority' => '0.7'];

        // Help articles — read from HelpCenterController's own array, so the
        // sitemap cannot drift from what the pages actually render.
        try {
            foreach (\App\Http\Controllers\HelpCenterController::slugs() as $slug) {
                $categorized['pages'][] = [
                    'loc' => route('help.show', ['slug' => $slug]),
                        'changefreq' => 'monthly',
                    'priority' => '0.5',
                ];
            }
        } catch (\Throwable $e) {
            // Never let the sitemap 500 over the help centre.
        }

        // Documentation (Dynamic /docs and /docs/{slug})
        $categorized['pages'][] = ['loc' => route('marketing.docs.index'), 'changefreq' => 'weekly', 'priority' => '0.8'];
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
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'accounting']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'growth-engine']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'inventory-management']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'offline-pos']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['pages'][] = ['loc' => route('marketing.features.show', ['slug' => 'point-of-sale']), 'changefreq' => 'weekly', 'priority' => '0.8'];

        // 2. Blog (Dynamic and index)
        $categorized['blog'][] = ['loc' => route('blog.index'), 'changefreq' => 'daily', 'priority' => '0.7'];
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
        $categorized['compare'][] = ['loc' => route('marketing.compare.index'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['compare'][] = ['loc' => route('marketing.compare.show', ['slug' => 'venqore-vs-square']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['compare'][] = ['loc' => route('marketing.compare.show', ['slug' => 'venqore-vs-vyapar']), 'changefreq' => 'weekly', 'priority' => '0.8'];

        // 4. Solutions (Index and 6 industry detail pages)
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.index'), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'pharmacy']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'electronics-store']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'grocery']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'wholesale']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'clothing']), 'changefreq' => 'weekly', 'priority' => '0.8'];
        $categorized['solutions'][] = ['loc' => route('marketing.solutions.show', ['slug' => 'multi-store']), 'changefreq' => 'weekly', 'priority' => '0.8'];

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
                'changefreq' => 'monthly',
                'priority' => $priority,
            ];
        }

        // 6. Published online shops (public, indexable)
        try {
            foreach (\Illuminate\Support\Facades\DB::table('storefronts')->where('status', 'published')->whereRaw(\App\Models\Commerce\Storefront::moduleLiveSql(), ['online_store'])->orderBy('id')->limit(5000)->get(['slug', 'updated_at']) as $shop) {
                $categorized['shops'][] = ['loc' => url('/shop/' . $shop->slug), 'changefreq' => 'weekly', 'priority' => '0.5'];
            }
        } catch (\Throwable $e) {
            // storefronts table not migrated yet: skip
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
