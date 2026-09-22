<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalTransition extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'reason_codes' => 'array',
        'metadata'     => 'array',
        'created_at'   => 'datetime',
    ];

    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function sourceRevision(): BelongsTo
    {
        return $this->belongsTo(ApprovalRevision::class, 'source_revision_id');
    }
}
