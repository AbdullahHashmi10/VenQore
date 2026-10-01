<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sale_item_batches') && !Schema::hasColumn('sale_item_batches', 'tenant_id')) {
            Schema::table('sale_item_batches', function (Blueprint $t) {
                $t->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sale_item_batches') && Schema::hasColumn('sale_item_batches', 'tenant_id')) {
            Schema::table('sale_item_batches', function (Blueprint $t) {
                $t->dropColumn('tenant_id');
            });
        }
    }
};
