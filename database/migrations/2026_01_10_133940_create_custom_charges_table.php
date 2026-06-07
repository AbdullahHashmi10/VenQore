<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('custom_charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('default_amount', 10, 2)->default(0);
            $table->boolean('is_percentage')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed default charges
        DB::table('custom_charges')->insert([
            ['id' => Str::uuid()->toString(), 'name' => 'Delivery', 'description' => 'Home delivery fee', 'default_amount' => 100, 'is_percentage' => false, 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Gift Wrapping', 'description' => 'Premium gift packaging', 'default_amount' => 50, 'is_percentage' => false, 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Rush Order', 'description' => 'Express processing fee', 'default_amount' => 10, 'is_percentage' => true, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_charges');
    }
};


