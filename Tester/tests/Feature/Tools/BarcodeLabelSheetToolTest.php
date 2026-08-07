<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\BarcodeLabelSheetService;
use Tests\TestCase;

class BarcodeLabelSheetToolTest extends TestCase
{
    use \Illuminate\Foundation\Testing\DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \Illuminate\Support\Facades\DB::table('tool_leads')->delete();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
    private function items(): array
    {
        return [
            ['name' => 'Cotton Crew T-Shirt', 'value' => 'TSH-001', 'format' => 'code128', 'price' => '19.99'],
            ['name' => 'Slim Fit Denim Jeans', 'value' => 'JNS-002', 'format' => 'code128', 'price' => null],
        ];
    }

    public function test_page_loads(): void
    {
        $this->get(route('tools.barcode-label'))->assertOk();
    }

    public function test_sheet_renders_a_pdf_for_manual_rows(): void
    {
        $response = $this->postJson(route('tools.barcode-label.sheet'), [
            'items'    => $this->items(),
            'preset'   => 'thermal-50x25',
            'copies'   => 1,
            'currency' => 'USD',
        ]);

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_bulk_paste_parses_correctly(): void
    {
        $response = $this->postJson(route('tools.barcode-label.parse'), [
            'csv_text' => "Cotton Crew T-Shirt,TSH-001,code128,19.99\nSlim Fit Denim Jeans,JNS-002,code128,",
        ]);

        $response->assertOk();
        $response->assertJsonCount(2, 'items');
        $this->assertSame('Cotton Crew T-Shirt', $response->json('items.0.name'));
        $this->assertSame('TSH-001', $response->json('items.0.value'));
    }

    public function test_every_preset_builds_without_error(): void
    {
        foreach (array_keys(BarcodeLabelSheetService::PRESETS) as $preset) {
            $response = $this->postJson(route('tools.barcode-label.sheet'), [
                'items'  => $this->items(),
                'preset' => $preset,
                'copies' => 1,
            ]);

            $response->assertOk();
            $this->assertStringStartsWith('%PDF', $response->getContent(), "Preset {$preset} did not produce a PDF.");
        }
    }

    public function test_copies_multiplier_repeats_the_batch(): void
    {
        $service = app(BarcodeLabelSheetService::class);
        $pdfOne = $service->build('thermal-50x25', $this->items(), ['copies' => 1]);
        $pdfThree = $service->build('thermal-50x25', $this->items(), ['copies' => 3]);

        // A 3x copy sheet should be a meaningfully larger PDF than a 1x sheet
        // (more pages of embedded SVG content) — a cheap but real proxy for
        // "the multiplier actually multiplied" without parsing PDF internals.
        $this->assertGreaterThan(strlen($pdfOne), strlen($pdfThree));
    }

    public function test_missing_rows_rejected(): void
    {
        $this->postJson(route('tools.barcode-label.sheet'), [
            'items'  => [],
            'preset' => 'thermal-50x25',
            'copies' => 1,
        ])->assertStatus(422);
    }

    public function test_unknown_preset_rejected(): void
    {
        $this->postJson(route('tools.barcode-label.sheet'), [
            'items'  => $this->items(),
            'preset' => 'not-a-real-preset',
            'copies' => 1,
        ])->assertStatus(422);
    }

    public function test_generation_is_free_and_requires_no_lead(): void
    {
        $this->assertDatabaseCount('tool_leads', 0);
        $this->postJson(route('tools.barcode-label.sheet'), [
            'items'  => $this->items(),
            'preset' => 'thermal-50x25',
            'copies' => 1,
        ])->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
