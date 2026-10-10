<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('delivery_challans')) {
            Schema::create('delivery_challans', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->uuid('sale_id')->index();
                $table->uuid('warehouse_id')->nullable()->index();
                $table->string('challan_number', 40);
                $table->date('dispatched_on');
                $table->string('carrier_name', 100)->nullable();
                $table->string('tracking_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('stock_deducted')->default(false);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->unique(['tenant_id', 'challan_number']);
            });
        }

        if (!Schema::hasTable('delivery_challan_items')) {
            Schema::create('delivery_challan_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->uuid('delivery_challan_id')->index();
                $table->uuid('sale_item_id')->nullable()->index();
                $table->uuid('product_id')->index();
                $table->decimal('qty', 14, 4);
                $table->timestamps();
            });
        }

        // The batch the seller chose for a deliver-later line, applied at dispatch.
        if (Schema::hasTable('sale_items') && !Schema::hasColumn('sale_items', 'preferred_batch_id')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->uuid('preferred_batch_id')->nullable();
            });
        }

        // true = stock leaves the warehouse when goods are dispatched (deliver-later sale);
        // false = stock already left at sale time (today's behaviour).
        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'stock_at_dispatch')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->boolean('stock_at_dispatch')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'preferred_batch_id')) {
            Schema::table('sale_items', fn (Blueprint $t) => $t->dropColumn('preferred_batch_id'));
        }
        Schema::dropIfExists('delivery_challan_items');
        Schema::dropIfExists('delivery_challans');
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'stock_at_dispatch')) {
            Schema::table('sales', fn (Blueprint $t) => $t->dropColumn('stock_at_dispatch'));
        }
    }
};
