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
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE expenses MODIFY purchase_id CHAR(36) NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a data type change, no rollback needed
    }
};
