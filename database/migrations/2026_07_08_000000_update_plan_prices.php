<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update subscription plans
        DB::table('plans')->where('slug', 'starter')->update([
            'price_monthly' => 36.00,
            'price_annual' => 360.00,
        ]);

        DB::table('plans')->where('slug', 'growth')->update([
            'price_monthly' => 63.00,
            'price_annual' => 630.00,
        ]);

        DB::table('plans')->where('slug', 'business')->update([
            'price_monthly' => 129.00,
            'price_annual' => 1290.00,
        ]);

        // Update LTD plans
        DB::table('plans')->where('slug', 'ltd_1')->update([
            'price_lifetime' => 79.00,
        ]);

        DB::table('plans')->where('slug', 'ltd_2')->update([
            'price_lifetime' => 199.00,
        ]);

        DB::table('plans')->where('slug', 'ltd_3')->update([
            'price_lifetime' => 399.00,
        ]);
    }

    public function down(): void
    {
        // Revert to original migration seed values
        DB::table('plans')->where('slug', 'starter')->update([
            'price_monthly' => 19.00,
            'price_annual' => null,
        ]);

        DB::table('plans')->where('slug', 'growth')->update([
            'price_monthly' => 39.00,
            'price_annual' => null,
        ]);

        DB::table('plans')->where('slug', 'business')->update([
            'price_monthly' => 79.00,
            'price_annual' => null,
        ]);

        DB::table('plans')->where('slug', 'ltd_1')->update([
            'price_lifetime' => 49.00,
        ]);

        DB::table('plans')->where('slug', 'ltd_2')->update([
            'price_lifetime' => 99.00,
        ]);

        DB::table('plans')->where('slug', 'ltd_3')->update([
            'price_lifetime' => 179.00,
        ]);
    }
};
