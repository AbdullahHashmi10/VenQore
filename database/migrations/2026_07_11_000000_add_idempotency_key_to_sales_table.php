<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * L038 — Idempotency protection for the primary online /sales endpoint.
 *
 * Adds a nullable, per-tenant-unique idempotency key to the sales table so a
 * network retry or double-click cannot double-post revenue and inventory.
 * Uniqueness is scoped to (tenant_id, idempotency_key) so two different stores
 * can reuse the same client-generated key without colliding.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'idempotency_key')) {
                $table->string('idempotency_key', 100)->nullable()->after('reference_number');
                $table->unique(['tenant_id', 'idempotency_key'], 'sales_tenant_idempotency_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'idempotency_key')) {
                $table->dropUnique('sales_tenant_idempotency_unique');
                $table->dropColumn('idempotency_key');
            }
        });
    }
};
