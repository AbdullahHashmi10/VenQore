<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('sales')) {
            if (!Schema::hasColumn('sales', 'idempotency_key')) {
                Schema::table('sales', function (Blueprint $table) {
                    $table->string('idempotency_key', 100)->nullable()->after('reference_number');
                });
            }

            $indexExists = false;
            try {
                $indexExists = Schema::hasIndex('sales', 'sales_tenant_idempotency_unique');
            } catch (\Throwable) {
                $indexes = DB::select("SHOW INDEX FROM sales WHERE Key_name = 'sales_tenant_idempotency_unique'");
                $indexExists = !empty($indexes);
            }

            if (!$indexExists) {
                Schema::table('sales', function (Blueprint $table) {
                    $table->unique(['tenant_id', 'idempotency_key'], 'sales_tenant_idempotency_unique');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * Rollback is intentionally non-destructive and a no-op. Because this forward
     * migration acts as a defensive repair to ensure consistency across heterogeneous
     * environments, ownership of pre-existing columns and indexes cannot be determined
     * safely. Dropping the column or unique constraint could cause data loss or break
     * foreign environments where the column or index was created by an earlier migration.
     */
    public function down(): void
    {
        // Intentionally non-destructive no-op.
    }
};
