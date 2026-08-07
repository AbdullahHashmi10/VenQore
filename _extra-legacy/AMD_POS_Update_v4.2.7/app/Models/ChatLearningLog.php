<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatLearningLog extends Model
{
    protected $table = 'chat_learning_logs';

    protected $fillable = [
        'chat_session_id',
        'agent_id',
        'category',
        'problem',
        'solution',
    ];

    /**
     * Get the chat session this log belongs to.
     */
    public function chatSession(): BelongsTo
    {
        return $this->belongsTo(ChatSession::class, 'chat_session_id');
    }

    /**
     * Get the agent who logged this learning record.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
