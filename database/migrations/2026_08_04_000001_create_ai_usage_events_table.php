<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_events', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('tenant_id')->nullable()->index();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->string('feature', 32)->default('scan')->index();
            $t->string('provider', 16)->default('gemini');
            $t->string('model', 64);
            $t->string('key_mode', 16)->default('platform_paid');
            $t->string('input_type', 16)->nullable();
            $t->unsignedInteger('pages')->default(1);
            $t->unsignedInteger('prompt_tokens')->default(0);
            $t->unsignedInteger('output_tokens')->default(0);
            $t->unsignedInteger('thinking_tokens')->default(0);
            $t->unsignedInteger('cached_tokens')->default(0);
            $t->decimal('cost_usd', 12, 8)->default(0);
            $t->unsignedInteger('latency_ms')->default(0);
            $t->boolean('success')->default(true);
            $t->string('error_code', 64)->nullable();
            $t->timestamp('created_at')->useCurrent()->index();
            $t->index(['tenant_id', 'created_at']);
            $t->index(['feature', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_events');
    }
};
