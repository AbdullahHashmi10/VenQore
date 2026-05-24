<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appsumo_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique()->index();
            $table->string('plan_tier')->default('Tier 1'); // Tier 1, Tier 2, etc. logic
            $table->boolean('is_redeemed')->default(false)->index();
            $table->dateTime('redeemed_at')->nullable();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('redeemed_by_email')->nullable();
            $table->json('metadata')->nullable(); // For audit (IP, etc)
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appsumo_codes');
    }
};
