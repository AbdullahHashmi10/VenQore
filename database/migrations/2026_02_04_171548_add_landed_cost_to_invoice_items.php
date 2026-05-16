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
        if (!Schema::hasColumn('invoice_items', 'base_unit_cost')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->decimal('base_unit_cost', 20, 2)->after('unit_price')->default(0); // Vendor Price
                $table->decimal('effective_unit_cost', 20, 2)->after('base_unit_cost')->default(0); // Real Cost (Vendor + Extra)
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            //
        });
    }
};
