<?php

use Illuminate\Database\Migrations\Migration;
use Database\Seeders\PlanFeatureMatrixSeeder;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        (new PlanFeatureMatrixSeeder())->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
