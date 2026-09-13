<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_monthly_pkr', 10, 2)->nullable()->after('price_lifetime');
            $table->decimal('price_annual_pkr', 10, 2)->nullable()->after('price_monthly_pkr');
            $table->decimal('price_lifetime_pkr', 10, 2)->nullable()->after('price_annual_pkr');
            $table->text('checkout_url_usd')->nullable()->after('trial_days');
            $table->text('checkout_url_pkr')->nullable()->after('checkout_url_usd');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'price_monthly_pkr',
                'price_annual_pkr',
                'price_lifetime_pkr',
                'checkout_url_usd',
                'checkout_url_pkr'
            ]);
        });
    }
};
