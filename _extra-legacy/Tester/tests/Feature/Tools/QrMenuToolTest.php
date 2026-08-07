<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

class QrMenuToolTest extends TestCase
{
    public function test_index_page_renders(): void
    {
        $this->get(route('tools.qr-menu'))->assertOk();
    }

    public function test_render_validation_fails_for_empty_input(): void
    {
        $response = $this->postJson(route('tools.qr-menu.render'), []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['restaurant_name', 'menu_url', 'preset', 'theme']);
    }

    public function test_render_accepts_valid_inputs_and_returns_pdf(): void
    {
        $response = $this->postJson(route('tools.qr-menu.render'), [
            'restaurant_name'  => 'Test Café',
            'menu_url'         => 'https://example.com/menu',
            'preset'           => 'tent_4x6',
            'theme'            => 'classic_dark',
            'table_number'     => '5',
            'instruction_text' => 'Scan to order',
            'menu_items'       => [
                ['name' => 'Coffee', 'price' => '$3.50', 'description' => 'Espresso'],
            ],
        ]);

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }
}
