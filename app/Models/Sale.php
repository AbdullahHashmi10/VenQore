<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

/**
 * Sale Model — Phase 1.2: The Revenue Recognition State Machine
 *
 * Status values (canonical — Phase 1.2):
 *   draft     → Invoice being built. Zero financial footprint. No journal entry. No stock deduction.
 *   posted    → THE TRIGGER. Goods changed hands. Revenue recognized. Journal entry fired. Stock deducted.
 *   returned  → Reversal. Revenue un-recognized via counter-journal-entries.
 *   cancelled → Voided before posting. No financial footprint.
 *
 * posted_at → The authoritative timestamp of revenue recognition (accrual date).
 *             NULL means revenue has NOT been recognized yet (draft state).
 *             Non-null locks in the exact moment this sale became legally binding.
 *             ALL P&L and revenue date-range queries MUST filter by posted_at, not created_at.
 *
 * payment_status → UI indicator ONLY. Never used in financial calculations.
 *                  The ledger (journal_items WHERE account_id = Account 1200) is the
 *                  sole, authoritative truth for outstanding receivables.
 */
class Sale extends Model
{
    use HasFactory, SoftDeletes, HasUuids, HasTenant, \App\Traits\HasActivityLog;

    protected $guarded = [];

    protected $casts = [
        'posted_at' => 'datetime',
    ];

    // ─── Phase 1.2 Query Scopes ───────────────────────────────────────────────

    /**
     * Only include sales that have been formally posted (revenue recognized).
     * Use this scope in ALL financial and reporting queries.
     * Draft sales must never appear in P&L, dashboard revenue, or COGS calculations.
     */
    public function scopePosted($query)
    {
        return $query->where('status', 'posted')->whereNotNull('posted_at');
    }

    /**
     * Filter posted sales by their revenue recognition date (posted_at).
     * Use this instead of whereBetween('created_at', ...) in all P&L reports.
     * The distinction matters when a sale is created on one day and finalized on another.
     */
    public function scopePostedBetween($query, $start, $end)
    {
        return $query->where('status', 'posted')->whereBetween('posted_at', [$start, $end]);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    /** @deprecated Use party() — kept for backward compatibility */
    public function customer()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function getPaidAmountAttribute()
    {
        return $this->payments->sum('amount');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
