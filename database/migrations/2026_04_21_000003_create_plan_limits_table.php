<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('value', 255)->nullable();
            $table->enum('reset_period', ['never', 'monthly', 'annually'])->default('never');
            $table->timestamps();

            $table->unique(['plan_id', 'key']);
            $table->index('key');
        });

        // Run the canonical matrix seeder to fully populate all feature keys
        (new \Database\Seeders\PlanFeatureMatrixSeeder())->run();
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_limits');
    }
};
