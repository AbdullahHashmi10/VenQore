<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FOH plan §2.8. Which table / ticket a receipt belongs to, and which channel
 * it sold through (dine_in | takeaway | delivery). Both nullable: retail sales
 * and every sale that predates FOH carry neither.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'occupancy_id')) {
                $table->unsignedBigInteger('occupancy_id')->nullable()->index();
            }
            if (!Schema::hasColumn('sales', 'order_type')) {
                $table->string('order_type', 16)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'order_type')) $table->dropColumn('order_type');
            if (Schema::hasColumn('sales', 'occupancy_id')) {
                $table->dropIndex(['occupancy_id']);
                $table->dropColumn('occupancy_id');
            }
        });
    }
};
