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
        if (Schema::hasTable('staff_invitations')) {
            Schema::table('staff_invitations', function (Blueprint $table) {
                if (!Schema::hasColumn('staff_invitations', 'metadata')) {
                    $table->json('metadata')->nullable()->after('permissions');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('staff_invitations')) {
            Schema::table('staff_invitations', function (Blueprint $table) {
                if (Schema::hasColumn('staff_invitations', 'metadata')) {
                    $table->dropColumn('metadata');
                }
            });
        }
    }
};
