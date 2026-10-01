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
        Schema::create('platform_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role');
            $table->decimal('equity_pct', 5, 2);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('platform_equity_drawings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('platform_partners')->onDelete('cascade');
            $table->decimal('amount', 20, 4);
            $table->string('description')->nullable();
            $table->timestamp('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_equity_drawings');
        Schema::dropIfExists('platform_partners');
    }
};
