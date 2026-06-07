<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('plans')) {
            Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->enum('type', ['trial', 'subscription', 'ltd', 'enterprise'])->default('subscription');

            $table->decimal('price_monthly', 10, 2)->nullable();
            $table->decimal('price_annual', 10, 2)->nullable();
            $table->decimal('price_lifetime', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');

            $table->string('display_name', 150)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);

            $table->boolean('is_active')->default(true);
            $table->boolean('is_visible')->default(true);

            $table->boolean('is_ltd')->default(false);
            $table->integer('trial_days')->nullable();

            $table->text('internal_notes')->nullable();
            $table->timestamps();

            $table->index(['platform_id', 'is_active', 'sort_order']);
            $table->index('slug');
        });
        }

        if (DB::table('plans')->count() === 0) {
            // Seed
        $websiteId = DB::table('platforms')->where('slug', 'website')->value('id');
        $appsumoId = DB::table('platforms')->where('slug', 'appsumo')->value('id');

        DB::table('plans')->insert([
            ['platform_id' => $websiteId, 'slug' => 'trial',    'name' => 'Trial',    'type' => 'trial',        'price_monthly' => null,  'price_lifetime' => null,  'is_featured' => false, 'is_ltd' => false, 'is_active' => true, 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $websiteId, 'slug' => 'starter',  'name' => 'Starter',  'type' => 'subscription', 'price_monthly' => 19.00, 'price_lifetime' => null,  'is_featured' => false, 'is_ltd' => false, 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $websiteId, 'slug' => 'growth',   'name' => 'Growth',   'type' => 'subscription', 'price_monthly' => 39.00, 'price_lifetime' => null,  'is_featured' => true,  'is_ltd' => false, 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $websiteId, 'slug' => 'business', 'name' => 'Business', 'type' => 'subscription', 'price_monthly' => 79.00, 'price_lifetime' => null,  'is_featured' => false, 'is_ltd' => false, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $appsumoId, 'slug' => 'ltd_1',    'name' => 'LTD Solo',   'type' => 'ltd',          'price_monthly' => null,  'price_lifetime' => 49.00, 'is_featured' => false, 'is_ltd' => true,  'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $appsumoId, 'slug' => 'ltd_2',    'name' => 'LTD Growth', 'type' => 'ltd',          'price_monthly' => null,  'price_lifetime' => 99.00, 'is_featured' => false, 'is_ltd' => true,  'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['platform_id' => $appsumoId, 'slug' => 'ltd_3',    'name' => 'LTD Pro',    'type' => 'ltd',          'price_monthly' => null,  'price_lifetime' => 179.00, 'is_featured' => false, 'is_ltd' => true,  'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
