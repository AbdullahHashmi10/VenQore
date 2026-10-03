<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A business-proposed change to a PENDING order (less quantity, removed item, substitute) that the customer must approve. */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('commerce_orders', function (Blueprint $t) {
            $t->string('revision_status', 12)->nullable()->after('reason'); // proposed | accepted | declined
            $t->string('revision_note', 255)->nullable()->after('revision_status');
            $t->json('revision')->nullable()->after('revision_note');
            $t->timestamp('revision_at')->nullable()->after('revision');
        });
    }

    public function down(): void
    {
        Schema::table('commerce_orders', fn (Blueprint $t) => $t->dropColumn(['revision_status', 'revision_note', 'revision', 'revision_at']));
    }
};
