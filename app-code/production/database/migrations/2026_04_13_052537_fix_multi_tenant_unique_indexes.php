<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique('sales_reference_number_unique');
            $table->unique(['tenant_id', 'reference_number']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique('invoices_invoice_number_unique');
            $table->unique(['tenant_id', 'invoice_number']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique('product_variants_sku_unique');
            $table->unique(['tenant_id', 'sku']);
        });

        Schema::table('product_barcodes', function (Blueprint $table) {
            $table->dropUnique('product_barcodes_barcode_unique');
            $table->unique(['tenant_id', 'barcode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'reference_number']);
            $table->unique('reference_number');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'invoice_number']);
            $table->unique('invoice_number');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'sku']);
            $table->unique('sku');
        });

        Schema::table('product_barcodes', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'barcode']);
            $table->unique('barcode');
        });
    }
};
