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
        // 1. Alter products table to support 'service' type and service attributes
        Schema::table('products', function (Blueprint $table) {
            // Modify type column safely (always safe to run)
            DB::statement("ALTER TABLE products MODIFY COLUMN type ENUM('standard','weighted','composite','service') NOT NULL DEFAULT 'standard'");

            if (!Schema::hasColumn('products', 'service_pricing')) {
                $table->enum('service_pricing', ['fixed', 'hourly', 'per_unit', 'quote'])->nullable()->after('type');
            }
            if (!Schema::hasColumn('products', 'default_duration')) {
                $table->smallInteger('default_duration')->unsigned()->nullable()->after('service_pricing');
            }
            if (!Schema::hasColumn('products', 'default_rate')) {
                $table->decimal('default_rate', 15, 4)->nullable()->after('default_duration');
            }
            if (!Schema::hasColumn('products', 'requires_visit')) {
                $table->tinyInteger('requires_visit')->default(0)->after('default_rate');
            }
            if (!Schema::hasColumn('products', 'skill_tag')) {
                $table->string('skill_tag', 64)->nullable()->after('requires_visit');
            }
        });

        // 2. Create service_jobs table (renamed from jobs to avoid queue jobs collision)
        if (!Schema::hasTable('service_jobs')) {
            Schema::create('service_jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->bigInteger('tenant_id')->unsigned();
                $table->string('number', 32);
                $table->bigInteger('party_id')->unsigned();
                $table->bigInteger('contract_id')->unsigned()->nullable();
                $table->bigInteger('quotation_id')->unsigned()->nullable();
                $table->bigInteger('invoice_id')->unsigned()->nullable();
                $table->bigInteger('occupancy_id')->unsigned()->nullable();
                $table->string('title', 180);
                $table->text('description')->nullable();
                $table->text('site_address')->nullable();
                $table->decimal('site_lat', 10, 7)->nullable();
                $table->decimal('site_lng', 10, 7)->nullable();
                $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
                $table->enum('status', ['draft', 'scheduled', 'in_progress', 'on_hold', 'awaiting_parts', 'completed', 'invoiced', 'cancelled'])->default('draft');
                $table->date('scheduled_for')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->decimal('estimated_total', 15, 4)->nullable();
                $table->decimal('actual_total', 15, 4)->nullable();
                $table->bigInteger('created_by')->unsigned();
                $table->timestamps();

                $table->unique(['tenant_id', 'number']);
                $table->index(['tenant_id', 'status', 'scheduled_for']);
                $table->index(['tenant_id', 'party_id']);
            });
        }

        // 3. Create job_lines table
        if (!Schema::hasTable('job_lines')) {
            Schema::create('job_lines', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->bigInteger('job_id')->unsigned(); // references service_jobs.id
                $table->enum('kind', ['service', 'part', 'ad_hoc']);
                $table->bigInteger('product_id')->unsigned()->nullable();
                $table->string('description', 255);
                $table->decimal('quantity', 15, 4)->default(1.0000);
                $table->decimal('unit_price', 15, 4)->default(0.0000);
                $table->decimal('unit_cost', 15, 4)->nullable();
                $table->decimal('tax_rate', 6, 3)->nullable();
                $table->bigInteger('warehouse_id')->unsigned()->nullable();
                $table->timestamp('consumed_at')->nullable();
                $table->timestamps();

                $table->index(['job_id', 'kind']);
            });
        }

        // 4. Create job_assignments table
        if (!Schema::hasTable('job_assignments')) {
            Schema::create('job_assignments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->bigInteger('job_id')->unsigned(); // references service_jobs.id
                $table->bigInteger('employee_id')->unsigned();
                $table->string('role', 48)->nullable();
                $table->timestamp('assigned_at')->useCurrent();
                $table->timestamp('checked_in_at')->nullable();
                $table->timestamp('checked_out_at')->nullable();
                $table->decimal('hours', 8, 2)->nullable();
                $table->timestamps();

                $table->unique(['job_id', 'employee_id']);
            });
        }

        // 5. Create job_events table
        if (!Schema::hasTable('job_events')) {
            Schema::create('job_events', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->bigInteger('job_id')->unsigned(); // references service_jobs.id
                $table->string('type', 40);
                $table->text('body')->nullable();
                $table->string('media_path', 255)->nullable();
                $table->bigInteger('user_id')->unsigned()->nullable();
                $table->timestamps();

                $table->index(['job_id', 'created_at']);
            });
        }

        // 6. Create employee_skills table
        if (!Schema::hasTable('employee_skills')) {
            Schema::create('employee_skills', function (Blueprint $table) {
                $table->bigInteger('employee_id')->unsigned();
                $table->string('skill_tag', 64);
                $table->enum('level', ['trainee', 'competent', 'expert'])->default('competent');

                $table->primary(['employee_id', 'skill_tag']);
            });
        }

        // 7. Alter employees table to support van stock and technician rates
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'default_warehouse_id')) {
                $table->bigInteger('default_warehouse_id')->unsigned()->nullable()->after('status');
            }
            if (!Schema::hasColumn('employees', 'hourly_cost')) {
                $table->decimal('hourly_cost', 15, 4)->nullable()->after('default_warehouse_id');
            }
            if (!Schema::hasColumn('employees', 'hourly_rate')) {
                $table->decimal('hourly_rate', 15, 4)->nullable()->after('hourly_cost');
            }
        });

        // 8. Create service_contracts table
        if (!Schema::hasTable('service_contracts')) {
            Schema::create('service_contracts', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->bigInteger('tenant_id')->unsigned();
                $table->bigInteger('party_id')->unsigned();
                $table->string('number', 32);
                $table->bigInteger('recurring_invoice_id')->unsigned()->nullable();
                $table->date('starts_on');
                $table->date('ends_on')->nullable();
                $table->smallInteger('visits_included')->nullable();
                $table->smallInteger('visits_used')->default(0);
                $table->tinyInteger('labour_covered')->default(1);
                $table->tinyInteger('parts_covered')->default(0);
                $table->timestamps();

                $table->unique(['tenant_id', 'number']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_contracts');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['default_warehouse_id', 'hourly_cost', 'hourly_rate']);
        });

        Schema::dropIfExists('employee_skills');
        Schema::dropIfExists('job_events');
        Schema::dropIfExists('job_assignments');
        Schema::dropIfExists('job_lines');
        Schema::dropIfExists('service_jobs');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['service_pricing', 'default_duration', 'default_rate', 'requires_visit', 'skill_tag']);
            DB::statement("ALTER TABLE products MODIFY COLUMN type ENUM('standard','weighted','composite') NOT NULL DEFAULT 'standard'");
        });
    }
};
