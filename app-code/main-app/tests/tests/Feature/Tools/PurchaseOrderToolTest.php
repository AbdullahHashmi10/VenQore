<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\PurchaseOrderService;
use Tests\TestCase;

class PurchaseOrderToolTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'buyer' => ['name' => 'Acme Retail Store', 'address' => '123 Main St', 'email' => 'buyer@acme.test'],
            'vendor' => ['name' => 'Global Supplier Inc', 'contact_person' => 'John Doe', 'address' => '456 Industrial Pkwy'],
            'items' => [
                ['sku' => 'SKU-001', 'description' => 'Product A', 'quantity' => 10, 'unit_cost' => 15.5, 'tax_rate' => 5],
                ['sku' => 'SKU-002', 'description' => 'Product B', 'quantity' => 5, 'unit_cost' => 40.0, 'tax_rate' => 0],
            ],
            'meta' => ['po_number' => 'PO-TEST-1', 'currency' => 'USD', 'template' => 'clean', 'shipping_cost' => 25.0],
        ], $overrides);
    }

    public function test_purchase_order_page_loads(): void
    {
        $this->get(route('tools.purchase-order'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.purchase-order.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_buyer_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['buyer']['name'] = '';

        $this->postJson(route('tools.purchase-order.render'), $payload)->assertStatus(422);
    }

    public function test_missing_vendor_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['vendor']['name'] = '';

        $this->postJson(route('tools.purchase-order.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.purchase-order.render'), $payload)->assertStatus(422);
    }

    public function test_totals_are_computed_correctly(): void
    {
        $service = new PurchaseOrderService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Vendor'],
            [
                ['sku' => 'A', 'description' => 'Prod A', 'quantity' => 10, 'unit_cost' => 10, 'tax_rate' => 10], // net 100, tax 10
                ['sku' => 'B', 'description' => 'Prod B', 'quantity' => 2, 'unit_cost' => 50, 'tax_rate' => 0],   // net 100, tax 0
            ],
            ['currency' => 'USD', 'shipping_cost' => 15]
        );

        $this->assertSame(200.0, $result['subtotal']);
        $this->assertSame(10.0, $result['tax']);
        $this->assertSame(15.0, $result['shipping']);
        $this->assertSame(225.0, $result['total']);
    }

    public function test_every_template_renders(): void
    {
        foreach (array_keys(PurchaseOrderService::TEMPLATES) as $template) {
            $payload = $this->payload(['meta' => ['template' => $template, 'currency' => 'USD']]);
            $response = $this->postJson(route('tools.purchase-order.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Template {$template} failed to render.");
        }
    }
}
