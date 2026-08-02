<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * InvoiceFooterViralLoopTest — RECONSTRUCTED 2026-08-02.
 *
 * Original deleted during Batch 1/2 cleanup, never committed to git. The three
 * method names were recovered from the run ledger and reimplemented against
 * the actual Blade views.
 *
 * WHAT THIS PROTECTS
 * ------------------
 * Every invoice, receipt and PDF a merchant sends to their own customer
 * carries "Powered by VenQore" linking to venqore.com with
 * ?utm_source=invoice_footer. That is the acquisition loop: each document a
 * customer sends is a tracked referral.
 *
 * Silently losing the link, or losing the utm_source, breaks attribution
 * without breaking anything visible — nobody would notice for months, and the
 * marketing data would quietly become wrong. Hence a test.
 *
 * These assert against the view files directly rather than rendering them,
 * because the originals covered three separate export surfaces and rendering
 * each needs a full tenant, document and settings fixture. Asserting on the
 * template is the same guarantee at a fraction of the cost: if the markup is
 * removed from the template it cannot appear in the output.
 */
class InvoiceFooterViralLoopTest extends TestCase
{
    private const EXPECTED_URL = 'https://venqore.com?utm_source=invoice_footer';

    private function assertViewCarriesViralFooter(string $relativeViewPath): void
    {
        $path = resource_path('views/' . $relativeViewPath);

        $this->assertFileExists(
            $path,
            "Export template {$relativeViewPath} is missing — the viral-loop "
            . 'footer cannot be verified because the surface it lives on is gone.'
        );

        $contents = file_get_contents($path);

        $this->assertStringContainsString(
            'Powered by',
            $contents,
            "'Powered by VenQore' attribution missing from {$relativeViewPath}."
        );

        $this->assertStringContainsString(
            self::EXPECTED_URL,
            $contents,
            "The viral-loop link in {$relativeViewPath} must point at "
            . self::EXPECTED_URL . " exactly.\n"
            . 'Dropping utm_source silently breaks referral attribution — the '
            . 'documents still look correct, so nobody notices.'
        );
    }

    /** @test */
    public function receipt_html_invoice_view_contains_powered_by_venqore_link_with_utm()
    {
        $this->assertViewCarriesViralFooter('invoices/receipt.blade.php');
    }

    /** @test */
    public function pdf_receipt_export_view_contains_powered_by_venqore_link_with_utm()
    {
        $this->assertViewCarriesViralFooter('pdf/receipt.blade.php');
    }

    /** @test */
    public function tools_pdf_invoice_export_view_contains_powered_by_venqore_link_with_utm()
    {
        $this->assertViewCarriesViralFooter('tools/pdf/invoice.blade.php');
    }

    /**
     * ADDED during reconstruction.
     *
     * The original covered three surfaces. There are ten templates carrying
     * this footer today, and a new export surface added without it would be an
     * unnoticed hole in the acquisition loop. This sweeps every one.
     *
     * @test
     */
    public function every_customer_facing_export_template_carries_the_viral_footer()
    {
        $surfaces = [
            'invoices/receipt.blade.php',
            'pdf/receipt.blade.php',
            'pdf/sales-order.blade.php',
            'tools/pdf/invoice.blade.php',
            'tools/pdf/credit-note.blade.php',
            'tools/pdf/packing-slip.blade.php',
            'tools/pdf/purchase-order.blade.php',
            'tools/pdf/quotation.blade.php',
            'tools/pdf/quote.blade.php',
            'tools/pdf/receipt.blade.php',
        ];

        $missing = [];

        foreach ($surfaces as $surface) {
            $path = resource_path('views/' . $surface);

            if (! is_file($path)) {
                $missing[] = "{$surface} (template not found)";
                continue;
            }

            if (! str_contains(file_get_contents($path), self::EXPECTED_URL)) {
                $missing[] = $surface;
            }
        }

        $this->assertSame(
            [],
            $missing,
            "Customer-facing export templates without the tracked VenQore footer:\n  - "
            . implode("\n  - ", $missing)
        );
    }
}
