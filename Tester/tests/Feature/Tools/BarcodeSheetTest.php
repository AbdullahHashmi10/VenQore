<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\BarcodeSheetService;
use Tests\TestCase;

class BarcodeSheetTest extends TestCase
{
    public function test_thermal_preset_produces_a_pdf(): void
    {
        $response = $this->post(route('tools.barcode.sheet'), [
            'format'   => 'code128',
            'value'    => 'VENQORE123',
            'preset'   => 'thermal-50x25',
            'quantity' => 5,
        ]);

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->streamedContent() ?: $response->getContent());
    }

    public function test_a4_sheet_preset_produces_a_pdf(): void
    {
        $response = $this->post(route('tools.barcode.sheet'), [
            'format'   => 'ean-13',
            'value'    => '400638133393',
            'preset'   => 'a4-3x8',
            'quantity' => 24,
        ]);

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_unknown_preset_is_rejected(): void
    {
        $this->postJson(route('tools.barcode.sheet'), [
            'format'   => 'code128',
            'value'    => 'ABC',
            'preset'   => 'not-a-real-preset',
            'quantity' => 5,
        ])->assertStatus(422);
    }

    public function test_quantity_is_capped(): void
    {
        $this->postJson(route('tools.barcode.sheet'), [
            'format'   => 'code128',
            'value'    => 'ABC',
            'preset'   => 'thermal-50x25',
            'quantity' => BarcodeSheetService::MAX_QUANTITY + 1,
        ])->assertStatus(422);
    }

    public function test_invalid_barcode_value_is_rejected_with_message(): void
    {
        $this->postJson(route('tools.barcode.sheet'), [
            'format'   => 'ean-13',
            'value'    => '123', // wrong length
            'preset'   => 'thermal-50x25',
            'quantity' => 5,
        ])->assertStatus(422)->assertJsonStructure(['errors']);
    }

    public function test_print_sheet_works_without_gd_because_it_embeds_svg(): void
    {
        // The sheet builder always renders the barcode as SVG and lets
        // dompdf draw it, so print output must not depend on GD/Imagick.
        $response = $this->post(route('tools.barcode.sheet'), [
            'format'   => 'code128',
            'value'    => 'NO-GD-NEEDED',
            'preset'   => 'thermal-75x50',
            'quantity' => 2,
        ]);

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_every_preset_builds_without_error(): void
    {
        foreach (array_keys(BarcodeSheetService::PRESETS) as $preset) {
            $response = $this->post(route('tools.barcode.sheet'), [
                'format'   => 'code128',
                'value'    => 'PRESETTEST',
                'preset'   => $preset,
                'quantity' => 2,
            ]);

            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Preset {$preset} did not produce a PDF.");
        }
    }
}
