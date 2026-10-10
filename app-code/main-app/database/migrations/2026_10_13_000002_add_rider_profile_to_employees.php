<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** What a customer sees about the rider bringing their order: optional photo, phone and vehicle. */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (! Schema::hasColumn('employees', 'rider_photo_path')) $table->string('rider_photo_path')->nullable();
            if (! Schema::hasColumn('employees', 'rider_phone')) $table->string('rider_phone', 40)->nullable();
            if (! Schema::hasColumn('employees', 'rider_vehicle')) $table->string('rider_vehicle', 80)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            foreach (['rider_photo_path', 'rider_phone', 'rider_vehicle'] as $c) {
                if (Schema::hasColumn('employees', $c)) $table->dropColumn($c);
            }
        });
    }
};
