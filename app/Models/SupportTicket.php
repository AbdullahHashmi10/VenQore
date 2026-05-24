<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Traits\HasTenant;

class SupportTicket extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'submitted_by', 'subject', 'message',
        'status', 'priority', 'requester_email', 'requester_name', 'resolved_at',
    ];

    protected $casts = ['resolved_at' => 'datetime'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(SupportTicketReply::class, 'ticket_id')->orderBy('created_at');
    }

    // Status helpers
    public function isOpen(): bool     { return $this->status === 'open'; }
    public function isResolved(): bool { return in_array($this->status, ['resolved', 'closed']); }

    public static function openCount(): int
    {
        return static::whereIn('status', ['open', 'in_progress'])->count();
    }
}
