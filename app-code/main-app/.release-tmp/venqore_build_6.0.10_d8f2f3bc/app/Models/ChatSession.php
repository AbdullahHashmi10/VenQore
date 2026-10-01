<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasTenant;

class ChatSession extends Model
{
    use HasTenant;

    // Status Constants
    public const STATUS_BOT_ACTIVE = 'bot_active';
    public const STATUS_HUMAN_REQUESTED = 'human_requested';
    public const STATUS_AGENT_CLAIMED = 'agent_claimed';
    public const STATUS_AGENT_ACTIVE = 'agent_active';
    public const STATUS_IDLE_OFFLINE = 'idle_offline';
    public const STATUS_RESOLVED = 'resolved';

    protected $fillable = [
        'tenant_id',
        'session_uuid',
        'visitor_name',
        'visitor_email',
        'status',
        'sub_status',
        'claimed_by',
        'referred_to',
        'claimed_at',
        'claim_lock_token',
        'claim_lock_expires',
        'escalation_reason',
        'ticket_created',
        'ai_disabled',
        'last_message_at',
        'resolved_at',
    ];

    protected $casts = [
        'claimed_at' => 'datetime',
        'claim_lock_expires' => 'datetime',
        'last_message_at' => 'datetime',
        'resolved_at' => 'datetime',
        'ticket_created' => 'boolean',
        'ai_disabled' => 'boolean',
    ];

    /**
     * Get the messages for this chat session.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'session_id')->orderBy('created_at');
    }

    /**
     * Get the agent that claimed this session.
     */
    public function claimedByAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    /**
     * Get the agent this session was referred to.
     */
    public function referredToAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_to');
    }

    /**
     * Helper checks
     */
    public function isResolved(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }

    public function isBotActive(): bool
    {
        return $this->status === self::STATUS_BOT_ACTIVE;
    }

    public function isHumanRequested(): bool
    {
        return $this->status === self::STATUS_HUMAN_REQUESTED;
    }

    public function isAgentActive(): bool
    {
        return $this->status === self::STATUS_AGENT_ACTIVE;
    }
}
