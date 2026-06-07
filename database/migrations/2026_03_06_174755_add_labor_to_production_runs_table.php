<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('production_runs', function (Blueprint $table) {
            $table->decimal('labor_cost', 15, 2)->default(0)->after('material_cost');
            $table->string('labor_type')->nullable()->after('labor_cost');
        });
    }

    public function down(): void
    {
        Schema::table('production_runs', function (Blueprint $table) {
            $table->dropColumn(['labor_cost', 'labor_type']);
        });
    }
};
