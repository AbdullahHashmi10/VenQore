<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ToolLead — a capture from a /tools/* free tool.
 *
 * PLATFORM-LEVEL MODEL. No tenant scoping — never join or filter this
 * against Tenant/TenantUser. See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §4.3.
 *
 * Do not write to this model directly from a controller — always go
 * through App\Services\Tools\ToolLeadService::capture() so the consent
 * audit trail (consent_ip/consent_user_agent/consent_at/consent_text_hash)
 * and the tool_lead_events log stay correct.
 */
class ToolLead extends Model
{
    protected $fillable = [
        'email', 'name', 'company',
        'tool_slug', 'deliverable', 'context', 'country', 'referrer', 'utm',
        'marketing_consent', 'consent_text_hash', 'consent_ip', 'consent_user_agent', 'consent_at',
        'confirm_token', 'confirm_sent_at', 'confirmed_at',
        'status', 'unsubscribe_token', 'unsubscribed_at', 'last_emailed_at',
    ];

    protected $casts = [
        'context'            => 'array',
        'utm'                => 'array',
        'marketing_consent'  => 'boolean',
        'consent_at'         => 'datetime',
        'confirm_sent_at'    => 'datetime',
        'confirmed_at'       => 'datetime',
        'unsubscribed_at'    => 'datetime',
        'last_emailed_at'    => 'datetime',
    ];

    /**
     * Attributes that must NEVER be mass-assigned from request input.
     * ToolLeadService sets these explicitly and deliberately.
     */
    protected $guarded_by_service = [
        'consent_ip', 'consent_user_agent', 'consent_at', 'consent_text_hash',
        'confirm_token', 'unsubscribe_token', 'status',
    ];

    public function events(): HasMany
    {
        return $this->hasMany(ToolLeadEvent::class);
    }

    /**
     * Eligible for a promotional/marketing send right now.
     * Does NOT check email_suppressions — callers must check that separately
     * (EmailSuppression::isSuppressed()) since suppression is keyed by email,
     * not by lead row, and one email can have several lead rows.
     */
    public function isMarketingEligible(): bool
    {
        return $this->marketing_consent === true
            && $this->status === 'confirmed'
            && $this->confirmed_at !== null
            && $this->unsubscribed_at === null;
    }
}
