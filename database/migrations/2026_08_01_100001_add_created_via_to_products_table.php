<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Traceability for products the system created on the user's behalf.
 *
 * AI Scan can create a catalogue product from a line the user confirmed as new.
 * That is convenient, but a misread name ("Coca Cala 1.5L") then lives in the
 * catalogue forever and quietly splits reporting across two products.
 *
 * Recording HOW a product was created makes those reviewable — the Products
 * screen can filter to "created by AI Scan" so they can be renamed or merged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'created_via')) {
                // 'ai_scan' | 'import' | 'woocommerce' | null (created manually)
                $table->string('created_via', 32)->nullable()->after('name');
                $table->index(['tenant_id', 'created_via'], 'products_created_via_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'created_via')) {
                $table->dropIndex('products_created_via_idx');
                $table->dropColumn('created_via');
            }
        });
    }
};
