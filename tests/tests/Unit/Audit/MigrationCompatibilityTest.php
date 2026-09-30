<?php

namespace Tests\Unit\Audit;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Feature\VenQoreTestCase;

class MigrationCompatibilityTest extends VenQoreTestCase
{
    /**
     * Verify that MariaDB / MySQL accepts CHAR(36) column modifications without syntax error.
     */
    public function test_expenses_purchase_id_column_compatibility(): void
    {
        $driver = DB::connection()->getDriverName();
        $this->assertContains($driver, ['mysql', 'mariadb', 'sqlite']);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            // Verify execution of the exact ALTER TABLE statement on amd_pos_test
            DB::statement('ALTER TABLE expenses MODIFY purchase_id CHAR(36) NULL');

            // Verify column definition in information_schema
            $dbName = config('database.connections.' . config('database.default') . '.database');
            $colType = DB::table('information_schema.columns')
                ->where('table_schema', $dbName)
                ->where('table_name', 'expenses')
                ->where('column_name', 'purchase_id')
                ->value('DATA_TYPE');

            $this->assertEquals('char', strtolower($colType));
        } else {
            $this->assertTrue(Schema::hasColumn('expenses', 'purchase_id'));
        }
    }

    /**
     * Verify forward migration ensure_sales_tenant_idempotency_index and its non-destructive rollback.
     */
    public function test_sales_tenant_idempotency_migration_and_non_destructive_rollback(): void
    {
        $migration = require base_path('database/migrations/2026_09_22_000001_ensure_sales_tenant_idempotency_index.php');

        // Run up()
        $migration->up();
        $this->assertTrue(Schema::hasColumn('sales', 'idempotency_key'));

        $indexes = DB::select("SHOW INDEX FROM sales WHERE Key_name = 'sales_tenant_idempotency_unique'");
        $this->assertNotEmpty($indexes, 'sales_tenant_idempotency_unique index must exist after migration up.');

        // Run down() — verify it is non-destructive no-op
        $migration->down();
        $this->assertTrue(Schema::hasColumn('sales', 'idempotency_key'), 'idempotency_key column must NOT be dropped by rollback.');

        $indexesAfterDown = DB::select("SHOW INDEX FROM sales WHERE Key_name = 'sales_tenant_idempotency_unique'");
        $this->assertNotEmpty($indexesAfterDown, 'sales_tenant_idempotency_unique index must NOT be dropped by non-destructive rollback.');
    }
}
