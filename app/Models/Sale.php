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
        'posted_at'             => 'datetime',
        'is_dropship'           => 'boolean',
        'financial_reconciled'  => 'boolean',
        'gross_platform_fee'    => 'decimal:4',
    ];

    protected $appends = ['paid_amount', 'total_amount', 'customer_prev_balance', 'customer_net_balance'];

    public function getTotalAmountAttribute()
    {
        return (float) ($this->invoice_total ?? $this->total ?? 0);
    }

    public function getCustomerNetBalanceAttribute()
    {
        if (!$this->relationLoaded('customer') || !$this->customer) {
            return null;
        }

        $tenantId = $this->tenant_id;
        $arAccount = \App\Models\Account::where('code', '1200')->where('tenant_id', $tenantId)->value('id') ?? 0;
        $apAccount = \App\Models\Account::where('code', '2000')->where('tenant_id', $tenantId)->value('id') ?? 0;

        $netAR = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->party_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
            ->value('balance') ?? 0;

        $netAP = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->party_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
            ->value('balance') ?? 0;

        return (float)$netAR - (float)$netAP;
    }

    public function getCustomerPrevBalanceAttribute()
    {
        $net = $this->customer_net_balance;
        if ($net === null) {
            return null;
        }
        $invoiceTotal = (float) ($this->invoice_total ?? $this->total ?? 0);
        $amountPaid = (float) $this->paid_amount;
        $balanceDue = max(0, $invoiceTotal - $amountPaid);
        return $net - $balanceDue;
    }

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

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class, 'reference', 'id')->where('reference_type', 'sale');
    }

    // ─── VenSynQ Relationships ────────────────────────────────────────────────

    public function ecommerceChannel()
    {
        return $this->belongsTo(EcommerceChannel::class);
    }

    /**
     * JIT purchase drafts auto-generated for shortfall items on this sale.
     * One draft per shortfall SKU, not per sale.
     */
    public function jitPurchases()
    {
        return $this->hasMany(PurchaseOrder::class, 'jit_sale_id');
    }

    // ─── VenSynQ Scopes ───────────────────────────────────────────────────────

    public function scopeDropship($query)
    {
        return $query->where('is_dropship', true);
    }

    public function scopePendingDispatch($query)
    {
        return $query->where('is_dropship', true)->where('dispatch_status', 'pending');
    }

    public function scopeUnreconciled($query)
    {
        return $query->where('is_dropship', true)->where('financial_reconciled', false);
    }
}
