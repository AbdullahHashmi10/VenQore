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
        Schema::table('tenants', function (Blueprint $table) {
            $table->boolean('google_backup_enabled')->default(false)->after('view_only_since');
            $table->integer('google_backup_retention')->default(7)->after('google_backup_enabled');
            $table->string('google_backup_email')->nullable()->after('google_backup_retention');
            $table->text('google_access_token')->nullable()->after('google_backup_email');
            $table->text('google_refresh_token')->nullable()->after('google_access_token');
            $table->string('google_backup_folder_id')->nullable()->after('google_refresh_token');
        });
    }
 
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'google_backup_enabled',
                'google_backup_retention',
                'google_backup_email',
                'google_access_token',
                'google_refresh_token',
                'google_backup_folder_id',
            ]);
        });
    }
};
