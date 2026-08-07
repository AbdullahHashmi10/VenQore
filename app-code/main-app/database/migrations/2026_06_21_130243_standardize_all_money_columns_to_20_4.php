<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // C2 fix: sanitize non-numeric values before widening (1292 fix)
        if (Schema::hasTable('accounts') && Schema::hasColumn('accounts', 'balance')) {
            DB::statement("UPDATE `accounts` SET `balance` = 0 WHERE CAST(`balance` AS CHAR) = 'NULL' OR CAST(`balance` AS CHAR) = ''");
        }
        if (Schema::hasTable('bank_accounts') && Schema::hasColumn('bank_accounts', 'current_balance')) {
            DB::statement("UPDATE `bank_accounts` SET `current_balance` = 0 WHERE CAST(`current_balance` AS CHAR) = 'NULL' OR CAST(`current_balance` AS CHAR) = ''");
        }
        if (Schema::hasTable('bank_accounts') && Schema::hasColumn('bank_accounts', 'opening_balance')) {
            DB::statement("UPDATE `bank_accounts` SET `opening_balance` = 0 WHERE CAST(`opening_balance` AS CHAR) = 'NULL' OR CAST(`opening_balance` AS CHAR) = ''");
        }
        if (Schema::hasTable('batches') && Schema::hasColumn('batches', 'mrp')) {
            DB::statement("UPDATE `batches` SET `mrp` = NULL WHERE CAST(`mrp` AS CHAR) = 'NULL' OR CAST(`mrp` AS CHAR) = ''");
        }
        if (Schema::hasTable('parties') && Schema::hasColumn('parties', 'credit_limit')) {
            DB::statement("UPDATE `parties` SET `credit_limit` = NULL WHERE CAST(`credit_limit` AS CHAR) = 'NULL' OR CAST(`credit_limit` AS CHAR) = ''");
        }
        if (Schema::hasTable('parties') && Schema::hasColumn('parties', 'default_discount')) {
            DB::statement("UPDATE `parties` SET `default_discount` = NULL WHERE CAST(`default_discount` AS CHAR) = 'NULL' OR CAST(`default_discount` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'discount')) {
            DB::statement("UPDATE `sales` SET `discount` = 0 WHERE CAST(`discount` AS CHAR) = 'NULL' OR CAST(`discount` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'global_discount')) {
            DB::statement("UPDATE `sales` SET `global_discount` = 0 WHERE CAST(`global_discount` AS CHAR) = 'NULL' OR CAST(`global_discount` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'net_sales')) {
            DB::statement("UPDATE `sales` SET `net_sales` = 0 WHERE CAST(`net_sales` AS CHAR) = 'NULL' OR CAST(`net_sales` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'subtotal_gross')) {
            DB::statement("UPDATE `sales` SET `subtotal_gross` = 0 WHERE CAST(`subtotal_gross` AS CHAR) = 'NULL' OR CAST(`subtotal_gross` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'tax')) {
            DB::statement("UPDATE `sales` SET `tax` = 0 WHERE CAST(`tax` AS CHAR) = 'NULL' OR CAST(`tax` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'tendered_amount')) {
            DB::statement("UPDATE `sales` SET `tendered_amount` = 0 WHERE CAST(`tendered_amount` AS CHAR) = 'NULL' OR CAST(`tendered_amount` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'total_item_discounts')) {
            DB::statement("UPDATE `sales` SET `total_item_discounts` = 0 WHERE CAST(`total_item_discounts` AS CHAR) = 'NULL' OR CAST(`total_item_discounts` AS CHAR) = ''");
        }
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'total_tax')) {
            DB::statement("UPDATE `sales` SET `total_tax` = 0 WHERE CAST(`total_tax` AS CHAR) = 'NULL' OR CAST(`total_tax` AS CHAR) = ''");
        }

        if (Schema::hasTable('accounts')) {
            Schema::table('accounts', function (Blueprint $table) {
                if (Schema::hasColumn('accounts', 'balance')) {
                    $table->decimal('balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('activities')) {
            Schema::table('activities', function (Blueprint $table) {
                if (Schema::hasColumn('activities', 'amount')) {
                    $table->decimal('amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('ai_recommendations')) {
            Schema::table('ai_recommendations', function (Blueprint $table) {
                if (Schema::hasColumn('ai_recommendations', 'potential_revenue')) {
                    $table->decimal('potential_revenue', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('bank_accounts')) {
            Schema::table('bank_accounts', function (Blueprint $table) {
                if (Schema::hasColumn('bank_accounts', 'current_balance')) {
                    $table->decimal('current_balance', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('bank_accounts', 'opening_balance')) {
                    $table->decimal('opening_balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('batches')) {
            Schema::table('batches', function (Blueprint $table) {
                if (Schema::hasColumn('batches', 'mrp')) {
                    $table->decimal('mrp', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('bom_items')) {
            Schema::table('bom_items', function (Blueprint $table) {
                if (Schema::hasColumn('bom_items', 'byproduct_nrv')) {
                    $table->decimal('byproduct_nrv', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('coupons')) {
            Schema::table('coupons', function (Blueprint $table) {
                if (Schema::hasColumn('coupons', 'discount_value')) {
                    $table->decimal('discount_value', 20, 4)->change();
                }
                if (Schema::hasColumn('coupons', 'max_discount')) {
                    $table->decimal('max_discount', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('coupon_redemptions')) {
            Schema::table('coupon_redemptions', function (Blueprint $table) {
                if (Schema::hasColumn('coupon_redemptions', 'discount_applied')) {
                    $table->decimal('discount_applied', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('customer_analytics')) {
            Schema::table('customer_analytics', function (Blueprint $table) {
                if (Schema::hasColumn('customer_analytics', 'average_order_value')) {
                    $table->decimal('average_order_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('customer_analytics', 'total_spent')) {
                    $table->decimal('total_spent', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('custom_charges')) {
            Schema::table('custom_charges', function (Blueprint $table) {
                if (Schema::hasColumn('custom_charges', 'default_amount')) {
                    $table->decimal('default_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('daily_snapshots')) {
            Schema::table('daily_snapshots', function (Blueprint $table) {
                if (Schema::hasColumn('daily_snapshots', 'cash_value')) {
                    $table->decimal('cash_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('daily_snapshots', 'expense_value')) {
                    $table->decimal('expense_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('daily_snapshots', 'payables_value')) {
                    $table->decimal('payables_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('daily_snapshots', 'purchases_value')) {
                    $table->decimal('purchases_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('daily_snapshots', 'receivables_value')) {
                    $table->decimal('receivables_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('daily_snapshots', 'sales_value')) {
                    $table->decimal('sales_value', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('debit_notes')) {
            Schema::table('debit_notes', function (Blueprint $table) {
                if (Schema::hasColumn('debit_notes', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('debit_note_items')) {
            Schema::table('debit_note_items', function (Blueprint $table) {
                if (Schema::hasColumn('debit_note_items', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->change();
                }
                if (Schema::hasColumn('debit_note_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('disaster_claims')) {
            Schema::table('disaster_claims', function (Blueprint $table) {
                if (Schema::hasColumn('disaster_claims', 'loss_amount')) {
                    $table->decimal('loss_amount', 20, 4)->change();
                }
                if (Schema::hasColumn('disaster_claims', 'recovery_amount')) {
                    $table->decimal('recovery_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('employees')) {
            Schema::table('employees', function (Blueprint $table) {
                if (Schema::hasColumn('employees', 'monthly_salary')) {
                    $table->decimal('monthly_salary', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                if (Schema::hasColumn('expenses', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
                if (Schema::hasColumn('expenses', 'tax_amount')) {
                    $table->decimal('tax_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('fund_transactions')) {
            Schema::table('fund_transactions', function (Blueprint $table) {
                if (Schema::hasColumn('fund_transactions', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
                if (Schema::hasColumn('fund_transactions', 'balance_after')) {
                    $table->decimal('balance_after', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('fund_transactions', 'balance_before')) {
                    $table->decimal('balance_before', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('gift_cards')) {
            Schema::table('gift_cards', function (Blueprint $table) {
                if (Schema::hasColumn('gift_cards', 'current_balance')) {
                    $table->decimal('current_balance', 20, 4)->change();
                }
                if (Schema::hasColumn('gift_cards', 'initial_value')) {
                    $table->decimal('initial_value', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('inventory_batches')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_batches', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->default(0.0000)->change();
                }
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (Schema::hasColumn('invoices', 'discount')) {
                    $table->decimal('discount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'discount_amount')) {
                    $table->decimal('discount_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'paid_amount')) {
                    $table->decimal('paid_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'tax')) {
                    $table->decimal('tax', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'tax_amount')) {
                    $table->decimal('tax_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoices', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('invoice_items')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                if (Schema::hasColumn('invoice_items', 'base_unit_cost')) {
                    $table->decimal('base_unit_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoice_items', 'discount_amount')) {
                    $table->decimal('discount_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoice_items', 'effective_unit_cost')) {
                    $table->decimal('effective_unit_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoice_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('invoice_items', 'total')) {
                    $table->decimal('total', 20, 4)->change();
                }
                if (Schema::hasColumn('invoice_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('journal_items')) {
            Schema::table('journal_items', function (Blueprint $table) {
                if (Schema::hasColumn('journal_items', 'credit')) {
                    $table->decimal('credit', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('journal_items', 'debit')) {
                    $table->decimal('debit', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('parties')) {
            Schema::table('parties', function (Blueprint $table) {
                if (Schema::hasColumn('parties', 'credit_limit')) {
                    $table->decimal('credit_limit', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('parties', 'current_balance')) {
                    $table->decimal('current_balance', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('parties', 'default_discount')) {
                    $table->decimal('default_discount', 20, 4)->nullable()->default(0.00)->change();
                }
                if (Schema::hasColumn('parties', 'opening_balance')) {
                    $table->decimal('opening_balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('party_snapshots')) {
            Schema::table('party_snapshots', function (Blueprint $table) {
                if (Schema::hasColumn('party_snapshots', 'cached_balance')) {
                    $table->decimal('cached_balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (Schema::hasColumn('payments', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('payment_allocations')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                if (Schema::hasColumn('payment_allocations', 'allocated_amount')) {
                    $table->decimal('allocated_amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('plans')) {
            Schema::table('plans', function (Blueprint $table) {
                if (Schema::hasColumn('plans', 'price_annual')) {
                    $table->decimal('price_annual', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('plans', 'price_annual_pkr')) {
                    $table->decimal('price_annual_pkr', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('plans', 'price_lifetime')) {
                    $table->decimal('price_lifetime', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('plans', 'price_lifetime_pkr')) {
                    $table->decimal('price_lifetime_pkr', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('plans', 'price_monthly')) {
                    $table->decimal('price_monthly', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('plans', 'price_monthly_pkr')) {
                    $table->decimal('price_monthly_pkr', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('production_logs')) {
            Schema::table('production_logs', function (Blueprint $table) {
                if (Schema::hasColumn('production_logs', 'actual_cost')) {
                    $table->decimal('actual_cost', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('production_log_ingredients')) {
            Schema::table('production_log_ingredients', function (Blueprint $table) {
                if (Schema::hasColumn('production_log_ingredients', 'cost_at_time')) {
                    $table->decimal('cost_at_time', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('production_runs')) {
            Schema::table('production_runs', function (Blueprint $table) {
                if (Schema::hasColumn('production_runs', 'labor_cost')) {
                    $table->decimal('labor_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('production_runs', 'material_cost')) {
                    $table->decimal('material_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('production_runs', 'total_cost')) {
                    $table->decimal('total_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('production_runs', 'wip_balance')) {
                    $table->decimal('wip_balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('production_run_materials')) {
            Schema::table('production_run_materials', function (Blueprint $table) {
                if (Schema::hasColumn('production_run_materials', 'total_cost')) {
                    $table->decimal('total_cost', 20, 4)->change();
                }
                if (Schema::hasColumn('production_run_materials', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'cost_price')) {
                    $table->decimal('cost_price', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('products', 'price')) {
                    $table->decimal('price', 20, 4)->change();
                }
                if (Schema::hasColumn('products', 'wholesale_price')) {
                    $table->decimal('wholesale_price', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('product_price_tiers')) {
            Schema::table('product_price_tiers', function (Blueprint $table) {
                if (Schema::hasColumn('product_price_tiers', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('product_variants')) {
            Schema::table('product_variants', function (Blueprint $table) {
                if (Schema::hasColumn('product_variants', 'cost_price')) {
                    $table->decimal('cost_price', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('product_variants', 'price')) {
                    $table->decimal('price', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('product_variants', 'wholesale_price')) {
                    $table->decimal('wholesale_price', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('proposals')) {
            Schema::table('proposals', function (Blueprint $table) {
                if (Schema::hasColumn('proposals', 'discount_amount')) {
                    $table->decimal('discount_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('proposals', 'estimated_cost')) {
                    $table->decimal('estimated_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('proposals', 'tax_amount')) {
                    $table->decimal('tax_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('proposals', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('proposal_items')) {
            Schema::table('proposal_items', function (Blueprint $table) {
                if (Schema::hasColumn('proposal_items', 'discount')) {
                    $table->decimal('discount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('proposal_items', 'total')) {
                    $table->decimal('total', 20, 4)->change();
                }
                if (Schema::hasColumn('proposal_items', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('proposal_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if (Schema::hasColumn('purchases', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('purchases', 'tax')) {
                    $table->decimal('tax', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('purchases', 'total')) {
                    $table->decimal('total', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_items', 'line_total')) {
                    $table->decimal('line_total', 20, 4)->change();
                }
                if (Schema::hasColumn('purchase_items', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_orders', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_order_items')) {
            Schema::table('purchase_order_items', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_order_items', 'total_cost')) {
                    $table->decimal('total_cost', 20, 4)->change();
                }
                if (Schema::hasColumn('purchase_order_items', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_proposals')) {
            Schema::table('purchase_proposals', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_proposals', 'estimated_total')) {
                    $table->decimal('estimated_total', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_proposal_items')) {
            Schema::table('purchase_proposal_items', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_proposal_items', 'estimated_cost')) {
                    $table->decimal('estimated_cost', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_returns', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('quotations')) {
            Schema::table('quotations', function (Blueprint $table) {
                if (Schema::hasColumn('quotations', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('quotation_items')) {
            Schema::table('quotation_items', function (Blueprint $table) {
                if (Schema::hasColumn('quotation_items', 'line_total')) {
                    $table->decimal('line_total', 20, 4)->change();
                }
                if (Schema::hasColumn('quotation_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('recipes')) {
            Schema::table('recipes', function (Blueprint $table) {
                if (Schema::hasColumn('recipes', 'estimated_cost')) {
                    $table->decimal('estimated_cost', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('recipes', 'labor_cost')) {
                    $table->decimal('labor_cost', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('recipes', 'overhead_cost')) {
                    $table->decimal('overhead_cost', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('recipe_ingredients')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                if (Schema::hasColumn('recipe_ingredients', 'cost_per_unit')) {
                    $table->decimal('cost_per_unit', 20, 4)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (Schema::hasColumn('sales', 'discount')) {
                    $table->decimal('discount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales', 'global_discount')) {
                    $table->decimal('global_discount', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sales', 'gross_platform_fee')) {
                    $table->decimal('gross_platform_fee', 20, 4)->nullable()->change();
                }
                if (Schema::hasColumn('sales', 'invoice_total')) {
                    $table->decimal('invoice_total', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sales', 'net_sales')) {
                    $table->decimal('net_sales', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sales', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->change();
                }
                if (Schema::hasColumn('sales', 'subtotal_gross')) {
                    $table->decimal('subtotal_gross', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sales', 'tax')) {
                    $table->decimal('tax', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales', 'tendered_amount')) {
                    $table->decimal('tendered_amount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales', 'total')) {
                    $table->decimal('total', 20, 4)->change();
                }
                if (Schema::hasColumn('sales', 'total_item_discounts')) {
                    $table->decimal('total_item_discounts', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sales', 'total_tax')) {
                    $table->decimal('total_tax', 20, 4)->default(0.0000)->change();
                }
            });
        }

        if (Schema::hasTable('sales_orders')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                if (Schema::hasColumn('sales_orders', 'discount')) {
                    $table->decimal('discount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales_orders', 'extra_charge_value')) {
                    $table->decimal('extra_charge_value', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales_orders', 'tax')) {
                    $table->decimal('tax', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales_orders', 'total_amount')) {
                    $table->decimal('total_amount', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('sales_order_items')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                if (Schema::hasColumn('sales_order_items', 'discount')) {
                    $table->decimal('discount', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sales_order_items', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->change();
                }
                if (Schema::hasColumn('sales_order_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $table) {
                if (Schema::hasColumn('sale_items', 'cost_price')) {
                    $table->decimal('cost_price', 20, 4)->default(0.00)->change();
                }
                if (Schema::hasColumn('sale_items', 'discount_amount')) {
                    $table->decimal('discount_amount', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_items', 'gross_amount')) {
                    $table->decimal('gross_amount', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_items', 'line_total')) {
                    $table->decimal('line_total', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_items', 'net_amount')) {
                    $table->decimal('net_amount', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_items', 'subtotal')) {
                    $table->decimal('subtotal', 20, 4)->change();
                }
                if (Schema::hasColumn('sale_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_items', 'unit_price')) {
                    $table->decimal('unit_price', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('sale_item_batches')) {
            Schema::table('sale_item_batches', function (Blueprint $table) {
                if (Schema::hasColumn('sale_item_batches', 'total_cogs')) {
                    $table->decimal('total_cogs', 20, 4)->default(0.0000)->change();
                }
                if (Schema::hasColumn('sale_item_batches', 'unit_cost')) {
                    $table->decimal('unit_cost', 20, 4)->default(0.0000)->change();
                }
            });
        }

        if (Schema::hasTable('stock_take_items')) {
            Schema::table('stock_take_items', function (Blueprint $table) {
                if (Schema::hasColumn('stock_take_items', 'cost_price')) {
                    $table->decimal('cost_price', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('store_credits')) {
            Schema::table('store_credits', function (Blueprint $table) {
                if (Schema::hasColumn('store_credits', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('store_credit_balances')) {
            Schema::table('store_credit_balances', function (Blueprint $table) {
                if (Schema::hasColumn('store_credit_balances', 'balance')) {
                    $table->decimal('balance', 20, 4)->default(0.00)->change();
                }
            });
        }

        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (Schema::hasColumn('transactions', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
                if (Schema::hasColumn('transactions', 'running_balance')) {
                    $table->decimal('running_balance', 20, 4)->change();
                }
            });
        }

        if (Schema::hasTable('transaction_allocations')) {
            Schema::table('transaction_allocations', function (Blueprint $table) {
                if (Schema::hasColumn('transaction_allocations', 'amount')) {
                    $table->decimal('amount', 20, 4)->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     * Note: irreversible precision-widening. Reverting to decimal(x, 2) could truncate sub-cent values.
     * Restore database from backup if revert is required.
     */
    public function down(): void
    {
        // No-op
    }
};
