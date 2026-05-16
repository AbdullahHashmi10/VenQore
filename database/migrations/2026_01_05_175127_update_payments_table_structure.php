<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Make sale_id nullable as payments can be general (not linked to specific sale)
            $table->foreignUuid('sale_id')->nullable()->change();

            // Add party_id for general payments
            if (!Schema::hasColumn('payments', 'party_id')) {
                $table->foreignUuid('party_id')->nullable()->constrained()->nullOnDelete();
            }

            // Add type (received/sent)
            if (!Schema::hasColumn('payments', 'type')) {
                $table->string('type')->default('received'); // received, sent
            }

            // Add date
            if (!Schema::hasColumn('payments', 'date')) {
                $table->date('date')->default(now());
            }

            // Add notes
            if (!Schema::hasColumn('payments', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('sale_id')->nullable(false)->change();
            $table->dropColumn(['party_id', 'type', 'date', 'notes']);
        });
    }
};


