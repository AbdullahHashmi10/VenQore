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
        Schema::create('dashboards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();     // null = tenant-wide layout / role default
            $table->string('name', 80);
            $table->string('slug', 80);
            $table->boolean('is_default')->default(false);
            $table->string('for_role', 40)->nullable();       // role matching default starting point
            $table->boolean('is_locked')->default(false);     // lock layout flag for employees
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id', 'slug']);
        });

        Schema::create('dashboard_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('dashboard_id')->index();
            $table->string('reading_key', 80);                // ReckonerRegistry key
            $table->string('period', 24)->default('today');
            $table->json('period_custom')->nullable();
            $table->string('granularity', 16)->nullable();
            $table->string('chart', 24)->default('stat');
            $table->string('size', 12)->default('small');
            $table->unsignedTinyInteger('x')->default(0);
            $table->unsignedSmallInteger('y')->default(0);
            $table->unsignedTinyInteger('w')->default(3);
            $table->unsignedTinyInteger('h')->default(2);
            $table->string('title_override', 80)->nullable();
            $table->json('args')->nullable();
            $table->json('style')->nullable();                // legend/grid/tooltip/brush, accent, target
            $table->timestamps();

            $table->index(['dashboard_id', 'y', 'x']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboard_cards');
        Schema::dropIfExists('dashboards');
    }
};
