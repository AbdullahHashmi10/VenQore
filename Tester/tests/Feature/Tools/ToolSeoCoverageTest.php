<?php

namespace Tests\Feature\Tools;

use App\Support\MarketingSeo;
use App\Support\ToolSeo;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * ToolSeoCoverageTest — the single most important test in the tools program.
 *
 * FAILS THE BUILD if any route registered under the `tools.` prefix in
 * routes/web.php lacks a corresponding App\Support\ToolSeo entry. A tool
 * page with no ToolSeo entry ships an empty client-rendered React shell to
 * GPTBot, ClaudeBot and PerplexityBot — none of which execute JavaScript —
 * which makes the page invisible to the exact channel this program exists
 * to win. See plan §4.7 and §11.1.
 */
class ToolSeoCoverageTest extends TestCase
{
    /**
     * GET-method, non-parameterised tools.* routes should all have a
     * ToolSeo entry. POST/download/action routes (render, lead.store,
     * lead.confirm, etc.) are excluded — they never render a full page.
     */
    private const EXCLUDED_ROUTE_SUFFIXES = [
        'tools.barcode.render',
        'tools.barcode.validate',
        'tools.barcode.sheet',
        'tools.invoice.render',
        'tools.price-tag.sheet',
        'tools.price-tag.parse',
        'tools.label-sheet.sheet',
        'tools.label-sheet.parse',
        'tools.receipt.render',
        'tools.barcode-validator.check',
        'tools.qr.render',
        'tools.stock-count.render',
        'tools.stock-count.parse',
        'tools.csv-cleaner.parse',
        'tools.csv-cleaner.download',
        'tools.purchase-order.render',
        'tools.quote.render',
        'tools.packing-slip.render',
        'tools.credit-note.render',
        'tools.lead.store',
        'tools.lead.confirm',
        'tools.lead.unsubscribe',
        'tools.lead.unsubscribe.confirm',
        'tools.download',
        'tools.qr-menu.render',
        'tools.cash-drawer.render',
        'tools.barcode-label.parse',
        'tools.barcode-label.sheet',
    ];

    public function test_every_public_tool_page_route_has_a_tool_seo_entry(): void
    {
        $toolRouteNames = collect(Route::getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter(fn ($name) => $name && str_starts_with($name, 'tools.'))
            ->reject(fn ($name) => in_array($name, self::EXCLUDED_ROUTE_SUFFIXES, true))
            ->unique()
            ->values();

        $this->assertNotEmpty($toolRouteNames, 'No tools.* routes are registered — did routing break?');

        $seoPages = ToolSeo::pages();

        // ToolSeo keys are either the plain route name, or "route.name:{param}"
        // for programmatic routes that share one Laravel route name across
        // many URL variants (e.g. tools.barcode.format for all 9 symbologies).
        // A route counts as covered if EITHER its plain name is a key, OR at
        // least one "route.name:*" parameterised key exists for it.
        $coveredRouteNames = collect(array_keys($seoPages))
            ->map(fn ($key) => explode(':', $key, 2)[0])
            ->unique();

        $missing = $toolRouteNames->reject(fn ($name) => $coveredRouteNames->contains($name));

        $this->assertTrue(
            $missing->isEmpty(),
            'The following tools.* routes have NO ToolSeo entry and are invisible to AI crawlers: '
                . $missing->implode(', ')
        );
    }

    public function test_every_tool_seo_entry_has_the_five_required_keys(): void
    {
        foreach (ToolSeo::pages() as $routeName => $entry) {
            foreach (['title', 'description', 'keywords', 'jsonld', 'static_html'] as $key) {
                $this->assertArrayHasKey(
                    $key,
                    $entry,
                    "ToolSeo entry for route '{$routeName}' is missing required key '{$key}'."
                );
            }

            $this->assertNotEmpty($entry['title'], "Empty title for '{$routeName}'.");
            $this->assertLessThanOrEqual(70, strlen($entry['title']), "Title too long for '{$routeName}' (SEO §4.7 caps at ~60 chars).");
            $this->assertNotEmpty($entry['static_html'], "Empty static_html for '{$routeName}' — this is what AI crawlers actually read.");
            $this->assertStringContainsString('<h1', $entry['static_html'], "No <h1> in static_html for '{$routeName}'.");
        }
    }

    public function test_no_tool_seo_entry_carries_aggregate_rating_schema(): void
    {
        // app.blade.php carries a comment explaining why a fabricated
        // AggregateRating block was removed site-wide (SEMrush flagged it,
        // and Google treats unsubstantiated review markup as a policy
        // violation). Tool pages must never reintroduce one without real
        // review data. See plan §4.7 and §13 launch checklist.
        foreach (ToolSeo::pages() as $routeName => $entry) {
            $encoded = json_encode($entry['jsonld'] ?? []);
            $this->assertStringNotContainsString(
                'AggregateRating',
                $encoded,
                "ToolSeo entry for '{$routeName}' contains AggregateRating schema with no backing review data."
            );
        }
    }

    public function test_marketing_seo_current_resolves_a_tool_page_for_crawlers(): void
    {
        // Simulate what app.blade.php does for a real request to the
        // barcode generator page.
        $response = $this->get('/tools/barcode-generator');
        $response->assertOk();
        $response->assertSee('Free Barcode Generator', false);
        $response->assertSee('application/ld+json', false);
    }

    public function test_marketing_seo_current_resolves_a_barcode_format_child_page(): void
    {
        $response = $this->get('/tools/barcode-generator/ean-13');
        $response->assertOk();
        $response->assertSee('EAN-13 Generator', false);
    }
}
