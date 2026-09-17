<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('dashboard_cards')) {
            Schema::table('dashboard_cards', function (Blueprint $t) {
                if (!Schema::hasColumn('dashboard_cards', 'spec')) {
                    $t->json('spec')->nullable()->after('args');
                }
                if (!Schema::hasColumn('dashboard_cards', 'definition_version')) {
                    $t->unsignedSmallInteger('definition_version')->nullable()->after('spec');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('dashboard_cards')) {
            Schema::table('dashboard_cards', function (Blueprint $t) {
                if (Schema::hasColumn('dashboard_cards', 'definition_version')) {
                    $t->dropColumn('definition_version');
                }
                if (Schema::hasColumn('dashboard_cards', 'spec')) {
                    $t->dropColumn('spec');
                }
            });
        }
    }
};
