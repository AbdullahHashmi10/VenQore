<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * MarginCalculatorToolTest — the Profit Margin & Markup Calculator has no
 * POST endpoint at all (every calculation is client-side JS), so this just
 * confirms the page loads and carries its SEO content for crawlers.
 */
class MarginCalculatorToolTest extends TestCase
{
    public function test_margin_calculator_page_loads(): void
    {
        $this->get(route('tools.margin-calculator'))->assertOk();
    }

    public function test_margin_calculator_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/margin-calculator');
        $response->assertOk();
        $response->assertSee('Profit Margin', false);
        $response->assertSee('application/ld+json', false);
    }
}
