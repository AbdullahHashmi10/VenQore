<?php

namespace Tests\Feature;

use App\Models\Sale;
use App\Models\SaleItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Collection;
use Tests\TestCase;

class ReceiptDocumentRenderingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // These tests must render entirely from supplied fixtures, never a database.
        config(['database.default' => 'audit-no-database', 'cache.default' => 'array']);
    }

    private function fixture(int $count = 1): Sale
    {
        $sale = (new Sale())->setDateFormat('Y-m-d H:i:s')->forceFill([
            'id' => 'audit-receipt', 'reference_number' => 'AUDIT-001',
            'invoice_total' => 108 * $count, 'total' => 999, 'subtotal_gross' => 100 * $count,
            'total_item_discounts' => 10 * $count, 'total_tax' => 18 * $count, 'net_sales' => 90 * $count,
            'created_at' => '2026-09-30 12:00:00', 'payment_status' => 'unpaid',
            'is_fbr_reported' => false, 'warehouse_name' => 'Main branch',
        ]);
        $items = new Collection();
        for ($i = 0; $i < $count; $i++) {
            $item = (new SaleItem())->setDateFormat('Y-m-d H:i:s')->forceFill(['quantity' => 2, 'unit_price' => 50, 'line_total' => 108,
                'net_amount' => 90, 'discount_amount' => 10, 'tax_amount' => 18,
                'item_name' => 'Audit product '.($i + 1), 'tax_rate' => 20, 'gross_amount' => 100,
                'product_name' => 'Audit product '.($i + 1)]);
            $item->setRelation('product', null)->setRelation('productVariant', null);
            $items->push($item);
        }
        return $sale->setRelation('items', $items)->setRelation('payments', new Collection())
            ->setRelation('customer', null)->setRelation('user', null);
    }

    private function settings(): array
    {
        return ['business_name' => 'Audit Store', 'currency_symbol' => 'AED',
            'decimal_places' => 2, 'fbr_integration' => '1'];
    }

    public function test_receipt_uses_recorded_totals_and_does_not_invent_fbr_verification(): void
    {
        $html = view('pdf.receipt', ['sale' => $this->fixture(), 'settings' => $this->settings()])->render();
        $this->assertStringContainsString('108.00', $html);
        $this->assertStringNotContainsString('999.00', $html);
        $this->assertStringNotContainsString('FBR REPORTED', $html);
        $this->assertStringNotContainsString('api.qrserver.com', $html);
        $this->assertStringContainsString('Audit product 1', $html);
    }

    public function test_public_receipt_does_not_treat_unpaid_sale_as_paid(): void
    {
        $sale = $this->fixture();
        $html = view('invoices.public_receipt', ['sale' => $sale, 'store' => null,
            'customer' => null, 'items' => $sale->items, 'settings' => $this->settings()])->render();
        $this->assertStringContainsString('UNPAID', $html);
        $this->assertStringContainsString('Balance Due', $html);
        $this->assertStringNotContainsString('999.00', $html);
    }

    public function test_long_receipt_generates_a_real_pdf_without_database_or_remote_images(): void
    {
        $pdf = Pdf::loadView('pdf.receipt', ['sale' => $this->fixture(65), 'settings' => $this->settings()])
            ->setOptions(['isRemoteEnabled' => false])->output();
        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertGreaterThan(5000, strlen($pdf));
        file_put_contents(sys_get_temp_dir().'/venqore-print-audit.pdf', $pdf);
    }

    public function test_customer_invoice_has_store_identity_and_balance(): void
    {
        $sale = $this->fixture();
        $html = view('v3.invoices.pdf', ['sale' => $sale, 'items' => $sale->items,
            'settings' => $this->settings(), 'paid' => 0, 'showMargin' => false,
            'isReturn' => false, 'primaryColor' => '#123456'])->render();
        $this->assertStringContainsString('Audit Store', $html);
        $this->assertStringNotContainsString('>Margin<', $html);
        $this->assertStringContainsString('Balance Due', $html);
    }
    public function test_email_receipt_renders_without_ambient_tenant_settings(): void
    {
        $html = (string) app(\Illuminate\Mail\Markdown::class)->render('emails.sales.receipt', [
            'sale' => $this->fixture(), 'settings' => $this->settings(),
        ]);
        $this->assertStringContainsString('Audit Store', $html);
        $this->assertStringContainsString('108.00', $html);
        $this->assertStringNotContainsString('999.00', $html);
    }

    public function test_verified_fbr_qr_is_embedded_locally(): void
    {
        $sale = $this->fixture();
        $sale->is_fbr_reported = true;
        $sale->fbr_invoice_number = 'ACTUAL-FBR-123';
        $sale->fbr_qr_data = 'ACTUAL-FBR-123';
        $html = view('pdf.receipt', ['sale' => $sale, 'settings' => $this->settings()])->render();
        $this->assertStringContainsString('ACTUAL-FBR-123', $html);
        $this->assertStringContainsString('data:image/svg+xml', $html);
        $pdf = Pdf::loadHTML($html)->setOptions(['isRemoteEnabled' => false])->output();
        $this->assertStringStartsWith('%PDF-', $pdf);
    }

    public function test_order_and_proposal_print_templates_exist_and_render(): void
    {
        $document = $this->fixture();
        $document->order_number = 'ORDER-1';
        $document->order_date = '2026-09-30';
        $document->total_amount = 108;
        foreach ($document->items as $item) {
            $item->quantity_requested = 2;
            $item->subtotal = 108;
            $item->total = 108;
        }
        foreach (['pdf.sales-order', 'proposals.print'] as $view) {
            $html = view($view, ['order' => $document, 'proposal' => $document, 'settings' => $this->settings()])->render();
            $this->assertStringContainsString('108.00', $html);
            $this->assertStringContainsString('Audit Store', $html);
        }
    }

}
