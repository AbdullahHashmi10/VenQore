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
            // Check indexes manually or just try to add them
        });

        // Use raw SQL for idempotent index creation to be 100% sure on MySQL
        try {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('created_at', 'sales_created_at_index');
            });
        } catch (\Exception $e) {}

        try {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('status', 'sales_status_index');
            });
        } catch (\Exception $e) {}

        try {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('payment_status', 'sales_payment_status_index');
            });
        } catch (\Exception $e) {}
        
        // Also add index to payments for speed
        try {
            Schema::table('payments', function (Blueprint $table) {
                 $table->index('created_at', 'payments_created_at_index');
            });
        } catch (\Exception $e) {}
        
        // And purchases
        if (Schema::hasTable('purchases')) {
            try {
                Schema::table('purchases', function (Blueprint $table) {
                    $table->index('created_at', 'purchases_created_at_index');
                });
            } catch (\Exception $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status']);
            $table->dropIndex(['payment_status']);
        });
        
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
        
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropIndex(['created_at']);
            });
        }
    }
};
