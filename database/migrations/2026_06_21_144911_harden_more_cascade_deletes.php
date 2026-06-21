<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            // 1. stock_movements.product_id -> products.id [RESTRICT] (prevent deleting product if it has movements)
            if (Schema::hasTable('stock_movements') && Schema::hasColumn('stock_movements', 'product_id')) {
                Schema::table('stock_movements', function (Blueprint $table) {
                    try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `stock_movements`
                     ADD CONSTRAINT `stock_movements_product_id_foreign_restrict`
                     FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                     ON DELETE RESTRICT ON UPDATE CASCADE'
                );
            }

            // 2. manufacturing_logs.sale_id -> sales.id [RESTRICT] (prevent deleting sale if it has mfg log)
            if (Schema::hasTable('manufacturing_logs') && Schema::hasColumn('manufacturing_logs', 'sale_id')) {
                Schema::table('manufacturing_logs', function (Blueprint $table) {
                    try { $table->dropForeign(['sale_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `manufacturing_logs`
                     ADD CONSTRAINT `manufacturing_logs_sale_id_foreign_restrict`
                     FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
                     ON DELETE RESTRICT ON UPDATE CASCADE'
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            if (Schema::hasTable('stock_movements') && Schema::hasColumn('stock_movements', 'product_id')) {
                Schema::table('stock_movements', function (Blueprint $table) {
                    try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `stock_movements`
                     ADD CONSTRAINT `stock_movements_product_id_foreign`
                     FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                     ON DELETE CASCADE ON UPDATE CASCADE'
                );
            }

            if (Schema::hasTable('manufacturing_logs') && Schema::hasColumn('manufacturing_logs', 'sale_id')) {
                Schema::table('manufacturing_logs', function (Blueprint $table) {
                    try { $table->dropForeign(['sale_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `manufacturing_logs`
                     ADD CONSTRAINT `manufacturing_logs_sale_id_foreign`
                     FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
                     ON DELETE CASCADE ON UPDATE CASCADE'
                );
            }
        }
    }
};
