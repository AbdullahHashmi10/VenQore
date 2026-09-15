<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'transporter_name')) {
                $table->string('transporter_name')->nullable()->after('fbr_qr_data');
            }
            if (!Schema::hasColumn('sales', 'vehicle_number')) {
                $table->string('vehicle_number')->nullable()->after('transporter_name');
            }
            if (!Schema::hasColumn('sales', 'eway_bill_number')) {
                $table->string('eway_bill_number')->nullable()->after('vehicle_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['transporter_name', 'vehicle_number', 'eway_bill_number']);
        });
    }
};
