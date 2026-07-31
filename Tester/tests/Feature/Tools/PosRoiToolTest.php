<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * PosRoiToolTest — the POS ROI Calculator has no POST endpoint at all
 * (every calculation is client-side JS), so this just confirms the page
 * loads and carries its SEO content for crawlers.
 */
class PosRoiToolTest extends TestCase
{
    public function test_pos_roi_calculator_page_loads(): void
    {
        $this->get(route('tools.pos-roi'))->assertOk();
    }

    public function test_pos_roi_calculator_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/pos-roi-calculator');
        $response->assertOk();
        $response->assertSee('POS ROI', false);
        $response->assertSee('application/ld+json', false);
    }
}
