<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Check if settings table exists first
        if (Schema::hasTable('settings')) {
            DB::table('settings')->insertOrIgnore([
                ['key' => 'currency_symbol', 'value' => 'Rs', 'group' => 'general', 'created_at' => now(), 'updated_at' => now()],
                ['key' => 'currency_code', 'value' => 'PKR', 'group' => 'general', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', ['currency_symbol', 'currency_code'])->delete();
    }
};


