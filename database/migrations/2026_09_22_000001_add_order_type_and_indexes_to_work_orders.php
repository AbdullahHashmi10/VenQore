<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('work_orders')) {
            Schema::table('work_orders', function (Blueprint $table) {
                if (!Schema::hasColumn('work_orders', 'order_type')) {
                    $table->string('order_type', 32)->nullable()->default('dine_in')->after('kind');
                }
            });

            // Index for bounded kitchenQueue() poll performance (tenant_id, status, fired_at)
            rescue(function () {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->index(['tenant_id', 'status', 'fired_at'], 'work_orders_tenant_status_fired_idx');
                });
            }, null, false);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('work_orders')) {
            rescue(function () {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->dropIndex('work_orders_tenant_status_fired_idx');
                });
            }, null, false);

            Schema::table('work_orders', function (Blueprint $table) {
                if (Schema::hasColumn('work_orders', 'order_type')) {
                    $table->dropColumn('order_type');
                }
            });
        }
    }
};
