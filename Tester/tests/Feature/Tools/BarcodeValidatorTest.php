<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

class BarcodeValidatorTest extends TestCase
{
    public function test_index_page_renders(): void
    {
        $this->get(route('tools.barcode-validator'))->assertOk();
    }

    public function test_valid_upc_a_returns_valid_true(): void
    {
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => '036000291452',
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('valid'));
        $this->assertSame(2, $response->json('computed_check_digit'));
    }

    public function test_invalid_check_digit_returns_valid_false_with_breakdown(): void
    {
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => '036000291450', // wrong final digit
        ]);

        $response->assertOk();
        $this->assertFalse($response->json('valid'));
        $response->assertJsonStructure(['breakdown']);
    }

    public function test_handles_whitespace_and_hyphens(): void
    {
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => ' 0360-0029 1452 ',
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('valid'));
    }

    public function test_rejects_non_digit_input_with_inline_error(): void
    {
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => 'not-a-barcode-at-all',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }

    public function test_rejects_wrong_length_with_inline_error(): void
    {
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => '123',
        ]);

        $response->assertStatus(422);
    }

    public function test_validator_requires_no_email(): void
    {
        \Illuminate\Support\Facades\DB::table('tool_lead_events')->delete();
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        $response = $this->postJson(route('tools.barcode-validator.check'), [
            'value' => '036000291452',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
