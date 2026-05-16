<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('fbr_invoice_number')->nullable()->after('reference_number');
            $table->text('fbr_qr_data')->nullable()->after('fbr_invoice_number');
            $table->boolean('is_fbr_reported')->default(false)->after('fbr_qr_data');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['fbr_invoice_number', 'fbr_qr_data', 'is_fbr_reported']);
        });
    }
};


