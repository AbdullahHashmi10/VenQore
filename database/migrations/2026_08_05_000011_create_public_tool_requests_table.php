<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_tool_requests', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255);
            $table->string('ip_address', 45);
            $table->string('feature', 64)->default('public_tool');
            $table->json('result_json')->nullable();
            $table->decimal('cost_usd', 8, 4)->default(0.0000);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['email', 'created_at']);
            $table->index(['ip_address', 'created_at']);
            $table->index(['feature', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_tool_requests');
    }
};
