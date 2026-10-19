<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terminal_pairing_tokens', function (Blueprint $table) {
            $table->uuid('replacement_terminal_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('terminal_pairing_tokens', function (Blueprint $table) {
            $table->dropIndex(['replacement_terminal_id']);
            $table->dropColumn('replacement_terminal_id');
        });
    }
};
