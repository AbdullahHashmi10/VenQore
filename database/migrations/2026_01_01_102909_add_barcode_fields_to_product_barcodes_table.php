<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add additional fields to product_barcodes table if they don't exist
        if (Schema::hasTable('product_barcodes')) {
            Schema::table('product_barcodes', function (Blueprint $table) {
                if (!Schema::hasColumn('product_barcodes', 'barcode_type')) {
                    $table->string('barcode_type')->default('EAN13')->after('barcode'); // EAN13, UPC, CODE128, etc.
                }
                if (!Schema::hasColumn('product_barcodes', 'is_primary')) {
                    $table->boolean('is_primary')->default(false)->after('barcode_type');
                }
                if (!Schema::hasColumn('product_barcodes', 'description')) {
                    $table->string('description')->nullable()->after('is_primary');
                }
                if (!Schema::hasColumn('product_barcodes', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('product_barcodes')) {
            Schema::table('product_barcodes', function (Blueprint $table) {
                $table->dropColumn(['barcode_type', 'is_primary', 'description', 'is_active']);
            });
        }
    }
};


