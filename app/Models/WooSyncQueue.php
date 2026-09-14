<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooSyncQueue extends Model
{
    protected $table = 'woo_sync_queue';

    protected $fillable = [
        'connection_id',
        'direction',
        'product_link_id',
        'payload',
        'status',
        'triggered_by',
        'error_message',
        'attempts',
        'process_after',
    ];

    protected $casts = [
        'payload'       => 'array',
        'process_after' => 'datetime',
        'attempts'      => 'integer',
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

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeStaged($query)
    {
        return $query->where('status', 'staged');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['staged', 'approved']);
    }

    public function scopeReadyToProcess($query)
    {
        return $query
            ->where('status', 'approved')
            ->where(function ($q) {
                $q->whereNull('process_after')
                  ->orWhere('process_after', '<=', now());
            });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Approve a staged queue entry for processing.
     */
    public function approve(): void
    {
        $this->update(['status' => 'approved']);
    }

    /**
     * Mark as failed with back-off delay.
     */
    public function fail(string $errorMessage): void
    {
        $backoff = min(60 * pow(2, $this->attempts), 3600); // max 1 hour
        $this->update([
            'status'        => 'failed',
            'error_message' => $errorMessage,
            'attempts'      => $this->attempts + 1,
            'process_after' => now()->addSeconds($backoff),
        ]);
    }

    /**
     * Retry a failed entry.
     */
    public function retry(): void
    {
        $this->update([
            'status'        => 'approved',
            'error_message' => null,
        ]);
    }
}
