<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\DB;

class ParkedSale extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'cart_data',
        'user_id',
        'customer_name',
        'expires_at',
        'tenant_id',
    ];

    protected $casts = [
        'cart_data' => 'array',
        'expires_at' => 'datetime',
    ];

    // Scope to get only non-expired parked sales
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())
            ->orWhereNull('expires_at');
    }

    // Check if parked sale is expired
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Virtual accessor for items count
    public function getItemsCountAttribute()
    {
        return is_array($this->cart_data) ? count($this->cart_data) : 0;
    }

    // Virtual accessor for total amount
    public function getTotalAmountAttribute()
    {
        if (!is_array($this->cart_data)) {
            return 0;
        }

        return collect($this->cart_data)->sum(function ($item) {
            return ($item['quantity'] ?? 0) * ($item['price'] ?? 0);
        });
    }
    /**
     * Phase 1.5 — Dual-write to occupancies table for shadow-compare soak.
     * The legacy parked_sales table remains the source of truth; this mirrors
     * mutations into occupancies so we can validate parity before switching.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saved(function (self $ps) {
            try {
                if (!DB::getSchemaBuilder()->hasTable('occupancies')) return;
                $tenantId = $ps->tenant_id;
                if (!$tenantId) return;

                // Ensure a counter position exists for this tenant
                $posId = DB::table('positions')
                    ->where('tenant_id', $tenantId)
                    ->where('source_type', 'parked_sale_slot')
                    ->value('id');

                if (!$posId) {
                    $posId = DB::table('positions')->insertGetId([
                        'tenant_id'   => $tenantId,
                        'zone'        => 'counter',
                        'code'        => 'CTR',
                        'label'       => 'Counter (Parked)',
                        'capacity'    => 99,
                        'status'      => 'active',
                        'sort_order'  => 9999,
                        'source_type' => 'parked_sale_slot',
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }

                DB::table('occupancies')->updateOrInsert(
                    ['source_type' => 'parked_sale', 'source_id' => (string) $ps->id],
                    [
                        'tenant_id'    => $tenantId,
                        'position_id'  => $posId,
                        'label'        => $ps->customer_name ?? 'Parked Cart',
                        'session_data' => is_array($ps->cart_data) ? json_encode($ps->cart_data) : $ps->cart_data,
                        'opened_by'    => $ps->user_id,
                        'opened_at'    => $ps->created_at ?? now(),
                        'expires_at'   => $ps->expires_at,
                        'closed_at'    => null,
                        'updated_at'   => now(),
                        'created_at'   => $ps->created_at ?? now(),
                    ]
                );
            } catch (\Throwable) {
                // Dual-write is best-effort during soak; never break primary write path
            }
        });

        static::deleted(function (self $ps) {
            try {
                if (!DB::getSchemaBuilder()->hasTable('occupancies')) return;
                DB::table('occupancies')
                    ->where('source_type', 'parked_sale')
                    ->where('source_id', (string) $ps->id)
                    ->update(['closed_at' => now(), 'updated_at' => now()]);
            } catch (\Throwable) {
                // Best-effort
            }
        });
    }
}
