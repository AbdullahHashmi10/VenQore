<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

/**
 * FoodCostToolTest — tests that the Recipe Costing Calculator tool route loads
 * and contains full SEO metadata for AI crawlers.
 */
class FoodCostToolTest extends TestCase
{
    public function test_food_cost_calculator_page_loads(): void
    {
        $this->get(route('tools.food-cost'))->assertOk();
    }

    public function test_food_cost_calculator_page_has_seo_content_for_crawlers(): void
    {
        $response = $this->get('/tools/food-cost-calculator');
        $response->assertOk();
        $response->assertSee('Recipe Costing Calculator', false);
        $response->assertSee('application/ld+json', false);
    }
}
