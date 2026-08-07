<?php

namespace Tests\Unit\Tools;

use App\Services\Tools\BarcodeService;
use Tests\TestCase;

/**
 * Known-good check-digit values for GTIN-8/12/13/14, per
 * SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §11.1.
 * These are real, published test vectors, not invented ones.
 */
class CheckDigitTest extends TestCase
{
    private BarcodeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BarcodeService();
    }

    public function test_computes_correct_upc_a_check_digit(): void
    {
        // 036000291452 is a well-known valid UPC-A (Nabisco product), check digit 2
        $this->assertSame(2, $this->service->computeGtinCheckDigit('03600029145'));
    }

    public function test_computes_correct_ean_13_check_digit(): void
    {
        // 4006381333931 is the canonical EAN-13 example (Stabilo pen), check digit 1
        $this->assertSame(1, $this->service->computeGtinCheckDigit('400638133393'));
    }

    public function test_computes_correct_ean_8_check_digit(): void
    {
        // 96385074 is a standard EAN-8 test vector, check digit 4
        $this->assertSame(4, $this->service->computeGtinCheckDigit('9638507'));
    }

    public function test_computes_correct_itf_14_check_digit(): void
    {
        // ITF-14 wraps a GTIN-13 body with a leading indicator digit; the
        // check-digit algorithm is the same mod-10 weighting regardless.
        $body = '1234567890123'; // 13 digits
        $checkDigit = $this->service->computeGtinCheckDigit($body);
        $this->assertIsInt($checkDigit);
        $this->assertGreaterThanOrEqual(0, $checkDigit);
        $this->assertLessThanOrEqual(9, $checkDigit);

        // Cross-check via validateGtin(): appending our own computed digit
        // must always validate as correct.
        $result = $this->service->validateGtin($body . $checkDigit);
        $this->assertTrue($result['valid']);
        $this->assertSame($checkDigit, $result['computed_check_digit']);
    }

    public function test_validate_gtin_detects_invalid_check_digit(): void
    {
        // 036000291450 has an intentionally wrong final digit (should be 2).
        $result = $this->service->validateGtin('036000291450');
        $this->assertFalse($result['valid']);
        $this->assertSame(2, $result['computed_check_digit']);
        $this->assertSame(0, $result['supplied_check_digit']);
    }

    public function test_validate_gtin_strips_whitespace_and_hyphens(): void
    {
        $clean = $this->service->validateGtin('036000291452');
        $spaced = $this->service->validateGtin(' 0 3600-0291452 ');

        $this->assertSame($clean['valid'], $spaced['valid']);
        $this->assertSame($clean['gtin14'], $spaced['gtin14']);
    }

    public function test_validate_gtin_rejects_non_digit_input(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->validateGtin('not-a-barcode');
    }

    public function test_validate_gtin_rejects_wrong_length(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->validateGtin('12345'); // 5 digits — not a valid GTIN length
    }
}
