<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * A short-lived conversational-invoice draft. NOT an invoice.
 *
 * Deliberately has no HasTenant global scope: every access goes through
 * App\Services\InvoiceAssistant\DraftRepository, which scopes explicitly on
 * tenant AND user and returns 404 for anything else.
 */
class InvoiceAssistantDraft extends Model
{
    use HasUuids;

    public const INTERPRETING        = 'interpreting';
    public const NEEDS_CLARIFICATION = 'needs_clarification';
    public const RESOLVING           = 'resolving';
    public const READY_FOR_REVIEW    = 'ready_for_review';
    public const HANDED_OFF          = 'handed_off';
    public const FAILED              = 'failed';
    public const CANCELLED           = 'cancelled';
    public const EXPIRED             = 'expired';

    /** States an operator can still act on. */
    public const ACTIVE = [self::INTERPRETING, self::NEEDS_CLARIFICATION, self::RESOLVING, self::READY_FOR_REVIEW];

    protected $table = 'invoice_assistant_drafts';

    protected $guarded = [];

    protected $casts = [
        'intent'        => 'array',
        'choices'       => 'array',
        'resolved'      => 'array',
        'unresolved'    => 'array',
        'request_log'   => 'array',
        'revision'      => 'integer',
        'turns'         => 'integer',
        'schema_version' => 'integer',
        'expires_at'    => 'datetime',
        'handed_off_at' => 'datetime',
        'claimed_at'    => 'datetime',
        'applied_at'    => 'datetime',
    ];

    protected $hidden = ['claim_token', 'request_log', 'create_request_id'];

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE, true);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
