<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'ai_title')) {
                $table->string('ai_title', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('products', 'ai_description_short')) {
                $table->text('ai_description_short')->nullable()->after('ai_title');
            }
            if (!Schema::hasColumn('products', 'ai_description_long')) {
                $table->text('ai_description_long')->nullable()->after('ai_description_short');
            }
            if (!Schema::hasColumn('products', 'ai_tags')) {
                $table->text('ai_tags')->nullable()->after('ai_description_long');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['ai_title', 'ai_description_short', 'ai_description_long', 'ai_tags']);
        });
    }
};
