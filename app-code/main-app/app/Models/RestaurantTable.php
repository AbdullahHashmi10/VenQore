<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class RestaurantTable extends Model
{
    protected $fillable = [
        'tenant_id',
        'table_number',
        'name',
        'capacity',
        'status',
        'order_total',
    ];

    protected $casts = [
        'capacity'    => 'integer',
        'order_total' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class, 'table_id');
    }

    /**
     * Phase 1.5 — Dual-write position status and occupancy changes.
     * Mirrors table status mutations into positions/occupancies for soak-period validation.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saved(function (self $rt) {
            try {
                if (!DB::getSchemaBuilder()->hasTable('positions')) return;

                // Keep the mirrored position's label/capacity in sync
                DB::table('positions')
                    ->where('source_type', 'restaurant_table')
                    ->where('source_id', $rt->id)
                    ->update([
                        'label'      => $rt->name ?? $rt->table_number,
                        'capacity'   => $rt->capacity ?? 4,
                        'updated_at' => now(),
                    ]);

                // If table just became occupied, open an occupancy row
                if ($rt->status === 'occupied') {
                    $posId = DB::table('positions')
                        ->where('source_type', 'restaurant_table')
                        ->where('source_id', $rt->id)
                        ->value('id');

                    if ($posId) {
                        DB::table('occupancies')->updateOrInsert(
                            [
                                'source_type' => 'restaurant_table',
                                'source_id'   => (string) $rt->id,
                                'closed_at'   => null,
                            ],
                            [
                                'tenant_id'    => $rt->tenant_id,
                                'position_id'  => $posId,
                                'label'        => $rt->name ?? $rt->table_number,
                                'session_data' => json_encode(['order_total' => $rt->order_total ?? 0]),
                                'opened_at'    => now(),
                                'created_at'   => now(),
                                'updated_at'   => now(),
                            ]
                        );
                    }
                }

                // If table became available again, close any open occupancy
                if ($rt->status === 'available') {
                    DB::table('occupancies')
                        ->where('source_type', 'restaurant_table')
                        ->where('source_id', (string) $rt->id)
                        ->whereNull('closed_at')
                        ->update(['closed_at' => now(), 'updated_at' => now()]);
                }
            } catch (\Throwable) {
                // Best-effort during soak; never block primary write
            }
        });
    }
}
