<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChequeDuplicateAuditLog extends Model
{
    use HasFactory, HasUuids, HasTenant;

    public $timestamps = false;

    protected $table = 'cheque_duplicate_audit_logs';

    protected $fillable = [
        'id',
        'tenant_id',
        'cheque_number',
        'normalized_cheque_number',
        'drawer_bank',
        'normalized_drawer_bank',
        'amount',
        'action',
        'reason',
        'existing_cheque_id',
        'user_id',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function existingCheque(): BelongsTo
    {
        return $this->belongsTo(ReceivedCheque::class, 'existing_cheque_id');
    }
}
