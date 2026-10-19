<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Loyalty on online orders belongs only to customers who signed in with a verified email code.
        Schema::table('commerce_orders', function (Blueprint $t) {
            $t->boolean('loyalty_member')->default(false)->after('party_id');
            $t->unsignedInteger('loyalty_points_used')->default(0)->after('loyalty_member');
            $t->decimal('loyalty_discount', 12, 2)->default(0)->after('loyalty_points_used');
            $t->boolean('loyalty_refunded')->default(false)->after('loyalty_discount');
        });
    }

    public function down(): void
    {
        Schema::table('commerce_orders', fn (Blueprint $t) => $t->dropColumn(['loyalty_member', 'loyalty_points_used', 'loyalty_discount', 'loyalty_refunded']));
    }
};
