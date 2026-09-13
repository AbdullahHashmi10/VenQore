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
        if (Schema::hasTable('kitchen_orders') && !Schema::hasTable('work_orders')) {
            Schema::rename('kitchen_orders', 'work_orders');
        }

        if (Schema::hasTable('work_orders') && !Schema::hasColumn('work_orders', 'kind')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->string('kind', 32)->default('kitchen')->after('tenant_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('work_orders') && Schema::hasColumn('work_orders', 'kind')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->dropColumn('kind');
            });
        }

        if (Schema::hasTable('work_orders') && !Schema::hasTable('kitchen_orders')) {
            Schema::rename('work_orders', 'kitchen_orders');
        }
    }
};
