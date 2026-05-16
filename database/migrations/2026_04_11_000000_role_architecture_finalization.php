<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Role Architecture Finalization
 *
 * This migration implements the full 15+17 role structure defined in the 
 * VenQore Role Architecture Master Plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Add platform_role to users table (Tier 1)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'platform_role')) {
                $table->enum('platform_role', [
                    'none',                // Regular store user
                    'platform_owner',           // Founder / Ultimate access
                    'platform_manager',    // Operations
                    'support_director',    // Global Support Head
                    'support_dept_manager',// Dept lead (Billing/Tech/Product)
                    'support_agent',       // L1 responder
                    'support_qa',          // Support quality assurance
                    'tech_escalation',     // L2 / Impersonation capable
                    'marketing_manager',   // CMS / Growth
                    'content_writer',      // Docs / Blogs
                    'billing_operations',  // AppSumo / LS Disputes
                    'platform_finance',    // MRR / ARR tracking
                    'customer_success',    // Proactive onboarding
                    'product_manager',     // Roadmap planning
                    'security_auditor',     // View-only log monitoring
                    'platform_sales'       // Enterprise / B2B sales
                ])->default('none')->after('is_platform_admin');
            }
        });

        // 2. Expand tenant_users.role ENUM (Tier 2)
        // Migration using DB::statement because updating ENUMs is DB-specific
        $roles = [
            'owner', 'franchise_admin', 'admin', 'manager', 'shift_supervisor',
            'purchasing_officer', 'accountant', 'inventory_controller', 'sales_executive',
            'cashier', 'hr_officer', 'kitchen_manager', 'dispenser', 
            'production_supervisor', 'fulfillment_lead', 'delivery_driver', 'viewer'
        ];
        
        $roleList = "'" . implode("','", $roles) . "'";
        DB::statement("ALTER TABLE tenant_users MODIFY COLUMN role ENUM($roleList) NOT NULL");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('platform_role');
        });

        $oldRoles = "'owner','admin','manager','cashier','viewer'";
        DB::statement("ALTER TABLE tenant_users MODIFY COLUMN role ENUM($oldRoles) NOT NULL");
    }
};
