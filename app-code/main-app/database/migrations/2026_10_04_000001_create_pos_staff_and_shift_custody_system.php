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
        // 1. Update tenant_users for membership_type and POS capabilities
        Schema::table('tenant_users', function (Blueprint $table) {
            if (!Schema::hasColumn('tenant_users', 'membership_type')) {
                $table->string('membership_type', 20)->default('full')->after('role')->index();
            }
            if (!Schema::hasColumn('tenant_users', 'pos_capabilities')) {
                $table->json('pos_capabilities')->nullable()->after('membership_type');
            }
            if (!Schema::hasColumn('tenant_users', 'assigned_location_id')) {
                $table->unsignedBigInteger('assigned_location_id')->nullable()->after('pos_capabilities')->index();
            }
        });

        // 2. Update staff_invitations for membership_type and POS capabilities
        Schema::table('staff_invitations', function (Blueprint $table) {
            if (!Schema::hasColumn('staff_invitations', 'membership_type')) {
                $table->string('membership_type', 20)->default('full')->after('role')->index();
            }
            if (!Schema::hasColumn('staff_invitations', 'pos_capabilities')) {
                $table->json('pos_capabilities')->nullable()->after('membership_type');
            }
            if (!Schema::hasColumn('staff_invitations', 'assigned_location_id')) {
                $table->unsignedBigInteger('assigned_location_id')->nullable()->after('pos_capabilities')->index();
            }
        });

        // 3. Update register_shifts for work shift mode, cash custody, and handover
        Schema::table('register_shifts', function (Blueprint $table) {
            if (!Schema::hasColumn('register_shifts', 'shift_mode')) {
                $table->string('shift_mode', 20)->default('cash_drawer')->after('register_id');
            }
            if (!Schema::hasColumn('register_shifts', 'cash_custodian_id')) {
                $table->unsignedBigInteger('cash_custodian_id')->nullable()->after('opened_by')->index();
            }
            if (!Schema::hasColumn('register_shifts', 'retained_float')) {
                $table->decimal('retained_float', 12, 2)->default(0)->after('opening_float');
            }
            if (!Schema::hasColumn('register_shifts', 'expected_handover')) {
                $table->decimal('expected_handover', 12, 2)->nullable()->after('variance');
            }
            if (!Schema::hasColumn('register_shifts', 'actual_handover')) {
                $table->decimal('actual_handover', 12, 2)->nullable()->after('expected_handover');
            }
            if (!Schema::hasColumn('register_shifts', 'handover_notes')) {
                $table->text('handover_notes')->nullable()->after('actual_handover');
            }
            if (!Schema::hasColumn('register_shifts', 'handover_acknowledged_by')) {
                $table->unsignedBigInteger('handover_acknowledged_by')->nullable()->after('handover_notes')->index();
            }
            if (!Schema::hasColumn('register_shifts', 'handover_acknowledged_at')) {
                $table->timestamp('handover_acknowledged_at')->nullable()->after('handover_acknowledged_by');
            }
            if (!Schema::hasColumn('register_shifts', 'manager_close_reason')) {
                $table->text('manager_close_reason')->nullable()->after('closed_by');
            }
        });

        // 4. Update sales table to record order taker
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'order_taker_id')) {
                $table->unsignedBigInteger('order_taker_id')->nullable()->after('user_id')->index();
            }
        });

        // 5. Update persisted plan limits in DB for pos_staff_limit and staff_limit
        if (Schema::hasTable('plans') && Schema::hasTable('plan_limits')) {
            $planLimitsMap = [
                'solo'       => ['staff_limit' => '1', 'pos_staff_limit' => '0'],
                'starter'    => ['staff_limit' => '1', 'pos_staff_limit' => '1'],
                'core'       => ['staff_limit' => '5', 'pos_staff_limit' => '5'],
                'growth'     => ['staff_limit' => '5', 'pos_staff_limit' => '5'],
                'scale'      => ['staff_limit' => '25', 'pos_staff_limit' => '25'],
                'business'   => ['staff_limit' => '25', 'pos_staff_limit' => '25'],
                'custom'     => ['staff_limit' => null, 'pos_staff_limit' => null],
                'enterprise' => ['staff_limit' => null, 'pos_staff_limit' => null],
                'ltd_1'      => ['staff_limit' => '1', 'pos_staff_limit' => '1'],
                'ltd_tier_1' => ['staff_limit' => '1', 'pos_staff_limit' => '1'],
                'ltd_2'      => ['staff_limit' => '2', 'pos_staff_limit' => '2'],
                'ltd_tier_2' => ['staff_limit' => '2', 'pos_staff_limit' => '2'],
                'ltd_3'      => ['staff_limit' => '5', 'pos_staff_limit' => '5'],
                'ltd_tier_3' => ['staff_limit' => '5', 'pos_staff_limit' => '5'],
            ];

            foreach ($planLimitsMap as $slug => $limits) {
                $plan = DB::table('plans')->where('slug', $slug)->first();
                if ($plan) {
                    foreach ($limits as $key => $val) {
                        DB::table('plan_limits')->updateOrInsert(
                            ['plan_id' => $plan->id, 'key' => $key],
                            [
                                'value'        => $val,
                                'reset_period' => 'never',
                                'updated_at'   => now(),
                                'created_at'   => now(),
                            ]
                        );
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'order_taker_id')) {
                $table->dropColumn('order_taker_id');
            }
        });

        Schema::table('register_shifts', function (Blueprint $table) {
            $cols = [
                'shift_mode', 'cash_custodian_id', 'retained_float',
                'expected_handover', 'actual_handover', 'handover_notes',
                'handover_acknowledged_by', 'handover_acknowledged_at',
                'manager_close_reason'
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('register_shifts', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('staff_invitations', function (Blueprint $table) {
            $cols = ['membership_type', 'pos_capabilities', 'assigned_location_id'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('staff_invitations', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            $cols = ['membership_type', 'pos_capabilities', 'assigned_location_id'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('tenant_users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
