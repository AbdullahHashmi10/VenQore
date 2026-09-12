<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\BarcodeService;
use Tests\TestCase;

/**
 * Human-readable text is the standard on a real barcode label — without it
 * nobody can key the code in when a scanner fails. It must work on servers
 * with NO image extension at all, which is why the SVG path draws text
 * itself rather than relying on GD.
 */
class BarcodeTextRenderingTest extends TestCase
{
    private BarcodeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BarcodeService();
    }

    public function test_svg_output_contains_the_human_readable_value(): void
    {
        $result = $this->service->render(
            slug: 'code128',
            value: 'VENQORE123',
            output: 'svg',
            showValue: true,
        );

        $this->assertSame('svg', $result['format']);
        $this->assertStringContainsString('<text', $result['bytes']);
        $this->assertStringContainsString('VENQORE123', $result['bytes']);
    }

    public function test_svg_output_omits_text_when_show_value_is_false(): void
    {
        $result = $this->service->render(
            slug: 'code128',
            value: 'HIDDEN',
            output: 'svg',
            showValue: false,
        );

        $this->assertStringNotContainsString('<text', $result['bytes']);
    }

    public function test_svg_includes_a_white_background_so_it_is_scannable(): void
    {
        // picqer emits a transparent SVG; on dark backgrounds that is
        // unscannable. We always paint white behind the bars.
        $result = $this->service->render(slug: 'code128', value: 'BG', output: 'svg');

        $this->assertStringContainsString('fill="#ffffff"', $result['bytes']);
    }

    public function test_svg_caption_is_rendered_in_addition_to_the_value(): void
    {
        $result = $this->service->render(
            slug: 'code128',
            value: 'SKU-99',
            output: 'svg',
            showValue: true,
            caption: 'Blue T-Shirt',
        );

        $this->assertStringContainsString('SKU-99', $result['bytes']);
        $this->assertStringContainsString('Blue T-Shirt', $result['bytes']);
    }

    public function test_svg_caption_is_xml_escaped(): void
    {
        $result = $this->service->render(
            slug: 'code128',
            value: 'X',
            output: 'svg',
            showValue: false,
            caption: 'Tom & Jerry <Ltd>',
        );

        // Raw ampersand/angle brackets would produce invalid XML and break
        // rendering in strict SVG viewers and dompdf alike.
        $this->assertStringNotContainsString('Tom & Jerry <Ltd>', $result['bytes']);
        $this->assertStringContainsString('&amp;', $result['bytes']);
    }

    public function test_svg_height_grows_to_fit_the_text(): void
    {
        $without = $this->service->render(slug: 'code128', value: 'ABC', output: 'svg', showValue: false);
        $with    = $this->service->render(slug: 'code128', value: 'ABC', output: 'svg', showValue: true);

        preg_match('/<svg[^>]*height="([\d.]+)"/', $without['bytes'], $a);
        preg_match('/<svg[^>]*height="([\d.]+)"/', $with['bytes'], $b);

        $this->assertGreaterThan((float) $a[1], (float) $b[1], 'SVG height should grow to make room for the text line.');
    }

    public function test_svg_remains_well_formed_xml_after_decoration(): void
    {
        $result = $this->service->render(
            slug: 'ean-13',
            value: '4006381333931',
            output: 'svg',
            showValue: true,
            caption: 'Test Product',
        );

        $previous = libxml_use_internal_errors(true);
        $xml = simplexml_load_string($result['bytes']);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $this->assertNotFalse($xml, 'Decorated SVG must still parse as valid XML.');
    }
}
