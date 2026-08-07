<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\BarcodeService;
use Tests\TestCase;

class BarcodeToolTest extends TestCase
{
    private function supportsRaster(): bool
    {
        return (new BarcodeService())->supportsRaster();
    }

    public function test_index_page_renders(): void
    {
        $this->get(route('tools.barcode'))->assertOk();
    }

    public function test_render_produces_a_png_for_valid_code128(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'code128',
            'value'  => 'VENQORE123',
            'output' => 'png',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['image_base64', 'mime_type', 'encoded_value', 'file_extension', 'actual_format', 'format_downgraded']);
        $expectedMime = $this->supportsRaster() ? 'image/png' : 'image/svg+xml';
        $this->assertSame($expectedMime, $response->json('mime_type'));
        $this->assertNotEmpty($response->json('image_base64'));

        // The reported file_extension must always match the actual bytes
        // produced — this is the specific bug that was fixed (a browser
        // downloading an SVG file mislabeled "barcode.png").
        $expectedExtension = $this->supportsRaster() ? 'png' : 'svg';
        $this->assertSame($expectedExtension, $response->json('file_extension'));
        $this->assertSame(!$this->supportsRaster(), $response->json('format_downgraded'));
    }

    public function test_render_produces_svg_and_jpg(): void
    {
        foreach (['svg' => 'image/svg+xml', 'jpg' => 'image/jpeg'] as $output => $mime) {
            $response = $this->postJson(route('tools.barcode.render'), [
                'format' => 'code128',
                'value'  => 'TEST',
                'output' => $output,
            ]);
            $response->assertOk();
            $expectedMime = ($output === 'jpg' && !$this->supportsRaster()) ? 'image/svg+xml' : $mime;
            $this->assertSame($expectedMime, $response->json('mime_type'));

            // file_extension must always be honest about what was produced
            $expectedExt = ($output === 'jpg' && !$this->supportsRaster()) ? 'svg' : $output;
            $this->assertSame($expectedExt, $response->json('file_extension'));
        }
    }

    public function test_inline_validate_endpoint_returns_explanation(): void
    {
        $response = $this->postJson(route('tools.barcode.validate'), [
            'value' => '036000291452',
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('valid'));
        $response->assertJsonStructure(['valid', 'format_name', 'explanation', 'computed_check_digit', 'supplied_check_digit', 'gtin14', 'breakdown']);
        $this->assertNotEmpty($response->json('explanation'));
    }

    public function test_inline_validate_endpoint_explains_invalid_codes(): void
    {
        $response = $this->postJson(route('tools.barcode.validate'), [
            'value' => '036000291450', // wrong check digit
        ]);

        $response->assertOk();
        $this->assertFalse($response->json('valid'));
        $this->assertStringContainsString("doesn't match", $response->json('explanation'));
    }

    public function test_ean13_short_form_auto_computes_check_digit(): void
    {
        // 12-digit short form; check digit should be computed as 2 (see
        // Tester/tests/Unit/Tools/CheckDigitTest.php for the verified vector).
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'ean-13',
            'value'  => '400638133393',
            'output' => 'png',
        ]);

        $response->assertOk();
        $this->assertTrue($response->json('was_computed'));
        $this->assertSame(1, $response->json('check_digit'));
        $this->assertSame('4006381333931', $response->json('encoded_value'));
    }

    public function test_ean13_full_form_is_not_recomputed(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'ean-13',
            'value'  => '4006381333931', // already includes correct check digit
            'output' => 'png',
        ]);

        $response->assertOk();
        $this->assertFalse($response->json('was_computed'));
        $this->assertSame('4006381333931', $response->json('encoded_value'));
    }

    public function test_invalid_length_for_ean13_returns_inline_error_not_500(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'ean-13',
            'value'  => '123', // too short
            'output' => 'png',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }

    public function test_non_digit_value_for_digit_only_format_returns_inline_error(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'upc-a',
            'value'  => 'NOTADIGIT12',
            'output' => 'png',
        ]);

        $response->assertStatus(422);
    }

    public function test_empty_value_returns_inline_error_not_500(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'code128',
            'value'  => '',
            'output' => 'png',
        ]);

        $response->assertStatus(422); // caught by form request validation ('required')
    }

    public function test_invalid_character_for_code39_returns_inline_error_not_500(): void
    {
        // Code39 does not support lowercase letters — picqer throws
        // InvalidCharacterException, which BarcodeToolController must catch
        // and turn into a 422, never a 500.
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'code39',
            'value'  => 'lowercase not allowed',
            'output' => 'png',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }

    public function test_unknown_format_is_rejected(): void
    {
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'not-a-real-format',
            'value'  => 'ABC',
            'output' => 'png',
        ]);

        $response->assertStatus(422); // caught by Rule::in validation
    }

    public function test_all_nine_format_child_pages_render(): void
    {
        foreach (array_keys(\App\Services\Tools\BarcodeService::FORMATS) as $slug) {
            $this->get("/tools/barcode-generator/{$slug}")->assertOk();
        }
    }

    public function test_unknown_format_child_page_404s(): void
    {
        $this->get('/tools/barcode-generator/not-a-format')->assertNotFound();
    }

    public function test_single_barcode_generation_requires_no_email(): void
    {
        // Plan §6.1 hard rule: core output is never gated. Assert the render
        // endpoint has no auth/lead requirement at all.
        \Illuminate\Support\Facades\DB::table('tool_lead_events')->delete();
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        $response = $this->postJson(route('tools.barcode.render'), [
            'format' => 'code128',
            'value'  => 'FREE-NO-EMAIL',
            'output' => 'png',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
