<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reckoner_invariant_runs')) {
            Schema::create('reckoner_invariant_runs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id');
                $table->timestamp('run_at');
                $table->string('invariant', 64);
                $table->date('period_start')->nullable();
                $table->date('period_end')->nullable();
                $table->string('status', 16); // 'pass', 'fail', 'unavailable'
                $table->decimal('expected', 20, 4)->nullable();
                $table->decimal('actual', 20, 4)->nullable();
                $table->decimal('difference', 20, 4)->default(0);
                $table->string('message', 255)->nullable();
                $table->json('details')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'invariant', 'run_at']);
                $table->index(['tenant_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reckoner_invariant_runs');
    }
};
