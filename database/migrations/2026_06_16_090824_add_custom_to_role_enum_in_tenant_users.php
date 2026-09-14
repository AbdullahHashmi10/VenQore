<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE tenant_users MODIFY COLUMN role ENUM('owner','franchise_admin','admin','manager','shift_supervisor','purchasing_officer','accountant','inventory_controller','sales_executive','cashier','hr_officer','kitchen_manager','dispenser','production_supervisor','fulfillment_lead','delivery_driver','viewer','custom') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE tenant_users MODIFY COLUMN role ENUM('owner','franchise_admin','admin','manager','shift_supervisor','purchasing_officer','accountant','inventory_controller','sales_executive','cashier','hr_officer','kitchen_manager','dispenser','production_supervisor','fulfillment_lead','delivery_driver','viewer') NULL");
    }
};
