<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('commerce_orders', function (Blueprint $t) {
            $t->string('customer_email', 150)->nullable();
            $t->timestamp('purged_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('commerce_orders', fn (Blueprint $t) => $t->dropColumn(['customer_email', 'purged_at']));
    }
};
