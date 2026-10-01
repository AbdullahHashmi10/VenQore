<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Expert Manufacturing Features:
     * 1. Recipe Version Control
     * 2. Recipe Media (SOP/Training)
     * 3. Production Logs (Batch Traceability)
     * 4. Brand Support (Ghost Kitchen Mode)
     */
    public function up(): void
    {
        // 1. Add version control fields to recipes
        if (!Schema::hasColumn('recipes', 'parent_recipe_id')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->foreignUuid('parent_recipe_id')->nullable()->constrained('recipes')->nullOnDelete()->after('id');
                $table->integer('version_number')->default(1)->after('parent_recipe_id');
            });
        }

        // 2. Recipe Media (Training Videos, PDFs, Images per step)
        if (!Schema::hasTable('recipe_media')) {
            Schema::create('recipe_media', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('recipe_id')->constrained('recipes')->onDelete('cascade');
                $table->enum('type', ['video', 'image', 'pdf', 'youtube'])->default('image');
                $table->string('url');
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->integer('step_number')->nullable(); // Which step this media is for
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 3. Production Logs (Batch Traceability)
        if (!Schema::hasTable('production_logs')) {
            Schema::create('production_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('recipe_id')->constrained('recipes')->onDelete('cascade');
                $table->string('batch_code')->unique(); // e.g., "BATCH-2026-001"
                $table->decimal('quantity_produced', 10, 2);
                $table->string('produced_by')->nullable(); // User or station
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('produced_at');
                $table->date('expiry_date')->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['completed', 'partial', 'failed'])->default('completed');
                $table->decimal('actual_cost', 12, 2)->nullable(); // Actual vs estimated
                $table->timestamps();
            });
        }

        // 4. Production Log Ingredients (Which lots/batches were used)
        if (!Schema::hasTable('production_log_ingredients')) {
            Schema::create('production_log_ingredients', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('production_log_id')->constrained('production_logs')->onDelete('cascade');
                $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
                $table->string('lot_number')->nullable(); // Traceability
                $table->decimal('quantity_used', 10, 3);
                $table->string('unit');
                $table->decimal('cost_at_time', 10, 2)->nullable();
                $table->timestamps();
            });
        }

        // 5. Add brand_id to recipes if brands table exists
        if (Schema::hasTable('brands') && !Schema::hasColumn('recipes', 'brand_id')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->foreignUuid('brand_id')->nullable()->after('is_active')->constrained('brands')->onDelete('set null');
            });
        }

        // 6. Add lot_number support to stock/purchases
        if (!Schema::hasColumn('stocks', 'lot_number')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->string('lot_number')->nullable()->after('quantity');
                $table->date('expiry_date')->nullable()->after('lot_number');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('stocks', 'lot_number')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->dropColumn(['lot_number', 'expiry_date']);
            });
        }

        if (Schema::hasColumn('recipes', 'brand_id')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->dropForeign(['brand_id']);
                $table->dropColumn('brand_id');
            });
        }

        if (Schema::hasColumn('recipes', 'parent_recipe_id')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->dropColumn(['parent_recipe_id', 'version_number']);
            });
        }

        Schema::dropIfExists('production_log_ingredients');
        Schema::dropIfExists('production_logs');
        Schema::dropIfExists('recipe_media');
    }
};


