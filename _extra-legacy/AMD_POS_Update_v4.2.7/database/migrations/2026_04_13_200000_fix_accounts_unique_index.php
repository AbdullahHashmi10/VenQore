<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Drop old global unique index
            $table->dropUnique(['code']);
            
            // Add tenant-scoped unique index
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'code']);
            $table->unique('code');
        });
    }
};
