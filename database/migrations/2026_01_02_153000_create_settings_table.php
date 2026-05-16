<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general'); // pos, general, etc.
            $table->timestamps();
        });

        // Insert default setting
        DB::table('settings')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'key' => 'pos_auto_fill_cash',
            'value' => '0', // Disabled by default
            'group' => 'pos',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};


