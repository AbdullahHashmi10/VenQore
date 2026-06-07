<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Check if account already exists to make migration idempotent
        $exists = DB::table('accounts')->where('code', '3999')->exists();
        
        if (!$exists) {
            DB::table('accounts')->insert([
                'id' => Str::uuid()->toString(),
                'name' => 'Historical Migration Variance',
                'code' => '3999',
                'type' => 'equity',
                'balance' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('accounts')->where('code', '3999')->delete();
    }
};
