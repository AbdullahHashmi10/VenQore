<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/*
|==============================================================================
| Services module — tools tracking, real calendar slots, and one FK-type fix
|==============================================================================
|
| Written against the services-engine schema in
| 2026_08_12_210000_create_services_engine_tables.php and
| 2026_08_16_000100_create_service_packages_and_rates_tables.php. Nothing here
| touches a row those migrations wrote, except the one guarded fix in step 0.
|
| WHY THIS EXISTS
| ----------------
| Three things the owner asked for (or that block what he asked for) have no
| working schema today:
|
|   0. Staff assignment is unusable, not just unbuilt. employees.id is a
|      UUID (`v3_foundation_schema.php:148-158`,
|      `$table->uuid('id')->primary()`), but job_assignments.employee_id was
|      created as `bigInteger unsigned`
|      (`create_services_engine_tables.php:94`). No real employee id can be
|      stored in that column without truncation. Separately,
|      `App\Models\Employee` — the class `JobAssignment::employee()`
|      belongs-to's — does not exist anywhere in app/Models, so
|      `ServiceJobController::show()`'s `assignments.employee` eager load
|      throws "Class App\Models\Employee not found" the moment a job has any
|      assignment. Both are fixed together here (schema in step 0; the model
|      file ships alongside this migration as app/Models/Employee.php).
|
|   1. Which tools a service needs, where a tool physically is right now, and
|      when it last needed maintenance — no schema at all.
|
|   2. A real start/end time for a booking. `service_jobs.scheduled_for` is a
|      bare DATE — no time-of-day — so no calendar view can be built on it
|      without guessing. Left exactly as it is; two new nullable columns sit
|      beside it.
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        // 0. job_assignments.employee_id: bigint -> char(36) to match
        //    employees.id. Guarded on row count — this only runs the
        //    destructive MODIFY when the table is empty, which it is
        //    expected to be: the class needed to write a row through the
        //    normal app flow (App\Models\Employee) has not existed until
        //    this same change set. If it is NOT empty, the migration skips
        //    the type change and leaves a log line instead of guessing.
        if (Schema::hasTable('job_assignments')) {
            $col = DB::selectOne(
                "SELECT DATA_TYPE as dt FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_assignments' AND COLUMN_NAME = 'employee_id'"
            );
            if ($col && strtolower($col->dt) !== 'char') {
                $rowCount = DB::table('job_assignments')->count();
                if ($rowCount === 0) {
                    DB::statement("ALTER TABLE job_assignments MODIFY employee_id CHAR(36) NOT NULL");
                } else {
                    Log::warning("job_assignments.employee_id type fix skipped: {$rowCount} existing row(s). Needs a manual backfill plan, not an automatic MODIFY.");
                }
            }
        }

        // 1. Real calendar slots on a booking, alongside the existing date field.
        if (Schema::hasTable('service_jobs') && !Schema::hasColumn('service_jobs', 'scheduled_start_at')) {
            Schema::table('service_jobs', function (Blueprint $table) {
                $table->dateTime('scheduled_start_at')->nullable()->after('scheduled_for');
                $table->dateTime('scheduled_end_at')->nullable()->after('scheduled_start_at');
                $table->index(['tenant_id', 'scheduled_start_at']);
            });
        }

        // 2. Optional link from an expense to the job it was bought for —
        //    "the AC gas the technician had to buy for this job." Nullable,
        //    additive, read by nothing yet, so no existing total changes.
        if (Schema::hasTable('expenses') && !Schema::hasColumn('expenses', 'service_job_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->unsignedBigInteger('service_job_id')->nullable()->after('purchase_id');
                $table->index('service_job_id');
            });
        }

        // 3. Tools — the physical kit a service needs, and where it is.
        if (!Schema::hasTable('tools')) {
            Schema::create('tools', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id');
                $table->string('name', 150);
                $table->string('category', 80)->nullable();
                $table->text('description')->nullable();

                // available | with_staff | in_maintenance | lost | retired
                $table->string('status', 20)->default('available');

                // Who has it right now (matches employees.id — UUID), and a
                // free-text location for cases an employee row doesn't cover
                // (a van, a storeroom shelf).
                $table->char('holder_employee_id', 36)->nullable();
                $table->string('current_location', 150)->nullable();

                // Maintenance / recharge cadence — "when do I next need to
                // refill the gas cylinder." Both dates are stored, not just
                // the interval, so a list screen can sort by "overdue" with
                // no computed column.
                $table->unsignedInteger('maintenance_interval_days')->nullable();
                $table->date('last_maintenance_at')->nullable();
                $table->date('next_maintenance_due_at')->nullable();

                $table->decimal('purchase_cost', 15, 4)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'next_maintenance_due_at']);
            });
        }

        // 4. Which tools a service (a products.type='service' row) normally
        //    needs — the owner's default packing list for that service. A
        //    specific job can still deviate via job_tools below.
        if (!Schema::hasTable('service_tools')) {
            Schema::create('service_tools', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id');
                $table->unsignedBigInteger('product_id');  // products.type = 'service'
                $table->unsignedBigInteger('tool_id');
                $table->unsignedInteger('quantity')->default(1);
                $table->timestamps();

                $table->unique(['product_id', 'tool_id']);
                $table->index('tenant_id');
            });
        }

        // 5. Which tools actually went out on a specific job — the answer to
        //    "if we sent someone out with a set of tools, where are they."
        if (!Schema::hasTable('job_tools')) {
            Schema::create('job_tools', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('job_id');   // service_jobs.id
                $table->unsignedBigInteger('tool_id');
                $table->unsignedInteger('quantity')->default(1);
                $table->timestamp('taken_at')->nullable();
                $table->timestamp('returned_at')->nullable();
                $table->string('condition_note', 255)->nullable();
                $table->timestamps();

                $table->unique(['job_id', 'tool_id']);
                $table->index('job_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_tools');
        Schema::dropIfExists('service_tools');
        Schema::dropIfExists('tools');

        if (Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'service_job_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropColumn('service_job_id');
            });
        }

        if (Schema::hasTable('service_jobs') && Schema::hasColumn('service_jobs', 'scheduled_start_at')) {
            Schema::table('service_jobs', function (Blueprint $table) {
                $table->dropIndex(['tenant_id', 'scheduled_start_at']);
                $table->dropColumn(['scheduled_start_at', 'scheduled_end_at']);
            });
        }

        // employee_id is deliberately left as CHAR(36) on rollback — reversing
        // it to bigint would re-break the type it was fixed to match.
    }
};
