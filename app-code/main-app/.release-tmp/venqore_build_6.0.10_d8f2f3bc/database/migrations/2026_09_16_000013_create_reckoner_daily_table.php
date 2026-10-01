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
        if (!Schema::hasTable('reckoner_daily')) {
            Schema::create('reckoner_daily', function (Blueprint $t) {
                $t->unsignedBigInteger('tenant_id');
                $t->date('day');                                   // store-local business date
                $t->string('measure', 64);
                $t->enum('kind', ['flow', 'closing', 'snapshot']);
                $t->string('dim', 32)->default('');                // '' = total, never NULL
                $t->string('dim_value', 64)->default('');
                $t->decimal('value', 20, 4)->default(0);           // money / quantity / balance
                $t->decimal('qty', 20, 4)->default(0);             // secondary amount where a measure needs one
                $t->unsignedBigInteger('n')->default(0);           // row count, so averages are sum ÷ n, never stored
                $t->unsignedSmallInteger('definition_version')->default(1);
                $t->timestamp('computed_at');

                $t->primary(['tenant_id', 'measure', 'dim', 'dim_value', 'day']);
                $t->index(['tenant_id', 'day']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reckoner_daily');
    }
};
