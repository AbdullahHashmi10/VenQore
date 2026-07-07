<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Offline-sale idempotency (GAPS C4 / IMPLEMENTATION T9).
//
// The POS client queues sales in IndexedDB (Dexie `sales_queue`) and replays them
// against this table's `store` route when connectivity returns. Previously the
// replay had no way to tell "the server already processed this sale but the
// response got lost" apart from "this sale was never sent" — so a lost response
// (server commits, network drops before the client sees the 200) caused an exact
// duplicate Sale row + a second FIFO stock deduction on the next retry.
//
// `client_sale_id` is a UUID the browser generates once, at the moment the sale is
// created (not at sync time), and resends unchanged on every retry of that same
// sale. The server can then treat a repeat client_sale_id as "already posted" and
// return the original sale instead of creating a new one.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'client_sale_id')) {
                $table->string('client_sale_id', 36)->nullable()->after('id');
            }
        });

        // Uniqueness is per-tenant, not global — two different tenants' clients could
        // (astronomically unlikely, but not impossible with a buggy client) generate
        // the same UUID, and that must not collide across tenants.
        if (!$this->indexExists('sales', 'sales_tenant_id_client_sale_id_unique')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->unique(['tenant_id', 'client_sale_id'], 'sales_tenant_id_client_sale_id_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if ($this->indexExists('sales', 'sales_tenant_id_client_sale_id_unique')) {
                $table->dropUnique('sales_tenant_id_client_sale_id_unique');
            }
            if (Schema::hasColumn('sales', 'client_sale_id')) {
                $table->dropColumn('client_sale_id');
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        // Plain information_schema check — no doctrine/dbal dependency required.
        $rows = Schema::getConnection()->select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
            [$table, $indexName]
        );
        return count($rows) > 0;
    }
};
