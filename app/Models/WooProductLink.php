<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WooProductLink extends Model
{
    protected $table = 'woo_product_links';

    protected $fillable = [
        'connection_id',
        'venqore_product_id',
        'woo_product_id',
        'sku',
        'sync_status',
        'conflict_data',
        'synced_fields',
        'last_synced_at',
    ];

    protected $casts = [
        'conflict_data'  => 'array',
        'synced_fields'  => 'array',
        'last_synced_at' => 'datetime',
        'woo_product_id' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function connection(): BelongsTo
    {
        return $this->belongsTo(WooConnection::class, 'connection_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'venqore_product_id');
    }

    public function syncQueue(): HasMany
    {
        return $this->hasMany(WooSyncQueue::class, 'product_link_id');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(WooSyncLog::class, 'product_link_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopeConflicts($query)
    {
        return $query->where('sync_status', 'conflict');
    }

    public function scopeStaged($query)
    {
        return $query->where('sync_status', 'staged');
    }

    public function scopeIgnored($query)
    {
        return $query->where('sync_status', 'ignored');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Mark this link as synced and record field snapshot.
     */
    public function markSynced(array $fieldSnapshot): void
    {
        $this->update([
            'sync_status'    => 'synced',
            'synced_fields'  => $fieldSnapshot,
            'conflict_data'  => null,
            'last_synced_at' => now(),
        ]);
    }

    /**
     * Flag a conflict with both sides stored.
     */
    public function flagConflict(array $venqoreSide, array $wooSide): void
    {
        $this->update([
            'sync_status'   => 'conflict',
            'conflict_data' => [
                'venqore'    => $venqoreSide,
                'woocommerce' => $wooSide,
                'detected_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
