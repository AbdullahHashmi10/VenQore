<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'delivery_charge')) {
                $table->decimal('delivery_charge', 15, 4)->default(0)->after('tax');
            }
            if (!Schema::hasColumn('sales', 'extra_charge_value')) {
                $table->decimal('extra_charge_value', 15, 4)->default(0)->after('delivery_charge');
            }
            if (!Schema::hasColumn('sales', 'extra_charge_label')) {
                $table->string('extra_charge_label')->nullable()->after('extra_charge_value');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['delivery_charge', 'extra_charge_value', 'extra_charge_label']);
        });
    }
};
