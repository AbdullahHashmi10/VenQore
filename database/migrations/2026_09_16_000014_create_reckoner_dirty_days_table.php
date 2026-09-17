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
        if (!Schema::hasTable('reckoner_dirty_days')) {
            Schema::create('reckoner_dirty_days', function (Blueprint $t) {
                $t->unsignedBigInteger('tenant_id');
                $t->string('stream', 32);
                $t->date('day');
                $t->string('reason', 64);
                $t->timestamp('first_marked_at');
                $t->unsignedSmallInteger('attempts')->default(0);

                $t->primary(['tenant_id', 'stream', 'day']);
                $t->index(['tenant_id', 'day']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reckoner_dirty_days');
    }
};
