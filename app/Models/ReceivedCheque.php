<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceivedCheque extends Model
{
    use HasFactory, HasUuids, HasTenant;

    public const STATUS_RECEIVED  = 'received';
    public const STATUS_DEPOSITED = 'deposited';
    public const STATUS_CLEARED   = 'cleared';
    public const STATUS_BOUNCED   = 'bounced';
    public const STATUS_RETURNED  = 'returned';
    public const STATUS_CANCELLED = 'cancelled';

    public const VALID_STATUSES = [
        self::STATUS_RECEIVED,
        self::STATUS_DEPOSITED,
        self::STATUS_CLEARED,
        self::STATUS_BOUNCED,
        self::STATUS_RETURNED,
        self::STATUS_CANCELLED,
    ];

    protected $table = 'received_cheques';

    protected $fillable = [
        'tenant_id',
        'party_id',
        'payment_id',
        'sale_id',
        'journal_entry_id',
        'deposit_journal_entry_id',
        'cheque_number',
        'normalized_cheque_number',
        'drawer_name',
        'drawer_bank',
        'normalized_drawer_bank',
        'drawer_branch',
        'received_date',
        'cheque_date',
        'amount',
        'deposit_bank_account_id',
        'status',
        'deposited_at',
        'cleared_at',
        'bounced_at',
        'returned_at',
        'duplicate_fingerprint',
        'is_duplicate_override',
        'override_reason',
        'override_by',
        'override_at',
        'status_reason',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'                => 'decimal:2',
        'received_date'         => 'date',
        'cheque_date'           => 'date',
        'deposited_at'          => 'datetime',
        'cleared_at'            => 'datetime',
        'bounced_at'            => 'datetime',
        'returned_at'           => 'datetime',
        'is_duplicate_override' => 'boolean',
        'override_at'           => 'datetime',
    ];

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function depositBankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'deposit_bank_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function overrider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'override_by');
    }
}
