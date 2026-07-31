<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\QuoteService;
use App\Support\ToolRegistry;
use Tests\TestCase;

class QuoteToolTest extends TestCase
{
    public function test_quote_tool_index_page_loads_successfully(): void
    {
        $response = $this->get(route('tools.quote'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Marketing/Tools/Quote', false)
            ->has('templates')
            ->has('currencies')
            ->has('suggestedNumber')
        );
    }

    public function test_quote_tool_renders_pdf_successfully(): void
    {
        $payload = [
            'company' => [
                'name' => 'Acme Solutions',
                'address' => '123 Business St',
                'email' => 'contact@acme.com',
                'phone' => '555-0199',
                'tax_id' => 'TAX-9988',
            ],
            'client' => [
                'name' => 'Global Corp',
                'address' => '456 Corporate Blvd',
                'email' => 'purchasing@globalcorp.com',
            ],
            'items' => [
                [
                    'description' => 'Web Development Consulting',
                    'quantity' => 10,
                    'unit_price' => 150.00,
                    'tax_rate' => 10,
                    'discount_pct' => 5,
                ],
            ],
            'meta' => [
                'doc_type' => 'Quotation',
                'quote_number' => 'QT-2026-001',
                'issue_date' => '2026-08-01',
                'valid_until' => '2026-08-31',
                'validity_days' => 30,
                'deposit_type' => 'percentage',
                'deposit_value' => 20,
                'currency' => 'USD',
                'notes' => 'Includes 3 months warranty.',
                'terms' => '50% deposit, balance on delivery.',
                'template' => 'modern',
                'accent_color' => '#4f46e5',
            ],
        ];

        $response = $this->postJson(route('tools.quote.render'), $payload);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Content-Disposition', 'attachment; filename="quote-QT-2026-001.pdf"');
        $response->assertHeader('X-Quote-Total', '1567.5');
    }

    public function test_quote_tool_validation_fails_with_missing_data(): void
    {
        $response = $this->postJson(route('tools.quote.render'), [
            'company' => ['name' => ''],
            'client' => ['name' => ''],
            'items' => [],
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }

    public function test_quote_tool_is_marked_live_in_registry(): void
    {
        $liveTools = ToolRegistry::live();
        $quoteTool = collect($liveTools)->firstWhere('slug', 'quote-generator');

        $this->assertNotNull($quoteTool);
        $this->assertEquals(ToolRegistry::STATUS_LIVE, $quoteTool['status']);
        $this->assertEquals('tools.quote', $quoteTool['route']);
    }
}
