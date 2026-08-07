<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Support\MarketingSeo;

class PricingConversionOptimizationTest extends TestCase
{
    /** @test */
    public function pricing_page_loads_successfully_and_has_trust_badges_competitor_table_and_faqs()
    {
        $response = $this->get('/pricing');

        $response->assertStatus(200);

        // Verify that the route dynamically enables Inertia SSR
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            "Expected Inertia SSR to be enabled for /pricing"
        );

        // Assert that key pricing tags exist in the raw response headers / head layer
        $response->assertSee('VenQore Pricing');
        $response->assertSee('14-Day Free Trial');
        $response->assertSee('no credit card');

        // Verify the FAQPage JSON-LD schema is outputted in raw HTML without HTML escaping issues
        $html = $response->getContent();
        $this->assertStringContainsString('"@type":"FAQPage"', $html);
        $this->assertStringContainsString('Do I need a credit card to start my trial?', $html);
        $this->assertStringContainsString('Are there any hidden fees or setup costs?', $html);
        $this->assertStringContainsString('Do you offer discounts for annual billing?', $html);
        $this->assertStringContainsString('What happens when the 14-day free trial ends?', $html);

        // Assert against the server-rendered static fallback content directly
        $seo = MarketingSeo::current();
        $this->assertNotNull($seo);
        
        $staticHtml = $seo['static_html'] ?? '';
        $this->assertStringContainsString('No Credit Card Required', $staticHtml);
        $this->assertStringContainsString('Cancel Anytime', $staticHtml);
        $this->assertStringContainsString('SOC2-Compliant Security', $staticHtml);
        $this->assertStringContainsString('Shopify POS Pro + Apps', $staticHtml);
        $this->assertStringContainsString('Square POS (Plus Device Add-ons)', $staticHtml);
        $this->assertStringContainsString('VenQore Growth (Annual)', $staticHtml);
        $this->assertStringContainsString('$636/yr', $staticHtml);
    }
}
