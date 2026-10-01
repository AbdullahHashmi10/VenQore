<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountingLockException extends Model
{
    use HasUuids, HasFactory, HasTenant;

    public const SCOPE_USER      = 'user';
    public const SCOPE_ALL_USERS = 'all_users';

    protected $guarded = ['id'];

    protected $casts = [
        'valid_from' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'is_active'  => 'boolean',
    ];

    public function lock()
    {
        return $this->belongsTo(AccountingPeriodLock::class, 'period_lock_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
