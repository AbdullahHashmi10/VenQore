<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Demo store: records a visitor creates are tagged with that visitor and shown
 * only to them (see App\Traits\DemoVisitorScoped). NULL = the shared sample data.
 * Real stores never write this column.
 */
return new class extends Migration {
    private array $tables = ['sales', 'parties', 'products'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'demo_session')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->string('demo_session', 36)->nullable()->index();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'demo_session')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropIndex([ 'demo_session' ]);
                    $t->dropColumn('demo_session');
                });
            }
        }
    }
};
