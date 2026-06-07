<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * V3 Foundation Migration — Phase 0
 *
 * All existing tables use UUID (char(36)) primary keys.
 * All new FKs to existing tables must also use char(36).
 *
 * New tables:
 *   - payment_allocations
 *   - party_snapshots
 *   - product_uom_conversions
 *   - product_price_tiers
 *   - discount_limits
 *   - disaster_claims
 *   - employees
 *   - disassembly_boms + disassembly_bom_items
 *   - system_settings
 *
 * Column additions to existing tables (safe, additive only):
 *   - journal_entries: idempotency_key, approved_by, narration, is_reversed, reversed_by
 *   - inventory_batches: batch_type, initial_qty, production_run_id
 *   - products: price_includes_tax, is_manufactured, is_expiry_tracked
 *
 * COA additions: 23 new accounts seeded via updateOrInsert
 */
return new class extends Migration
{
    public function up(): void
    {
        // ─────────────────────────────────────────────────────────────
        // payment_allocations
        // Links B4/B5 payment journal entries to sale/purchase invoices
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('payment_allocations')) {
            Schema::create('payment_allocations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                // FK to journal_entries (char 36 UUID)
                $table->char('payment_journal_entry_id', 36)->nullable()->index('pa_pje_idx');
                // FK to sales (char 36 UUID)
                $table->char('sale_id', 36)->nullable()->index('pa_sale_idx');
                // FK to purchases (char 36 UUID)
                $table->char('purchase_id', 36)->nullable()->index('pa_purchase_idx');
                $table->decimal('allocated_amount', 15, 2);
                $table->enum('status', ['active', 'reversed', 'written_off'])->default('active');
                $table->timestamps();
            });
        }

        // ─────────────────────────────────────────────────────────────
        // party_snapshots
        // Cached party balances — rebuilt by PartyService after every entry
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('party_snapshots')) {
            Schema::create('party_snapshots', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->char('party_id', 36)->index();
                // account_id: references accounts table
                $table->unsignedBigInteger('account_id')->nullable()->index();
                $table->string('account_code', 10)->nullable(); // Also store code for easy lookup
                $table->decimal('cached_balance', 15, 2)->default(0.00);
                $table->char('last_journal_id', 36)->nullable();
                $table->timestamp('last_updated_at')->nullable();
                $table->timestamps();

                $table->unique(['party_id', 'account_code'], 'ps_party_account_unique');
            });
        }

        // ─────────────────────────────────────────────────────────────
        // product_uom_conversions
        // UOM conversion factors for selling in different units (S-012)
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('product_uom_conversions')) {
            Schema::create('product_uom_conversions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->char('product_id', 36);
                $table->string('sale_uom', 20);
                $table->decimal('conversion_factor', 15, 6);
                $table->timestamps();

                $table->unique(['product_id', 'sale_uom'], 'puom_product_uom_unique');
                // No FK constraint — product FK already managed by products table
            });
        }

        // ─────────────────────────────────────────────────────────────
        // product_price_tiers
        // Tiered / bulk pricing per product (S-042)
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('product_price_tiers')) {
            Schema::create('product_price_tiers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->char('product_id', 36)->index('ppt_product_idx');
                $table->decimal('min_qty', 10, 4);
                $table->decimal('max_qty', 10, 4)->nullable();
                $table->decimal('unit_price', 15, 2);
                $table->timestamps();
            });
        }

        // ─────────────────────────────────────────────────────────────
        // discount_limits
        // Role-based maximum discount (S-044)
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('discount_limits')) {
            Schema::create('discount_limits', function (Blueprint $table) {
                $table->id(); // Simple auto-increment is fine here
                $table->string('role', 50)->unique();
                $table->decimal('max_discount_percent', 5, 2);
                $table->timestamps();
            });

            DB::table('discount_limits')->insert([
                ['role' => 'cashier', 'max_discount_percent' => 10.00, 'created_at' => now(), 'updated_at' => now()],
                ['role' => 'manager', 'max_discount_percent' => 50.00, 'created_at' => now(), 'updated_at' => now()],
                ['role' => 'admin',   'max_discount_percent' => 100.00, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // ─────────────────────────────────────────────────────────────
        // disaster_claims
        // Tracks B29 two-step insurance claim process
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('disaster_claims')) {
            Schema::create('disaster_claims', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->text('description');
                $table->char('loss_journal_entry_id', 36)->nullable();
                $table->char('recovery_journal_entry_id', 36)->nullable();
                $table->decimal('loss_amount', 15, 2);
                $table->decimal('recovery_amount', 15, 2)->default(0.00);
                $table->enum('status', ['loss_recorded', 'recovery_pending', 'closed'])->default('loss_recorded');
                $table->timestamps();
            });
        }

        // ─────────────────────────────────────────────────────────────
        // employees
        // HR foundation for payroll/settlement
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 200);
                $table->decimal('monthly_salary', 15, 2);
                $table->date('hire_date');
                $table->date('termination_date')->nullable();
                $table->enum('status', ['active', 'terminated'])->default('active');
                $table->decimal('commission_rate', 5, 2)->default(0.00);
                $table->char('party_id', 36)->nullable();
                $table->timestamps();
            });
        }

        // ─────────────────────────────────────────────────────────────
        // disassembly_boms + disassembly_bom_items
        // B30 set disassembly — allocation % must sum to 100%
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('disassembly_boms')) {
            Schema::create('disassembly_boms', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->char('product_id', 36)->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('disassembly_bom_items')) {
            Schema::create('disassembly_bom_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->char('disassembly_bom_id', 36)->index();
                $table->char('component_product_id', 36)->index();
                $table->decimal('allocation_percent', 5, 2);
                $table->timestamps();
            });
        }

        // ─────────────────────────────────────────────────────────────
        // system_settings
        // Global configuration key-value store
        // ─────────────────────────────────────────────────────────────
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->timestamps();
            });

            DB::table('system_settings')->insert([
                ['key' => 'roundoff_tolerance', 'value' => '1.00',  'created_at' => now(), 'updated_at' => now()],
                ['key' => 'period_lock_date',   'value' => null,    'created_at' => now(), 'updated_at' => now()],
                ['key' => 'max_future_days',    'value' => '30',    'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // ─────────────────────────────────────────────────────────────
        // Add missing columns to existing tables (additive only)
        // ─────────────────────────────────────────────────────────────

        // journal_entries: add V3 fields
        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                if (!Schema::hasColumn('journal_entries', 'idempotency_key')) {
                    $table->string('idempotency_key', 36)->nullable()->unique()->after('description');
                }
                if (!Schema::hasColumn('journal_entries', 'approved_by')) {
                    $table->char('approved_by', 36)->nullable()->after('idempotency_key');
                }
                if (!Schema::hasColumn('journal_entries', 'narration')) {
                    $table->text('narration')->nullable()->after('approved_by');
                }
                if (!Schema::hasColumn('journal_entries', 'is_reversed')) {
                    $table->boolean('is_reversed')->default(false)->after('narration');
                }
                if (!Schema::hasColumn('journal_entries', 'reversed_by')) {
                    $table->char('reversed_by', 36)->nullable()->after('is_reversed');
                }
                if (!Schema::hasColumn('journal_entries', 'reference_type')) {
                    // Map from existing source_type concept, keeping source_type too
                    $table->string('reference_type', 50)->nullable()->after('reversed_by');
                }
            });
        }

        // journal_items: add V3 fields
        if (Schema::hasTable('journal_items')) {
            Schema::table('journal_items', function (Blueprint $table) {
                if (!Schema::hasColumn('journal_items', 'party_id')) {
                    $table->char('party_id', 36)->nullable()->after('account_id');
                }
            });
        }

        // inventory_batches: add V3 fields
        if (Schema::hasTable('inventory_batches')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_batches', 'batch_type')) {
                    $table->string('batch_type', 20)->default('purchase')->after('warehouse_id');
                }
                if (!Schema::hasColumn('inventory_batches', 'initial_qty')) {
                    $table->decimal('initial_qty', 12, 4)->nullable()->after('batch_type');
                }
                if (!Schema::hasColumn('inventory_batches', 'production_run_id')) {
                    $table->char('production_run_id', 36)->nullable()->after('purchase_invoice_id');
                }
            });
        }

        // products: add V3 fields
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'price_includes_tax')) {
                    $table->boolean('price_includes_tax')->default(false)->after('tax_rate');
                }
                if (!Schema::hasColumn('products', 'is_manufactured')) {
                    $table->boolean('is_manufactured')->default(false)->after('price_includes_tax');
                }
                if (!Schema::hasColumn('products', 'is_expiry_tracked')) {
                    $table->boolean('is_expiry_tracked')->default(false)->after('is_manufactured');
                }
            });
        }

        // sales: ensure payment_status uses our enum values going forward
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!Schema::hasColumn('sales', 'source_order_id')) {
                    $table->char('source_order_id', 36)->nullable()->after('payment_status');
                }
            });
        }

        // ─────────────────────────────────────────────────────────────
        // Seed V3 Chart of Accounts
        // Uses updateOrInsert — safe to run multiple times
        // ─────────────────────────────────────────────────────────────
        if (Schema::hasTable('accounts')) {
            $newAccounts = [
                ['code' => '1150', 'name' => 'Work-In-Progress',            'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '1300', 'name' => 'Advance to Supplier',         'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '1350', 'name' => 'Employee Advance',            'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '1400', 'name' => 'Prepaid Expenses',            'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '1500', 'name' => 'Fixed Assets',                'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '1510', 'name' => 'Accumulated Depreciation',    'type' => 'contra_asset', 'normal_balance' => 'credit'],
                ['code' => '2100', 'name' => 'Customer Advance',            'type' => 'liability',    'normal_balance' => 'credit'],
                ['code' => '2300', 'name' => 'Input Tax Recoverable',       'type' => 'asset',        'normal_balance' => 'debit'],
                ['code' => '2400', 'name' => 'Salary Payable',              'type' => 'liability',    'normal_balance' => 'credit'],
                ['code' => '2500', 'name' => 'Loan Payable',                'type' => 'liability',    'normal_balance' => 'credit'],
                ['code' => '3100', 'name' => 'Retained Earnings',           'type' => 'equity',       'normal_balance' => 'credit'],
                ['code' => '4200', 'name' => 'Stock Adjustment Gain',       'type' => 'income',       'normal_balance' => 'credit'],
                ['code' => '5100', 'name' => 'Purchase Expense',            'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6200', 'name' => 'Charity Expense',             'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6300', 'name' => 'Stock Adjustment Loss',       'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6400', 'name' => 'Manufacturing Cost',          'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6410', 'name' => 'Applied Manufacturing Labor', 'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6500', 'name' => 'Loan Interest Expense',       'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6600', 'name' => 'Depreciation Expense',        'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6700', 'name' => 'Bad Debt Expense',            'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6800', 'name' => 'Gratuity & Severance',        'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6900', 'name' => 'Cash Shortage Loss',          'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6950', 'name' => 'Disaster Loss',               'type' => 'expense',      'normal_balance' => 'debit'],
                ['code' => '6960', 'name' => 'Insurance Recovery',          'type' => 'income',       'normal_balance' => 'credit'],
                ['code' => '7000', 'name' => 'Opening Balance Equity',      'type' => 'equity',       'normal_balance' => 'credit'],
            ];

            // Check what columns the accounts table actually has
            // Determine actual columns to avoid inserting non-existent columns
            $accountColumns = Schema::getColumnListing('accounts');
            $hasNormalBalance = in_array('normal_balance', $accountColumns);
            $hasIsSystem      = in_array('is_system', $accountColumns);

            // Add normal_balance column if missing (safe additive migration)
            if (!$hasNormalBalance) {
                Schema::table('accounts', function (Blueprint $table) {
                    $table->string('normal_balance', 10)->default('debit')->after('type');
                });
                $hasNormalBalance = true;
            }

            // The existing accounts TYPE enum is: asset, liability, equity, income, expense
            // Map contra_asset → asset (no contra_asset enum value exists)
            $typeMap = ['contra_asset' => 'asset'];

            foreach ($newAccounts as $account) {
                $resolvedType = $typeMap[$account['type']] ?? $account['type'];

                $updateData = [
                    'name'       => $account['name'],
                    'type'       => $resolvedType,
                    'updated_at' => now(),
                ];
                if ($hasNormalBalance) {
                    $updateData['normal_balance'] = $account['normal_balance'];
                }

                $exists = DB::table('accounts')->where('code', $account['code'])->exists();

                if ($exists) {
                    // Update the name/type/normal_balance if the account already exists
                    DB::table('accounts')
                        ->where('code', $account['code'])
                        ->update($updateData);
                } else {
                    // Insert new account with a fresh UUID as the primary key
                    $insertData = array_merge($updateData, [
                        'id'         => \Illuminate\Support\Str::uuid()->toString(),
                        'code'       => $account['code'],
                        'is_active'  => 1,
                        'created_at' => now(),
                    ]);
                    DB::table('accounts')->insert($insertData);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('disassembly_bom_items');
        Schema::dropIfExists('disassembly_boms');
        Schema::dropIfExists('disaster_claims');
        Schema::dropIfExists('discount_limits');
        Schema::dropIfExists('product_price_tiers');
        Schema::dropIfExists('product_uom_conversions');
        Schema::dropIfExists('party_snapshots');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('system_settings');
        // Note: columns added to existing tables are not reversed to avoid data loss
    }
};
