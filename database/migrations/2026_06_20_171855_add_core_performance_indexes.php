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
        // 1. sales Table
        if (Schema::hasTable('sales')) {
            // Check if idx_sales_tenant_posted exists
            if (Schema::hasIndex('sales', 'idx_sales_tenant_posted')) {
                // Check if it has the requested columns ['tenant_id', 'posted_at']
                $index = $this->getIndexInfo('sales', 'idx_sales_tenant_posted');
                if ($index && $index['columns'] !== ['tenant_id', 'posted_at']) {
                    // Drop it first
                    Schema::table('sales', function (Blueprint $t) {
                        $t->dropIndex('idx_sales_tenant_posted');
                    });
                }
            }

            // Create idx_sales_tenant_posted if not exists
            if (!Schema::hasIndex('sales', 'idx_sales_tenant_posted')) {
                if (Schema::hasColumns('sales', ['tenant_id', 'posted_at'])) {
                    Schema::table('sales', function (Blueprint $t) {
                        $t->index(['tenant_id', 'posted_at'], 'idx_sales_tenant_posted');
                    });
                }
            }

            // Create idx_sales_tenant_status if not exists
            if (!Schema::hasIndex('sales', 'idx_sales_tenant_status') && !$this->hasEquivalentIndex('sales', ['tenant_id', 'status'])) {
                if (Schema::hasColumns('sales', ['tenant_id', 'status'])) {
                    Schema::table('sales', function (Blueprint $t) {
                        $t->index(['tenant_id', 'status'], 'idx_sales_tenant_status');
                    });
                }
            }
        }

        // 2. sale_items Table
        if (Schema::hasTable('sale_items')) {
            if (!Schema::hasIndex('sale_items', 'idx_si_tenant_sale') && !$this->hasEquivalentIndex('sale_items', ['tenant_id', 'sale_id'])) {
                if (Schema::hasColumns('sale_items', ['tenant_id', 'sale_id'])) {
                    Schema::table('sale_items', function (Blueprint $t) {
                        $t->index(['tenant_id', 'sale_id'], 'idx_si_tenant_sale');
                    });
                }
            }
            if (!Schema::hasIndex('sale_items', 'idx_si_product') && !$this->hasEquivalentIndex('sale_items', ['product_id'])) {
                if (Schema::hasColumns('sale_items', ['product_id'])) {
                    Schema::table('sale_items', function (Blueprint $t) {
                        $t->index(['product_id'], 'idx_si_product');
                    });
                }
            }
        }

        // 3. journal_items Table
        if (Schema::hasTable('journal_items')) {
            if (!Schema::hasIndex('journal_items', 'idx_ji_account') && !$this->hasEquivalentIndex('journal_items', ['account_id'])) {
                if (Schema::hasColumns('journal_items', ['account_id'])) {
                    Schema::table('journal_items', function (Blueprint $t) {
                        $t->index(['account_id'], 'idx_ji_account');
                    });
                }
            }
        }

        // 4. journal_entries Table
        if (Schema::hasTable('journal_entries')) {
            if (!Schema::hasIndex('journal_entries', 'idx_je_tenant_date_rev') && !$this->hasEquivalentIndex('journal_entries', ['tenant_id', 'date', 'is_reversed'])) {
                if (Schema::hasColumns('journal_entries', ['tenant_id', 'date', 'is_reversed'])) {
                    Schema::table('journal_entries', function (Blueprint $t) {
                        $t->index(['tenant_id', 'date', 'is_reversed'], 'idx_je_tenant_date_rev');
                    });
                }
            }
        }

        // 5. stocks Table
        if (Schema::hasTable('stocks')) {
            if (!Schema::hasIndex('stocks', 'idx_stocks_tpw') && !$this->hasEquivalentIndex('stocks', ['tenant_id', 'product_id', 'warehouse_id'])) {
                if (Schema::hasColumns('stocks', ['tenant_id', 'product_id', 'warehouse_id'])) {
                    Schema::table('stocks', function (Blueprint $t) {
                        $t->index(['tenant_id', 'product_id', 'warehouse_id'], 'idx_stocks_tpw');
                    });
                }
            }
        }

        // 6. inventory_batches Table
        if (Schema::hasTable('inventory_batches')) {
            if (!Schema::hasIndex('inventory_batches', 'idx_ib_tpwc') && !$this->hasEquivalentIndex('inventory_batches', ['tenant_id', 'product_id', 'warehouse_id', 'created_at'])) {
                if (Schema::hasColumns('inventory_batches', ['tenant_id', 'product_id', 'warehouse_id', 'created_at'])) {
                    Schema::table('inventory_batches', function (Blueprint $t) {
                        $t->index(['tenant_id', 'product_id', 'warehouse_id', 'created_at'], 'idx_ib_tpwc');
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. sales Table
        if (Schema::hasTable('sales')) {
            if (Schema::hasIndex('sales', 'idx_sales_tenant_posted')) {
                $index = $this->getIndexInfo('sales', 'idx_sales_tenant_posted');
                if ($index && $index['columns'] === ['tenant_id', 'posted_at']) {
                    Schema::table('sales', function (Blueprint $t) {
                        $t->dropIndex('idx_sales_tenant_posted');
                    });
                    // Restore old index columns
                    Schema::table('sales', function (Blueprint $t) {
                        $t->index(['tenant_id', 'status', 'posted_at', 'deleted_at'], 'idx_sales_tenant_posted');
                    });
                }
            }
            if (Schema::hasIndex('sales', 'idx_sales_tenant_status')) {
                Schema::table('sales', function (Blueprint $t) {
                    $t->dropIndex('idx_sales_tenant_status');
                });
            }
        }

        // 2. sale_items Table
        if (Schema::hasTable('sale_items')) {
            if (Schema::hasIndex('sale_items', 'idx_si_tenant_sale')) {
                Schema::table('sale_items', function (Blueprint $t) {
                    $t->dropIndex('idx_si_tenant_sale');
                });
            }
            if (Schema::hasIndex('sale_items', 'idx_si_product')) {
                Schema::table('sale_items', function (Blueprint $t) {
                    $t->dropIndex('idx_si_product');
                });
            }
        }

        // 3. journal_items Table
        if (Schema::hasTable('journal_items')) {
            if (Schema::hasIndex('journal_items', 'idx_ji_account')) {
                Schema::table('journal_items', function (Blueprint $t) {
                    $t->dropIndex('idx_ji_account');
                });
            }
        }

        // 4. journal_entries Table
        if (Schema::hasTable('journal_entries')) {
            if (Schema::hasIndex('journal_entries', 'idx_je_tenant_date_rev')) {
                Schema::table('journal_entries', function (Blueprint $t) {
                    $t->dropIndex('idx_je_tenant_date_rev');
                });
            }
        }

        // 5. stocks Table
        if (Schema::hasTable('stocks')) {
            if (Schema::hasIndex('stocks', 'idx_stocks_tpw')) {
                Schema::table('stocks', function (Blueprint $t) {
                    $t->dropIndex('idx_stocks_tpw');
                });
            }
        }

        // 6. inventory_batches Table
        if (Schema::hasTable('inventory_batches')) {
            if (Schema::hasIndex('inventory_batches', 'idx_ib_tpwc')) {
                Schema::table('inventory_batches', function (Blueprint $t) {
                    $t->dropIndex('idx_ib_tpwc');
                });
            }
        }
    }

    /**
     * Helper to get index info by name.
     */
    private function getIndexInfo(string $table, string $name): ?array
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $name) {
                return $index;
            }
        }
        return null;
    }

    /**
     * Helper to check if an equivalent index already exists (matching the columns prefix).
     */
    private function hasEquivalentIndex(string $table, array $columns): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            $idxCols = $index['columns'];
            if (count($idxCols) >= count($columns)) {
                $slice = array_slice($idxCols, 0, count($columns));
                if ($slice === $columns) {
                    return true;
                }
            }
        }
        return false;
    }
};

