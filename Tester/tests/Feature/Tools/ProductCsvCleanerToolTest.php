<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\ProductCsvCleanerService;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProductCsvCleanerToolTest extends TestCase
{
    private const VALID_GTIN13 = '0012345678905'; // valid EAN-13 check digit

    public function test_page_loads(): void
    {
        $this->get(route('tools.csv-cleaner'))->assertOk();
    }

    public function test_parsing_malformed_price_normalizes_it(): void
    {
        $csv = "Name,SKU,Price\nWidget,SKU-1,\$19.99";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $preview = $response->json('preview');
        $this->assertCount(1, $preview);
        $this->assertSame(19.99, $preview[0]['price_clean']);
        $this->assertContains('malformed_price', $preview[0]['issues']);
    }

    public function test_thousands_separator_price_normalizes_correctly(): void
    {
        $csv = "Name,SKU,Price\nWidget,SKU-1,\"1,200.00\"";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertEquals(1200.0, $preview[0]['price_clean']);
    }

    public function test_duplicate_sku_detection(): void
    {
        $csv = "Name,SKU,Price\nWidget A,SKU-1,10.00\nWidget B,SKU-1,12.00";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertContains('duplicate_sku', $preview[0]['issues']);
        $this->assertContains('duplicate_sku', $preview[1]['issues']);
        $this->assertSame(2, $response->json('summary.issues_by_type.duplicate_sku'));
    }

    public function test_missing_sku_detection(): void
    {
        $csv = "Name,SKU,Price\nWidget A,,10.00";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv, 'generate_missing_skus' => false]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertContains('missing_sku', $preview[0]['issues']);
        $this->assertSame('', $preview[0]['sku']);
    }

    public function test_missing_sku_auto_generation_when_opted_in(): void
    {
        $csv = "Name,SKU,Price\nWidget A,,10.00";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv, 'generate_missing_skus' => true]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertNotSame('', $preview[0]['sku']);
        $this->assertTrue($preview[0]['sku_generated']);
    }

    public function test_invalid_barcode_detection_reuses_barcode_service(): void
    {
        // Last digit deliberately wrong for a valid GTIN-13 check digit.
        $invalidGtin = '0012345678901';
        $csv = "Name,SKU,Price,Barcode\nWidget,SKU-1,10.00,{$invalidGtin}";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertContains('invalid_barcode', $preview[0]['issues']);
    }

    public function test_valid_barcode_is_not_flagged(): void
    {
        $csv = "Name,SKU,Price,Barcode\nWidget,SKU-1,10.00," . self::VALID_GTIN13;

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $preview = $response->json('preview');
        $this->assertNotContains('invalid_barcode', $preview[0]['issues']);
    }

    public function test_row_cap_enforced_with_clear_error(): void
    {
        $rows = ["Name,SKU,Price"];
        for ($i = 0; $i < ProductCsvCleanerService::MAX_ROWS + 1; $i++) {
            $rows[] = "Widget {$i},SKU-{$i},9.99";
        }
        $csv = implode("\n", $rows);

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertStatus(422);
        $this->assertStringContainsString('5000', $response->json('errors.0'));
    }

    public function test_download_endpoint_returns_valid_csv(): void
    {
        $csv = "Name,SKU,Price\nWidget,SKU-1,\$19.99";

        $response = $this->post(route('tools.csv-cleaner.download'), ['csv_text' => $csv]);

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('19.99', $response->getContent());
        $this->assertStringContainsString('SKU-1', $response->getContent());
    }

    public function test_file_upload_mode_is_supported(): void
    {
        $csv = "Name,SKU,Price\nWidget,SKU-1,9.99";
        $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

        $response = $this->post(route('tools.csv-cleaner.parse'), [
            'file' => $file,
        ], ['Accept' => 'application/json']);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    }

    public function test_empty_rows_are_skipped_not_flagged(): void
    {
        $csv = "Name,SKU,Price\nWidget,SKU-1,9.99\n,,\n";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $this->assertSame(1, $response->json('summary.rows_skipped_empty'));
    }

    public function test_tool_is_free_and_ungated(): void
    {
        // No auth middleware, no email-lead requirement to get a JSON preview.
        $csv = "Name,SKU,Price\nWidget,SKU-1,9.99";

        $response = $this->postJson(route('tools.csv-cleaner.parse'), ['csv_text' => $csv]);

        $response->assertOk();
        $response->assertJson(['success' => true]);
    }
}
