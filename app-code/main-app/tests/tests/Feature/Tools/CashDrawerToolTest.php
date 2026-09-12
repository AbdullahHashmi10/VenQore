<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

class CashDrawerToolTest extends TestCase
{
    public function test_cash_drawer_tool_index_page_loads(): void
    {
        $this->get('/tools/cash-drawer-count-sheet')->assertOk();
    }

    public function test_cash_drawer_pdf_render_success(): void
    {
        $payload = [
            'store' => [
                'name' => 'Main Retail Store',
                'location' => 'Building 4',
                'cashier_name' => 'John Doe',
                'supervisor_name' => 'Jane Smith',
                'register_id' => 'Till 1',
                'shift_date' => '2026-08-01',
                'notes' => 'End of shift count - balanced',
            ],
            'denominations' => [
                ['name' => '$100 Bill', 'type' => 'bill', 'value' => 100.00, 'count' => 5],
                ['name' => '$20 Bill', 'type' => 'bill', 'value' => 20.00, 'count' => 10],
                ['name' => '25¢ Quarter', 'type' => 'coin', 'value' => 0.25, 'count' => 40],
            ],
            'meta' => [
                'currency' => 'USD',
                'opening_float' => 150.00,
                'expected_cash_sales' => 560.00,
                'expected_cash_total' => 710.00,
            ],
        ];

        $response = $this->postJson(route('tools.cash-drawer.render'), $payload);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('X-Counted-Total', '710');
        $response->assertHeader('X-Variance', '0');
    }

    public function test_cash_drawer_pdf_render_validation_error(): void
    {
        $payload = [
            'store' => [
                'name' => '', // Required
            ],
            'denominations' => [],
        ];

        $response = $this->postJson(route('tools.cash-drawer.render'), $payload);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }
}
