<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. capabilities table
        Schema::create('capabilities', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->string('group_key', 32);
            $table->string('label', 120);
            $table->text('description')->nullable();
            $table->string('icon', 48)->nullable();
            $table->enum('kind', ['capability', 'limit', 'marketing']);
            $table->boolean('is_composable')->default(false);
            $table->json('requires')->nullable();
            $table->json('conflicts')->nullable();
            $table->json('provides_nav')->nullable();
            $table->json('provides_cards')->nullable();
            $table->json('provides_terms')->nullable();
            $table->string('min_plan', 24)->nullable();
            $table->enum('status', ['live', 'beta', 'soon'])->default('live');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 2. capability_search_index table
        Schema::create('capability_search_index', function (Blueprint $table) {
            $table->string('capability_key', 64)->primary();
            $table->string('name_norm', 191);
            $table->string('name_soundex', 32)->nullable();
            $table->string('name_metaphone', 64)->nullable();
            $table->text('aliases')->nullable();
            $table->text('tokens')->nullable();
            $table->binary('embedding')->nullable();
            $table->timestamps();
        });

        // Add FullText index to tokens (raw SQL to be safe on MariaDB 10.5)
        DB::statement('ALTER TABLE capability_search_index ADD FULLTEXT INDEX tokens_fulltext (tokens)');

        // 3. tenant_terminology table
        Schema::create('tenant_terminology', function (Blueprint $table) {
            $table->bigInteger('tenant_id')->unsigned();
            $table->string('term_key', 48);
            $table->string('singular', 80);
            $table->string('plural', 80);
            $table->bigInteger('updated_by')->unsigned()->nullable();
            $table->timestamps();

            $table->primary(['tenant_id', 'term_key']);
        });

        // 4. Add experience to tenants table
        if (Schema::hasTable('tenants') && !Schema::hasColumn('tenants', 'experience')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('experience', 40)->default('classic');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'experience')) {
                $table->dropColumn('experience');
            }
        });

        Schema::dropIfExists('tenant_terminology');
        Schema::dropIfExists('capability_search_index');
        Schema::dropIfExists('capabilities');
    }
};
