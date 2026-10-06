<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FOH plan §2.5. A made-to-order menu should not run "out of stock" because
 * nobody counted the ingredients. Default true so every existing product keeps
 * today's behaviour.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'track_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('track_stock')->default(true);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'track_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('track_stock');
            });
        }
    }
};
