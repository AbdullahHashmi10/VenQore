<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('plans')->where('slug', 'counter')->count() === 0) {
            $websiteId = DB::table('platforms')->where('slug', 'website')->value('id')
                ?? DB::table('platforms')->value('id')
                ?? 1;

            DB::table('plans')->insert([
                'platform_id'       => $websiteId,
                'name'              => 'Counter',
                'slug'              => 'counter',
                'type'              => 'subscription',
                'price_monthly'     => 18.00,
                'price_annual'      => 180.00,
                'price_monthly_pkr' => 5000.00,
                'price_annual_pkr'  => 50000.00,
                'is_active'         => true,
                'sort_order'        => 0,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }

        (new \Database\Seeders\PlanFeatureMatrixSeeder())->run();
    }

    public function down(): void
    {
        DB::table('plans')->where('slug', 'counter')->delete();
    }
};
