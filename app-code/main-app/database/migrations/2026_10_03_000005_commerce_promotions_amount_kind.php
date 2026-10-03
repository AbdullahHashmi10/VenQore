<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('commerce_promotions', function (Blueprint $t) {
            $t->string('kind', 10)->default('percent')->after('code'); // percent | amount
            $t->decimal('amount', 12, 2)->nullable()->after('percent');
        });
    }

    public function down(): void
    {
        Schema::table('commerce_promotions', fn (Blueprint $t) => $t->dropColumn(['kind', 'amount']));
    }
};
