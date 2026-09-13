<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| STEP 8 — service packages + hourly rate cards
|==============================================================================
|
| The services engine tables (service_jobs, job_lines, job_assignments,
| job_events, employee_skills, service_contracts) already exist from
| 2026_08_12_210000. These two add the BILLING side, which does not.
|
| WHY BOTH POINT AT A PRODUCT
| ---------------------------
| Every billable line must resolve to a `products` row with `type = 'service'`,
| because that is the flag SaleService reads (line 137) to skip FIFO. A package
| or rate with no product would try to deduct stock it does not have.
|
| The product row is a hook into the Qore, not a catalogue entry — these do not
| need to appear on the Products screen, and a salon should never see
| "Bridal Package" sitting in its inventory list.
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        /*
        | A named fixed-price bundle: "Full Service — Rs. 4,500".
        |
        | ONE LINE ON THE INVOICE, NOT A RECIPE. A package that expanded into
        | components would be Cookbook (#29) in disguise, and a customer buying
        | a haircut does not want a bill of materials. `includes` is descriptive
        | text for the quote and the receipt; it is never priced.
        */
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name', 120);
            $table->text('includes')->nullable();      // shown to the customer, never priced
            $table->unsignedBigInteger('product_id');  // must be products.type = 'service'
            $table->decimal('price', 14, 2);
            $table->decimal('tax_rate', 6, 3)->default(0);
            $table->unsignedInteger('duration_minutes')->nullable();  // for scheduling, not billing
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'active']);
            $table->unique(['tenant_id', 'name']);
        });

        /*
        | Hourly rate cards.
        |
        | employee_id NULL  = the tenant's default rate
        | employee_id set   = this technician's rate, which wins
        |
        | ROUNDING LIVES HERE ON PURPOSE. A consultant who works 61 minutes
        | usually bills 1.25 hours, not 1.0166 — and every trade rounds
        | differently. Hard-coding one rule in the service would be a support
        | ticket per customer.
        */
        Schema::create('service_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->string('label', 80)->default('Labour');
            $table->unsignedBigInteger('product_id');  // must be products.type = 'service'
            $table->decimal('hourly_rate', 14, 2);
            $table->decimal('tax_rate', 6, 3)->default(0);

            // 15 = quarter-hour billing, the most common convention.
            $table->unsignedSmallInteger('increment_minutes')->default(15);

            // up | down | nearest | exact
            $table->string('rounding', 10)->default('up');

            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'active']);
            $table->unique(['tenant_id', 'employee_id', 'label']);
        });

        /*
        | ServiceBillingService writes the resulting sale id back to the job.
        | The existing column is `invoice_id`, pointing at the LEGACY invoices
        | table — the very thing Step 8 stops using. Both columns coexist during
        | the transition so nothing that still reads invoice_id breaks.
        */
        if (Schema::hasTable('service_jobs') && !Schema::hasColumn('service_jobs', 'sale_id')) {
            Schema::table('service_jobs', function (Blueprint $table) {
                $table->string('sale_id', 36)->nullable()->after('invoice_id');
                $table->index('sale_id');
            });
        }

        // job_lines needs a discount column to match ordinary sale lines.
        if (Schema::hasTable('job_lines') && !Schema::hasColumn('job_lines', 'discount_percent')) {
            Schema::table('job_lines', function (Blueprint $table) {
                $table->decimal('discount_percent', 6, 3)->default(0);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_rates');
        Schema::dropIfExists('service_packages');

        if (Schema::hasTable('service_jobs') && Schema::hasColumn('service_jobs', 'sale_id')) {
            Schema::table('service_jobs', function (Blueprint $table) {
                $table->dropColumn('sale_id');
            });
        }
    }
};
