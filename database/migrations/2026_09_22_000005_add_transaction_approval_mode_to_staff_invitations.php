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
                if (!Schema::hasColumn('staff_invitations', 'transaction_approval_mode')) {
                    $table->string('transaction_approval_mode', 20)->default('inherit')->after('role');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive rollback
    }
};
