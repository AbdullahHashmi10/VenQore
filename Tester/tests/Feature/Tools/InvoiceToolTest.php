<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\InvoiceService;
use Tests\TestCase;

class InvoiceToolTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'company' => ['name' => 'Acme Retail Co', 'address' => '123 Main St', 'email' => 'billing@acme.test'],
            'client'  => ['name' => 'Jane Customer', 'address' => '456 Oak Ave'],
            'items'   => [
                ['description' => 'Widget', 'quantity' => 2, 'unit_price' => 10, 'tax_rate' => 10, 'discount_pct' => 0],
                ['description' => 'Gadget', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 0, 'discount_pct' => 10],
            ],
            'meta' => ['invoice_number' => 'INV-TEST-1', 'currency' => 'USD', 'template' => 'clean'],
        ], $overrides);
    }

    public function test_invoice_page_loads(): void
    {
        $this->get(route('tools.invoice'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.invoice.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_company_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['company']['name'] = '';

        $this->postJson(route('tools.invoice.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.invoice.render'), $payload)->assertStatus(422);
    }

    public function test_totals_are_computed_correctly(): void
    {
        $service = new InvoiceService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Client'],
            [
                ['description' => 'A', 'quantity' => 2, 'unit_price' => 10, 'tax_rate' => 10, 'discount_pct' => 0], // net 20, tax 2
                ['description' => 'B', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 0, 'discount_pct' => 10], // net 45, tax 0
            ],
            ['currency' => 'USD']
        );

        $this->assertSame(65.0, $result['subtotal']); // 20 + 45
        $this->assertSame(2.0, $result['tax']);
        $this->assertSame(5.0, $result['discount']);
        $this->assertSame(67.0, $result['total']);
    }

    public function test_every_template_renders(): void
    {
        foreach (array_keys(InvoiceService::TEMPLATES) as $template) {
            $payload = $this->payload(['meta' => ['template' => $template, 'currency' => 'USD']]);
            $response = $this->postJson(route('tools.invoice.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Template {$template} failed to render.");
        }
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $payload = $this->payload(['meta' => ['currency' => 'XXX']]);

        $this->postJson(route('tools.invoice.render'), $payload)->assertStatus(422);
    }

    public function test_invoice_generation_is_free_and_requires_no_lead(): void
    {
        \Illuminate\Support\Facades\DB::table('tool_lead_events')->delete();
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        $this->assertDatabaseCount('tool_leads', 0);
        $this->postJson(route('tools.invoice.render'), $this->payload())->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
