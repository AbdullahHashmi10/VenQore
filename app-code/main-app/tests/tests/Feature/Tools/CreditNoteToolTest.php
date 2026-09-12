<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\CreditNoteService;
use Tests\TestCase;

class CreditNoteToolTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'company' => ['name' => 'Acme Retail Co', 'address' => '123 Main St', 'email' => 'billing@acme.test'],
            'client'  => ['name' => 'Jane Customer', 'address' => '456 Oak Ave'],
            'items'   => [
                ['description' => 'Widget Return', 'quantity' => 2, 'unit_price' => 10, 'tax_rate' => 10, 'discount_pct' => 0],
                ['description' => 'Gadget Credit', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 0, 'discount_pct' => 10],
            ],
            'meta' => [
                'credit_note_number'      => 'CN-TEST-1',
                'original_invoice_number' => 'INV-2026-001',
                'reason'                  => 'return',
                'refund_method'           => 'store_credit',
                'currency'                => 'USD',
                'template'                => 'clean',
            ],
        ], $overrides);
    }

    public function test_credit_note_page_loads(): void
    {
        $this->get(route('tools.credit-note'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.credit-note.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_company_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['company']['name'] = '';

        $this->postJson(route('tools.credit-note.render'), $payload)->assertStatus(422);
    }

    public function test_missing_original_invoice_number_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['meta']['original_invoice_number'] = '';

        $this->postJson(route('tools.credit-note.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.credit-note.render'), $payload)->assertStatus(422);
    }

    public function test_totals_are_computed_correctly(): void
    {
        $service = new CreditNoteService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Client'],
            [
                ['description' => 'A', 'quantity' => 2, 'unit_price' => 10, 'tax_rate' => 10, 'discount_pct' => 0], // net 20, tax 2
                ['description' => 'B', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 0, 'discount_pct' => 10], // net 45, tax 0
            ],
            [
                'original_invoice_number' => 'INV-100',
                'currency'                => 'USD',
            ]
        );

        $this->assertSame(65.0, $result['subtotal']); // 20 + 45
        $this->assertSame(2.0, $result['tax']);
        $this->assertSame(5.0, $result['discount']);
        $this->assertSame(67.0, $result['total']);
    }

    public function test_every_template_renders(): void
    {
        foreach (array_keys(CreditNoteService::TEMPLATES) as $template) {
            $payload = $this->payload([
                'meta' => [
                    'original_invoice_number' => 'INV-100',
                    'template'                => $template,
                    'currency'                => 'USD',
                ],
            ]);
            $response = $this->postJson(route('tools.credit-note.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Template {$template} failed to render.");
        }
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $payload = $this->payload(['meta' => ['original_invoice_number' => 'INV-100', 'currency' => 'XXX']]);

        $this->postJson(route('tools.credit-note.render'), $payload)->assertStatus(422);
    }

    public function test_credit_note_generation_is_free_and_requires_no_lead(): void
    {
        \Illuminate\Support\Facades\DB::table('tool_lead_events')->delete();
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        $this->assertDatabaseCount('tool_leads', 0);
        $this->postJson(route('tools.credit-note.render'), $this->payload())->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
