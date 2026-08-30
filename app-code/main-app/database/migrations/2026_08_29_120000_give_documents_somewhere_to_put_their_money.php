<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Give the document tables somewhere to put what their screens have always
 * shown.
 *
 * Every one of these screens has had a discount box, a tax row and an amount-
 * paid field for as long as it has existed, and every one of them threw the
 * numbers away on save: a quotation could be discounted on screen and saved at
 * full price, a sales order could take a deposit that was never recorded, and
 * a recurring template's tax was lost the moment it raised an invoice. The
 * columns were missing, so the controllers had nowhere to write.
 *
 * Nothing here changes an existing value. Every column is nullable or defaults
 * to zero, so a document saved before today reads back exactly as it did.
 */
return new class extends Migration {

    /** Add a money column only where it is not already there. */
    private function money(Blueprint $t, string $name, string $after = null): void
    {
        $col = $t->decimal($name, 20, 4)->default(0);
        if ($after) $col->after($after);
    }

    public function up(): void
    {
        /* ── QUOTATIONS ──────────────────────────────────────────────────
           tax_amount and discount_amount are already there and have never
           been written; what is missing is carriage and the terms a quote is
           offered on. */
        if (Schema::hasTable('proposals')) {
            Schema::table('proposals', function (Blueprint $t) {
                if (!Schema::hasColumn('proposals', 'delivery_charge'))    $t->decimal('delivery_charge', 20, 4)->default(0);
                if (!Schema::hasColumn('proposals', 'extra_charge_value')) $t->decimal('extra_charge_value', 20, 4)->default(0);
                if (!Schema::hasColumn('proposals', 'extra_charge_label')) $t->string('extra_charge_label')->nullable();
                if (!Schema::hasColumn('proposals', 'tax_rate'))           $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('proposals', 'payment_terms'))      $t->string('payment_terms')->nullable();
                if (!Schema::hasColumn('proposals', 'reference'))          $t->string('reference')->nullable();
            });
        }

        /* ── SALES ORDERS ────────────────────────────────────────────────
           The money columns are already there and unwritten. What is genuinely
           new is the deposit: an order taken with money down is the normal
           case, and there has never been anywhere to record it. */
        if (Schema::hasTable('sales_orders')) {
            Schema::table('sales_orders', function (Blueprint $t) {
                if (!Schema::hasColumn('sales_orders', 'amount_paid'))        $t->decimal('amount_paid', 20, 4)->default(0);
                if (!Schema::hasColumn('sales_orders', 'payment_account_id')) $t->uuid('payment_account_id')->nullable();
                if (!Schema::hasColumn('sales_orders', 'payment_method'))     $t->string('payment_method')->nullable();
                if (!Schema::hasColumn('sales_orders', 'tax_rate'))           $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('sales_orders', 'payment_terms'))      $t->string('payment_terms')->nullable();
                if (!Schema::hasColumn('sales_orders', 'reference'))          $t->string('reference')->nullable();
                if (!Schema::hasColumn('sales_orders', 'journal_entry_id'))   $t->uuid('journal_entry_id')->nullable();
            });
        }

        /* ── PURCHASE ORDERS ─────────────────────────────────────────────
           `is_tax_inclusive` was the only tax-adjacent thing on the table and
           nothing ever read it. An order placed with a deposit is as ordinary
           on the buying side as on the selling side. */
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $t) {
                if (!Schema::hasColumn('purchase_orders', 'discount'))           $t->decimal('discount', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'tax'))                $t->decimal('tax', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'tax_rate'))           $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'delivery_charge'))    $t->decimal('delivery_charge', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'extra_charge_value')) $t->decimal('extra_charge_value', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'extra_charge_label')) $t->string('extra_charge_label')->nullable();
                if (!Schema::hasColumn('purchase_orders', 'amount_paid'))        $t->decimal('amount_paid', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_orders', 'payment_account_id')) $t->uuid('payment_account_id')->nullable();
                if (!Schema::hasColumn('purchase_orders', 'payment_terms'))      $t->string('payment_terms')->nullable();
                if (!Schema::hasColumn('purchase_orders', 'reference'))          $t->string('reference')->nullable();
                if (!Schema::hasColumn('purchase_orders', 'journal_entry_id'))   $t->uuid('journal_entry_id')->nullable();
            });
        }
        if (Schema::hasTable('purchase_order_items')) {
            Schema::table('purchase_order_items', function (Blueprint $t) {
                if (!Schema::hasColumn('purchase_order_items', 'discount'))      $t->decimal('discount', 20, 4)->default(0);
                if (!Schema::hasColumn('purchase_order_items', 'discount_type')) $t->string('discount_type')->default('fixed');
                if (!Schema::hasColumn('purchase_order_items', 'tax_rate'))      $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('purchase_order_items', 'free_quantity')) $t->decimal('free_quantity', 15, 4)->default(0);
            });
        }

        /* ── RECURRING INVOICES ──────────────────────────────────────────
           The table held a customer, a frequency and a bag of JSON. Everything
           else the template needs to raise a correct invoice — its discount,
           its tax, its carriage, its terms — had nowhere to live, so every
           invoice it raised came out at list price with no tax on it. */
        if (Schema::hasTable('recurring_invoices')) {
            Schema::table('recurring_invoices', function (Blueprint $t) {
                if (!Schema::hasColumn('recurring_invoices', 'name'))               $t->string('name')->nullable();
                if (!Schema::hasColumn('recurring_invoices', 'discount'))           $t->decimal('discount', 20, 4)->default(0);
                if (!Schema::hasColumn('recurring_invoices', 'tax'))                $t->decimal('tax', 20, 4)->default(0);
                if (!Schema::hasColumn('recurring_invoices', 'tax_rate'))           $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('recurring_invoices', 'delivery_charge'))    $t->decimal('delivery_charge', 20, 4)->default(0);
                if (!Schema::hasColumn('recurring_invoices', 'extra_charge_value')) $t->decimal('extra_charge_value', 20, 4)->default(0);
                if (!Schema::hasColumn('recurring_invoices', 'extra_charge_label')) $t->string('extra_charge_label')->nullable();
                if (!Schema::hasColumn('recurring_invoices', 'payment_terms'))      $t->string('payment_terms')->nullable();
                if (!Schema::hasColumn('recurring_invoices', 'notes'))              $t->text('notes')->nullable();
                if (!Schema::hasColumn('recurring_invoices', 'total_amount'))       $t->decimal('total_amount', 20, 4)->default(0);
            });
        }

        /* ── DEBIT NOTES ─────────────────────────────────────────────────
           `purchase_id` was already a column and was never written, so a note
           could not say which bill it was arguing with. The status enum also
           accepted a value the validator offered and the column refused. */
        if (Schema::hasTable('debit_notes')) {
            Schema::table('debit_notes', function (Blueprint $t) {
                if (!Schema::hasColumn('debit_notes', 'tax'))          $t->decimal('tax', 20, 4)->default(0);
                if (!Schema::hasColumn('debit_notes', 'tax_rate'))     $t->decimal('tax_rate', 8, 4)->default(0);
                if (!Schema::hasColumn('debit_notes', 'discount'))     $t->decimal('discount', 20, 4)->default(0);
                if (!Schema::hasColumn('debit_notes', 'warehouse_id')) $t->uuid('warehouse_id')->nullable();
                if (!Schema::hasColumn('debit_notes', 'notes'))        $t->text('notes')->nullable();
                if (!Schema::hasColumn('debit_notes', 'returns_stock')) $t->boolean('returns_stock')->default(false);
                if (!Schema::hasColumn('debit_notes', 'journal_entry_id')) $t->uuid('journal_entry_id')->nullable();
            });
        }

        /* ── SALE RETURNS ────────────────────────────────────────────────
           A return is written as a negative row in `sales`, which is workable,
           but it has never said WHICH sale it answers to. Without that there is
           no cap on what can be returned, and a return is a hole you can walk
           both stock and cash out through. */
        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'original_sale_id')) {
            Schema::table('sales', function (Blueprint $t) {
                $t->uuid('original_sale_id')->nullable()->index();
                $t->string('return_reason')->nullable();
            });
        }
        if (Schema::hasTable('sale_items') && !Schema::hasColumn('sale_items', 'original_sale_item_id')) {
            Schema::table('sale_items', function (Blueprint $t) {
                /* Which line of the original sale this line gives back, so the
                   cap is per line rather than per product. */
                $t->uuid('original_sale_item_id')->nullable()->index();
            });
        }

        /* ── EXPENSES ────────────────────────────────────────────────────
           One voucher covering rent AND utilities is an ordinary thing that the
           single-amount form could not express, so shops entered it twice. */
        if (!Schema::hasTable('expense_items')) {
            Schema::create('expense_items', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->uuid('tenant_id')->nullable()->index();
                $t->uuid('expense_id')->index();
                $t->uuid('expense_category_id')->nullable();
                $t->string('description')->nullable();
                $t->decimal('amount', 20, 4)->default(0);
                $t->decimal('tax_amount', 20, 4)->default(0);
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_items');

        $drop = [
            'proposals'            => ['delivery_charge', 'extra_charge_value', 'extra_charge_label', 'tax_rate', 'payment_terms', 'reference'],
            'sales_orders'         => ['amount_paid', 'payment_account_id', 'payment_method', 'tax_rate', 'payment_terms', 'reference', 'journal_entry_id'],
            'purchase_orders'      => ['discount', 'tax', 'tax_rate', 'delivery_charge', 'extra_charge_value', 'extra_charge_label', 'amount_paid', 'payment_account_id', 'payment_terms', 'reference', 'journal_entry_id'],
            'purchase_order_items' => ['discount', 'discount_type', 'tax_rate', 'free_quantity'],
            'recurring_invoices'   => ['name', 'discount', 'tax', 'tax_rate', 'delivery_charge', 'extra_charge_value', 'extra_charge_label', 'payment_terms', 'notes', 'total_amount'],
            'debit_notes'          => ['tax', 'tax_rate', 'discount', 'warehouse_id', 'notes', 'returns_stock', 'journal_entry_id'],
            'sales'                => ['original_sale_id', 'return_reason'],
            'sale_items'           => ['original_sale_item_id'],
        ];

        foreach ($drop as $table => $columns) {
            if (!Schema::hasTable($table)) continue;
            $present = array_values(array_filter($columns, fn ($c) => Schema::hasColumn($table, $c)));
            if ($present) {
                Schema::table($table, fn (Blueprint $t) => $t->dropColumn($present));
            }
        }
    }
};
