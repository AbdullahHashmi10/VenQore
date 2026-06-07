<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenaKnowledgeBase extends Model
{
    protected $table = 'vena_knowledge_base';

    protected $fillable = [
        'session_uuid',
        'question',
        'vena_suggestion',
        'agent_answer',
        'was_edited',
        'edit_delta',
        'category',
        'times_seen',
        'ai_autonomous',
    ];

    protected $casts = [
        'was_edited'    => 'boolean',
        'ai_autonomous' => 'boolean',
        'times_seen'    => 'integer',
    ];
}
