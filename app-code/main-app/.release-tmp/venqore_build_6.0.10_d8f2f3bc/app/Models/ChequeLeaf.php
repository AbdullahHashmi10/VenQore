<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChequeLeaf extends Model
{
    use HasFactory, HasUuids, HasTenant;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_RESERVED  = 'reserved';
    public const STATUS_ISSUED    = 'issued';
    public const STATUS_CLEARED   = 'cleared';
    public const STATUS_BOUNCED   = 'bounced';
    public const STATUS_STOPPED   = 'stopped';
    public const STATUS_VOID      = 'void';

    public const VALID_STATUSES = [
        self::STATUS_AVAILABLE,
        self::STATUS_RESERVED,
        self::STATUS_ISSUED,
        self::STATUS_CLEARED,
        self::STATUS_BOUNCED,
        self::STATUS_STOPPED,
        self::STATUS_VOID,
    ];

    protected $table = 'cheque_leaves';

    protected $fillable = [
        'tenant_id',
        'cheque_book_id',
        'bank_account_id',
        'normalized_serial_number',
        'display_serial_number',
        'numeric_serial',
        'status',
        'reserved_by_approval_document_id',
        'payment_id',
        'party_id',
        'amount',
        'issue_date',
        'cheque_date',
        'cleared_at',
        'bounced_at',
        'voided_at',
        'stopped_at',
        'status_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'numeric_serial' => 'integer',
        'amount'         => 'decimal:2',
        'issue_date'     => 'date',
        'cheque_date'    => 'date',
        'cleared_at'     => 'datetime',
        'bounced_at'     => 'datetime',
        'voided_at'      => 'datetime',
        'stopped_at'     => 'datetime',
    ];

    public function chequeBook(): BelongsTo
    {
        return $this->belongsTo(ChequeBook::class, 'cheque_book_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }

    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'reserved_by_approval_document_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
