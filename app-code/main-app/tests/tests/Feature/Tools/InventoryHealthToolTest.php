<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * InventoryHealthToolTest — the Inventory Health Toolkit has no POST
 * endpoint at all (every calculation is client-side JS), so this just
 * confirms the page loads and carries its SEO content for crawlers.
 */
class InventoryHealthToolTest extends TestCase
{
    public function test_inventory_health_page_loads(): void
    {
        $this->get(route('tools.inventory-health'))->assertOk();
    }

    public function test_inventory_health_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/inventory-health');
        $response->assertOk();
        $response->assertSee('Inventory Health', false);
        $response->assertSee('application/ld+json', false);
    }
}
