<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_rate_buckets', function (Blueprint $table) {
            $table->string('bucket_key', 96)->change();
        });

        Schema::table('ai_spend_counters', function (Blueprint $table) {
            $table->string('scope', 96)->change();
        });
    }

    public function down(): void
    {
        Schema::table('ai_spend_counters', function (Blueprint $table) {
            $table->string('scope', 48)->change();
        });

        Schema::table('ai_rate_buckets', function (Blueprint $table) {
            $table->string('bucket_key', 64)->change();
        });
    }
};
