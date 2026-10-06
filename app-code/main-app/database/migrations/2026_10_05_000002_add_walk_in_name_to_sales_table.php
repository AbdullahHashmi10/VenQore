<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Walk-in sales have no customer record. The cashier may still type a name
 * (to call the person in a rush); it is only a label on the sale — it never
 * creates or matches a customer. Empty means "Walk-in Customer".
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'walk_in_name')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->string('walk_in_name', 120)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'walk_in_name')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('walk_in_name');
            });
        }
    }
};
