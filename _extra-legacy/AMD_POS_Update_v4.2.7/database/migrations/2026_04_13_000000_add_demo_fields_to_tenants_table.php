<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->after('setup_completed');
            $table->boolean('is_golden_master')->default(false)->after('is_demo');
            $table->timestamp('demo_expires_at')->nullable()->after('is_golden_master');
            $table->string('demo_session_token')->nullable()->after('demo_expires_at');
        });
    }

    public function down()
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['is_demo', 'is_golden_master', 'demo_expires_at', 'demo_session_token']);
        });
    }
};
