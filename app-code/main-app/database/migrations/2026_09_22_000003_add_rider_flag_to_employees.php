<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add rider capability flag and delivery-reconciliation fields to employees.
     *
     * WHY A FLAG AND NOT A ROLE
     * -------------------------
     * A rider is a staff member with one extra permission: they can be
     * assigned deliveries. Modelling it as a separate table would mean a
     * separate lookup on every dispatch screen load, a separate form to
     * maintain, and a join nobody asked for. A boolean flag on the existing
     * employee record costs nothing and answers the question in one WHERE.
     *
     * WHY tracking_token IS ON OCCUPANCIES
     * -------------------------------------
     * The delivery lives on the occupancy (via session_data), and so does its
     * tracking token. No migration needed for that — it is a JSON field.
     * This migration is only about the staff side.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'is_rider')) {
                $table->boolean('is_rider')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'is_rider')) {
                $table->dropColumn('is_rider');
            }
        });
    }
};
