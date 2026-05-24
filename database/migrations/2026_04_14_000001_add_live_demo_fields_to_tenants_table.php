<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->timestamp('demo_reset_at')->nullable(); // when it last reset
            $table->unsignedInteger('demo_visit_count')->default(0); // total all-time visits
            $table->unsignedInteger('demo_visit_today')->default(0); // resets daily
        });
    }

    public function down()
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['demo_reset_at', 'demo_visit_count', 'demo_visit_today']);
        });
    }
};
