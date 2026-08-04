<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_rate_buckets', function (Blueprint $t) {
            $t->string('bucket_key', 64)->primary();
            $t->decimal('tokens', 10, 4)->default(0);
            $t->decimal('capacity', 10, 4);
            $t->decimal('refill_per_sec', 10, 6);
            $t->decimal('last_refill_at', 16, 4);
            $t->unsignedInteger('day_count')->default(0);
            $t->unsignedInteger('day_limit')->default(0);
            $t->date('day_date')->nullable();
            $t->timestamps();
        });

        Schema::create('ai_spend_counters', function (Blueprint $t) {
            $t->id();
            $t->string('scope', 48);
            $t->date('day');
            $t->decimal('spend_usd', 12, 6)->default(0);
            $t->decimal('cap_usd', 12, 4);
            $t->boolean('tripped')->default(false);
            $t->unique(['scope', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_spend_counters');
        Schema::dropIfExists('ai_rate_buckets');
    }
};
