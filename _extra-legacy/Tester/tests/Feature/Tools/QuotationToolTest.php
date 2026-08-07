<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\QuotationService;
use Tests\TestCase;

class QuotationToolTest extends TestCase
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
            'meta' => ['quote_number' => 'QTE-TEST-1', 'currency' => 'USD', 'template' => 'clean'],
        ], $overrides);
    }

    public function test_quote_page_loads(): void
    {
        $this->get(route('tools.quote'))->assertOk();
    }

    public function test_render_produces_a_pdf(): void
    {
        $response = $this->postJson(route('tools.quote.render'), $this->payload());

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_missing_company_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['company']['name'] = '';

        $this->postJson(route('tools.quote.render'), $payload)->assertStatus(422);
    }

    public function test_missing_client_name_is_rejected(): void
    {
        $payload = $this->payload();
        $payload['client']['name'] = '';

        $this->postJson(route('tools.quote.render'), $payload)->assertStatus(422);
    }

    public function test_missing_line_items_is_rejected(): void
    {
        $payload = $this->payload(['items' => []]);

        $this->postJson(route('tools.quote.render'), $payload)->assertStatus(422);
    }

    /**
     * Hand-verified arithmetic:
     * Line A: qty 2 * unit 10 = gross 20, discount 0% -> net 20, tax 10% of 20 = 2, line total 22
     * Line B: qty 1 * unit 50 = gross 50, discount 10% -> discount amt 5, net 45, tax 0% -> line total 45
     * subtotal = 20 + 45 = 65
     * tax      = 2 + 0   = 2
     * discount = 0 + 5   = 5
     * total    = subtotal + tax = 65 + 2 = 67
     */
    public function test_totals_are_computed_correctly(): void
    {
        $service = new QuotationService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Client'],
            [
                ['description' => 'A', 'quantity' => 2, 'unit_price' => 10, 'tax_rate' => 10, 'discount_pct' => 0],
                ['description' => 'B', 'quantity' => 1, 'unit_price' => 50, 'tax_rate' => 0, 'discount_pct' => 10],
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
        foreach (array_keys(QuotationService::TEMPLATES) as $template) {
            $payload = $this->payload(['meta' => ['template' => $template, 'currency' => 'USD']]);
            $response = $this->postJson(route('tools.quote.render'), $payload);
            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Template {$template} failed to render.");
        }
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $payload = $this->payload(['meta' => ['currency' => 'XXX']]);

        $this->postJson(route('tools.quote.render'), $payload)->assertStatus(422);
    }

    public function test_valid_until_defaults_to_issue_date_plus_thirty_days_when_not_specified(): void
    {
        $service = new QuotationService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Client'],
            [['description' => 'A', 'quantity' => 1, 'unit_price' => 10, 'tax_rate' => 0, 'discount_pct' => 0]],
            ['currency' => 'USD', 'issue_date' => '2026-01-01']
        );

        $this->assertSame(QuotationService::DEFAULT_VALIDITY_DAYS, 30);
        $this->assertSame('2026-01-31', $result['valid_until']);
    }

    public function test_valid_until_respects_custom_validity_days(): void
    {
        $service = new QuotationService();

        $result = $service->build(
            ['name' => 'Acme'],
            ['name' => 'Client'],
            [['description' => 'A', 'quantity' => 1, 'unit_price' => 10, 'tax_rate' => 0, 'discount_pct' => 0]],
            ['currency' => 'USD', 'issue_date' => '2026-01-01', 'validity_days' => 14]
        );

        $this->assertSame('2026-01-15', $result['valid_until']);
    }

    public function test_document_label_defaults_to_quotation_and_can_be_set_to_estimate(): void
    {
        $payload = $this->payload(['meta' => ['currency' => 'USD', 'document_label' => 'ESTIMATE']]);

        $response = $this->postJson(route('tools.quote.render'), $payload);
        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_quote_generation_is_free_and_requires_no_lead(): void
    {
        \Illuminate\Support\Facades\DB::table('tool_lead_events')->delete();
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        $this->assertDatabaseCount('tool_leads', 0);
        $this->postJson(route('tools.quote.render'), $this->payload())->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
