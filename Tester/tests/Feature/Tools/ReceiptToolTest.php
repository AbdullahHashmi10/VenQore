<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\ReceiptService;
use Tests\TestCase;

class ReceiptToolTest extends TestCase
{
    // FIXED 2026-08-02 (Batch 4, C4): test_receipt_generation_is_free_and_requires_no_lead()
    // below reads DB::table('tool_leads')->count() as a baseline and asserts it
    // doesn't change. Without RefreshDatabase, that baseline is whatever rows
    // happen to be left over from other tests/suites that ran earlier in the
    // same process (e.g. ToolLeadCaptureTest.php), making the assertion
    // order-dependent instead of a clean, deterministic check.
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'store' => ['name' => 'Corner Retail Store', 'address' => '123 Retail Way', 'phone' => '555-0199', 'footer_message' => 'Thanks!'],
            'items' => [
                ['name' => 'Item A', 'quantity' => 2, 'unit_price' => 15.00],
                ['name' => 'Item B', 'quantity' => 1, 'unit_price' => 20.00],
            ],
            'meta' => [
                'receipt_number' => 'REC-TEST-1',
                'currency' => 'USD',
                'paper_preset' => 'thermal_80mm',
                'payment_method' => 'Cash',
                'amount_tendered' => 60.00,
                'tax_rate' => 10.0,
                'discount_value' => 5.0,
                'discount_type' => 'flat',
            ],
        ], $overrides);
    }

    public function test_receipt_page_loads(): void
    {
        $this->get(route('tools.receipt'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.receipt.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_store_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['store']['name'] = '';

        $this->postJson(route('tools.receipt.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.receipt.render'), $payload)->assertStatus(422);
    }

    public function test_totals_are_computed_correctly_flat_discount(): void
    {
        $service = new ReceiptService();

        // subtotal = 2*15 + 1*20 = 50
        // flat discount = 5 -> net taxable = 45
        // tax 10% on 45 = 4.5
        // total = 49.5
        $result = $service->build(
            ['name' => 'Store'],
            [
                ['name' => 'Item A', 'quantity' => 2, 'unit_price' => 15.00],
                ['name' => 'Item B', 'quantity' => 1, 'unit_price' => 20.00],
            ],
            [
                'currency' => 'USD',
                'tax_rate' => 10.0,
                'discount_value' => 5.0,
                'discount_type' => 'flat',
            ]
        );

        $this->assertSame(50.0, $result['subtotal']);
        $this->assertSame(5.0, $result['discount']);
        $this->assertSame(4.5, $result['tax']);
        $this->assertSame(49.5, $result['total']);
    }

    public function test_totals_are_computed_correctly_percentage_discount(): void
    {
        $service = new ReceiptService();

        // subtotal = 100
        // 20% discount = 20 -> net taxable = 80
        // 5% tax on 80 = 4
        // total = 84
        $result = $service->build(
            ['name' => 'Store'],
            [['name' => 'Product X', 'quantity' => 1, 'unit_price' => 100.00]],
            [
                'currency' => 'USD',
                'tax_rate' => 5.0,
                'discount_value' => 20.0,
                'discount_type' => 'percent',
            ]
        );

        $this->assertSame(100.0, $result['subtotal']);
        $this->assertSame(20.0, $result['discount']);
        $this->assertSame(4.0, $result['tax']);
        $this->assertSame(84.0, $result['total']);
    }

    public function test_every_paper_preset_renders(): void
    {
        foreach (array_keys(ReceiptService::PAPER_PRESETS) as $preset) {
            $payload = $this->payload(['meta' => ['paper_preset' => $preset, 'currency' => 'USD']]);
            $response = $this->postJson(route('tools.receipt.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Paper preset {$preset} failed to render.");
        }
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $payload = $this->payload(['meta' => ['currency' => 'XXX']]);

        $this->postJson(route('tools.receipt.render'), $payload)->assertStatus(422);
    }

    public function test_receipt_generation_is_free_and_requires_no_lead(): void
    {
        $initial = \Illuminate\Support\Facades\DB::table('tool_leads')->count();
        $this->postJson(route('tools.receipt.render'), $this->payload())->assertOk();
        $this->assertDatabaseCount('tool_leads', $initial);
    }
}
