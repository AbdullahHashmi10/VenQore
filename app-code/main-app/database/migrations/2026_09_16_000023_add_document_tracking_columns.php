<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (§5.4 Data Capture: Document Tracking & Specialty Columns).
     */
    public function up(): void
    {
        // 1. sale_items entry method & UOM
        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $t) {
                if (!Schema::hasColumn('sale_items', 'entry_method')) {
                    $t->string('entry_method', 16)->default('scan')->after('product_id')->index();
                }
                if (!Schema::hasColumn('sale_items', 'sale_uom')) {
                    $t->string('sale_uom', 32)->nullable()->after('quantity');
                }
                if (!Schema::hasColumn('sale_items', 'sale_uom_qty')) {
                    $t->decimal('sale_uom_qty', 15, 4)->nullable()->after('sale_uom');
                }
            });
        }

        // 2. label_print_jobs
        if (!Schema::hasTable('label_print_jobs')) {
            Schema::create('label_print_jobs', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('tenant_id')->index();
                $t->unsignedBigInteger('product_id')->nullable()->index();
                $t->string('barcode', 64)->nullable();
                $t->unsignedInteger('copies_count')->default(1);
                $t->unsignedBigInteger('printed_by')->nullable()->index();
                $t->dateTime('printed_at')->index();
                $t->string('status', 32)->default('completed');
                $t->timestamps();

                $t->index(['tenant_id', 'printed_at']);
            });
        }

        // 3. product_serials warranty & dates
        if (Schema::hasTable('product_serials')) {
            Schema::table('product_serials', function (Blueprint $t) {
                if (!Schema::hasColumn('product_serials', 'sold_at')) {
                    $t->dateTime('sold_at')->nullable()->after('status')->index();
                }
                if (!Schema::hasColumn('product_serials', 'warranty_until')) {
                    $t->date('warranty_until')->nullable()->after('sold_at')->index();
                }
                if (!Schema::hasColumn('product_serials', 'status_changed_at')) {
                    $t->dateTime('status_changed_at')->nullable()->after('warranty_until');
                }
            });
        }

        // 4. payments status & bounced_at
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $t) {
                if (!Schema::hasColumn('payments', 'status')) {
                    $t->string('status', 32)->default('completed')->after('type')->index();
                }
                if (!Schema::hasColumn('payments', 'bounced_at')) {
                    $t->dateTime('bounced_at')->nullable()->after('status')->index();
                }
            });
        }

        // 5. expenses recurring_expense_id
        if (Schema::hasTable('expenses') && !Schema::hasColumn('expenses', 'recurring_expense_id')) {
            Schema::table('expenses', function (Blueprint $t) {
                $t->unsignedBigInteger('recurring_expense_id')->nullable()->after('expense_category_id')->index();
            });
        }

        // 6. purchase_orders received_at & closed_at
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $t) {
                if (!Schema::hasColumn('purchase_orders', 'received_at')) {
                    $t->dateTime('received_at')->nullable()->after('status')->index();
                }
                if (!Schema::hasColumn('purchase_orders', 'closed_at')) {
                    $t->dateTime('closed_at')->nullable()->after('received_at')->index();
                }
            });
        }

        // 7. stock_transfer_items received_quantity
        if (Schema::hasTable('stock_transfer_items') && !Schema::hasColumn('stock_transfer_items', 'received_quantity')) {
            Schema::table('stock_transfer_items', function (Blueprint $t) {
                $t->decimal('received_quantity', 15, 4)->nullable()->after('quantity');
            });
        }

        // 8. sales_orders fulfilled_at
        if (Schema::hasTable('sales_orders') && !Schema::hasColumn('sales_orders', 'fulfilled_at')) {
            Schema::table('sales_orders', function (Blueprint $t) {
                $t->dateTime('fulfilled_at')->nullable()->after('status')->index();
            });
        }

        // 9. proposals decided_at
        if (Schema::hasTable('proposals') && !Schema::hasColumn('proposals', 'decided_at')) {
            Schema::table('proposals', function (Blueprint $t) {
                $t->dateTime('decided_at')->nullable()->after('status')->index();
            });
        }

        // 10. recurring_invoices cancelled_at
        if (Schema::hasTable('recurring_invoices') && !Schema::hasColumn('recurring_invoices', 'cancelled_at')) {
            Schema::table('recurring_invoices', function (Blueprint $t) {
                $t->dateTime('cancelled_at')->nullable()->after('status')->index();
            });
        }

        // 11. parties city
        if (Schema::hasTable('parties') && !Schema::hasColumn('parties', 'city')) {
            Schema::table('parties', function (Blueprint $t) {
                $t->string('city', 128)->nullable()->after('address')->index();
            });
        }

        // 12. parked_sales
        if (!Schema::hasTable('parked_sales')) {
            Schema::create('parked_sales', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->unsignedBigInteger('tenant_id')->index();
                $t->unsignedBigInteger('user_id')->nullable()->index();
                $t->unsignedBigInteger('customer_id')->nullable()->index();
                $t->json('cart_data')->nullable();
                $t->string('status', 32)->default('open')->index();
                $t->dateTime('resolved_at')->nullable()->index();
                $t->timestamps();

                $t->index(['tenant_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parked_sales');
        Schema::dropIfExists('label_print_jobs');

        if (Schema::hasTable('parties') && Schema::hasColumn('parties', 'city')) {
            Schema::table('parties', fn (Blueprint $t) => $t->dropColumn('city'));
        }
        if (Schema::hasTable('recurring_invoices') && Schema::hasColumn('recurring_invoices', 'cancelled_at')) {
            Schema::table('recurring_invoices', fn (Blueprint $t) => $t->dropColumn('cancelled_at'));
        }
        if (Schema::hasTable('proposals') && Schema::hasColumn('proposals', 'decided_at')) {
            Schema::table('proposals', fn (Blueprint $t) => $t->dropColumn('decided_at'));
        }
        if (Schema::hasTable('sales_orders') && Schema::hasColumn('sales_orders', 'fulfilled_at')) {
            Schema::table('sales_orders', fn (Blueprint $t) => $t->dropColumn('fulfilled_at'));
        }
        if (Schema::hasTable('stock_transfer_items') && Schema::hasColumn('stock_transfer_items', 'received_quantity')) {
            Schema::table('stock_transfer_items', fn (Blueprint $t) => $t->dropColumn('received_quantity'));
        }
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $t) {
                if (Schema::hasColumn('purchase_orders', 'closed_at')) $t->dropColumn('closed_at');
                if (Schema::hasColumn('purchase_orders', 'received_at')) $t->dropColumn('received_at');
            });
        }
        if (Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'recurring_expense_id')) {
            Schema::table('expenses', fn (Blueprint $t) => $t->dropColumn('recurring_expense_id'));
        }
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $t) {
                if (Schema::hasColumn('payments', 'bounced_at')) $t->dropColumn('bounced_at');
                if (Schema::hasColumn('payments', 'status')) $t->dropColumn('status');
            });
        }
        if (Schema::hasTable('product_serials')) {
            Schema::table('product_serials', function (Blueprint $t) {
                if (Schema::hasColumn('product_serials', 'status_changed_at')) $t->dropColumn('status_changed_at');
                if (Schema::hasColumn('product_serials', 'warranty_until')) $t->dropColumn('warranty_until');
                if (Schema::hasColumn('product_serials', 'sold_at')) $t->dropColumn('sold_at');
            });
        }
        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $t) {
                if (Schema::hasColumn('sale_items', 'sale_uom_qty')) $t->dropColumn('sale_uom_qty');
                if (Schema::hasColumn('sale_items', 'sale_uom')) $t->dropColumn('sale_uom');
                if (Schema::hasColumn('sale_items', 'entry_method')) $t->dropColumn('entry_method');
            });
        }
    }
};
