<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Policy: when a business has set opening hours, checkout closes outside them unless the merchant opts in to advance orders.
        Schema::table('storefronts', fn (Blueprint $t) => $t->boolean('orders_outside_hours')->default(false)->after('intake_paused'));
    }

    public function down(): void
    {
        Schema::table('storefronts', fn (Blueprint $t) => $t->dropColumn('orders_outside_hours'));
    }
};
