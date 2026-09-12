<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\StockCountSheetService;
use Tests\TestCase;

class StockCountSheetToolTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'store' => [
                'name' => 'VenQore Flagship Store',
                'location' => 'Aisle 1 & 2',
                'auditor_name' => 'John Auditor',
                'audit_date' => '2026-07-31',
                'reference_no' => 'AUD-TEST-1',
            ],
            'items' => [
                ['sku' => 'SKU-001', 'name' => 'Organic Coffee Beans', 'category' => 'Beverages', 'unit' => 'bags', 'expected_qty' => 50],
                ['sku' => 'SKU-002', 'name' => 'Green Tea 100s', 'category' => 'Beverages', 'unit' => 'boxes', 'expected_qty' => 20],
                ['sku' => 'SKU-003', 'name' => 'Dark Chocolate 85%', 'category' => 'Confectionery', 'unit' => 'bars', 'expected_qty' => 100],
            ],
            'meta' => [
                'show_expected' => true,
                'blind_count' => false,
                'group_by' => 'category',
                'orientation' => 'portrait',
            ],
        ], $overrides);
    }

    public function test_stock_count_page_loads(): void
    {
        $this->get(route('tools.stock-count'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.stock-count.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_store_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['store']['name'] = '';

        $this->postJson(route('tools.stock-count.render'), $payload)->assertStatus(422);
    }

    public function test_missing_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.stock-count.render'), $payload)->assertStatus(422);
    }

    public function test_csv_parser_works(): void
    {
        $service = new StockCountSheetService();

        $csv = "SKU,Name,Category,Expected Qty,Unit\nSKU-1,Item One,Cat A,10,pcs\nSKU-2,Item Two,Cat B,20,box";
        $parsed = $service->parseCsv($csv);

        $this->assertCount(2, $parsed);
        $this->assertSame('SKU-1', $parsed[0]['sku']);
        $this->assertSame('Item One', $parsed[0]['name']);
        $this->assertSame('Cat A', $parsed[0]['category']);
        $this->assertSame(10.0, $parsed[0]['expected_qty']);
        $this->assertSame('pcs', $parsed[0]['unit']);
    }

    public function test_csv_parse_endpoint_returns_json(): void
    {
        $response = $this->postJson(route('tools.stock-count.parse'), [
            'csv_text' => "SKU-1,Item 1,Cat 1,15,pcs\nSKU-2,Item 2,Cat 2,30,pcs",
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'count'   => 2,
        ]);
    }

    public function test_blind_count_mode_hides_expected_qty(): void
    {
        $payload = $this->payload([
            'meta' => [
                'blind_count' => true,
                'show_expected' => true, // should be overridden to false in service
            ],
        ]);

        $response = $this->postJson(route('tools.stock-count.render'), $payload);
        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }
}
