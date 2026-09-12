<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\PriceTagSheetService;
use Tests\TestCase;

class PriceTagToolTest extends TestCase
{
    public function test_price_tag_page_loads(): void
    {
        $response = $this->get(route('tools.price-tag'));

        $response->assertOk();
        $response->assertSee('Free Price Tag Generator', false);
    }

    public function test_manual_entry_rows_produce_a_pdf(): void
    {
        $response = $this->post(route('tools.price-tag.sheet'), [
            'items' => [
                ['name' => 'T-Shirt', 'price' => '19.99', 'was_price' => '29.99', 'sku' => 'TSH-1', 'badge' => 'SALE'],
                ['name' => 'Jeans', 'price' => '49.99', 'was_price' => null, 'sku' => 'JNS-2', 'badge' => 'NEW'],
            ],
            'preset'          => 'thermal-50x25',
            'copies'          => 1,
            'currency_symbol' => '$',
            'show_barcode'    => true,
            'barcode_format'  => 'code128',
        ]);

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_csv_parse_endpoint_parses_lines_correctly(): void
    {
        $csvText = "Cotton Shirt,19.99,29.99,SHIRT-01,SALE\nDenim Pants,39.99,,PANTS-02,NEW";

        $response = $this->postJson(route('tools.price-tag.parse'), [
            'csv_text' => $csvText,
        ]);

        $response->assertOk();
        $response->assertJson([
            'count' => 2,
            'items' => [
                ['name' => 'Cotton Shirt', 'price' => '19.99', 'was_price' => '29.99', 'sku' => 'SHIRT-01', 'badge' => 'SALE'],
                ['name' => 'Denim Pants', 'price' => '39.99', 'was_price' => null, 'sku' => 'PANTS-02', 'badge' => 'NEW'],
            ],
        ]);
    }

    public function test_every_preset_builds_without_error(): void
    {
        $items = [
            ['name' => 'Test Item', 'price' => '10.00', 'was_price' => '15.00', 'sku' => 'TEST-01', 'badge' => 'HOT'],
        ];

        foreach (array_keys(PriceTagSheetService::PRESETS) as $preset) {
            $response = $this->post(route('tools.price-tag.sheet'), [
                'items'           => $items,
                'preset'          => $preset,
                'copies'          => 1,
                'currency_symbol' => '$',
                'show_barcode'    => false,
            ]);

            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Preset {$preset} did not produce a PDF.");
        }
    }

    public function test_quantity_multiplier_copies_works(): void
    {
        $response = $this->post(route('tools.price-tag.sheet'), [
            'items' => [
                ['name' => 'Item 1', 'price' => '5.00'],
            ],
            'preset' => 'thermal-50x25',
            'copies' => 5,
        ]);

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_items_rejected_with_422(): void
    {
        $this->postJson(route('tools.price-tag.sheet'), [
            'items'  => [],
            'preset' => 'thermal-50x25',
            'copies' => 1,
        ])->assertStatus(422);
    }

    public function test_invalid_preset_rejected_with_422(): void
    {
        $this->postJson(route('tools.price-tag.sheet'), [
            'items'  => [['name' => 'Test', 'price' => '1.00']],
            'preset' => 'invalid-preset-name',
            'copies' => 1,
        ])->assertStatus(422);
    }

    public function test_tool_requires_no_tool_lead_free_ungated(): void
    {
        // Price tag sheet output is free and ungated (no email required)
        $response = $this->post(route('tools.price-tag.sheet'), [
            'items'  => [['name' => 'Free Item', 'price' => '12.34']],
            'preset' => 'a4-3x8',
            'copies' => 1,
        ]);

        $response->assertOk();
    }
}
