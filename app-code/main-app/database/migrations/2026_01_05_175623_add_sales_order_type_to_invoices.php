<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // This is just a logical migration to document that 'sales_order' is a valid type in the 'type' column.
        // Since 'type' is a string column, we don't strictly need to modify the schema unless it was an enum.
        // However, if we want to add specific columns for sales orders (like delivery_date), we can do it here.

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'due_date')) {
                $table->date('due_date')->nullable(); // Can serve as delivery date
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // $table->dropColumn('due_date'); // Don't drop it as it might be used by other types
        });
    }
};


