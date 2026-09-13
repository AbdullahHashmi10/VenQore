<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('platforms')) {
            Schema::create('platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->enum('type', ['subscription', 'ltd', 'hybrid'])->default('subscription');
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable();
            $table->timestamps();

            $table->index(['slug', 'is_active']);
        });
        }

        if (DB::table('platforms')->count() === 0) {
            // Seed
            DB::table('platforms')->insert([
            ['name' => 'Website',  'slug' => 'website',  'type' => 'subscription', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'AppSumo',  'slug' => 'appsumo',  'type' => 'ltd',          'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platforms');
    }
};
