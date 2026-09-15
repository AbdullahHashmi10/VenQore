<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooSyncLog extends Model
{
    protected $table = 'woo_sync_logs';

    // Logs are append-only — no updates
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $fillable = [
        'connection_id',
        'product_link_id',
        'action',
        'direction',
        'before',
        'after',
        'performed_by',
    ];

    protected $casts = [
        'before' => 'array',
        'after'  => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function connection(): BelongsTo
    {
        return $this->belongsTo(WooConnection::class, 'connection_id');
    }

    public function productLink(): BelongsTo
    {
        return $this->belongsTo(WooProductLink::class, 'product_link_id');
    }

    // ─── Factory helper ───────────────────────────────────────────────────────

    /**
     * Write a sync log entry.
     */
    public static function record(
        int $connectionId,
        string $action,
        string $direction = 'internal',
        ?array $before = null,
        ?array $after = null,
        ?int $productLinkId = null,
        string $performedBy = 'system'
    ): self {
        return static::create([
            'connection_id'   => $connectionId,
            'product_link_id' => $productLinkId,
            'action'          => $action,
            'direction'       => $direction,
            'before'          => $before,
            'after'           => $after,
            'performed_by'    => $performedBy,
        ]);
    }
}
