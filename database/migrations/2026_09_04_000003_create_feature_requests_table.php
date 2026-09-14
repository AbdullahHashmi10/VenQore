<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('feature_requests')) {
            Schema::create('feature_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->nullable()->index();
                $table->string('email')->nullable();
                $table->string('source', 64)->default('landing_page')->index();
                $table->text('raw_text');
                $table->text('normalised')->nullable();
                $table->string('status', 32)->default('pending');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_requests');
    }
};
