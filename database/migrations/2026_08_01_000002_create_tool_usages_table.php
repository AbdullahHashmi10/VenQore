<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tool_usages — anonymous aggregate telemetry for the Free Tools program.
 *
 * PLATFORM-LEVEL TABLE. No tenant_id. No email, no IP, no uploaded content —
 * this table must never carry anything identifying. It is the raw material
 * for the VenQore Retail Index (plan §9), which is published only in
 * aggregate with a minimum cohort size of 30.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_usages', function (Blueprint $table) {
            $table->id();
            $table->string('tool_slug')->index();
            $table->string('variant')->nullable();
            $table->string('country', 2)->nullable();
            $table->json('metrics')->nullable();
            $table->date('used_on')->index();
            $table->timestamps();

            $table->index(['tool_slug', 'used_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_usages');
    }
};
