<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Imports\PurchasesDataSheetImport;
use App\Imports\PurchasesImport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Row;

class PurchasesImportTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_can_import_purchase_rows_with_correct_columns(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        // Create a default warehouse
        $warehouse = Warehouse::create([
            'name' => 'Main Warehouse',
            'is_default' => true,
        ]);

        // Create a product
        $product = Product::create([
            'name' => 'Test Item',
            'sku' => 'SKU-TEST-123',
            'price' => 100.0,
            'cost_price' => 50.0,
        ]);

        // Mock Row
        $rowMock = $this->createMock(Row::class);
        $rowMock->method('getIndex')->willReturn(4);
        $rowMock->method('toArray')->willReturn([
            'INV-ABC-123',      // 0: invoice_number
            '2026-07-08',       // 1: date
            '1234567890',       // 2: supplier_phone
            'Test Supplier',    // 3: supplier_name
            'SKU-TEST-123',     // 4: product_sku
            'Test Item',        // 5: product_name
            15.0,               // 6: quantity
            60.0,               // 7: cost_price
            900.0,              // 8: total
        ]);

        // Instantiate and run the sheet import on the mocked row
        $parent = new PurchasesImport();
        $sheetImport = new PurchasesDataSheetImport([], $parent);
        $sheetImport->onRow($rowMock);

        // Assert Purchase was created in DB
        $purchase = Purchase::where('invoice_number', 'INV-ABC-123')->first();
        $this->assertNotNull($purchase, 'Purchase was not created.');
        $this->assertEquals($warehouse->id, $purchase->warehouse_id);
        $this->assertEquals(900.0, $purchase->total);

        // Assert PurchaseItem was created in DB with correct columns
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_id' => $product->id,
            'qty' => 15.0,
            'unit_cost' => 60.0,
            'line_total' => 900.0,
        ]);

        // Assert Supplier was created in DB
        $this->assertDatabaseHas('suppliers', [
            'phone' => '1234567890',
            'name' => 'Test Supplier',
        ]);
    }
}
