<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    // Sender types
    public const SENDER_VISITOR = 'visitor';
    public const SENDER_BOT = 'bot';
    public const SENDER_AGENT = 'agent';
    public const SENDER_SYSTEM = 'system';

    protected $fillable = [
        'session_id',
        'sender_type',
        'sender_id',
        'sender_name',
        'body',
        'metadata',
        'is_read',
        'delivered_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_read' => 'boolean',
        'delivered_at' => 'datetime',
    ];

    /**
     * Get the session this message belongs to.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(ChatSession::class, 'session_id');
    }

    /**
     * Get the sender (user) of this message, if applicable.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
