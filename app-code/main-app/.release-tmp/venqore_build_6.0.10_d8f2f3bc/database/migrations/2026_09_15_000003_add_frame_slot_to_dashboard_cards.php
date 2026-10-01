<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_cards', function (Blueprint $table) {
            $table->unsignedTinyInteger('frame_slot')->nullable()->after('fit');
        });
    }

    public function down(): void
    {
        Schema::table('dashboard_cards', function (Blueprint $table) {
            $table->dropColumn('frame_slot');
        });
    }
};
