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
        // 1. Update existing data first (if any)
        DB::table('users')->where('platform_role', 'platform_owner')->update(['platform_role' => 'platform_manager']); // Temp move
        
        // 2. Change column definition
        // Note: Using raw SQL as enum modification is tricky in Laravel standard Schema
        DB::statement("ALTER TABLE users MODIFY COLUMN platform_role ENUM('none','platform_owner','platform_manager','support_director','support_dept_manager','support_agent','support_qa','tech_escalation','marketing_manager','content_writer','billing_operations','platform_finance','customer_success','product_manager','security_auditor','platform_sales') NOT NULL DEFAULT 'none'");

        // 3. Move them back to the new slug
        DB::table('users')->where('platform_role', 'platform_manager')->update(['platform_role' => 'platform_owner']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN platform_role ENUM('none','platform_owner','platform_manager','support_director','support_dept_manager','support_agent','support_qa','tech_escalation','marketing_manager','content_writer','billing_operations','platform_finance','customer_success','product_manager','security_auditor','platform_sales') NOT NULL DEFAULT 'none'");
        DB::table('users')->where('platform_role', 'platform_owner')->update(['platform_role' => 'platform_owner']);
    }
};
