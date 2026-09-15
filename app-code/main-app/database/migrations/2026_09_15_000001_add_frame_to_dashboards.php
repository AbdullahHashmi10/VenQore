<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboards', function (Blueprint $table) {
            $table->string('frame_key', 40)->nullable()->after('slug');
            $table->boolean('frame_dirty')->default(false)->after('frame_key');
        });
    }

    public function down(): void
    {
        Schema::table('dashboards', function (Blueprint $table) {
            $table->dropColumn(['frame_key', 'frame_dirty']);
        });
    }
};
