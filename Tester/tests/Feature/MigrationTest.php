<?php

namespace Tests\Feature;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

class MigrationTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_migration_execute_imports_parties_products_sales_and_purchases(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);

        // The Vyapar importer reads a customer's Vyapar BACKUP FILE, which is a
        // SQLite database. This is NOT a violation of the MySQL-only policy in
        // CLAUDE.md — that policy governs VenQore's own database. Reading a
        // third-party backup still needs the pdo_sqlite driver present.
        //
        // Fail with the actual remedy rather than letting PDO raise a bare
        // "could not find driver", and do NOT markTestSkipped here: skipping
        // would turn a genuinely broken product feature (Vyapar import is dead
        // on any host without this extension, including production) into a
        // silent green.
        $this->assertTrue(
            extension_loaded('pdo_sqlite') && in_array('sqlite', \PDO::getAvailableDrivers(), true),
            "The pdo_sqlite extension is not loaded, so the Vyapar import cannot open a customer's "
                . "backup file. This is a real product outage on any host configured this way, not a "
                . "test-only problem.\n\n"
                . "Fix: enable BOTH lines in the php.ini of the binary that runs the suite, then restart it:\n"
                . "    extension=pdo_sqlite\n"
                . "    extension=sqlite3\n\n"
                . "Candidate php.ini locations on this machine:\n"
                . "    C:\\Users\\PC\\AppData\\Roaming\\Local\\lightning-services\\php-8.2.23+0\\bin\\win64\\php.ini\n"
                . "    E:\\Software\\Xampp\\php\\php.ini\n\n"
                . "Confirm with: php -m | findstr sqlite\n"
                . "Loaded php.ini: " . (php_ini_loaded_file() ?: 'none')
        );

        // Define temp SQLite file path
        $dbPath = Storage::disk('local')->path('temp_migration/test_migration.sqlite');
        @mkdir(dirname($dbPath), 0755, true);
        @unlink($dbPath);

        // Build temporary Vyapar-style SQLite database
        $sqlite = new \PDO("sqlite:" . $dbPath);
        $sqlite->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // 1. Create table Party
        $sqlite->exec("CREATE TABLE Party (party_id TEXT PRIMARY KEY, name TEXT, phone TEXT, balance REAL)");
        $sqlite->exec("INSERT INTO Party (party_id, name, phone, balance) VALUES ('party1', 'Migrated Supplier', '11223344', 500.0)");
        $sqlite->exec("INSERT INTO Party (party_id, name, phone, balance) VALUES ('party2', 'Migrated Customer', '55667788', -200.0)");

        // 2. Create table Item (Product)
        $sqlite->exec("CREATE TABLE Item (product_id TEXT PRIMARY KEY, name TEXT, sku TEXT, price REAL)");
        $sqlite->exec("INSERT INTO Item (product_id, name, sku, price) VALUES ('prod1', 'Migrated Product', 'SKU-MIG-1', 12.5)");

        // 3. Create table Sale
        $sqlite->exec("CREATE TABLE Sale (invoice_id TEXT PRIMARY KEY, customer_id TEXT, invoice_no TEXT, date TEXT, total REAL)");
        $sqlite->exec("INSERT INTO Sale (invoice_id, customer_id, invoice_no, date, total) VALUES ('sale1', 'party2', 'INV-001', '2026-07-08', 12.5)");

        // 4. Create table SaleItem
        $sqlite->exec("CREATE TABLE SaleItem (invoice_id TEXT, product_id TEXT, qty REAL, rate REAL)");
        $sqlite->exec("INSERT INTO SaleItem (invoice_id, product_id, qty, rate) VALUES ('sale1', 'prod1', 1, 12.5)");

        // 5. Create table Purchase (Bill)
        $sqlite->exec("CREATE TABLE Purchase (purchase_id TEXT PRIMARY KEY, supplier_id TEXT, bill_no TEXT, date TEXT, total REAL)");
        $sqlite->exec("INSERT INTO Purchase (purchase_id, supplier_id, bill_no, date, total) VALUES ('purch1', 'party1', 'BILL-001', '2026-07-08', 25.0)");

        // 6. Create table PurchaseItem
        $sqlite->exec("CREATE TABLE PurchaseItem (purchase_id TEXT, product_id TEXT, qty REAL, cost REAL)");
        $sqlite->exec("INSERT INTO PurchaseItem (purchase_id, product_id, qty, cost) VALUES ('purch1', 'prod1', 2, 12.5)");

        // Close PDO connection
        $sqlite = null;

        // Perform the POST request to migrate
        // In the test context, actingAsTenantUser already grants superadmin/owner permission bypass
        $response = $this->post(route('store.legacy.admin.migration.execute', ['store_slug' => $tenant->slug]), [
            'path' => 'temp_migration/test_migration.sqlite',
            'options' => []
        ]);

        $response->assertJsonFragment([
            'success' => true
        ]);

        // Clean up sqlite file
        @unlink($dbPath);

        // Verify parties imported
        $this->assertDatabaseHas('parties', [
            'name' => 'Migrated Supplier',
            'type' => 'supplier',
            'phone' => '11223344',
        ]);
        $this->assertDatabaseHas('parties', [
            'name' => 'Migrated Customer',
            'type' => 'customer',
            'phone' => '55667788',
        ]);

        // Verify products imported
        $this->assertDatabaseHas('products', [
            'name' => 'Migrated Product',
            'sku' => 'SKU-MIG-1',
            'price' => 12.5,
        ]);

        // Verify Sales imported (with correct reference_number column)
        $sale = Sale::first();
        $this->assertNotNull($sale);
        $this->assertEquals('INV-001', $sale->reference_number);
        $this->assertEquals(12.5, $sale->total);

        // Verify SaleItem imported
        $saleItem = SaleItem::first();
        $this->assertNotNull($saleItem);
        $this->assertEquals($sale->id, $saleItem->sale_id);
        $this->assertEquals(1, $saleItem->quantity);
        $this->assertEquals(12.5, $saleItem->unit_price);

        // Verify PurchaseOrder imported (with correct reference_number column)
        $po = PurchaseOrder::first();
        $this->assertNotNull($po);
        $this->assertEquals('BILL-001', $po->reference_number);
        $this->assertEquals(25.0, $po->total_amount);

        // Verify PurchaseOrderItem imported (with correct total_cost column)
        $poItem = PurchaseOrderItem::first();
        $this->assertNotNull($poItem);
        $this->assertEquals($po->id, $poItem->purchase_order_id);
        $this->assertEquals(2, $poItem->quantity);
        $this->assertEquals(12.5, $poItem->unit_cost);
        $this->assertEquals(25.0, $poItem->total_cost);
    }
}
