<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\PackingSlipService;
use Tests\TestCase;

class PackingSlipToolTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'shipFrom' => ['name' => 'Acme Warehouse', 'address' => '123 Supply Chain Way', 'email' => 'shipping@acme.test'],
            'shipTo'   => ['name' => 'Jane Smith', 'address' => '456 Delivery Lane', 'phone' => '555-0199'],
            'billTo'   => ['name' => 'Acme HQ', 'address' => '789 Corporate Blvd'],
            'items'    => [
                ['sku' => 'SKU-100', 'description' => 'Widget A', 'quantity_ordered' => 10, 'quantity_shipped' => 10, 'package_number' => 'Box 1'],
                ['sku' => 'SKU-200', 'description' => 'Gadget B', 'quantity_ordered' => 5, 'quantity_shipped' => 3, 'package_number' => 'Box 1', 'notes' => 'Backordered 2 units'],
            ],
            'meta'     => ['order_number' => 'ORD-9988', 'carrier' => 'FedEx', 'tracking_number' => 'TRK123456', 'template' => 'clean'],
        ], $overrides);
    }

    public function test_packing_slip_page_loads(): void
    {
        $this->get(route('tools.packing-slip'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.packing-slip.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_ship_from_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['shipFrom']['name'] = '';

        $this->postJson(route('tools.packing-slip.render'), $payload)->assertStatus(422);
    }

    public function test_missing_ship_to_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['shipTo']['name'] = '';

        $this->postJson(route('tools.packing-slip.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.packing-slip.render'), $payload)->assertStatus(422);
    }

    public function test_partial_shipment_is_detected_and_totals_computed(): void
    {
        $service = new PackingSlipService();

        $result = $service->build(
            ['name' => 'Acme Warehouse'],
            ['name' => 'Recipient'],
            [],
            [
                ['sku' => 'A', 'description' => 'Item A', 'quantity_ordered' => 10, 'quantity_shipped' => 10],
                ['sku' => 'B', 'description' => 'Item B', 'quantity_ordered' => 5, 'quantity_shipped' => 2],
            ],
            ['template' => 'clean']
        );

        $this->assertTrue($result['hasPartialShipment']);
        $this->assertSame(15.0, $result['totalOrdered']);
        $this->assertSame(12.0, $result['totalShipped']);
    }

    public function test_every_template_renders(): void
    {
        foreach (array_keys(PackingSlipService::TEMPLATES) as $template) {
            $payload = $this->payload(['meta' => ['template' => $template]]);
            $response = $this->postJson(route('tools.packing-slip.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Template {$template} failed to render.");
        }
    }
}
