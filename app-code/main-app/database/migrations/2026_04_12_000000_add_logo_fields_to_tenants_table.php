<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'logo_style')) {
                $table->string('logo_style')->default('minimal')->after('industry');
            }
            if (!Schema::hasColumn('tenants', 'logo_path')) {
                $table->string('logo_path')->nullable()->after('logo_style');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['logo_style', 'logo_path']);
        });
    }
};
