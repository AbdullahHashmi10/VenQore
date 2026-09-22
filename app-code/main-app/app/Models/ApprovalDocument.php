<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalDocument extends Model
{
    use HasFactory, HasTenant;

    public const STATUS_DRAFT     = 'draft';
    public const STATUS_PENDING   = 'pending';
    public const STATUS_RETURNED  = 'returned';
    public const STATUS_APPROVED  = 'approved';
    public const STATUS_REJECTED  = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    public const VALID_STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PENDING,
        self::STATUS_RETURNED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_WITHDRAWN,
    ];

    public const TYPE_CUSTOMER_RECEIPT  = 'customer_receipt';
    public const TYPE_SUPPLIER_PAYMENT  = 'supplier_payment';
    public const TYPE_SALES_INVOICE     = 'sales_invoice';
    public const TYPE_OPERATING_EXPENSE = 'operating_expense';

    public const SUPPORTED_TYPES = [
        self::TYPE_CUSTOMER_RECEIPT,
        self::TYPE_SUPPLIER_PAYMENT,
        self::TYPE_SALES_INVOICE,
        self::TYPE_OPERATING_EXPENSE,
    ];

    protected $guarded = ['id'];

    protected $casts = [
        'amount'    => 'decimal:2',
        'version'   => 'integer',
        'metadata'  => 'array',
        'posted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function maker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'maker_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function currentRevision(): BelongsTo
    {
        return $this->belongsTo(ApprovalRevision::class, 'current_revision_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(ApprovalRevision::class, 'approval_document_id')->orderBy('revision_number', 'asc');
    }

    public function transitions(): HasMany
    {
        return $this->hasMany(ApprovalTransition::class, 'approval_document_id')->orderBy('created_at', 'asc');
    }

    public function latestRevision(): ?ApprovalRevision
    {
        return ApprovalRevision::where('approval_document_id', $this->id)->orderByDesc('revision_number')->first();
    }
}
