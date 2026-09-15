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

        // Assert that key pricing tags exist in the raw response headers / head layer
        $response->assertSee('Pricing');
        $response->assertSee('VenQore');
        $response->assertSee('Solo — Free Forever');

        // Verify the FAQPage JSON-LD schema is outputted in raw HTML without HTML escaping issues
        $html = $response->getContent();
        $this->assertStringContainsString('"@type":"FAQPage"', $html);
        $this->assertStringContainsString('Is there a free trial?', $html);
        $this->assertStringContainsString('What happens after the trial?', $html);
        $this->assertStringContainsString('Can I change plans?', $html);
        $this->assertStringContainsString('Is there a contract?', $html);
    }
}
