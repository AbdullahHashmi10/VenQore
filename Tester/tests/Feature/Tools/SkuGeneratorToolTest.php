<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * SkuGeneratorToolTest — the Bulk SKU Generator has no POST endpoint at all
 * (scheme builder, live preview, bulk generation and CSV export are all
 * client-side JS), so this just confirms the page loads and carries its
 * SEO content for crawlers.
 */
class SkuGeneratorToolTest extends TestCase
{
    public function test_sku_generator_page_loads(): void
    {
        $this->get(route('tools.sku-generator'))->assertOk();
    }

    public function test_sku_generator_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/sku-generator');
        $response->assertOk();
        $response->assertSee('Bulk SKU Generator', false);
        $response->assertSee('application/ld+json', false);
    }
}
