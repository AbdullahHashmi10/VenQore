<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRevision extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'revision_number' => 'integer',
        'payload'         => 'array',
    ];

    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    public function maker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'maker_id');
    }
}
