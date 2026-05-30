<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_visitor_logs', function (Blueprint $table) {
            $table->id();
            $table->date('log_date');
            $table->string('role', 50)->default('unknown');
            $table->unsignedInteger('visit_count')->default(1);
            $table->unique(['log_date', 'role'], 'unique_date_role');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_visitor_logs');
    }
};
