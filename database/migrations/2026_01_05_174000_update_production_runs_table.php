<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('production_runs', function (Blueprint $table) {
            if (Schema::hasColumn('production_runs', 'quantity_made')) {
                $table->renameColumn('quantity_made', 'quantity');
            }
            if (!Schema::hasColumn('production_runs', 'status')) {
                $table->string('status')->default('completed');
            }
            if (!Schema::hasColumn('production_runs', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('production_runs', function (Blueprint $table) {
            if (Schema::hasColumn('production_runs', 'quantity')) {
                $table->renameColumn('quantity', 'quantity_made');
            }
            $table->dropColumn(['status', 'notes']);
        });
    }
};


