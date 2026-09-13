<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Phase 1.5 — R-4 Occupancy Unification (Deploy A)
 *
 * Creates two canonical tables:
 *   - positions   : the physical space (table, counter slot, delivery zone, etc.)
 *   - occupancies : an active session at a position (open bill, parked cart, etc.)
 *
 * Backfills shadow rows from existing restaurant_tables and parked_sales so the
 * two legacy systems and the new system run in parallel during the soak period.
 * The legacy tables are NOT dropped — dual-write is handled at the model level.
 *
 * Also adds the missing `expires_at` column to parked_sales (model already
 * declares it in $fillable and $casts but the column was never migrated).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Fix parked_sales: add missing expires_at column ───────────────
        if (Schema::hasTable('parked_sales') && !Schema::hasColumn('parked_sales', 'expires_at')) {
            Schema::table('parked_sales', function (Blueprint $table) {
                $table->timestamp('expires_at')->nullable()->after('customer_name');
            });
        }

        // ── 2. positions table ───────────────────────────────────────────────
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('zone', 48)->default('main');        // e.g. indoor, outdoor, delivery, counter
            $table->string('code', 24);                         // short display code, e.g. T01, C1
            $table->string('label', 80)->nullable();            // human friendly name
            $table->unsignedSmallInteger('capacity')->default(1);
            $table->string('status', 32)->default('active');
            $table->integer('sort_order')->default(0);
            $table->string('source_type', 32)->nullable();      // 'restaurant_table' | 'parked_sale_slot' etc.
            $table->unsignedBigInteger('source_id')->nullable(); // FK to legacy row
            $table->timestamps();

            $table->index(['tenant_id', 'zone']);
            $table->index(['tenant_id', 'status']);
        });

        // ── 3. occupancies table ─────────────────────────────────────────────
        Schema::create('occupancies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('position_id');
            $table->string('label', 80)->nullable();
            $table->json('session_data')->nullable();            // cart_data, order items, etc.
            $table->unsignedBigInteger('party_id')->nullable();  // linked customer
            $table->unsignedBigInteger('opened_by')->nullable(); // user_id
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('source_type', 48)->nullable();       // 'parked_sale' | 'restaurant_order'
            $table->string('source_id', 64)->nullable();         // UUID or bigint from legacy table
            $table->timestamps();

            $table->index(['tenant_id', 'position_id']);
            $table->index(['tenant_id', 'source_type', 'source_id']);
        });

        // ── 4. Backfill from restaurant_tables ───────────────────────────────
        if (Schema::hasTable('restaurant_tables')) {
            $tables = DB::table('restaurant_tables')->get();
            foreach ($tables as $rt) {
                $posId = DB::table('positions')->insertGetId([
                    'tenant_id'   => $rt->tenant_id,
                    'zone'        => 'dining',
                    'code'        => $rt->table_number,
                    'label'       => $rt->name ?? $rt->table_number,
                    'capacity'    => $rt->capacity ?? 4,
                    'status'      => $rt->status === 'available' ? 'active' : 'active',
                    'sort_order'  => $rt->id,
                    'source_type' => 'restaurant_table',
                    'source_id'   => $rt->id,
                    'created_at'  => $rt->created_at ?? now(),
                    'updated_at'  => $rt->updated_at ?? now(),
                ]);

                // If table is currently occupied, create an open occupancy
                if ($rt->status === 'occupied') {
                    DB::table('occupancies')->insert([
                        'tenant_id'   => $rt->tenant_id,
                        'position_id' => $posId,
                        'label'       => $rt->name ?? $rt->table_number,
                        'session_data'=> json_encode(['order_total' => $rt->order_total ?? 0]),
                        'opened_at'   => $rt->updated_at ?? now(),
                        'source_type' => 'restaurant_table',
                        'source_id'   => (string) $rt->id,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }

        // ── 5. Backfill from parked_sales ────────────────────────────────────
        // parked_sales use UUIDs; we create one shared "POS counter" position
        // per tenant and map each parked sale to an occupancy on it.
        if (Schema::hasTable('parked_sales')) {
            $tenantIds = DB::table('parked_sales')
                ->whereNotNull('tenant_id')
                ->distinct()
                ->pluck('tenant_id');

            // Create one "Counter" position per tenant for parked carts
            $counterPositions = [];
            foreach ($tenantIds as $tid) {
                $counterPositions[$tid] = DB::table('positions')->insertGetId([
                    'tenant_id'   => $tid,
                    'zone'        => 'counter',
                    'code'        => 'CTR',
                    'label'       => 'Counter (Parked)',
                    'capacity'    => 99,
                    'status'      => 'active',
                    'sort_order'  => 9999,
                    'source_type' => 'parked_sale_slot',
                    'source_id'   => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            $parkedSales = DB::table('parked_sales')
                ->whereNotNull('tenant_id')
                ->get();

            foreach ($parkedSales as $ps) {
                $posId = $counterPositions[$ps->tenant_id] ?? null;
                if (!$posId) continue;

                DB::table('occupancies')->insert([
                    'tenant_id'   => $ps->tenant_id,
                    'position_id' => $posId,
                    'label'       => $ps->customer_name ?? 'Parked Cart',
                    'session_data'=> $ps->cart_data,
                    'opened_by'   => $ps->user_id,
                    'opened_at'   => $ps->created_at ?? now(),
                    'expires_at'  => $ps->expires_at ?? null,
                    'source_type' => 'parked_sale',
                    'source_id'   => $ps->id,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('occupancies');
        Schema::dropIfExists('positions');

        if (Schema::hasTable('parked_sales') && Schema::hasColumn('parked_sales', 'expires_at')) {
            Schema::table('parked_sales', function (Blueprint $table) {
                $table->dropColumn('expires_at');
            });
        }
    }
};
