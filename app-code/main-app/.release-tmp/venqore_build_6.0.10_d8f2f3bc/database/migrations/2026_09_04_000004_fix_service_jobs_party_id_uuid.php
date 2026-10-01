<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('service_jobs')) {
            DB::statement("ALTER TABLE service_jobs MODIFY COLUMN party_id CHAR(36) NOT NULL");
        }
        if (Schema::hasTable('service_contracts')) {
            DB::statement("ALTER TABLE service_contracts MODIFY COLUMN party_id CHAR(36) NOT NULL");
        }
        if (Schema::hasTable('job_lines')) {
            DB::statement("ALTER TABLE job_lines MODIFY COLUMN product_id CHAR(36) NULL");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('service_jobs')) {
            DB::statement("ALTER TABLE service_jobs MODIFY COLUMN party_id BIGINT UNSIGNED NOT NULL");
        }
        if (Schema::hasTable('service_contracts')) {
            DB::statement("ALTER TABLE service_contracts MODIFY COLUMN party_id BIGINT UNSIGNED NOT NULL");
        }
        if (Schema::hasTable('job_lines')) {
            DB::statement("ALTER TABLE job_lines MODIFY COLUMN product_id BIGINT UNSIGNED NULL");
        }
    }
};
